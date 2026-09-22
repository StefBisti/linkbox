import Fastify from "fastify";
import { db, redis } from "./db.js";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

app.get(
  "/links",
  async () => (await db.query("SELECT * FROM links ORDER BY id DESC")).rows,
);

app.post<{ Body: { url: string } }>(
  "/links",
  {
    schema: {
      body: {
        type: "object",
        required: ["url"],
        properties: { url: { type: "string", format: "uri" } },
      },
    },
  },
  async (req, reply) => {
    const { rows } = await db.query(
      "INSERT INTO links (url) VALUES ($1) RETURNING *",
      [req.body.url],
    );
    await redis.lPush("jobs", String(rows[0].id));
    return reply.code(201).send(rows[0]);
  },
);

await app.listen({ host: "0.0.0.0", port: 3000 });

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, async () => {
    setTimeout(() => process.exit(1), 5000).unref();
    await app.close();
    process.exit(0);
  });
}
