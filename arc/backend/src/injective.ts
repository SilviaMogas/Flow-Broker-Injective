// Injective integration: Injective EVM chains plus live market data from the
// public Injective Indexer (read-only, no keys).
import { createPublicClient, http, type Chain } from "viem";
import { injective, injectiveTestnet } from "viem/chains";

export const INJECTIVE_CHAINS: { network: "testnet" | "mainnet"; chain: Chain }[] = [
  { network: "testnet", chain: injectiveTestnet },
  { network: "mainnet", chain: injective },
];

export const INJECTIVE_INDEXER_URL =
  process.env.INJECTIVE_INDEXER_URL || "https://sentry.exchange.grpc-web.injective.network";

// Injective mainnet spot markets read by the Injective provider.
export const INJECTIVE_MARKETS = [
  { ticker: "INJ/USDT", marketId: "0xa508cb32923323679f29a032c70342c147c17d0145625922b0ef22e955c844c0" },
  { ticker: "WETH/USDT", marketId: "0xd1956e20d74eeb1febe31cd37060781ff1cb266f49e0512b446a5fafa9a16034" },
] as const;

// Flow Broker contracts deployed on Injective EVM testnet (set after `forge script ... --rpc-url injective_testnet`).
export const INJECTIVE_CONTRACTS = {
  agentRegistry: process.env.INJECTIVE_AGENT_REGISTRY || null,
  paymentAccumulator: process.env.INJECTIVE_PAYMENT_ACCUMULATOR || null,
  pricingOracle: process.env.INJECTIVE_PRICING_ORACLE || null,
  agenticCommerce: process.env.INJECTIVE_AGENTIC_COMMERCE || null,
  reputationHook: process.env.INJECTIVE_REPUTATION_HOOK || null,
};

type Level = { price: string; quantity: string };

export interface InjectiveMarketSnapshot {
  ticker: string;
  marketId: string;
  bestBid: number | null;
  bestAsk: number | null;
  mid: number | null;
  spreadBps: number | null;
  bidDepth: number;
  askDepth: number;
  imbalance: number | null;
  lastPrice: number | null;
  lastTradeDirection: string | null;
  lastTradeAt: number | null;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  fetchedAt: number;
  source: string;
}

const decimalsCache = new Map<string, { base: number; quote: number }>();

async function getJson(path: string): Promise<any> {
  const res = await fetch(`${INJECTIVE_INDEXER_URL}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Injective Indexer ${res.status} for ${path}`);
  return res.json();
}

async function marketDecimals(marketId: string) {
  const cached = decimalsCache.get(marketId);
  if (cached) return cached;
  const { market } = await getJson(`/api/exchange/spot/v1/markets/${marketId}`);
  const decimals = { base: Number(market.baseTokenMeta.decimals), quote: Number(market.quoteTokenMeta.decimals) };
  decimalsCache.set(marketId, decimals);
  return decimals;
}

// Indexer spot prices are quote-per-base in chain units; scale to human units.
export function toHumanPrice(chainPrice: string, base: number, quote: number) {
  return Number(chainPrice) * 10 ** (base - quote);
}

