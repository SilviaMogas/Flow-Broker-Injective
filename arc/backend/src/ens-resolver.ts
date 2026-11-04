import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import type { ServiceConfig } from "./services.js";

const ensClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

const ENS_DOMAIN = "flowbroker.eth";

export interface ENSAgentRecord {
  name: string;
  ensName: string;
  endpoint: string;
  price: string;
  priceUsd: number;
  capabilities: string;
  status: string;
  agentType: string;
  providers: string;
}

const PROVIDER_NAMES = [
  "market-data", "ai-analysis", "sentiment", "classifier", "portfolio-data",
  "embeddings", "translator", "summarizer", "chart-analyzer", "compute",
];

const BROKER_NAMES = [
  "momentum", "news-reaction", "execution", "risk-manager",
  "mean-reversion", "rebalancing", "yield-strategy", "cross-market",
];

// Map provider ENS names to backend endpoints
export const PROVIDER_TO_ENDPOINT: Record<string, string> = {
  "market-data": "search", "ai-analysis": "llm", "sentiment": "sentiment",
  "classifier": "classify", "portfolio-data": "data", "embeddings": "embeddings",
  "translator": "translate", "summarizer": "summarize", "chart-analyzer": "vision",
  "compute": "code",
};

export const ENDPOINT_TO_PROVIDER: Record<string, string> = Object.fromEntries(
  Object.entries(PROVIDER_TO_ENDPOINT).map(([provider, endpoint]) => [endpoint, provider])
);

export function parseENSPrice(value: string | null) {
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function resolveAgent(name: string): Promise<ENSAgentRecord | null> {
  const ensName = `${name}.${ENS_DOMAIN}`;
  try {
    const [price, capabilities, status, agentType, providers] = await Promise.all([
      ensClient.getEnsText({ name: normalize(ensName), key: "com.x402.price" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.agent.capabilities" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.agent.status" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.agent.type" }),
      ensClient.getEnsText({ name: normalize(ensName), key: "com.agent.providers" }),
    ]);

    const priceUsd = parseENSPrice(price);
    if (name in PROVIDER_TO_ENDPOINT && priceUsd === null) return null;
    return {
      name, ensName,
      endpoint: PROVIDER_TO_ENDPOINT[name] || name,
      price: priceUsd !== null ? `$${price}` : "$0.000001",
      priceUsd: priceUsd ?? 0.000001,
      capabilities: capabilities || "",
      status: status || "active",
      agentType: agentType || "unknown",
      providers: providers || "",
    };
  } catch (cause) {
    throw new Error(`ENS read failed for ${ensName}`, { cause });
  }
}

export interface ProviderDiscovery {
  agents: Pick<ENSAgentRecord, "name" | "priceUsd">[];
  failed: string[];
}

export async function discoverProviderPrices(): Promise<ProviderDiscovery> {
  const results = await Promise.allSettled(PROVIDER_NAMES.map((name) => ensClient.getEnsText({
    name: normalize(`${name}.${ENS_DOMAIN}`), key: "com.x402.price",
  })));
  const agents: ProviderDiscovery["agents"] = [];
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") failed.push(PROVIDER_NAMES[i]);
    else {
      const priceUsd = parseENSPrice(result.value);
      if (priceUsd !== null) agents.push({ name: PROVIDER_NAMES[i], priceUsd });
    }
  });
  return { agents, failed };
}

export async function discoverProviders(): Promise<ENSAgentRecord[]> {
  console.log(`Discovering providers via ENS (${ENS_DOMAIN})...`);
  const results = await Promise.all(PROVIDER_NAMES.map((name) => resolveAgent(name).catch(() => null)));
  return results.filter((record): record is ENSAgentRecord => record !== null);
}

export async function discoverBrokers(): Promise<ENSAgentRecord[]> {
  console.log(`Discovering brokers via ENS (${ENS_DOMAIN})...`);
  const results = await Promise.all(BROKER_NAMES.map((name) => resolveAgent(name).catch(() => null)));
  const active = results.filter((r): r is ENSAgentRecord => r !== null);
  console.log(`  ${active.length}/${BROKER_NAMES.length} brokers found`);
  for (const a of active) console.log(`   ${a.ensName} → providers: ${a.providers}`);
  return active;
}

export interface ENSBrokerProfile {
  name: string;
  ensName: string;
  profile: string;
  apy: string;
  cost: string;
  risk: string;
  providers: string;
  strategy: string;
}

const BROKER_NAMES_LIST = [
  "guardian", "sentinel", "steady", "navigator",
  "growth", "momentum", "apex", "titan",
];

export async function discoverBrokerProfiles(): Promise<ENSBrokerProfile[]> {
  console.log(`Discovering broker profiles from ENS (${ENS_DOMAIN})...`);
  const results = await Promise.all(BROKER_NAMES_LIST.map(async (name) => {
    const ensName = `${name}.${ENS_DOMAIN}`;
    try {
      const [profile, apy, cost, risk, providers, strategy] = await Promise.all([
        ensClient.getEnsText({ name: normalize(ensName), key: "com.broker.profile" }),
        ensClient.getEnsText({ name: normalize(ensName), key: "com.broker.apy" }),
        ensClient.getEnsText({ name: normalize(ensName), key: "com.broker.cost" }),
        ensClient.getEnsText({ name: normalize(ensName), key: "com.broker.risk" }),
        ensClient.getEnsText({ name: normalize(ensName), key: "com.broker.providers" }),
        ensClient.getEnsText({ name: normalize(ensName), key: "com.broker.strategy" }),
      ]);
      return { name, ensName, profile: profile || "", apy: apy || "", cost: cost || "", risk: risk || "", providers: providers || "", strategy: strategy || "" };
    } catch { return null; }
  }));
  return results.filter((r): r is ENSBrokerProfile => r !== null);
}

// Keep old function for compatibility
export async function discoverAgents() { return discoverProviders(); }

export function toServiceConfigs(agents: ENSAgentRecord[], localBaseUrl: string): ServiceConfig[] {
  return agents.map((agent) => ({
    name: agent.endpoint,
    ensName: agent.ensName,
    endpoint: `/api/${agent.endpoint}`,
    price: agent.price,
    priceUsd: agent.priceUsd,
    method: ["llm", "translate", "summarize", "vision", "code"].includes(agent.endpoint)
      ? "POST" as const : "GET" as const,
  }));
}
