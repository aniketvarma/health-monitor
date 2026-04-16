// load .env file into process.env
import dotenv from "dotenv";
dotenv.config(); // reads backend/.env automatically

// import pg-promise
import pgPromise from "pg-promise";

// initialize pg-promise
const pgp = pgPromise();

// connection config — pulls values from .env file
const db = pgp({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT), // env vars are strings, convert to number
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

export default db;
