import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import type { DashboardBaseline } from "../../../app/src/lib/dashboard-view.js";
const { visibleEvents, visibleStats } = createRequire(import.meta.url)(
  "../../../app/src/lib/dashboard-view.ts",
) as typeof import("../../../app/src/lib/dashboard-view.js");

const initial: DashboardBaseline = {
  session: "a", updatedAt: 1_000,
  stats: {
    totalPayments: 10, totalVolume: "0.1000", paymentsPerMin: 10,
    dollarsPerSec: "0.001", activeWorkers: 0, gasSaved: "3",
    platformFees: "0.0100", elapsed: 60, isRunning: false,
  },
};

test("local Reset keeps identical polled history cleared without mutating server state", () => {
  const stats = visibleStats({ ...initial, updatedAt: 6_000 }, initial);
  assert.equal(stats.totalPayments, 0);
  assert.equal(stats.totalVolume, "0.0000");
  assert.equal(stats.elapsed, 0);
  assert.deepEqual(visibleEvents([{ timestamp: 900 }], initial, initial), []);
  assert.equal(initial.stats.totalPayments, 10);
});

test("new activity after clearing remains visible and a new session restores normal totals", () => {
  const next = {
    ...initial, updatedAt: 6_000,
    stats: { ...initial.stats, totalPayments: 11, totalVolume: "0.1150", platformFees: "0.0115" },
  };
  assert.equal(visibleStats(next, initial).totalPayments, 1);
  assert.equal(visibleStats(next, initial).totalVolume, "0.0150");
  assert.deepEqual(
    visibleEvents([{ timestamp: 900 }, { timestamp: 2_000 }], next, initial),
    [{ timestamp: 2_000 }],
  );
  assert.deepEqual(visibleStats({ ...next, session: "b" }, initial), next.stats);
  assert.deepEqual(visibleEvents([{ timestamp: 900 }], { ...next, session: "b" }, initial), [{ timestamp: 900 }]);
});
