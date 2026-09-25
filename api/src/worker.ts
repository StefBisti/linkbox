import { db, redis } from "./db.js";
import { parseTitle } from "./title.js";

process.once("SIGTERM", () => process.exit(0));

while (true) {
  const jobId = await redis.brPop("jobs", 0);
  if (!jobId) continue;

  try {
    const {
      rows: [row],
    } = await db.query("SELECT url FROM links WHERE id = $1", [jobId.element]);

    // !!! fetches any URL. Solve before exposing !!!
    const res = await fetch(row.url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const title = parseTitle(html);
    await db.query("UPDATE links SET title = $1 WHERE id = $2", [
      title ?? null,
      jobId.element,
    ]);
  } catch (err) {
    console.log(`job ${jobId.element} failed:`, err);
  }
}
