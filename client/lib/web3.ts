import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injective, injectiveTestnet } from "viem/chains";

export { injective, injectiveTestnet };

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";
export const walletConfigured = /^[a-f0-9]{32}$/i.test(projectId);

const chainConfig = {
  chains: [arcTestnet, injectiveTestnet, injective],
  ssr: true,
  multiInjectedProviderDiscovery: false,
} as const;

export const wagmiConfig = walletConfigured
  ? getDefaultConfig({ ...chainConfig, appName: "Flow Broker", projectId })
  : createConfig({
      ...chainConfig,
      connectors: [],
      transports: {
        [arcTestnet.id]: http(),
        [injectiveTestnet.id]: http(),
        [injective.id]: http(),
      },
    });

export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const PLATFORM_ADDRESS = "0x44ACAb497e28c6F700528FE7C281A4A1e557d155" as `0x${string}`;
