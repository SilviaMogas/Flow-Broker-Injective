// Broker agents (buyers) — each has a strategy and specific providers it calls
export const BROKERS = [
  { id: "guardian", label: "Guardian", erc8004: "1448", profile: "Conservative", providers: ["search"], cost: "~$3/mo", desc: "Market data only", risk: "Low", rep: 4 },
  { id: "sentinel", erc8004: "1449", label: "Sentinel", profile: "Conservative", providers: ["search", "sentiment"], cost: "~$5/mo", desc: "Market + News sentiment", risk: "Low-Med", rep: 4 },
  { id: "steady", erc8004: "1450", label: "Steady", profile: "Balanced", providers: ["search", "sentiment", "llm"], cost: "~$10/mo", desc: "Market + Sentiment + AI", risk: "Medium", rep: 5 },
  { id: "navigator", erc8004: "1451", label: "Navigator", profile: "Balanced", providers: ["search", "sentiment", "llm", "code"], cost: "~$15/mo", desc: "Full analysis + Optimizer", risk: "Medium", rep: 5 },
  { id: "growth", erc8004: "1452", label: "Growth", profile: "Growth", providers: ["search", "sentiment", "embeddings", "classify", "data"], cost: "~$25/mo", desc: "5 intelligence services", risk: "Med-High", rep: 4 },
  { id: "momentum", erc8004: "1453", label: "Momentum", profile: "Growth", providers: ["search", "sentiment", "embeddings", "classify", "data", "translate"], cost: "~$35/mo", desc: "6 services + On-chain", risk: "Med-High", rep: 3 },
  { id: "apex", erc8004: "1454", label: "Apex", profile: "Alpha", providers: ["search", "sentiment", "llm", "embeddings", "classify", "data", "code", "vision", "injective"], cost: "~$50/mo", desc: "8 core services + Injective orderbook", risk: "High", rep: 4 },
  { id: "titan", erc8004: "1455", label: "Titan", profile: "Alpha", providers: ["search", "sentiment", "llm", "embeddings", "classify", "data", "code", "vision", "translate", "summarize", "injective"], cost: "~$75/mo", desc: "All 11 services", risk: "High", rep: 5 },
];

// Provider agents (sellers) — intelligence services
export const PROVIDERS: Record<string, { label: string; type: string; price: string; ens: string }> = {
  search: { label: "Market data feed", type: "Real-time prices, volume, spreads", price: "$0.000002/call", ens: "market-data.flowbroker.eth" },
  sentiment: { label: "News sentiment scorer", type: "Bullish/bearish score in real-time", price: "$0.0003/call", ens: "sentiment.flowbroker.eth" },
  llm: { label: "AI analysis engine", type: "LLM streaming, stops when agent has enough", price: "$0.015/analysis", ens: "ai-analysis.flowbroker.eth" },
  embeddings: { label: "Pattern recognition", type: "Chart patterns, supports, resistances", price: "$0.0005/call", ens: "embeddings.flowbroker.eth" },
  classify: { label: "Risk calculator", type: "VaR, implied volatility, correlations", price: "$0.0004/call", ens: "classifier.flowbroker.eth" },
  data: { label: "On-chain analytics", type: "Whale movements, DeFi TVL, exchange flows", price: "$0.001/call", ens: "portfolio-data.flowbroker.eth" },
  translate: { label: "Macro signals", type: "Fed decisions, inflation, GDP data", price: "$0.0008/call", ens: "translator.flowbroker.eth" },
  code: { label: "Portfolio optimizer", type: "MPT allocation, rebalancing signals", price: "$0.005/call", ens: "compute.flowbroker.eth" },
  vision: { label: "Execution optimizer", type: "Smart order routing, slippage minimization", price: "$0.002/call", ens: "chart-analyzer.flowbroker.eth" },
  summarize: { label: "Report generator", type: "Decision summary for your dashboard", price: "$0.015/call", ens: "summarizer.flowbroker.eth" },
  injective: { label: "Injective orderbook", type: "Live INJ spot book: mid, spread, depth imbalance", price: "$0.001/call", ens: "injective.flowbroker.eth" },
};

export function providerLabel(name: string) {
  return PROVIDERS[name]?.label || name;
}

export function brokerLabel(addr: string) {
  const idx = WORKER_ADDRS.indexOf(addr.toLowerCase());
  return idx >= 0 && idx < BROKERS.length ? BROKERS[idx].label : `Broker ${addr.slice(0, 6)}`;
}

export const WORKER_ADDRS = [
  "0xea108a5074772f700dc84c76f180b11285be6d8d",
  "0x225f28e9c6d4e9a2db8e2b007bec91716e331efb",
  "0xbe3359304457a8c0c443ad412e65f7d4aadc405e",
  "0x1ee2cfc2b77d388b451f7dd74982391e0bb3bad5",
  "0xa9624b279640f36adcad3845447d40bbe6eb7e5b",
  "0x92cd4862e054e3f426818d1883b92a9321ae6ba5",
  "0x5c10adf159d45d1a3874882d36cdaca722c000c9",
  "0x3004b4add68c3753ecd5f18edd93ee999ffaff3e",
];
