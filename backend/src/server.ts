// load .env before anything else
import dotenv from "dotenv";
dotenv.config();

// import express
import express from "express";
// import cors
import cors from "cors";

import bcrypt from "bcrypt";

import db from "./db.js";

import jwt from "jsonwebtoken";

import { z } from "zod";
import {
  signupSchema,
  loginschema,
  bpReadingSchema,
  glucoseReadingSchema,
  medicineSchema,
  ForgotPasswordSchema,
  ResetpasswordSchema,
  reminderSchema,
  updateProfileFieldSchema,
} from "./schemas.js";

import authenticate from "./middleware/authenticate.js";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// create the app instance
const app = express();

const allowedOrigins = [
  "http://localhost:5173", // local dev
  process.env.FRONT_END_URL!,
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

//telling the app to use json middleware to parse incoming JSON requests
app.use(express.json());

const PORT = process.env.PORT || 3000;

//signup route to handle user registration
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // validate the request body using zod schema
  const result = signupSchema.safeParse({ name, email, password });

  if (!result.success) {
    return res.status(400).json({ error: z.flattenError(result.error) });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.none(
      `INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)`,
      [name, email, passwordHash],
    );

    res.status(201).json({ message: "Signup successful! Please log in." });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Credential already in use" });
    }
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = loginschema.safeParse({ email, password });

  if (!user.success) {
    return res.status(400).json({ error: z.flattenError(user.error) });
  }

  try {
    const dbuser = await db.oneOrNone(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    if (dbuser === null) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, dbuser.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: dbuser.id,
        name: dbuser.name,
        email: dbuser.email,
        role: dbuser.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    res.json({ token: token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// route for bp readings logging
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

app.post("/api/glucose-readings", authenticate, async (req, res) => {
  // validate the request body using zod schema
  const validationResult = glucoseReadingSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  // extract validated data
  const { reading, type } = validationResult.data;

  //get user id from the authenticated request
  const userId = (req as any).user.id;

  // insert the glucose reading into the database and handle potential errors
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

// save a reminder
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

// get all reminders for the logged-in user
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

// delete a reminder
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

// get user profile
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

// update a single profile field
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

app.post("/api/auth/forgot-password", async (req, res) => {
  const validationResult = ForgotPasswordSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: "invalid username" });
  }

  const userEmail = validationResult.data.email;

  const user = await db.oneOrNone(`SELECT * FROM users WHERE email= $1`, [
    userEmail,
  ]);

  if (!user) {
    return res
      .status(200)
      .json({ message: "If this email exists, a reset link has been sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    await db.none(
      `INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)`,
      [userEmail, token, expiresAt],
    );

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: userEmail,
      subject: "Reset your password",
      html: `<p>Click the link to reset your password:</p>
         <a href="${process.env.FRONT_END_URL}/reset-password/${token}">Reset Password</a>
         <p>This link expires in 15 minutes.</p>`,
    });
    return res
      .status(200)
      .json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ error: "something went wrong" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const validationResult = ResetpasswordSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: "inavlid input" });
  }

  const { newPassword, token } = validationResult.data;

  try {
    const tokenRow = await db.oneOrNone(
      `SELECT * FROM password_reset_tokens WHERE token=$1 AND expires_at > NOW()`,
      [token],
    );

    if (!tokenRow) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await db.none(`UPDATE users SET password = $1 WHERE email=$2`, [
      newHashedPassword,
      tokenRow.email,
    ]);

    await db.none(`DELETE FROM password_reset_tokens WHERE token=$1`, [token]);

    res.status(200).json({ message: "password reset successfull" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
// start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