export function summariseOrderbook(
  ticker: string,
  marketId: string,
  book: { buys: Level[]; sells: Level[] },
  lastTrade: { price: { price: string }; tradeDirection: string; executedAt: number } | null,
  decimals: { base: number; quote: number },
  fetchedAt = Date.now(),
): InjectiveMarketSnapshot {
  const price = (p: string) => toHumanPrice(p, decimals.base, decimals.quote);
  const qty = (q: string) => Number(q) / 10 ** decimals.base;
  const top = (levels: Level[]) => levels.slice(0, 10).reduce((sum, l) => sum + qty(l.quantity), 0);

  const bestBid = book.buys.length ? price(book.buys[0].price) : null;
  const bestAsk = book.sells.length ? price(book.sells[0].price) : null;
  const mid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : bestBid ?? bestAsk;
  const spreadBps = bestBid !== null && bestAsk !== null && mid ? ((bestAsk - bestBid) / mid) * 10_000 : null;
  const bidDepth = top(book.buys);
  const askDepth = top(book.sells);
  const imbalance = bidDepth + askDepth > 0 ? (bidDepth - askDepth) / (bidDepth + askDepth) : null;
  const signal = imbalance === null ? "NEUTRAL" : imbalance > 0.15 ? "BULLISH" : imbalance < -0.15 ? "BEARISH" : "NEUTRAL";

  return {
    ticker,
    marketId,
    bestBid,
    bestAsk,
    mid,
    spreadBps,
    bidDepth,
    askDepth,
    imbalance,
    lastPrice: lastTrade ? price(lastTrade.price.price) : null,
    lastTradeDirection: lastTrade?.tradeDirection ?? null,
    lastTradeAt: lastTrade?.executedAt ?? null,
    signal,
    fetchedAt,
    source: `${INJECTIVE_INDEXER_URL}/api/exchange/spot/v2/orderbook/${marketId}`,
  };
}

export async function fetchInjectiveMarket(ticker: string, marketId: string): Promise<InjectiveMarketSnapshot> {
  const [decimals, { orderbook }, { trades }] = await Promise.all([
    marketDecimals(marketId),
    getJson(`/api/exchange/spot/v2/orderbook/${marketId}`),
    getJson(`/api/exchange/spot/v2/trades?marketId=${marketId}&limit=1`),
  ]);
  return summariseOrderbook(ticker, marketId, orderbook, trades?.[0] ?? null, decimals);
}

let latestMarkets: InjectiveMarketSnapshot[] = [];
let lastError: string | null = null;

export async function refreshInjectiveMarkets() {
  try {
    latestMarkets = await Promise.all(INJECTIVE_MARKETS.map((m) => fetchInjectiveMarket(m.ticker, m.marketId)));
    lastError = null;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
  }
  return latestMarkets;
}

export function getInjectiveMarkets() {
  return { markets: latestMarkets, error: lastError };
}

export function injectiveServiceData(): { data: any; insight: string } {
  const inj = latestMarkets.find((m) => m.ticker === "INJ/USDT");
  if (!inj || inj.mid === null) {
    return { data: { status: "unavailable", error: lastError }, insight: "Injective market data unavailable" };
  }
  return {
    data: {
      market: inj.ticker,
      mid: inj.mid.toFixed(4),
      spread_bps: inj.spreadBps?.toFixed(1) ?? null,
      orderbook_imbalance: inj.imbalance?.toFixed(3) ?? null,
      last_trade: inj.lastPrice?.toFixed(4) ?? null,
      signal: inj.signal,
      markets: latestMarkets.map((m) => ({ ticker: m.ticker, mid: m.mid, signal: m.signal })),
      source: "Injective Indexer (mainnet orderbook)",
      fetched_at: inj.fetchedAt,
    },
    insight: `Injective ${inj.ticker} $${inj.mid.toFixed(3)}, book ${inj.signal} (imbalance ${inj.imbalance?.toFixed(2) ?? "n/a"})`,
  };
}

export async function getInjectiveChainStatus() {
  return Promise.all(
    INJECTIVE_CHAINS.map(async ({ network, chain }) => {
      const client = createPublicClient({ chain, transport: http(undefined, { timeout: 8000 }) });
      try {
        const [chainId, blockNumber] = await Promise.all([client.getChainId(), client.getBlockNumber()]);
        return { network, name: chain.name, chainId, blockNumber: blockNumber.toString(), rpc: chain.rpcUrls.default.http[0], explorer: chain.blockExplorers?.default.url, ok: true };
      } catch (e) {
        return { network, name: chain.name, chainId: chain.id, blockNumber: null, rpc: chain.rpcUrls.default.http[0], explorer: chain.blockExplorers?.default.url, ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );
}
