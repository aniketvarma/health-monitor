-- remove password column (no longer needed — using Google + OTP login)
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- remove is_active column (unused)
ALTER TABLE users DROP COLUMN IF EXISTS is_active;

-- add google_id for Google login users (null for OTP users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- make name nullable — Google users might not have one initially
-- (Google provides it, but OTP users might register with just email first)

-- drop the password_reset_tokens table (no longer needed without password login)
DROP TABLE IF EXISTS password_reset_tokens;
