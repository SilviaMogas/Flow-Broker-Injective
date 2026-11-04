import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcTestnet, injective, injectiveTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "Flow Broker",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [arcTestnet, injectiveTestnet, injective],
  ssr: true,
});
