import { test } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

test("healthy", async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("post a link and then get title", async () => {
  const res = await fetch(`${BASE_URL}/links`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://example.com" }),
  });
  assert.equal(res.status, 201);
  const link = await res.json();
  assert.equal(typeof link.id, "number");

  const deadline = Date.now() + 15000;
  let title = null;
  while (Date.now() < deadline) {
    const links = await (await fetch(`${BASE_URL}/links`)).json();
    title = links.find((l) => l.id === link.id)?.title ?? null;
    if (title) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal(title, "Example Domain");
});
