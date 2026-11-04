"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PaymentEvent } from "@/lib/useWebSocket";
import { useWebSocket } from "@/lib/useWebSocket";
import { api } from "@/lib/api";
import { BROKERS, PROVIDERS, providerLabel, brokerLabel } from "@/lib/agents";
import { FlowView } from "@/components/flow-view";
import { ActivationsPanel } from "@/components/activations-panel";
import { BountyPanel } from "@/components/bounty-panel";
import { InjectivePanel } from "@/components/injective-panel";
import { LiveTicker } from "@/components/live-ticker";

const MAX_TRADES = 20;

export function Dashboard() {
  const { connected, stats, payments, isComplete, connect, disconnect, reset, error, priceUpdates, trades, decisions } = useWebSocket();
  const isRunning = connected && !isComplete;
  const [txCount, setTxCount] = useState("200");
  const [profile, setProfile] = useState("balanced");
  const [tab, setTab] = useState<"flow" | "calls" | "decisions" | "trades" | "settlement" | "cre" | "ens" | "injective" | "verify" | "bounty">("flow");
  const [creLogs, setCreLogs] = useState<any[]>([]);
  const [creResults, setCreResults] = useState<any[]>([]);
  const [gwStatus, setGwStatus] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEvent | null>(null);
  const [ensPrices, setEnsPrices] = useState<Record<string, string>>({});
  const [backendTrades, setBackendTrades] = useState<any[]>([]);
  const [backendDecisions, setBackendDecisions] = useState<any[]>([]);
  const [brokerFilter, setBrokerFilter] = useState<string>("all");
  const [priceAgent, setPriceAgent] = useState("search");
  const [newPrice, setNewPrice] = useState("0.0005");
  const [priceResult, setPriceResult] = useState("");

  // Auto-refresh gateway status while running
  useEffect(() => {
    if (!isRunning && !isComplete) return;
    const refresh = () => {
      fetch(api("/gateway-status")).then(r => r.json()).then(setGwStatus).catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [isRunning, isComplete]);

  const handleStart = async () => {
    if (connected) {
      disconnect();
      if (isComplete) reset();
      return;
    }
    connect();
    try {
      await fetch(api("/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycles: Math.ceil(parseInt(txCount) / 8), profile }),
      });
    } catch {}
  };

  const TABS = [
    { id: "flow", label: "Flow" },
    { id: "calls", label: "Calls" },
    { id: "decisions", label: "Decisions" },
    { id: "trades", label: "Trades" },
    { id: "settlement", label: "Settlement" },
    { id: "cre", label: "CRE" },
    { id: "ens", label: "ENS" },
    { id: "injective", label: "Injective" },
    { id: "verify", label: "Verify" },
    { id: "bounty", label: "Protocols" },
  ] as const;

  const gasSavedNum = parseFloat(stats.gasSaved) || 0;

  // Get unique broker names for filter
  const brokerNames = useMemo(() => {
    const names = new Set<string>();
    [...decisions, ...backendDecisions].forEach(d => { if (d.broker) names.add(d.broker); });
    return Array.from(names).sort();
  }, [decisions, backendDecisions]);

  // Merge WebSocket decisions with backend decisions
  const allDecisions = useMemo(() => {
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const d of [...decisions, ...backendDecisions]) {
      const key = `${d.broker}-${d.cycle}-${d.timestamp}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(d);
      }
    }
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [decisions, backendDecisions]);

  const filteredDecisions = useMemo(() => {
    if (brokerFilter === "all") return allDecisions;
    return allDecisions.filter(d => d.broker === brokerFilter);
  }, [allDecisions, brokerFilter]);

  // Merge WebSocket trades with backend trades (dedup by txHash)
  const allTrades = useMemo(() => {
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const t of [...trades, ...backendTrades]) {
      if (t.txHash && !seen.has(t.txHash)) {
        seen.add(t.txHash);
        merged.push(t);
      }
    }
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  }, [trades, backendTrades]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-5 space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          {!connected && (
            <input value={txCount} onChange={e => setTxCount(e.target.value)}
              className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-gray-200" />
          )}
          {isComplete && !connected && (
            <button onClick={() => { reset(); setBackendTrades([]); setBackendDecisions([]); }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
              Reset
            </button>
          )}
          <button onClick={handleStart}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              connected
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}>
            {connected ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      {/* Live Ticker */}
      <LiveTicker
        totalPayments={stats.totalPayments}
        totalVolume={stats.totalVolume}
        gasSaved={stats.gasSaved}
        paymentsPerMin={stats.paymentsPerMin}
        activeWorkers={stats.activeWorkers}
        totalTrades={allTrades.length}
        isRunning={isRunning}
      />

      {/* x402 Protocol Banner — visible when running or has data */}
      {(isRunning || payments.length > 0) && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 bg-white">x402</span>
            <span className="text-xs text-amber-800 font-medium">EIP-3009 TransferWithAuthorization</span>
          </div>
          <span className="text-[10px] text-amber-600">Scheme: GatewayWalletBatched</span>
          <span className="text-[10px] text-amber-600">Chain: Arc Testnet (eip155:5042002)</span>
          <span className="text-[10px] text-amber-600">Settlement: Circle Gateway Batch</span>
          {gwStatus && (
            <span className="text-[10px] text-emerald-700 font-mono ml-auto font-semibold">
              Gateway: ${gwStatus.gateway?.available} USDC
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={async () => {
            setTab(t.id);
            setSelectedPayment(null);
            if (t.id === "settlement") {
              try { setGwStatus(await (await fetch(api("/gateway-status"))).json()); } catch {}
            }
            if (t.id === "ens") {
              try { setEnsPrices(await (await fetch(api("/prices"))).json()); } catch {}
            }
            if (t.id === "decisions") {
              try {
                const data = await (await fetch(api("/decisions"))).json();
                if (data.decisions?.length) setBackendDecisions(data.decisions);
              } catch {}
            }
            if (t.id === "trades") {
              try {
                const data = await (await fetch(api("/trades"))).json();
                if (data.trades?.length) setBackendTrades(data.trades);
              } catch {}
            }
            if (t.id === "cre") {
              try {
                const res = await fetch(api("/cre-run"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: "all" }) });
                const data = await res.json();
                if (data.workflows) setCreResults(data.workflows);
                const logs = await (await fetch(api("/cre-logs"))).json();
                if (logs.logs) setCreLogs(logs.logs);
              } catch {}
            }
          }}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[2px] ${
              tab === t.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Flow Tab ── */}
      {tab === "flow" && (
        <div className="space-y-3">
          {/* Trade Notification Banner */}
          {trades.length > 0 && (Date.now() - trades[0].timestamp < 15000) && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-lg animate-pulse">
              <span className="text-[10px] font-bold text-orange-700 border border-orange-300 rounded px-1.5 py-0.5 bg-white">SWAP</span>
              <span className="text-xs text-orange-800 font-medium">{trades[0].broker}</span>
              <span className="text-xs text-orange-600 font-mono">{trades[0].amountIn} → {trades[0].amountOut}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">via Uniswap</span>
              <a href={trades[0].explorer} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-orange-500 hover:underline ml-auto font-mono">{trades[0].txHash?.slice(0, 14)}... →</a>
            </div>
          )}

          {/* CRE Price Update Banner */}
          {priceUpdates.length > 0 && (Date.now() - priceUpdates[0].timestamp < 30000) && (
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg animate-pulse">
              <span className="text-[10px] font-semibold text-purple-700 border border-purple-300 rounded px-1.5 py-0.5 bg-white">CRE</span>
              <span className="text-xs text-purple-800 font-medium">Dynamic Pricing Update</span>
              <span className="text-[10px] text-purple-600 font-mono">{priceUpdates[0].agent} → ${priceUpdates[0].value}</span>
              <span className="text-[10px] text-purple-400">{priceUpdates.length} agents updated</span>
              {priceUpdates[0].tx && (
                <a href={`https://sepolia.etherscan.io/tx/${priceUpdates[0].tx}`} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-purple-500 hover:underline ml-auto">tx →</a>
              )}
            </div>
          )}

          {/* Side by side: Flow graph + Payment log */}
          <div className="flex gap-4" style={{ height: "calc(100vh - 520px)", minHeight: "400px" }}>
            {/* Left: Flow visualization */}
            <div className="flex-1 min-w-0">
              <FlowView payments={payments} isRunning={isRunning} priceUpdates={priceUpdates} />
            </div>

            {/* Right: Payment feed + detail */}
            <div className="w-[420px] flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                  <p className="text-xs font-medium text-gray-700">x402 Feed</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-amber-600 border border-amber-200 rounded px-1 bg-amber-50">Batched</span>
                  <span className="text-[10px] text-gray-400 font-mono">{payments.length}</span>
                </div>
              </div>

              {selectedPayment ? (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <button onClick={() => setSelectedPayment(null)} className="text-[10px] text-blue-600 hover:underline">← back</button>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-[10px] space-y-1">
                    <p className="text-gray-500">// GatewayClient.pay() response</p>
                    <p className="text-green-400">status: <span className="text-white">200</span></p>
                    <p className="text-green-400">amount: <span className="text-amber-300">{selectedPayment.amount}</span></p>
                    <p className="text-green-400">payer: <span className="text-cyan-300 text-[9px]">{selectedPayment.worker}</span></p>
                    <p className="text-green-400">broker: <span className="text-white">{brokerLabel(selectedPayment.worker)}</span></p>
                    <p className="text-green-400">service: <span className="text-white">{providerLabel(selectedPayment.service)}</span></p>
                    <p className="text-gray-600 mt-1">// x402 protocol</p>
                    <p className="text-green-400">scheme: <span className="text-white">{selectedPayment.scheme || "GatewayWalletBatched"}</span></p>
                    <p className="text-green-400">auth: <span className="text-white">EIP-3009</span></p>
                    <p className="text-green-400">network: <span className="text-white">{selectedPayment.network || "eip155:5042002"}</span></p>
                    <p className="text-green-400">verified: <span className="text-emerald-400">true</span></p>
                    <p className="text-green-400">ref: <span className="text-cyan-300 text-[9px]">{selectedPayment.transaction || "gateway-batch"}</span></p>
                    <p className="text-gray-600 mt-1">// settlement</p>
                    <p className="text-green-400">on_chain: <span className="text-amber-400">false</span> <span className="text-gray-600">// pending batch</span></p>
                    <p className="text-green-400">gas: <span className="text-emerald-400">$0.00</span> <span className="text-gray-600">// gas-free</span></p>
                    <p className="text-green-400">fee: <span className="text-amber-300">{selectedPayment.fee || "10%"}</span></p>
                    {selectedPayment.insight && (
                      <>
                        <p className="text-gray-600 mt-1">// data returned</p>
                        <p className="text-green-400 break-words">data: <span className="text-white">{selectedPayment.insight}</span></p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-[9px]">
                    <a href={`https://testnet.arcscan.app/address/${selectedPayment.worker}`} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline">Payer on ArcScan →</a>
                    <a href="https://testnet.arcscan.app/address/0x0077777d7EBA4688BDeF3E311b846F25870A19B9" target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline">Gateway Wallet →</a>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {payments.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">Click Start</div>
                  ) : payments.map((p, i) => (
                    <div key={i} onClick={() => setSelectedPayment(p)}
                      className="flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                      <span className="text-gray-300 w-14 text-[9px]">{new Date(p.timestamp).toLocaleTimeString()}</span>
                      <span className="text-[8px] text-amber-600 border border-amber-200 rounded px-0.5 bg-amber-50">x402</span>
                      <span className="text-gray-800 w-20 font-medium truncate">{brokerLabel(p.worker)}</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-blue-600 flex-1 truncate">{providerLabel(p.service)}</span>
                      <span className="text-emerald-500 text-[9px]">signed</span>
                      <span className="text-gray-600 font-semibold">{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CRE Status Bar */}
          <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Chainlink CRE</p>
            {[
              { label: "Health Check", interval: "5min" },
              { label: "Price Update", interval: "10min" },
              { label: "Settlement", interval: "30min" },
            ].map(w => (
              <div key={w.label} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {w.label} <span className="text-gray-400">({w.interval})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Calls Tab ── */}
      {tab === "calls" && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-gray-700">x402 Nanopayment Log</p>
              <span className="text-[9px] text-amber-600 border border-amber-200 rounded px-1.5 py-0.5 bg-amber-50">GatewayWalletBatched</span>
              <span className="text-[9px] text-gray-400">click any row for SDK details</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">{payments.length} payments · eip155:5042002</span>
          </div>

          {selectedPayment && tab === "calls" ? (
            <div className="p-4 space-y-3">
              <button onClick={() => setSelectedPayment(null)} className="text-xs text-blue-600 hover:underline">← back to log</button>
              <p className="text-xs font-medium">x402 Payment Detail — SDK Response</p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-[11px] space-y-1.5">
                <p className="text-gray-500">// GatewayClient.pay() returned:</p>
                <p className="text-green-400">{"{"}</p>
                <p className="text-green-400 pl-4">status: <span className="text-amber-300">200</span>,</p>
                <p className="text-green-400 pl-4">amount: <span className="text-amber-300">"{selectedPayment.amount}"</span>,</p>
                <p className="text-green-400 pl-4">transaction: <span className="text-cyan-300">"{selectedPayment.transaction || "gw-batch-ref"}"</span>, <span className="text-gray-500">// gateway ref, NOT on-chain hash</span></p>
                <p className="text-green-400 pl-4">data: {"{"} <span className="text-gray-500">/* service response */</span> {"}"}</p>
                <p className="text-green-400">{"}"}</p>
                <p className="text-gray-600 mt-2">// ── Request context ──</p>
                <p className="text-green-400">payer: <span className="text-cyan-300">{selectedPayment.worker}</span></p>
                <p className="text-green-400">broker: <span className="text-white">{brokerLabel(selectedPayment.worker)}</span></p>
                <p className="text-green-400">service: <span className="text-white">{providerLabel(selectedPayment.service)}</span> <span className="text-gray-500">(/api/{selectedPayment.service})</span></p>
                <p className="text-green-400">price: <span className="text-amber-300">{selectedPayment.amount}</span></p>
                <p className="text-gray-600 mt-2">// ── x402 protocol details ──</p>
                <p className="text-green-400">scheme: <span className="text-white">{selectedPayment.scheme || "GatewayWalletBatched"}</span></p>
                <p className="text-green-400">protocol: <span className="text-white">{selectedPayment.protocol || "x402"}</span></p>
                <p className="text-green-400">auth_type: <span className="text-white">EIP-3009 TransferWithAuthorization</span></p>
                <p className="text-green-400">network: <span className="text-white">{selectedPayment.network || "eip155:5042002"}</span></p>
                <p className="text-green-400">signature_verified: <span className="text-emerald-400">{String(selectedPayment.verified ?? true)}</span></p>
                <p className="text-green-400">platform_fee: <span className="text-amber-300">{selectedPayment.fee || "10%"}</span></p>
                <p className="text-gray-600 mt-2">// ── Settlement status ──</p>
                <p className="text-green-400">settled_on_chain: <span className="text-amber-400">false</span></p>
                <p className="text-green-400">batch_status: <span className="text-amber-300">"pending"</span> <span className="text-gray-500">// Circle Gateway decides when to settle</span></p>
                <p className="text-green-400">gas_cost_for_buyer: <span className="text-emerald-400">$0.00</span> <span className="text-gray-500">// EIP-3009 = gas-free signature</span></p>
                {selectedPayment.insight && (
                  <>
                    <p className="text-gray-600 mt-2">// ── Intelligence data returned ──</p>
                    <p className="text-green-400">insight: <span className="text-white">"{selectedPayment.insight}"</span></p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <a href={`https://testnet.arcscan.app/address/${selectedPayment.worker}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline">Payer wallet on ArcScan →</a>
                <a href="https://testnet.arcscan.app/address/0x0077777d7EBA4688BDeF3E311b846F25870A19B9" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline">Gateway Wallet on ArcScan →</a>
                <a href="https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline">USDC Contract →</a>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {payments.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Click Start to begin x402 payments</div>
              ) : payments.map((p, i) => (
                <div key={i} onClick={() => setSelectedPayment(p)} className="px-4 py-2.5 font-mono text-xs hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-300 w-16">{new Date(p.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[9px] text-amber-600 border border-amber-200 rounded px-1.5 py-0.5 bg-amber-50 font-semibold">x402</span>
                    <span className="text-gray-800 w-24 font-semibold truncate">{brokerLabel(p.worker)}</span>
                    <span className="text-gray-300 text-[10px]">→</span>
                    <span className="text-blue-600 w-32 truncate">{providerLabel(p.service)}</span>
                    <span className="text-emerald-500 text-[10px]">signed</span>
                    <span className="text-amber-500 text-[10px]">in batch</span>
                    <span className="text-emerald-700 font-semibold ml-auto">{p.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Decisions Tab ── */}
      {tab === "decisions" && (
        <div className="space-y-3">
          {/* Broker filter */}
          {brokerNames.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setBrokerFilter("all")}
                className={`px-2 py-1 rounded text-xs ${brokerFilter === "all" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                All ({allDecisions.length})
              </button>
              {brokerNames.map(name => (
                <button key={name} onClick={() => setBrokerFilter(name)}
                  className={`px-2 py-1 rounded text-xs ${brokerFilter === name ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {name} ({allDecisions.filter(d => d.broker === name).length})
                </button>
              ))}
            </div>
          )}
          <div className="space-y-3 max-h-[calc(100vh-460px)] overflow-y-auto">
          {filteredDecisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <p>Broker decisions appear every 5 intelligence calls</p>
              <p className="text-[10px]">Each cycle: 5 x402 calls → aggregate intelligence → BUY/HOLD decision → trade if BUY</p>
            </div>
          ) : filteredDecisions.map((d, i) => (
            <div key={i} className={`border rounded-lg overflow-hidden ${d.signal === "EXECUTE_BUY" ? "border-emerald-200" : "border-gray-200"}`}>
              {/* Decision Header */}
              <div className={`px-4 py-2.5 flex items-center justify-between ${d.signal === "EXECUTE_BUY" ? "bg-emerald-50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{d.broker}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    d.profile === "Conservative" ? "bg-blue-100 text-blue-600" :
                    d.profile === "Balanced" ? "bg-green-100 text-green-600" :
                    d.profile === "Growth" ? "bg-amber-100 text-amber-600" :
                    "bg-red-100 text-red-600"
                  }`}>{d.profile}</span>
                  <span className="text-[10px] text-gray-400">Cycle {d.cycle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    d.signal === "EXECUTE_BUY" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>{d.signal === "EXECUTE_BUY" ? "BUY" : d.signal}</span>
                  <span className="text-[10px] text-gray-400">{new Date(d.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Intelligence Grid */}
              <div className="px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Intelligence Collected ({d.intelligence?.length || 0} providers)</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {(d.intelligence || []).map((intel: any, j: number) => (
                    <div key={j} className="bg-gray-50 rounded p-2.5 text-[11px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-700">{providerLabel(intel.provider)}</span>
                        <span className="text-[9px] text-blue-400 font-mono">{intel.provider}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{intel.insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision + Trade */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-600">
                    <span className="font-medium">Decision:</span> {d.confidence}
                  </div>
                  {d.trade && (
                    <a href={d.trade.explorer} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[10px] text-emerald-600 hover:underline font-mono">
                      <span className="text-[9px] text-orange-600 border border-orange-200 rounded px-1 bg-orange-50 font-bold">SWAP</span>
                      {d.trade.amountOut}
                      <span className="text-blue-500">{d.trade.txHash?.slice(0, 14)}... →</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          </div>
      )}

      {/* ── Trades Tab ── */}
      {tab === "trades" && (
        <div className="space-y-4">
          {/* How trading works */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-orange-800 mb-2">Uniswap API Trading (Sepolia Testnet)</p>
            <div className="grid grid-cols-5 gap-2 text-[10px] text-orange-700 font-mono">
              <div className="bg-white rounded p-2 text-center border border-orange-100">
                <p className="font-semibold text-orange-900">1. Intelligence</p>
                <p>x402 calls to providers</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-orange-100">
                <p className="font-semibold text-orange-900">2. Analyze</p>
                <p>LLM → BUY/HOLD signal</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-orange-100">
                <p className="font-semibold text-orange-900">3. Quote</p>
                <p>Uniswap API /quote</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-orange-100">
                <p className="font-semibold text-orange-900">4. Swap</p>
                <p>Uniswap API /swap</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-orange-100">
                <p className="font-semibold text-orange-900">5. Confirm</p>
                <p>Real tx on Sepolia</p>
              </div>
            </div>
            <p className="text-[9px] text-orange-600 mt-2">Max {MAX_TRADES} trades per session. Each trade: 0.0001 ETH → USDC via Uniswap V3 on Sepolia.</p>
          </div>

          {/* Trade list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-gray-700">Uniswap Trades</p>
                <span className="text-[9px] text-orange-600 border border-orange-200 rounded px-1.5 py-0.5 bg-orange-50 font-semibold">Sepolia</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{allTrades.length}/{MAX_TRADES} trades</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {allTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
                  <p>Trades appear when brokers receive BUY signals</p>
                  <p className="text-[10px]">Every 5 intelligence calls → risk check → if BUY → Uniswap swap</p>
                </div>
              ) : allTrades.map((t, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[10px] text-gray-300 w-16">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[9px] text-orange-600 border border-orange-200 rounded px-1.5 py-0.5 bg-orange-50 font-bold">SWAP</span>
                    <span className="text-gray-800 font-semibold w-24">{t.broker}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.signal === "EXECUTE_BUY" || t.signal === "BUY" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.signal}
                    </span>
                    <span className="text-gray-500 font-mono">{t.amountIn}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-emerald-600 font-mono font-semibold">{t.amountOut}</span>
                    <span className={`ml-auto text-[10px] font-semibold ${t.status === "success" ? "text-emerald-500" : "text-red-500"}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 ml-20 text-[9px] text-gray-400">
                    <span>routing: {t.routing}</span>
                    <span>chain: Sepolia</span>
                    <span>trade {t.tradeNumber}/{t.maxTrades}</span>
                    <a href={t.explorer} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:underline ml-auto font-mono">
                      {t.txHash?.slice(0, 18)}... →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Settlement Tab ── */}
      {tab === "settlement" && (
        <div className="space-y-4">
          {/* How Batching Works */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-800 mb-2">Circle Gateway Batch Settlement Lifecycle</p>
            <div className="grid grid-cols-5 gap-2 text-[10px] text-amber-700 font-mono">
              <div className="bg-white rounded p-2 text-center border border-emerald-200">
                <p className="font-semibold text-emerald-700">1. Request</p>
                <p>Buyer calls service</p>
                <p className="text-[8px] text-gray-400 mt-1">HTTP GET/POST</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-amber-200">
                <p className="font-semibold text-amber-800">2. 402 Required</p>
                <p>Seller returns price</p>
                <p className="text-[8px] text-gray-400 mt-1">x-payment header</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-emerald-200">
                <p className="font-semibold text-emerald-700">3. Sign</p>
                <p>EIP-3009 auth</p>
                <p className="text-[8px] text-emerald-500 mt-1">gas-free, off-chain</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-amber-300 bg-amber-50">
                <p className="font-semibold text-amber-800">4. In Batch</p>
                <p>Gateway accumulates</p>
                <p className="text-[8px] text-amber-600 mt-1">NOT on-chain yet</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-200">
                <p className="font-semibold text-blue-700">5. Settle</p>
                <p>1 on-chain tx for all</p>
                <p className="text-[8px] text-blue-500 mt-1">Circle decides when</p>
              </div>
            </div>
            <p className="text-[9px] text-amber-600 mt-2">Each client.pay() returns immediately with data + gateway reference. The on-chain settlement happens later when Circle executes the batch.</p>
          </div>

          {/* Gateway Status */}
          <div className="border border-gray-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Gateway Balance (Live)</p>
              <button onClick={() => fetch(api("/gateway-status")).then(r => r.json()).then(setGwStatus).catch(() => {})}
                className="text-[10px] text-blue-600 hover:underline">Refresh</button>
            </div>
            {gwStatus ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gateway Earned</p>
                    <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">${gwStatus.gateway?.available}</p>
                    <p className="text-[9px] text-emerald-600 mt-1">from batched x402 payments</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Wallet Balance</p>
                    <p className="text-2xl font-bold font-mono mt-1">${gwStatus.wallet?.balance}</p>
                    <p className="text-[9px] text-gray-400 mt-1">USDC on Arc Testnet</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lifetime Payments</p>
                    <p className="text-2xl font-bold text-blue-700 font-mono mt-1">{gwStatus.lifetimePayments}</p>
                    <p className="text-[9px] text-blue-500 mt-1">x402 nanopayments</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gas Saved</p>
                    <p className="text-2xl font-bold text-purple-700 font-mono mt-1">${gasSavedNum.toFixed(2)}</p>
                    <p className="text-[9px] text-purple-500 mt-1">vs {stats.totalPayments} individual txs</p>
                  </div>
                </div>

                {/* Batching Proof */}
                <div className="bg-gray-900 rounded-lg p-4 space-y-2 font-mono text-[11px]">
                  <p className="text-gray-500">// x402 Payment Status</p>
                  <p className="text-green-400">sdk: <span className="text-white">@circle-fin/x402-batching</span></p>
                  <p className="text-green-400">scheme: <span className="text-white">GatewayWalletBatched</span></p>
                  <p className="text-green-400">authorization: <span className="text-white">EIP-3009 TransferWithAuthorization</span></p>
                  <p className="text-green-400">chain: <span className="text-white">Arc Testnet (eip155:5042002)</span></p>
                  <p className="text-green-400">gateway_wallet: <span className="text-cyan-300">0x0077777d7EBA4688BDeF3E311b846F25870A19B9</span></p>
                  <p className="text-green-400">usdc_contract: <span className="text-cyan-300">0x3600000000000000000000000000000000000000</span></p>
                  <p className="text-gray-500">// ── Payment Lifecycle ──</p>
                  <p className="text-green-400">signatures_collected: <span className="text-amber-300">{gwStatus.lifetimePayments || stats.totalPayments}</span></p>
                  <p className="text-green-400">gateway_balance: <span className="text-amber-300">${gwStatus.gateway?.available} USDC</span></p>
                  <p className="text-green-400">status: <span className="text-amber-400">in batch (pending on-chain settlement)</span></p>
                  <p className="text-gray-500">// ── Gas Savings ──</p>
                  <p className="text-green-400">without_batching: <span className="text-red-400">{stats.totalPayments} individual txs x ~$0.30 = ${(stats.totalPayments * 0.30).toFixed(2)}</span></p>
                  <p className="text-green-400">with_batching: <span className="text-emerald-400">1 batch tx = ~$0.30</span></p>
                  <p className="text-green-400">saved: <span className="text-emerald-400">${gasSavedNum.toFixed(2)}</span></p>
                </div>

                {/* Verify Links */}
                <div className="flex items-center gap-4 text-xs">
                  <a href={gwStatus.verifyOnChain?.seller} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline">Seller on ArcScan →</a>
                  <a href={gwStatus.verifyOnChain?.gatewayWallet} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline">Gateway Contract →</a>
                  <a href={gwStatus.verifyOnChain?.usdcContract} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline">USDC Contract →</a>
                </div>

                {/* Recent Payments */}
                {gwStatus.recentPayments?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Recent Batched Payments</p>
                    <div className="space-y-1 font-mono text-[11px]">
                      {gwStatus.recentPayments.slice(0, 10).map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-gray-300">{new Date(p.timestamp).toLocaleTimeString()}</span>
                          <span className="text-[9px] text-amber-600 border border-amber-200 rounded px-1 bg-amber-50">x402</span>
                          <span className="text-gray-500">{p.worker?.slice(0,8)}→{p.service}</span>
                          <span className="text-[9px] text-gray-400">GatewayWalletBatched</span>
                          <span className="text-emerald-500 ml-auto">+{p.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-8">Loading gateway status...</p>}
          </div>
        </div>
      )}

      {/* ── CRE Tab ── */}
      {tab === "cre" && (
        <div className="space-y-4">
          {creLogs.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 max-h-[250px] overflow-y-auto font-mono text-[11px] text-green-400 space-y-0.5">
              {creLogs.slice(-30).map((log: any, i: number) => (
                <div key={i} className={log.level === "ERROR" ? "text-red-400" : log.level === "WARN" ? "text-yellow-400" : log.level === "DEBUG" ? "text-gray-600" : "text-green-400"}>
                  <span className="text-gray-600">{log.timestamp?.slice(11, 19)}</span>{" "}
                  <span className="text-blue-400">[{log.workflow}]</span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {creResults.map((w: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium">{w.workflow}</span>
                </div>
                <p className="text-[11px] text-gray-400">{w.trigger}</p>
                <p className="text-[11px] text-gray-600 font-mono mt-1">{w.summary}</p>
              </div>
            ))}
          </div>
          {creResults.length === 0 && creLogs.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-12">Click the CRE tab to execute workflows</p>
          )}
        </div>
      )}

      {/* ── ENS Tab ── */}
      {tab === "ens" && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">flowbroker.eth</h2>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 font-medium">Live from Sepolia</span>
                <a href="https://sepolia.app.ens.domains/flowbroker.eth" target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline">View on ENS →</a>
              </div>
              <p className="text-xs text-gray-400 mt-1">18 subnames: 8 brokers + 10 providers. Agents discover each other via ENS text records.</p>
            </div>
            <button onClick={() => fetch(api("/prices")).then(r => r.json()).then(setEnsPrices).catch(() => {})}
              className="text-[10px] text-blue-600 hover:underline">Refresh prices</button>
          </div>

          {/* How ENS works in Flow Broker */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-800 mb-2">How agents use ENS for discovery</p>
            <div className="grid grid-cols-4 gap-2 text-[10px] text-blue-700 font-mono">
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <p className="font-semibold text-blue-900">1. Resolve</p>
                <p>getEnsText(agent.flowbroker.eth)</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <p className="font-semibold text-blue-900">2. Read Price</p>
                <p>com.x402.price → "$0.001"</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <p className="font-semibold text-blue-900">3. Pay</p>
                <p>x402 nanopayment at ENS price</p>
              </div>
              <div className="bg-white rounded p-2 text-center border border-blue-100">
                <p className="font-semibold text-blue-900">4. React</p>
                <p>Price changes → agents adapt in 30s</p>
              </div>
            </div>
          </div>

          {/* Provider Agents */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold">Information Providers</h3>
              <span className="text-[10px] text-gray-400">10 subnames</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PROVIDERS).map(([key, p]) => {
                const livePrice = ensPrices[key];
                const hasUpdate = priceUpdates.some(pu => pu.agent.replace(".flowbroker.eth", "") === key && Date.now() - pu.timestamp < 30000);
                return (
                  <a key={key} href={`https://sepolia.app.ens.domains/${p.ens}`} target="_blank" rel="noopener noreferrer"
                    className={`block border rounded-lg p-4 hover:border-blue-300 transition-all ${hasUpdate ? "border-purple-300 bg-purple-50" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">{p.label}</span>
                      <span className={`text-xs font-mono font-bold ${hasUpdate ? "text-purple-600" : "text-emerald-600"}`}>
                        {livePrice || p.price}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-500 font-mono mb-1">{p.ens}</p>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between text-gray-500">
                        <span>com.x402.price</span>
                        <span className="font-mono text-gray-700">{livePrice || "..."}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>com.agent.capabilities</span>
                        <span className="text-gray-700 truncate ml-2">{p.type}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>com.agent.type</span>
                        <span className="text-gray-700">provider</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>com.agent.status</span>
                        <span className="text-emerald-600">active</span>
                      </div>
                    </div>
                    {hasUpdate && (
                      <div className="mt-2 text-[9px] text-purple-500 font-semibold animate-pulse">CRE just updated this price</div>
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Broker Agents */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold">Broker Agents</h3>
              <span className="text-[10px] text-gray-400">8 subnames</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BROKERS.map((b) => (
                <a key={b.id} href={`https://sepolia.app.ens.domains/${b.id}.flowbroker.eth`} target="_blank" rel="noopener noreferrer"
                  className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{b.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      b.profile === "Conservative" ? "bg-blue-100 text-blue-600" :
                      b.profile === "Balanced" ? "bg-green-100 text-green-600" :
                      b.profile === "Growth" ? "bg-amber-100 text-amber-600" :
                      "bg-red-100 text-red-600"
                    }`}>{b.profile}</span>
                  </div>
                  <p className="text-[11px] text-blue-500 font-mono mb-1">{b.id}.flowbroker.eth</p>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-gray-500">
                      <span>com.agent.type</span>
                      <span className="text-gray-700">broker</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>com.agent.providers</span>
                      <span className="text-gray-700 truncate ml-2">{b.providers.join(", ")}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>com.agent.status</span>
                      <span className="text-emerald-600">active</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>cost</span>
                      <span className="text-gray-700">{b.cost}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Live Price Change Demo */}
          <div className="border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-semibold mb-1">Live Price Change Demo</p>
            <p className="text-[10px] text-gray-400 mb-3">Update an agent's ENS price on Sepolia. Brokers discover the new price within 30 seconds.</p>
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Agent</label>
                <select value={priceAgent} onChange={e => setPriceAgent(e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1.5 text-xs bg-white">
                  {Object.keys(PROVIDERS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">New Price (USDC)</label>
                <input value={newPrice} onChange={e => setNewPrice(e.target.value)}
                  className="w-24 border border-gray-200 rounded px-3 py-1.5 text-xs font-mono" />
              </div>
              <button onClick={async () => {
                setPriceResult("writing to ENS...");
                try {
                  const res = await fetch(api("/change-price"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ agent: priceAgent, newPrice }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setPriceResult(`Updated on Sepolia: tx ${data.tx.slice(0, 20)}...`);
                    setTimeout(() => fetch(api("/prices")).then(r => r.json()).then(setEnsPrices), 3000);
                  } else setPriceResult(data.error || "failed");
                } catch (e: any) { setPriceResult(e.message); }
              }}
                className="px-4 py-1.5 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800">
                Update ENS
              </button>
            </div>
            {priceResult && <p className="text-[10px] text-gray-500 mt-2 font-mono">{priceResult}</p>}
          </div>
        </div>
      )}

      {/* ── Verify Tab ── */}
      {tab === "verify" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-medium">On-Chain Contracts (Arc Testnet)</p>
            {[
              { n: "AgentRegistry", a: "0xE9bFA497e189272109540f9dBA4cb1419F05cdF0" },
              { n: "AgenticCommerce", a: "0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A" },
              { n: "PaymentAccumulator", a: "0x627eE346183AB858c581A8F234ADA37579Ff1b13" },
              { n: "PricingOracle", a: "0xdF5e936A36A190859C799754AAC848D9f5Abf958" },
              { n: "ReputationHook", a: "0x18d9a536932168bCd066609FB47AB5c1F55b0153" },
              { n: "Gateway Wallet", a: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" },
              { n: "USDC", a: "0x3600000000000000000000000000000000000000" },
            ].map(c => (
              <div key={c.n} className="flex justify-between text-xs">
                <span className="text-gray-600">{c.n}</span>
                <a href={`https://testnet.arcscan.app/address/${c.a}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono text-[11px]">{c.a.slice(0,8)}..{c.a.slice(-4)}</a>
              </div>
            ))}
          </div>
          <div className="border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-medium">ENS (Sepolia)</p>
            <a href="https://sepolia.app.ens.domains/flowbroker.eth" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs block">flowbroker.eth →</a>
            <p className="text-xs text-gray-500">18 subnames: 8 brokers + 10 providers</p>
            <p className="text-xs text-gray-500">72+ text records (prices, capabilities, roles)</p>

            <p className="text-sm font-medium mt-4">x402 Protocol</p>
            <p className="text-xs text-gray-500">SDK: @circle-fin/x402-batching</p>
            <p className="text-xs text-gray-500">Scheme: GatewayWalletBatched (EIP-3009)</p>
            <p className="text-xs text-gray-500">Settlement: Circle Gateway Batch</p>

            <p className="text-sm font-medium mt-4">CRE Workflows</p>
            <p className="text-xs text-gray-500">3 workflows on CRE CLI v1.9.0</p>
            <p className="text-xs text-gray-500">Health Monitor, Dynamic Pricing, Settlement</p>

            <p className="text-sm font-medium mt-4">Uniswap (Sepolia)</p>
            <p className="text-xs text-gray-500">API: trade-api.gateway.uniswap.org/v1</p>
            <p className="text-xs text-gray-500">Routing: BEST_PRICE across all Uniswap pools</p>
            <p className="text-xs text-gray-500">Tokens: ETH, USDC, WETH, UNI</p>
            <a href="https://sepolia.etherscan.io/address/0x44ACAb497e28c6F700528FE7C281A4A1e557d155" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-[10px] block">View trader wallet on Etherscan →</a>

            <p className="text-sm font-medium mt-4">ERC-8004 Identities (Arc)</p>
            <p className="text-xs text-gray-500">8 brokers registered on IdentityRegistry</p>
            <a href="https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-[10px] block">IdentityRegistry on ArcScan →</a>
            <p className="text-[10px] text-gray-400">Token IDs: #1448 (Guardian) → #1455 (Titan)</p>
          </div>
        </div>
      )}

      {tab === "injective" && <InjectivePanel />}

      {/* ── Protocols Tab ── */}
      {tab === "bounty" && (
        <BountyPanel
          totalPayments={stats.totalPayments}
          totalVolume={stats.totalVolume}
          gasSaved={stats.gasSaved}
        />
      )}
    </div>
  );
}
