"use client";

import dynamic from "next/dynamic";
import { Dashboard } from "@/components/dashboard";
import { walletConfigured } from "@/lib/wagmi";

const Providers = dynamic(
  () => import("./providers").then((m) => m.Providers),
  { ssr: false }
);

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false }
);

export default function Home() {
  return (
    <Providers>
      <main className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🕸️</span>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Flow Broker</h1>
                <p className="text-xs text-muted-foreground">
                  Live Agent Economy on Arc
                </p>
              </div>
            </div>
            {walletConfigured ? <ConnectButton /> : (
              <button disabled title="The site owner must configure an owned Reown project ID and allow this origin." className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground cursor-not-allowed">
                Wallet setup required
              </button>
            )}
          </div>
        </header>

        {/* Dashboard */}
        <Dashboard />
      </main>
    </Providers>
  );
}
