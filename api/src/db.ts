import pg from "pg";
import { createClient } from "redis";
import { env } from "./env.js";

export const db = new pg.Pool({ connectionString: env.DATABASE_URL });
export const redis = await createClient({ url: env.REDIS_URL }).connect();
