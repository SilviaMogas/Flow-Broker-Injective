import assert from "node:assert/strict";
import { test } from "node:test";
import { ENDPOINT_TO_PROVIDER, parseENSPrice } from "./ens-resolver.js";
import { DEFAULT_PRICES, discoveredPrices, listedPrices, priceFor, providerFor, refreshedPrices, serviceConfigs } from "./pricing.js";

test("every paid endpoint resolves its ENS provider label, not the endpoint alias", () => {
  for (const [endpoint, provider] of Object.entries(ENDPOINT_TO_PROVIDER)) {
    assert.equal(providerFor(endpoint), provider);
    const ens = { [provider]: "$0.012345" };
    assert.equal(priceFor(endpoint, ens), "$0.012345");
    assert.equal(listedPrices(ens)[endpoint], "$0.012345");
  }
});

test("Injective keeps its listed price without an ENS record", () => {
  assert.equal(priceFor("injective", {}), "$0.001");
  assert.equal(listedPrices({})["injective"], "$0.001");
});

test("all endpoints have a valid fallback and bad ENS prices are ignored", () => {
  assert.equal(Object.keys(DEFAULT_PRICES).length, 11);
  for (const endpoint of Object.keys(DEFAULT_PRICES)) {
    assert.ok(Number(priceFor(endpoint, {}).slice(1)) > 0);
    for (const invalid of ["$NaN", "$Infinity", "$-1", "$0", "100", "$1junk"]) {
      assert.equal(priceFor(endpoint, { [providerFor(endpoint)]: invalid }), DEFAULT_PRICES[endpoint]);
    }
  }
});

test("missing or malformed ENS prices are not discovered as one-microdollar offers", () => {
  for (const invalid of [null, "", "NaN", "-1", "0", "1junk", "Infinity"]) {
    assert.equal(parseENSPrice(invalid), null);
  }
  assert.equal(parseENSPrice("0.015"), 0.015);
});

test("broker catalog retains Injective and all providers even without ENS discovery", () => {
  const services = serviceConfigs({ "ai-analysis": "$0.02" });
  assert.equal(services.length, 11);
  assert.deepEqual(services.find((service) => service.name === "injective"), {
    name: "injective", endpoint: "/api/injective", ensName: "injective.flowbroker.eth",
    price: "$0.001", priceUsd: 0.001, method: "GET",
  });
  assert.equal(services.find((service) => service.name === "llm")?.price, "$0.02");
  assert.equal(services.find((service) => service.name === "llm")?.method, "POST");
});

test("a successful discovery replaces removed ENS prices with the catalog fallback", () => {
  let prices = discoveredPrices([{ name: "ai-analysis", priceUsd: 0.02 }]);
  assert.equal(priceFor("llm", prices), "$0.02");
  prices = discoveredPrices([]);
  assert.equal(priceFor("llm", prices), "$0.015");
  assert.equal("ai-analysis" in prices, false);
});

test("RPC failure preserves a confirmed price; confirmed removal does not", () => {
  const confirmed = { "ai-analysis": "$0.02", "market-data": "$0.000005" };
  const duringOutage = refreshedPrices(confirmed, { agents: [], failed: ["ai-analysis"] });
  assert.equal(priceFor("llm", duringOutage), "$0.02");
  assert.equal(priceFor("search", duringOutage), DEFAULT_PRICES.search);
  const afterRemoval = refreshedPrices(duringOutage, { agents: [], failed: [] });
  assert.equal(priceFor("llm", afterRemoval), DEFAULT_PRICES.llm);
  assert.equal(priceFor("injective", duringOutage), "$0.001");
});
