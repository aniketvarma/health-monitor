// load .env file into process.env
import dotenv from "dotenv";
dotenv.config(); // reads backend/.env automatically

// import pg-promise
import pgPromise from "pg-promise";

// initialize pg-promise
const pgp = pgPromise();

// connection config — pulls values from .env file
const db = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default db;
