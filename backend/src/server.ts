// load .env before anything else
import "dotenv/config";
import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import db from "./db.js"; // pg-promise database instance
import jwt from "jsonwebtoken"; // create/verify auth tokens
import { z } from "zod"; // input validation
import {
  bpReadingSchema,
  glucoseReadingSchema,
  medicineSchema,
  reminderSchema,
  updateProfileFieldSchema,
  googleAuthSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "./schemas.js";
import authenticate from "./middleware/authenticate.js"; // JWT auth middleware
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { sendOtpEmail } from "./utils/email.js";

// create the app instance
const app = express();
app.set("trust proxy", 1);

// only allow requests from our frontend
const allowedOrigins = ["http://localhost:5173", process.env.FRONT_END_URL!];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// parse JSON request bodies
app.use(express.json());

const PORT = process.env.PORT || 3000;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────RATE LIMITERS(OTP)───────────────────────────

const requestOtpEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1,
  keyGenerator: (req) => req.body?.email ?? "missing-email",
  message: { error: "Wait a moment before requesting another code" },
  standardHeaders: true,
  legacyHeaders: false,
  // if the route ends with status >= 400 (validation fail, DB error, email send fail),
  // the library decrements the counter so the user isn't penalized for a failed attempt
  skipFailedRequests: true,
});

const requestOtpIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: "Too many requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: { error: "Too many verification attempts, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── AUTH ROUTE LOGIN VIA GOOGLE ──────────────────────────────────────────

app.post("/api/auth/google", async (req, res) => {
  const validationResult = googleAuthSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }
  // frontend sends the Google token it got from the Google login popup
  const { token } = validationResult.data;

  try {
    // verify the token with Google — throws if invalid/expired/fake
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // make sure token was meant for our app
    });

    // extract user info from the verified token
    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name;
    const googleId = payload?.sub; // Google's unique user ID — never changes

    try {
      // check if this Google user already exists in our DB
      let user = await db.oneOrNone(`SELECT * FROM users WHERE google_id=$1`, [
        googleId,
      ]);

      // first-time Google login — create a new user
      // RETURNING * gives back the new row so we can read user.id
      if (!user) {
        user = await db.one(
          `INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING *`,
          [name, email, googleId],
        );
      }

      // create our own JWT with the DB user id
      const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });

      return res.status(200).json({ token: jwtToken });
    } catch (e) {
      // DB error — connection failed, query error, etc.
      res.status(500).json({ error: "Something went wrong" });
    }
  } catch (e) {
    // Google token verification failed — invalid, expired, or tampered token
    return res.status(401).json({ error: "Google login failed" });
  }
});

// ─── AUTH ROUTE FOR LOGIN USING EMAIL OTP ───────────────

