import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { test } from "node:test";

const load = createRequire(resolve("package.json"));
const configPath = load.resolve("./lib/web3.ts");

for (const value of [undefined, "", "  ", "YOUR_WALLETCONNECT_PROJECT_ID", "not-a-project", "g".repeat(32)]) {
  test(`disables wallet connectors for ${JSON.stringify(value)}`, () => {
    const previous = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
    try {
      if (value === undefined) delete process.env.NEXT_PUBLIC_WC_PROJECT_ID;
      else process.env.NEXT_PUBLIC_WC_PROJECT_ID = value;
      delete load.cache[configPath];
      const { walletConfigured, wagmiConfig } = load(configPath) as typeof import("./web3");
      assert.equal(walletConfigured, false);
      assert.equal(wagmiConfig.connectors.length, 0);
      assert.equal(wagmiConfig._internal.ssr, true);
      assert.deepEqual(wagmiConfig.chains.map((chain) => chain.id), [5042002, 1439, 1776]);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_WC_PROJECT_ID;
      else process.env.NEXT_PUBLIC_WC_PROJECT_ID = previous;
      delete load.cache[configPath];
    }
  });
}
