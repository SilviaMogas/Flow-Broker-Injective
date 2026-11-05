"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { walletConfigured } from "@/lib/web3";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const green = { backgroundColor: "#00D26A", color: "#000", borderRadius: "6px", padding: "8px 16px", fontSize: "14px", fontWeight: "500" as const, border: "none", cursor: "pointer" as const };
  const greenPill = { backgroundColor: "#00D26A", color: "#000", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: "500" as const, border: "none", cursor: "pointer" as const, fontFamily: "monospace" };

  if (!walletConfigured) {
    return (
      <button disabled title="The site owner must configure an owned Reown project ID and allow this origin." style={{ ...green, cursor: "not-allowed", opacity: 0.6 }}>
        Wallet setup required
      </button>
    );
  }

  if (isConnected && address) {
    return <button onClick={() => disconnect()} style={greenPill}>{address.slice(0, 6)}...{address.slice(-4)}</button>;
  }

  return (
    <button onClick={openConnectModal} style={green}>
      Connect Wallet
    </button>
  );
}
