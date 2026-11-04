import assert from "node:assert/strict";
import { test } from "node:test";
import { generatePrivateKey } from "viem/accounts";
import { DEFAULT_PRICES } from "./pricing.js";

test("HTTP capabilities, x402 price requirements and accounting (mock facilitator, no real payment)", async (t) => {
  process.env.VERCEL = "1";
  // Disposable, unfunded test identity; never used against a real payment service.
  process.env.SELLER_KEY = generatePrivateKey();
  const nativeFetch = globalThis.fetch;
  let supportedCalls = 0;
  const verifiedAmounts: string[] = [];
  const settledAmounts: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.startsWith("http://127.0.0.1:")) return nativeFetch(input, init);
    if (url.includes("/v1/x402/supported")) {
      supportedCalls++;
      return Response.json({ kinds: [{
        network: "eip155:5042002",
        extra: {
          verifyingContract: "0x0000000000000000000000000000000000000001",
          assets: [{ symbol: "USDC", address: "0x0000000000000000000000000000000000000002" }],
        },
      }] });
    }
    if (url.includes("/v1/x402/verify") || url.includes("/v1/x402/settle")) {
      const body = JSON.parse(String(init?.body));
      (url.endsWith("verify") ? verifiedAmounts : settledAmounts).push(body.paymentRequirements.amount);
      return Response.json({ isValid: true, success: true, payer: "test-payer", transaction: "mock-settlement" });
    }
    // ENS and Injective are deliberately offline in this regression test.
    throw new Error("Test upstream unavailable");
  };
  const { default: app } = await import("./server.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const health = await (await nativeFetch(base + "/api/health")).json();
  assert.equal(health.websocket, false);
  assert.equal(health.workerLoops, false);
  assert.equal(health.sellerConfigured, true);
  assert.equal(health.statePersistence, "instance");
  const prices = await (await nativeFetch(base + "/api/prices")).json();
  assert.equal(prices.llm, "$0.015");
  assert.equal(prices.search, "$0.000002");
  const postServices = ["llm", "translate", "summarize", "vision", "code"];
  for (const [service, price] of Object.entries(DEFAULT_PRICES)) {
    if (service === "injective") continue;
    const options = { method: postServices.includes(service) ? "POST" : "GET" };
    const response = await nativeFetch(base + `/api/${service}`, options);
    assert.equal(response.status, 402);
    const requirement = JSON.parse(Buffer.from(response.headers.get("payment-required")!, "base64").toString());
    const amount = String(Math.round(Number(price.slice(1)) * 1e6));
    assert.equal(requirement.accepts[0].amount, amount, service);
    const paidResponse = await nativeFetch(base + `/api/${service}`, {
      ...options,
      headers: { "payment-signature": Buffer.from(JSON.stringify({
        accepted: requirement.accepts[0],
      })).toString("base64") },
    });
    assert.equal(paidResponse.status, 200);
    assert.equal(verifiedAmounts.at(-1), amount);
    assert.equal(settledAmounts.at(-1), amount);
  }
  const callsBeforeMissingData = supportedCalls;
  const unavailable = await nativeFetch(base + "/api/injective");
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("payment-required"), null);
  assert.equal(supportedCalls, callsBeforeMissingData, "missing data must reject before payment middleware");
  const stateResponse = await nativeFetch(base + "/api/dashboard-state");
  assert.equal(stateResponse.headers.get("cache-control"), "no-store");
  const state = await stateResponse.json();
  assert.equal(state.stats.totalPayments, 10);
  for (const payment of state.payments) {
    assert.equal(payment.amount, prices[payment.service]);
  }
  const total = Object.entries(DEFAULT_PRICES).filter(([service]) => service !== "injective")
    .reduce((sum, [, price]) => sum + Number(price.slice(1)), 0);
  assert.equal(state.stats.totalVolume, total.toFixed(4));
  assert.equal(state.stats.platformFees, (total * 0.1).toFixed(4));
  assert.equal((await nativeFetch(base + "/api/start", { method: "POST" })).status, 501);
});
