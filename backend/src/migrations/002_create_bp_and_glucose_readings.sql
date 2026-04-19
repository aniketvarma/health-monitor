CREATE TABLE IF NOT EXISTS bp_readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    pulse INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS glucose_readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reading INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fasting', 'post_meal')),
    created_at TIMESTAMP DEFAULT NOW()
);
