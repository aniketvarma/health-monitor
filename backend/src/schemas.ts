import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1).max(250),
  email: z.email(),
  password: z.string().min(6).max(100),
});

export const loginschema = z.object({
  email: z.email(),
  password: z.string().min(6).max(100),
});

export const bpReadingSchema = z.object({
  systolic: z.number().min(70).max(250),
  diastolic: z.number().min(40).max(150),
  pulse: z.number().optional(),
});

export const glucoseReadingSchema = z.object({
  reading: z.number().min(20).max(600),
  type: z.enum(["fasting", "post_meal"]),
});

export const medicineSchema = z.object({
  medicine: z.string().min(1).max(250),
});

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export const ResetpasswordSchema = z.object({
  newPassword: z.string(),
  token: z.string(),
});
