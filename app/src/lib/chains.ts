import { defineChain } from "viem";

export const EXPLORER_URL = "https://testnet.arcscan.app";

export { injective, injectiveTestnet } from "viem/chains";
export const INJECTIVE_EXPLORER_URL = "https://blockscout.injective.network";
export const INJECTIVE_TESTNET_EXPLORER_URL = "https://testnet.blockscout.injective.network";


export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

// Contract addresses — deployed on Arc Testnet
export const CONTRACTS = {
  agentRegistry: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" as `0x${string}`,
  paymentAccumulator: "0x627eE346183AB858c581A8F234ADA37579Ff1b13" as `0x${string}`,
  pricingOracle: "0xdF5e936A36A190859C799754AAC848D9f5Abf958" as `0x${string}`,
  agenticCommerce: "0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A" as `0x${string}`,
  reputationHook: "0x18d9a536932168bCd066609FB47AB5c1F55b0153" as `0x${string}`,
  usdc: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  link: "0x3F1f176e347235858DD6Db905DDBA09Eaf25478a" as `0x${string}`,
} as const;