app.post(
  "/api/auth/request-otp",
  requestOtpIpLimiter,
  requestOtpEmailLimiter,
  async (req, res) => {
    const validationResult = requestOtpSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res
        .status(400)
        .json({ error: z.flattenError(validationResult.error) });
    }

    const { email } = validationResult.data;
    try {
      const code = String(randomInt(100000, 1000000));
      const codeHash = await bcrypt.hash(code, 10);

      await db.none(
        `INSERT INTO email_otps (email, code_hash) VALUES ($1, $2)
    ON CONFLICT (email) DO UPDATE
    SET code_hash = EXCLUDED.code_hash,
    expires_at = EXCLUDED.expires_at,
    attempts   = EXCLUDED.attempts,
    created_at = EXCLUDED.created_at`,
        [email, codeHash],
      );

      await sendOtpEmail(email, code);

      return res.status(200).json({ message: "Code sent" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Couldn't send code, try again" });
    }
  },
);

app.post("/api/auth/verify-otp", verifyOtpIpLimiter, async (req, res) => {
  const validationResult = verifyOtpSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const { email, otp } = validationResult.data;

  try {
    const emailOtpRow = await db.oneOrNone(
      `Select * FROM email_otps WHERE email=$1`,
      [email],
    );
    if (!emailOtpRow) {
      return res
        .status(400)
        .json({ error: "No code requested for this email" });
    }

    if (new Date() > new Date(emailOtpRow.expires_at)) {
      await db.none(`DELETE FROM email_otps WHERE email =$1`, [email]);
      return res
        .status(400)
        .json({ error: "Code expired , request a fresh code" });
    }

    if (emailOtpRow.attempts >= 5) {
      await db.none(`DELETE FROM email_otps WHERE email =$1`, [email]);
      return res
        .status(400)
        .json({ error: "Too many wrong tries , request a new one" });
    }

    const ok = await bcrypt.compare(otp, emailOtpRow.code_hash);

    if (!ok) {
      await db.none(
        `UPDATE email_otps SET attempts = attempts + 1 WHERE email = $1`,
        [email],
      );
      return res.status(400).json({ error: "Wrong Code" });
    }

    await db.none(`DELETE FROM email_otps WHERE email=$1`, [email]);

    let user = await db.oneOrNone(`SELECT * FROM users WHERE email=$1`, [
      email,
    ]);

    if (!user) {
      user = await db.one(`INSERT INTO users (email) VALUES ($1) RETURNING *`, [
        email,
      ]);
    }

    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .json({ token: jwtToken, needsOnboarding: user.name === null });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// ── BP READINGS ─────────────────────────────────────────

app.post("/api/bp-readings", authenticate, async (req, res) => {
  const validationResult = bpReadingSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const { systolic, diastolic, pulse } = validationResult.data;

  const userId = (req as any).user.id;

  try {
    await db.none(
      `INSERT INTO bp_readings (user_id, systolic, diastolic, pulse) VALUES ($1, $2, $3, $4)`,
      [userId, systolic, diastolic, pulse],
    );
    res
      .status(201)
      .json({ message: "Blood pressure reading logged successfully" });
  } catch (error) {
    console.error("Error logging blood pressure reading:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ── GLUCOSE READINGS ────────────────────────────────────

app.post("/api/glucose-readings", authenticate, async (req, res) => {
  const validationResult = glucoseReadingSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const { reading, type } = validationResult.data;
  const userId = (req as any).user.id;

  try {
    await db.none(
      `INSERT INTO glucose_readings (user_id, reading, type) VALUES ($1, $2, $3)`,
      [userId, reading, type],
    );
    return res
      .status(201)
      .json({ message: "Glucose reading logged successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong: " + error });
  }
});

app.get("/api/bp-readings", authenticate, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const readings = await db.any(
      `SELECT * FROM bp_readings WHERE user_id =$1 `,
      [userId],
    );
    res.status(200).json({ readings });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.get("/api/glucose-readings", authenticate, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const readings = await db.any(
      `SELECT * FROM glucose_readings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    res.status(200).json({ readings });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// ── MEDICINES ───────────────────────────────────────────

app.post("/api/medicines", authenticate, async (req, res) => {
  const validationResult = medicineSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const userId = (req as any).user.id;

  const medicine = validationResult.data.medicine;
  try {
    await db.none(`INSERT INTO medicines (user_id, medicine) VALUES ($1, $2)`, [
      userId,
      medicine,
    ]);
    res.status(201).json({ message: "Medicine logged successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong: " + error });
  }
});

app.get("/api/medicines", authenticate, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const medicines = await db.any(
      `SELECT id, medicine FROM medicines WHERE user_id = $1`,
      [userId],
    );
    res.status(200).json({ medicines: medicines });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong: " + error });
  }
});

app.delete("/api/medicines/:id", authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const medicineId = req.params.id;
  try {
    const dbResult = await db.oneOrNone(
      `SELECT * FROM medicines WHERE id=$1 AND user_id=$2`,
      [medicineId, userId],
    );

    if (!dbResult) {
      res.status(404).json({ error: "medicine not found" });
    } else {
      await db.none(`DELETE FROM medicines WHERE id =$1`, [medicineId]);
      res.status(200).json({ message: "Medicine Deleted" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ── REMINDERS ───────────────────────────────────────────

app.post("/api/reminders", authenticate, async (req, res) => {
  const validationResult = reminderSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const userId = (req as any).user.id;
  const { date, time, message } = validationResult.data;

  try {
    await db.none(
      `INSERT INTO reminders (user_id, date, time, message) VALUES ($1, $2, $3, $4)`,
      [userId, date, time, message],
    );
    res.status(201).json({ message: "Reminder saved" });
  } catch (error) {
    console.error("Error saving reminder:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/reminders", authenticate, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const reminders = await db.any(
      `SELECT id, date, time, message FROM reminders WHERE user_id = $1 ORDER BY date, time`,
      [userId],
    );
    res.status(200).json({ reminders });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/reminders/:id", authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const reminderId = req.params.id;

  try {
    const dbResult = await db.oneOrNone(
      `SELECT * FROM reminders WHERE id = $1 AND user_id = $2`,
      [reminderId, userId],
    );

    if (!dbResult) {
      res.status(404).json({ error: "Reminder not found" });
    } else {
      await db.none(`DELETE FROM reminders WHERE id = $1`, [reminderId]);
      res.status(200).json({ message: "Reminder deleted" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ── PROFILE ─────────────────────────────────────────────

app.get("/api/profile", authenticate, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const profile = await db.oneOrNone(
      `SELECT name, email, role, date_of_birth, gender FROM users WHERE id = $1`,
      [userId],
    );

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.patch("/api/profile", authenticate, async (req, res) => {
  const validationResult = updateProfileFieldSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const userId = (req as any).user.id;
  const { field, value } = validationResult.data;

  try {
    await db.none(
      `UPDATE users SET ${field} = $1, updated_at = NOW() WHERE id = $2`,
      [value, userId],
    );
    res.status(200).json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ── START SERVER ────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
