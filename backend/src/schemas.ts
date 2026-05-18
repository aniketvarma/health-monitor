import { z } from "zod";

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

export const reminderSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  message: z.string().min(1).max(500),
});

export const updateProfileFieldSchema = z.object({
  field: z.enum(["name", "date_of_birth", "gender"]),
  value: z.string().min(1).max(250),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1),
});

export const requestOtpSchema = z.object({
  email: z.email().max(255),
});

export const verifyOtpSchema = z.object({
  email: z.email().max(255),
  otp: z.string().regex(/^\d{6}$/),
});
