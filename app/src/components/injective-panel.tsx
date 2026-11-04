"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { INJECTIVE_EXPLORER_URL, INJECTIVE_TESTNET_EXPLORER_URL } from "@/lib/chains";

interface Market {
  ticker: string;
  marketId: string;
  bestBid: number | null;
  bestAsk: number | null;
  mid: number | null;
  spreadBps: number | null;
  bidDepth: number;
  askDepth: number;
  imbalance: number | null;
  lastPrice: number | null;
  lastTradeDirection: string | null;
  signal: string;
  fetchedAt: number;
}

interface ChainStatus {
  network: string;
  name: string;
  chainId: number;
  blockNumber: string | null;
  rpc: string;
  explorer?: string;
  ok: boolean;
}

const fmt = (n: number | null, d = 3) => (n === null || Number.isNaN(n) ? "n/a" : n.toFixed(d));

export function InjectivePanel() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [chains, setChains] = useState<ChainStatus[]>([]);
  const [contracts, setContracts] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(api("/injective/markets"));
        const j = await r.json();
        if (!alive) return;
        setMarkets(j.markets || []);
        setError(j.error || null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    fetch(api("/injective/chains"))
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setChains(j.chains || []);
        setContracts(j.contracts || {});
      })
      .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const deployed = Object.entries(contracts).filter(([, addr]) => addr);

  return (
    <div className="space-y-4">
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-cyan-900 mb-1">Injective provider</p>
        <p className="text-[11px] text-cyan-800">
          Apex and Titan buy the <span className="font-mono">injective</span> signal over x402. It is computed from the live
          Injective mainnet spot orderbook (Injective Indexer), refreshed every 15s.
        </p>
      </div>

      {error && <p className="text-xs text-red-600">Injective data error: {error}</p>}

      <div className="grid md:grid-cols-2 gap-3">
        {markets.length === 0 && !error && <p className="text-xs text-gray-400">Loading Injective markets…</p>}
        {markets.map((m) => (
          <div key={m.marketId} className="border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">{m.ticker}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  m.signal === "BULLISH" ? "bg-emerald-100 text-emerald-700" : m.signal === "BEARISH" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {m.signal}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div><p className="text-gray-400">Bid</p><p>{fmt(m.bestBid)}</p></div>
              <div><p className="text-gray-400">Mid</p><p className="font-semibold">{fmt(m.mid)}</p></div>
              <div><p className="text-gray-400">Ask</p><p>{fmt(m.bestAsk)}</p></div>
              <div><p className="text-gray-400">Spread</p><p>{fmt(m.spreadBps, 1)} bps</p></div>
              <div><p className="text-gray-400">Imbalance</p><p>{fmt(m.imbalance, 2)}</p></div>
              <div><p className="text-gray-400">Last</p><p>{fmt(m.lastPrice)} {m.lastTradeDirection ?? ""}</p></div>
            </div>
            <p className="text-[10px] text-gray-400">Updated {new Date(m.fetchedAt).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Injective EVM networks</p>
        <div className="grid md:grid-cols-2 gap-2">
          {chains.map((c) => (
            <a key={c.network} href={c.explorer} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded border border-gray-100 hover:bg-gray-50 text-xs">
              <span className="text-gray-700">{c.name} · chain {c.chainId}</span>
              <span className={`font-mono text-[10px] ${c.ok ? "text-emerald-600" : "text-red-600"}`}>
                {c.ok ? `block ${c.blockNumber}` : "unreachable"}
              </span>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Wallets can switch to Injective EVM testnet (1439) or mainnet (1776).
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Flow Broker contracts on Injective testnet</p>
        {deployed.length === 0 ? (
          <p className="text-[11px] text-gray-500">
            Not deployed yet. Deploy with <span className="font-mono">forge script script/Deploy.s.sol --rpc-url injective_testnet --broadcast</span>.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-2">
            {deployed.map(([name, addr]) => (
              <a key={name} href={`${INJECTIVE_TESTNET_EXPLORER_URL}/address/${addr}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 text-xs">
                <span className="text-gray-600">{name}</span>
                <span className="text-blue-600 font-mono text-[10px]">{addr!.slice(0, 6)}..{addr!.slice(-4)}</span>
              </a>
            ))}
          </div>
        )}
        <a href={INJECTIVE_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] block mt-2">
          Injective Blockscout →
        </a>
      </div>
    </div>
  );
}
