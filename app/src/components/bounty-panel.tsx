"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PROVIDERS } from "@/lib/agents";

interface Props {
  totalPayments: number;
  totalVolume: string;
  gasSaved: string;
}

export function BountyPanel({ totalPayments, totalVolume, gasSaved }: Props) {
  const [tab, setTab] = useState<"arc" | "ens" | "cre" | "uni">("arc");
  const [gwStatus, setGwStatus] = useState<any>(null);
  const [ensPrices, setEnsPrices] = useState<Record<string, string>>({});
  const [creLogs, setCreLogs] = useState<any[]>([]);
  const [creResults, setCreResults] = useState<any[]>([]);
  const [creRunning, setCreRunning] = useState(false);
  const [priceAgent, setPriceAgent] = useState("search");
  const [newPrice, setNewPrice] = useState("0.0005");
  const [priceResult, setPriceResult] = useState("");

  useEffect(() => {
    fetch(api("/gateway-status")).then(r => r.json()).then(setGwStatus).catch(() => {});
    fetch(api("/prices")).then(r => r.json()).then(setEnsPrices).catch(() => {});
  }, []);

  const runCRE = async () => {
    setCreRunning(true);
    try {
      const [run, logs] = await Promise.all([
        fetch(api("/cre-run"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: "all" }) }).then(r => r.json()),
        fetch(api("/cre-logs")).then(r => r.json()),
      ]);
      if (run.workflows) setCreResults(run.workflows);
      if (logs.logs) setCreLogs(logs.logs);
    } catch {}
    setCreRunning(false);
  };

  const changePrice = async () => {
    setPriceResult("writing to ENS...");
    try {
      const res = await fetch(api("/change-price"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: priceAgent, newPrice }),
      });
      const data = await res.json();
      if (data.success) {
        setPriceResult(`Updated on-chain: tx ${data.tx.slice(0, 14)}...`);
        setTimeout(() => fetch(api("/prices")).then(r => r.json()).then(setEnsPrices), 3000);
      } else setPriceResult(data.error || "failed");
    } catch (e: any) { setPriceResult(e.message); }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex border-b border-gray-100">
        {(["arc", "ens", "cre", "uni"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium ${tab === t ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-400 hover:bg-gray-50"}`}>
            {t === "arc" ? "Arc x402" : t === "ens" ? "ENS" : t === "cre" ? "Chainlink CRE" : "Uniswap"}
          </button>
        ))}
      </div>

      <div className="p-4 text-xs space-y-4">
        {tab === "arc" && (
          <>
            <div>
              <p className="font-medium mb-1">How x402 works in Flow Broker</p>
              <div className="bg-gray-50 rounded p-3 font-mono text-[10px] space-y-1 text-gray-600">
                <p className="text-gray-400">// Each intelligence call follows this flow:</p>
                <p>1. Broker needs data</p>
                <p>2. Broker resolves price from ENS</p>
                <p>3. Provider returns <span className="text-amber-600">402 Payment Required</span></p>
                <p>4. Broker signs EIP-3009 authorization (gas-free)</p>
                <p>5. Provider verifies + serves data</p>
                <p>6. Gateway batches settlements on Arc</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-gray-200 p-2 text-center">
                <p className="font-semibold">{totalPayments.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">calls made</p>
              </div>
              <div className="rounded border border-gray-200 p-2 text-center">
                <p className="font-semibold">${totalVolume}</p>
                <p className="text-[10px] text-gray-400">USDC paid</p>
              </div>
              <div className="rounded border border-gray-200 p-2 text-center">
                <p className="font-semibold text-green-600">${gasSaved}</p>
                <p className="text-[10px] text-gray-400">gas saved</p>
              </div>
            </div>
            {gwStatus && (
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">seller balance (Gateway)</span>
                  <span className="text-green-600">${gwStatus.gateway?.available} USDC</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">payment scheme</span>
                  <span>GatewayWalletBatched</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-400">protocol</span>
                  <span>x402 (EIP-3009)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">chain</span>
                  <span>Arc Testnet · eip155:5042002</span>
                </div>
              </div>
            )}
            {gwStatus && (
              <a href={gwStatus.verifyOnChain?.seller} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-[10px] block">View seller wallet on ArcScan →</a>
            )}
          </>
        )}

        {tab === "ens" && (
          <>
            <div>
              <p className="font-medium mb-1">How brokers use ENS to discover providers</p>
              <div className="bg-gray-50 rounded p-3 font-mono text-[10px] space-y-1 text-gray-600">
                <p className="text-gray-400">// Before each call, broker resolves ENS:</p>
                <p>const price = await getEnsText(</p>
                <p className="pl-4">'market-data.flowbroker.eth',</p>
                <p className="pl-4">'com.x402.price'  <span className="text-gray-400">// reads from Sepolia</span></p>
                <p>)</p>
                <p className="text-amber-600">// price is variable — change ENS → agents react</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-medium text-gray-500 pb-1">
                <span>Provider (ENS)</span><span>Live Price</span>
              </div>
              {Object.entries(PROVIDERS).slice(0, 8).map(([key, p]) => (
                <div key={key} className="flex justify-between text-[10px]">
                  <span className="text-blue-500 font-mono">{p.ens}</span>
                  <span className="text-green-600 font-mono">{ensPrices[key] || "..."}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] font-medium mb-2">Live price change demo</p>
              <div className="flex gap-2 items-end">
                <select value={priceAgent} onChange={e => setPriceAgent(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-[10px] bg-white">
                  {Object.keys(PROVIDERS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input value={newPrice} onChange={e => setNewPrice(e.target.value)}
                  className="w-20 border border-gray-200 rounded px-2 py-1 text-[10px]" />
                <button onClick={changePrice}
                  className="px-3 py-1 bg-gray-900 text-white rounded text-[10px] hover:bg-gray-800">
                  Update ENS
                </button>
              </div>
              {priceResult && <p className="text-[10px] text-gray-500 mt-1 font-mono">{priceResult}</p>}
            </div>
            <a href="https://sepolia.app.ens.domains/flowbroker.eth" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-[10px] block">View flowbroker.eth →</a>
          </>
        )}

        {tab === "cre" && (
          <>
            <div>
              <p className="font-medium mb-1">How CRE orchestrates the system</p>
              <div className="space-y-1.5 text-[10px]">
                {[
                  { name: "Health Monitor", trigger: "Every 5 min", action: "Pings all providers. Marks down ones inactive." },
                  { name: "Dynamic Pricing", trigger: "Every 10 min", action: "Fetches ETH/USD. Adjusts provider prices." },
                  { name: "Settlement Monitor", trigger: "Every 30 min", action: "Verifies Gateway batch. Confirms settlement." },
                ].map(w => (
                  <div key={w.name} className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{w.name}</span>
                      <span className="text-gray-400">{w.trigger}</span>
                    </div>
                    <p className="text-gray-500">{w.action}</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={runCRE} disabled={creRunning}
              className={`w-full py-1.5 rounded text-xs font-medium ${creRunning ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
              {creRunning ? "Running..." : "Run Workflows Now"}
            </button>
            {creLogs.length > 0 && (
              <div className="bg-gray-900 rounded p-2 max-h-[160px] overflow-y-auto font-mono text-[9px] text-green-400 space-y-0.5">
                {creLogs.slice(-25).map((log: any, i: number) => (
                  <div key={i} className={log.level === "DEBUG" ? "text-gray-600" : log.level === "ERROR" ? "text-red-400" : log.level === "WARN" ? "text-amber-400" : "text-green-400"}>
                    <span className="text-gray-600">{log.timestamp?.slice(11, 19)}</span>{" "}
                    <span className="text-blue-400">[{log.workflow}]</span>{" "}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
            {creResults.length > 0 && (
              <div className="space-y-1">
                {creResults.map((w: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[10px] bg-gray-50 rounded px-2 py-1">
                    <div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${w.error ? "bg-amber-400" : "bg-green-400"}`} /><span>{w.workflow}</span></div>
                    <span className={`font-mono ${w.error ? "text-amber-600" : "text-gray-500"}`}>{w.error || w.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      {tab === "uni" && (
        <>
          <p className="font-medium mb-1">How brokers use Uniswap</p>
          <div className="bg-gray-50 rounded p-3 font-mono text-[10px] space-y-1 text-gray-600">
            <p className="text-gray-400">// Each broker has a token strategy:</p>
            <p>Guardian / Sentinel → ETH → USDC (preserve capital)</p>
            <p>Navigator / Momentum → ETH → UNI (trend + governance)</p>
            <p>Apex / Titan → ETH → UNI (alpha, max conviction)</p>
            <p className="text-amber-600 mt-1">// After 5 intelligence calls with BUY signal:</p>
            <p>1. GET /quote  (routingPreference: BEST_PRICE)</p>
            <p>2. GET /swap   (get transaction data)</p>
            <p>3. Send tx on Sepolia</p>
            <p className="text-green-600 mt-1">// Cross-broker coordination:</p>
            <p>broker buys UNI → broadcasts COORDINATION_BUY</p>
            <p>other brokers see signal → may also buy UNI</p>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between font-mono"><span className="text-gray-400">API endpoint</span><span>trade-api.gateway.uniswap.org/v1</span></div>
            <div className="flex justify-between font-mono"><span className="text-gray-400">routing</span><span>BEST_PRICE</span></div>
            <div className="flex justify-between font-mono"><span className="text-gray-400">tokens</span><span>ETH, USDC, WETH, UNI</span></div>
            <div className="flex justify-between font-mono"><span className="text-gray-400">network</span><span>Sepolia (11155111)</span></div>
          </div>
          <a href="https://sepolia.etherscan.io/address/0x44ACAb497e28c6F700528FE7C281A4A1e557d155" target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-[10px] block">Trader wallet on Etherscan →</a>
        </>
      )}

      </div>
    </div>
  );
}
