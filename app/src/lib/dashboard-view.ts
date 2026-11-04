export interface StatsData {
  totalPayments: number;
  totalVolume: string;
  totalVolumeRaw: string;
  paymentsPerMin: number;
  dollarsPerSec: string;
  activeWorkers: number;
  gasSaved: string;
  platformFees: string;
  platformFeesRaw: string;
  elapsed: number;
  isRunning: boolean;
  isStopping?: boolean;
}

export interface DashboardBaseline {
  session: string;
  updatedAt: number;
  stats: StatsData;
}

export function visibleStats(snapshot: DashboardBaseline, baseline: DashboardBaseline | null): StatsData {
  if (!baseline || baseline.session !== snapshot.session) return snapshot.stats;
  const totalPayments = Math.max(0, snapshot.stats.totalPayments - baseline.stats.totalPayments);
  const volume = Math.max(0, Number(snapshot.stats.totalVolumeRaw) - Number(baseline.stats.totalVolumeRaw));
  const fees = Math.max(0, Number(snapshot.stats.platformFeesRaw) - Number(baseline.stats.platformFeesRaw));
  const elapsed = totalPayments ? Math.max(0, (snapshot.updatedAt - baseline.updatedAt) / 1000) : 0;
  return {
    ...snapshot.stats,
    totalPayments,
    totalVolume: volume.toFixed(4),
    totalVolumeRaw: volume.toString(),
    platformFees: fees.toFixed(4),
    platformFeesRaw: fees.toString(),
    gasSaved: (totalPayments * 0.30).toFixed(2),
    paymentsPerMin: elapsed ? Math.round(totalPayments / elapsed * 60) : 0,
    dollarsPerSec: elapsed ? (volume / elapsed).toFixed(4) : "0",
    elapsed: Math.round(elapsed),
  };
}

export function visibleEvents<T extends { timestamp: number }>(
  events: T[], snapshot: DashboardBaseline, baseline: DashboardBaseline | null,
) {
  if (!baseline || baseline.session !== snapshot.session) return events;
  return events.filter((event) => event.timestamp > baseline.updatedAt);
}
