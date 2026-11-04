"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api";
import { visibleEvents, visibleStats, type StatsData, type DashboardBaseline } from "./dashboard-view";
export type { StatsData } from "./dashboard-view";

export interface PaymentEvent {
  worker: string;
  service: string;
  amount: string;
  network?: string;
  verified?: boolean;
  transaction?: string;
  insight?: string;
  cycle?: number;
  timestamp: number;
  scheme?: string;
  protocol?: string;
  fee?: string;
}

export interface BackendCapabilities {
  sellerConfigured: boolean;
  websocket: boolean;
  workerLoops: boolean;
  statePersistence: "instance";
}

export interface WorkerEvent {
  name: string;
  address?: string;
}

export type WSEvent =
  | { type: "payment"; data: PaymentEvent }
  | { type: "stats"; data: StatsData }
  | { type: "worker_joined"; data: WorkerEvent }
  | { type: "worker_finished"; data: WorkerEvent }
  | { type: "complete"; data: StatsData }
  | { type: "cre_log"; data: { workflow: string; level: string; message: string; timestamp: string } }
  | { type: "cre_start"; data: any }
  | { type: "cre_complete"; data: any }
  | { type: "cre_result"; data: any }
  | { type: "ens_update"; data: any }
  | { type: "trade"; data: any }
  | { type: "broker_decision"; data: any }
  | { type: "started"; data: any }
  | { type: "stopped"; data: any }
  | { type: "reset"; data: any };

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? (process.env.NODE_ENV === "development" ? "ws://localhost:3002" : "");

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    totalPayments: 0,
    totalVolume: "0",
    paymentsPerMin: 0,
    dollarsPerSec: "0",
    activeWorkers: 0,
    gasSaved: "0",
    platformFees: "0",
    elapsed: 0,
    isRunning: false,
  });
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [workers, setWorkers] = useState<Map<string, WorkerEvent>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceUpdates, setPriceUpdates] = useState<{ agent: string; value: string; tx: string; timestamp: number }[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const latestSnapshot = useRef<DashboardBaseline | null>(null);
  const resetBaseline = useRef<DashboardBaseline | null>(null);
  const [transport, setTransport] = useState<"connecting" | "websocket" | "polling">("connecting");
  const [capabilities, setCapabilities] = useState<BackendCapabilities | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const connect = useCallback(() => {
    if (!WS_URL || (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN)) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      console.log("[ws] connected to orchestrator");
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setConnected(false);
      setTransport("polling");
      console.log("🔌 Disconnected from orchestrator");
    };

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;
      const msg: WSEvent = JSON.parse(event.data);

      switch (msg.type) {
        case "payment":
          setPayments((prev) => [msg.data, ...prev].slice(0, 500));
          console.log(`%c[x402] %c${msg.data.worker?.slice(0,8)}→${msg.data.service} %c${msg.data.amount} %c✓ verified`, "color: #f59e0b", "color: #d1d5db", "color: #22c55e", "color: #22c55e; font-weight: bold");
          break;
        case "stats":
          setStats(msg.data);
          setLastUpdated(Date.now());
          break;
        case "cre_log":
          console.log(
            `%c[CRE] %c[${msg.data.workflow}] %c${msg.data.message}`,
            "color: #22c55e; font-weight: bold",
            "color: #3b82f6",
            msg.data.level === "ERROR" ? "color: #ef4444" : msg.data.level === "WARN" ? "color: #eab308" : "color: #d1d5db"
          );
          break;
        case "cre_start":
          console.log("%c[CRE] === Workflow Execution Started ===", "color: #22c55e; font-weight: bold; font-size: 12px");
          break;
        case "cre_complete":
          console.log("%c[CRE] === All Workflows Complete ===", "color: #22c55e; font-weight: bold; font-size: 12px");
          break;
        case "broker_decision":
          setDecisions((prev) => [msg.data, ...prev].slice(0, 50));
          break;
        case "trade":
          setTrades((prev) => [msg.data, ...prev].slice(0, 30));
          console.log(`%c[TRADE] %c${msg.data.broker} %c${msg.data.signal} → ${msg.data.amountIn} → ${msg.data.amountOut} %c${msg.data.txHash?.slice(0,14)}...`, "color: #f59e0b; font-weight: bold", "color: #fff", "color: #22c55e", "color: #3b82f6");
          break;
        case "ens_update":
          setPriceUpdates((prev) => [{ ...msg.data, timestamp: Date.now() }, ...prev].slice(0, 20));
          console.log(`%c[ENS] Price updated: ${msg.data.agent} → ${msg.data.value} (tx: ${msg.data.tx?.slice(0, 14)}...)`, "color: #8b5cf6; font-weight: bold");
          break;
        case "worker_joined":
          setWorkers((prev) => new Map(prev).set(msg.data.name, msg.data));
          break;
        case "worker_finished":
          setWorkers((prev) => {
            const next = new Map(prev);
            next.delete(msg.data.name);
            return next;
          });
          break;
        case "reset":
          // New session started — clear all state
          setPayments([]);
          setTrades([]);
          setDecisions([]);
          setPriceUpdates([]);
          setWorkers(new Map());
          setIsComplete(false);
          setError(null);
          break;
        case "complete":
          setStats(msg.data);
          setIsComplete(true);
          break;
        case "started":
          setStats(msg.data);
          setIsComplete(false);
          break;
        case "stopped":
          setStats(msg.data);
          break;
      }
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      ws.close();
      setTransport("polling");
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const reset = useCallback(() => {
    resetBaseline.current = latestSnapshot.current;
    setPayments([]);
    setStats({
      totalPayments: 0,
      totalVolume: "0",
      paymentsPerMin: 0,
      dollarsPerSec: "0",
      activeWorkers: 0,
      gasSaved: "0",
      platformFees: "0",
      elapsed: 0,
      isRunning: false,
    });
    setWorkers(new Map());
    setIsComplete(false);
    setPriceUpdates([]);
    setTrades([]);
    setDecisions([]);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const detect = async () => {
      try {
        const response = await fetch(api("/health"), {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Backend health: HTTP ${response.status}`);
        const data: BackendCapabilities = await response.json();
        if (controller.signal.aborted) return;
        setCapabilities(data);
        if (data.websocket && WS_URL) {
          setTransport("websocket");
          connect();
        } else {
          setTransport("polling");
        }
      } catch {
        if (!controller.signal.aborted) setTransport("polling");
      }
    };
    void detect();
    return () => {
      controller.abort();
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (transport !== "polling") return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch(api("/dashboard-state"), {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Dashboard unavailable (HTTP ${response.status})`);
        const data = await response.json();
        if (!data.stats || typeof data.session !== "string" || !data.capabilities || !Array.isArray(data.payments)
          || !Array.isArray(data.trades) || !Array.isArray(data.decisions)
          || !Array.isArray(data.priceUpdates)) {
          throw new Error("Invalid dashboard response");
        }
        if (controller.signal.aborted) return;
        latestSnapshot.current = data;
        const viewStats = visibleStats(data, resetBaseline.current);
        setCapabilities(data.capabilities);
        setStats(viewStats);
        setIsComplete(!viewStats.isRunning && viewStats.totalPayments > 0);
        setPayments(visibleEvents<PaymentEvent>(data.payments, data, resetBaseline.current));
        setTrades(visibleEvents(data.trades, data, resetBaseline.current));
        setDecisions(visibleEvents(data.decisions, data, resetBaseline.current));
        setPriceUpdates(visibleEvents<(typeof priceUpdates)[number]>(data.priceUpdates, data, resetBaseline.current));
        setLastUpdated(data.updatedAt);
        setConnected(true);
        setError(null);
      } catch (e) {
        if (controller.signal.aborted) return;
        setConnected(false);
        setError(e instanceof Error ? e.message : "Dashboard unavailable");
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 5_000);
      }
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [transport]);

  return {
    connected,
    stats,
    payments,
    workers,
    isComplete,
    connect,
    disconnect,
    reset,
    error,
    priceUpdates,
    trades,
    decisions,
    transport,
    capabilities,
    lastUpdated,
  };
}
