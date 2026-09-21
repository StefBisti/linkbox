import { db } from "./db.js";

await db.query(`CREATE TABLE IF NOT EXISTS links (
  id serial PRIMARY KEY,
  url text NOT NULL,
  title text
)`);

process.exit();
