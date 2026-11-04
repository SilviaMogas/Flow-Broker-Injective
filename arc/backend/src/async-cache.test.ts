import assert from "node:assert/strict";
import { test } from "node:test";
import { createAsyncCache } from "./async-cache.js";

test("cold concurrent calls share a refresh; TTL starts on completion", async () => {
  let now = 1;
  let calls = 0;
  let resolve!: (value: string) => void;
  const cached = createAsyncCache(() => {
    calls++;
    return new Promise<string>((done) => { resolve = done; });
  }, 15_000, undefined, () => now);
  const a = cached();
  const b = cached();
  assert.equal(calls, 1);
  now = 20_000;
  resolve("snapshot");
  assert.deepEqual(await Promise.all([a, b]), ["snapshot", "snapshot"]);
  now = 34_999;
  assert.equal(await cached(), "snapshot");
  assert.equal(calls, 1);
  now = 35_000;
  const next = cached();
  assert.equal(calls, 2);
  resolve("new snapshot");
  assert.equal(await next, "new snapshot");
});

test("unhealthy results use a short retry TTL", async () => {
  let now = 0;
  let calls = 0;
  const cached = createAsyncCache(async () => ++calls, 15_000, () => false, () => now);
  assert.equal(await cached(), 1);
  now = 4_999;
  assert.equal(await cached(), 1);
  now = 5_000;
  assert.equal(await cached(), 2);
});

test("a rejected refresh can be retried rather than caching a rejected promise", async () => {
  let calls = 0;
  const cached = createAsyncCache(async () => {
    if (++calls === 1) throw new Error("offline");
    return "recovered";
  }, 15_000);
  await assert.rejects(cached(), /offline/);
  assert.equal(await cached(), "recovered");
});
