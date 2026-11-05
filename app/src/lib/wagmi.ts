import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { arcTestnet, injective, injectiveTestnet } from "./chains";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";
export const walletConfigured = /^[a-f0-9]{32}$/i.test(projectId);

const chainConfig = {
  chains: [arcTestnet, injectiveTestnet, injective],
  ssr: true,
} as const;

export const config = walletConfigured
  ? getDefaultConfig({ ...chainConfig, appName: "Flow Broker", projectId })
  : createConfig({
      ...chainConfig,
      multiInjectedProviderDiscovery: false,
      connectors: [],
      transports: {
        [arcTestnet.id]: http(),
        [injectiveTestnet.id]: http(),
        [injective.id]: http(),
      },
    });
