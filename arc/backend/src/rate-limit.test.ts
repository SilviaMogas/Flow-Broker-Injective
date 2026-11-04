import assert from "node:assert/strict";
import { test } from "node:test";
import express, { type Request } from "express";
import { clientKey, createInjectiveLimiter } from "./rate-limit.js";

test("local requests cannot spoof identity with forwarded headers", () => {
  const req = {
    ip: "127.0.0.1",
    get: () => "203.0.113.42",
  } as unknown as Request;
  assert.equal(clientKey(req, false), "127.0.0.1");
  assert.equal(clientKey(req, true), "203.0.113.42");
});

test("invalid Vercel headers fall back to socket identity; IPv6 rotates within one subnet", () => {
  const request = (ip: string, header: string) => ({
    ip, get: () => header,
  } as unknown as Request);
  assert.equal(clientKey(request("127.0.0.1", "bad, list"), true), "127.0.0.1");
  assert.equal(
    clientKey(request("::1", "2001:db8:1234:ab00::1"), true),
    clientKey(request("::1", "2001:db8:1234:ab01::2"), true),
  );
  assert.equal(
    clientKey(request("127.0.0.1", "::ffff:203.0.113.42"), true),
    clientKey(request("127.0.0.1", "203.0.113.42"), true),
  );
});

test("markets, chains and paid routes share a 60/min budget; other clients are isolated", async (t) => {
  const app = express();
  const limiter = createInjectiveLimiter(true);
  app.use(["/injective", "/api/injective"], limiter);
  app.use((_req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const headers = { "x-vercel-forwarded-for": "203.0.113.1" };
  const paths = ["/injective/markets", "/injective/chains", "/api/injective"];
  for (let i = 0; i < 60; i++) {
    const response = await fetch(base + paths[i % 3], { headers });
    assert.equal(response.status, 200);
    await response.text();
  }
  const limited = await fetch(base + "/injective/markets", { headers });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.match(limited.headers.get("ratelimit") || "", /remaining=0/);
  assert.match((await limited.json()).error, /Too many/);
  assert.equal((await fetch(base + "/injective/chains", {
    headers: { "x-vercel-forwarded-for": "203.0.113.2" },
  })).status, 200);
  assert.equal((await fetch(base + "/health", { headers })).status, 200);
  limiter.resetKey("203.0.113.1");
  assert.equal((await fetch(base + "/injective/markets", { headers })).status, 200);
});
