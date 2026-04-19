import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import db from "../db.js";

async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.headers.authorization?.split(" ")[1];
  let userInformation: JwtPayload;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    userInformation = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (error) {
    console.log("token verification error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = await db.oneOrNone(`SELECT * FROM users WHERE id = $1`, [
    userInformation.id,
  ]);

  if (!user) {
    return res.status(401).json({ error: "no user found for this token" });
  }

  (req as any).user = { id: user.id }; // attach user info to request object for downstream use
  next();
}

export default authenticate;
