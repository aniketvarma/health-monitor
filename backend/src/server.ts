// import express
import express from "express";
// import cors
import cors from "cors";

import bcrypt from "bcrypt";

import db from "./db.js";

import jwt from "jsonwebtoken";

import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1).max(250),
  email: z.email(),
  password: z.string().min(6).max(100),
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
});

// start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
