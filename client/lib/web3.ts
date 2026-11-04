import { getDefaultConfig } from "@rainbow-me/rainbowkit";
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

export const wagmiConfig = getDefaultConfig({
  appName: "Flow Broker",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "a439946a4066ac956330bf09c0080f0c",
  chains: [arcTestnet, injectiveTestnet, injective],
  ssr: false,
  multiInjectedProviderDiscovery: false,
});

export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const PLATFORM_ADDRESS = "0x44ACAb497e28c6F700528FE7C281A4A1e557d155" as `0x${string}`;
