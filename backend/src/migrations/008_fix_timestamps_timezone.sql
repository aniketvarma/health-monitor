-- Convert all TIMESTAMP columns to TIMESTAMPTZ across the schema.
-- Reason: TIMESTAMP (no zone) caused JS Date to mis-interpret UTC values
-- as local time (IST, UTC+5:30), making fresh OTPs appear expired by 5h30m
-- and skewing every created_at by the same offset.
--
-- USING ... AT TIME ZONE 'UTC' tells Postgres: "the bare values currently
-- stored are UTC wall-clock times — tag them with UTC, don't shift them."
--
-- The second ALTER per table re-declares defaults so they emit clean
-- TIMESTAMPTZ values instead of inheriting a stale ::timestamp cast.

-- ── users ──────────────────────────────────────────────
ALTER TABLE users
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE users
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- ── bp_readings ────────────────────────────────────────
ALTER TABLE bp_readings
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE bp_readings
  ALTER COLUMN created_at SET DEFAULT NOW();

-- ── glucose_readings ───────────────────────────────────
ALTER TABLE glucose_readings
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE glucose_readings
  ALTER COLUMN created_at SET DEFAULT NOW();

-- ── medicines ──────────────────────────────────────────
ALTER TABLE medicines
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE medicines
  ALTER COLUMN created_at SET DEFAULT NOW();

-- ── reminders ──────────────────────────────────────────
ALTER TABLE reminders
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE reminders
  ALTER COLUMN created_at SET DEFAULT NOW();

-- ── email_otps ─────────────────────────────────────────
ALTER TABLE email_otps
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC';

ALTER TABLE email_otps
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '10 minutes');
