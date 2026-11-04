import assert from "node:assert/strict";
import { test } from "node:test";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { generatePrivateKey } from "viem/accounts";

test("Stop drains in-flight calls, prevents new calls and blocks overlapping runs (mock clients)", async (t) => {
  process.env.NODE_ENV = "test";
  delete process.env.VERCEL;
  process.env.SELLER_KEY = generatePrivateKey();
  delete process.env.UNISWAP_API_KEY;
  delete process.env.DEPLOYER_KEY;
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("http://127.0.0.1:")) return nativeFetch(input, init);
    throw new Error("Test: external services disabled");
  };
  t.mock.method(GatewayClient.prototype, "getBalances", async () => ({
    gateway: { available: 1_000_000n },
  }));
  type PayResult = Awaited<ReturnType<GatewayClient["pay"]>>;
  const releases: (() => void)[] = [];
  let payCalls = 0;
  let markAllStarted!: () => void;
  const allStarted = new Promise<void>((resolve) => { markAllStarted = resolve; });
  t.mock.method(GatewayClient.prototype, "pay", async () => {
    payCalls++;
    if (payCalls === 8) markAllStarted();
    return new Promise<PayResult>((resolve) => {
      releases.push(() => resolve({} as PayResult));
    });
  });
  const { default: app } = await import("./server.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));
  t.after(() => { releases.forEach((release) => release()); server.closeAllConnections(); server.close(); });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const start = () => nativeFetch(base + "/start", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cycles: 10 }),
  });
  assert.equal((await start()).status, 200);
  await Promise.race([
    allStarted,
    new Promise((_, reject) => setTimeout(() => reject(new Error("workers did not start")), 2_000).unref()),
  ]);
  assert.equal(payCalls, 8);
  const stopped = await nativeFetch(base + "/stop", { method: "POST" });
  assert.equal(stopped.status, 200);
  let state = await (await nativeFetch(base + "/dashboard-state")).json();
  assert.equal(state.stats.isStopping, true);
  assert.equal(state.stats.isRunning, false);
  assert.equal((await start()).status, 409);
  releases.forEach((release) => release());
  for (let i = 0; i < 50; i++) {
    state = await (await nativeFetch(base + "/dashboard-state")).json();
    if (!state.stats.isStopping) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(state.stats.isStopping, false);
  assert.equal(state.stats.activeWorkers, 0);
  assert.equal(payCalls, 8, "no further payment or risk-check calls after Stop");
  assert.equal(state.stats.totalTrades, 0);
});
