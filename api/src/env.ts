import z from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
});

export const env = schema.parse(process.env);
