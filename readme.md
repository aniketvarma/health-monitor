# KinLog

Track your health vitals in one place. Log blood pressure, glucose levels, and medications — then see trends over time with visual charts.

## Live App

[kinlog-app.vercel.app](https://kinlog-app.vercel.app)

## What It Does

**Sign in** — Continue with Google, or request a 6-digit code over email. _(Note: email OTP login does **not** work on the live deployment — Render's free tier blocks outbound SMTP, so Gmail can't send the code. Google sign-in works as usual.)_

**Log vitals daily** — Record blood pressure (systolic / diastolic / pulse) and glucose readings in seconds.

**Track medications** — Keep a list of active medicines so nothing gets missed.

**Reminders** — Add date/time reminders that show up on your home page so you don't forget what to measure or take.

**Trends & insights** — Interactive charts show how your readings change over days and weeks.

## Built With

**Frontend**

- React 19 + TypeScript + Vite
- React Router for routing
- Tailwind CSS v4 + shadcn/ui (Radix primitives) for the interface
- Recharts for data visualizations
- Framer Motion for animations, Sonner for toasts, Lucide for icons
- `@react-oauth/google` for Google sign-in, `input-otp` for the OTP field

**Backend**

- Express 5 + TypeScript (tsx in dev)
- PostgreSQL via `pg-promise`
- JWT auth (`jsonwebtoken`) with a custom `authenticate` middleware
- Zod for request validation
- `google-auth-library` to verify Google ID tokens
- Nodemailer (Gmail SMTP) to send OTP codes, `bcrypt` to hash them
- `express-rate-limit` to throttle OTP requests per email and per IP

**Hosting**

- Frontend on Vercel
- Backend on Render
- Postgres on Neon

## License

MIT
