// import express
import express from "express";
// import cors
import cors from "cors";

import bcrypt from "bcrypt";

import db from "./db.js";

import jwt from "jsonwebtoken";

import { safeParse, z } from "zod";

import authenticate from "./middleware/authenticate.ts";

const signupSchema = z.object({
  name: z.string().min(1).max(250),
  email: z.email(),
  password: z.string().min(6).max(100),
});

const loginschema = z.object({
  email: z.email(),
  password: z.string().min(6).max(100),
});

const bpReadingSchema = z.object({
  systolic: z.number().min(70).max(250),
  diastolic: z.number().min(40).max(150),
  pulse: z.number().optional(),
});

// create the app instance
const app = express();
app.use(cors());

//telling the app to use json middleware to parse incoming JSON requests
app.use(express.json());

const PORT = 3000;

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
    { expiresIn: "7d" },
  );

  res.json({ token: token });
});

// route for bp readings logging
app.post("/api/bp-readings", authenticate, async (req, res) => {
  const validationResult = bpReadingSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: z.flattenError(validationResult.error) });
  }

  const { systolic, diastolic, pulse } = req.body;

  const userId = (req as any).user.id;

  try {
    db.none(
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

// start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
