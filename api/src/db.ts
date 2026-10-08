import pg from "pg";
import { createClient } from "redis";
import { env } from "./env.js";
import retry from "./retry.js";

export const db = new pg.Pool({ connectionString: env.DATABASE_URL });
await retry("postgres", () => db.query("SELECT 1"));

export const redis = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(2 ** retries * 100, 5000),
  },
});
redis.on("error", (err) => console.log("redis:", err.message));
await redis.connect();
