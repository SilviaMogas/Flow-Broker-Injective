"use client";

import { useState, useEffect, type ComponentType } from "react";
import { api } from "@/lib/dashboard/api";
import { walletConfigured } from "@/lib/web3";

const BROKER_WALLETS: Record<string, `0x${string}`> = {
  guardian:   "0xea108a5074772f700Dc84c76F180b11285be6d8d",
  sentinel:   "0x225F28E9c6d4E9a2DB8E2b007BEc91716E331efB",
  steady:     "0xbe3359304457A8C0C443Ad412E65f7d4aADC405e",
  navigator:  "0x1eE2cfc2b77D388B451F7Dd74982391e0bB3BaD5",
  growth:     "0xa9624B279640F36aDCAd3845447d40bbe6eb7E5B",
  momentum:   "0x92Cd4862E054e3F426818D1883b92A9321Ae6Ba5",
  apex:       "0x5c10Adf159D45D1A3874882d36cdacA722C000c9",
  titan:      "0x3004B4add68C3753Ecd5f18edD93EE999Ffaff3e",
};

const USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const ARC_ID = 5042002;

interface Props { brokerName: string; depositAmount: string; }

export function WalletActivation({ brokerName, depositAmount }: Props) {
  const [Component, setComponent] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    if (!walletConfigured) return;
    Promise.all([
      import("wagmi"),
      import("viem"),
    ]).then(([wagmi, viem]) => {
      const USDC_ABI = [{ name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const;

      function Inner({ brokerName, depositAmount }: Props) {
        const { isConnected, address } = wagmi.useAccount();
        const { connect, connectors } = wagmi.useConnect();
        const { writeContract, data: txHash, isPending } = wagmi.useWriteContract();
        const { isLoading: isConfirming, isSuccess } = wagmi.useWaitForTransactionReceipt({ hash: txHash });
        const [done, setDone] = useState(false);

        const brokerWallet = BROKER_WALLETS[brokerName] || USDC;

        const pay = () => {
          if (!depositAmount || Number(depositAmount) <= 0) return;
          writeContract({
            address: USDC,
            abi: USDC_ABI,
            functionName: "transfer",
            args: [brokerWallet, viem.parseUnits(depositAmount, 6)],
            chainId: ARC_ID,
          });
        };

        if (!isConnected) return (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">Connect your wallet to pay on Arc Testnet</p>
            <button onClick={() => connect({ connector: connectors[0] })}
              className="w-full h-14 rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 transition-colors">
              Connect Wallet
            </button>
          </div>
        );

        // Send activation to backend when payment confirms
        if (isSuccess && txHash && !done) {
          setDone(true);
          fetch(api("/activate"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ broker: brokerName, txHash, userAddress: address }),
          }).catch(() => {});
        }

        // Notify backend about this activation
        if (isSuccess && txHash) {
          fetch(api("/activate"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ broker: brokerName, txHash, userAddress: address }),
          }).catch(() => {});
        }

        if (isSuccess) return (
          <div className="space-y-4">
            <div className="w-full p-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold">Payment confirmed!</p>
                <p className="text-sm text-green-600">{depositAmount} USDC transferred to {brokerName} broker</p>
              </div>
            </div>
            {txHash && (
              <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-2 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-gray-50 font-mono">
                View on ArcScan → {txHash.slice(0, 20)}...
              </a>
            )}
            <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard"} target="_blank" rel="noopener noreferrer"
              className="block w-full py-4 text-center rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 transition-colors">
              🚀 View Live Dashboard →
            </a>
          </div>
        );

        return (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Connected: {address?.slice(0, 8)}...{address?.slice(-4)}</span>
              <span className="text-green-600">● Arc Testnet</span>
            </div>
            <div className="text-xs text-muted-foreground px-1 font-mono">
              Broker wallet: {brokerWallet.slice(0, 10)}...{brokerWallet.slice(-6)}
            </div>
            <button onClick={pay} disabled={!depositAmount || Number(depositAmount) <= 0 || isPending || isConfirming}
              className="w-full h-14 rounded-lg bg-primary text-primary-foreground text-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {isPending || isConfirming
                ? <><span className="animate-spin">⏳</span>{isConfirming ? "Confirming on Arc..." : "Confirm in wallet..."}</>
                : <>Pay ${depositAmount} USDC · Activate {brokerName} →</>
              }
            </button>
            {txHash && !isSuccess && (
              <p className="text-xs text-center text-muted-foreground font-mono">tx pending: {txHash.slice(0, 20)}...</p>
            )}
          </div>
        );
      }

      setComponent(() => function Activation(props: Props) {
        return <Inner {...props} />;
      });
    });
  }, []);

  if (!walletConfigured) return (
    <div className="rounded-lg border border-border p-4 text-center space-y-2">
      <p className="font-medium">Wallet setup required</p>
      <p className="text-sm text-muted-foreground">
        The site owner must configure an owned Reown project and allow this site before wallet activation is available. You can still explore brokers and public Injective data.
      </p>
    </div>
  );

  if (!Component) return (
    <div className="w-full h-14 rounded-lg border border-border flex items-center justify-center text-muted-foreground text-sm animate-pulse">
      Loading wallet...
    </div>
  );

  return <Component brokerName={brokerName} depositAmount={depositAmount} />;
}
