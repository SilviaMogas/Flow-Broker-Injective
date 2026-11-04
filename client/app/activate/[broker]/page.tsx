"use client"

import { use } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, ArrowRight, Shield, Zap } from "lucide-react"
import dynamic from "next/dynamic"
const WalletActivation = dynamic(() => import("@/components/broker/wallet-activation").then(m => m.WalletActivation), { ssr: false, loading: () => <div className="h-14 bg-gray-100 rounded animate-pulse" /> })
import { useState } from "react"

type BrokerType = 
  | "guardian" 
  | "sentinel" 
  | "steady" 
  | "navigator" 
  | "growth" 
  | "momentum" 
  | "apex" 
  | "titan"

const brokerData: Record<BrokerType, {
  name: string
  ens: string
  monthlyEstimate: string
  perDecision: string
  intelligence: string[]
  color: string
  textColor: string
  category: string
}> = {
  guardian: {
    name: "Guardian",
    ens: "guardian.flowbroker.eth",
    monthlyEstimate: "~$3",
    perDecision: "~$0.0002",
    intelligence: ["Market data"],
    color: "bg-emerald-600",
    textColor: "text-white",
    category: "Conservative",
  },
  sentinel: {
    name: "Sentinel",
    ens: "sentinel.flowbroker.eth",
    monthlyEstimate: "~$5",
    perDecision: "~$0.0005",
    intelligence: ["Market data", "News sentiment"],
    color: "bg-teal-500",
    textColor: "text-white",
    category: "Conservative",
  },
  steady: {
    name: "Steady",
    ens: "steady.flowbroker.eth",
    monthlyEstimate: "~$10",
    perDecision: "~$0.008",
    intelligence: ["Market data", "Sentiment", "AI analysis"],
    color: "bg-blue-500",
    textColor: "text-white",
    category: "Balanced",
  },
  navigator: {
    name: "Navigator",
    ens: "navigator.flowbroker.eth",
    monthlyEstimate: "~$15",
    perDecision: "~$0.015",
    intelligence: ["Market data", "Sentiment", "AI analysis", "Portfolio optimizer"],
    color: "bg-indigo-500",
    textColor: "text-white",
    category: "Balanced",
  },
  growth: {
    name: "Growth",
    ens: "growth.flowbroker.eth",
    monthlyEstimate: "~$25",
    perDecision: "~$0.025",
    intelligence: ["Market data", "Sentiment", "AI analysis", "Portfolio optimizer", "Technical signals"],
    color: "bg-purple-500",
    textColor: "text-white",
    category: "Growth",
  },
  momentum: {
    name: "Momentum",
    ens: "momentum.flowbroker.eth",
    monthlyEstimate: "~$35",
    perDecision: "~$0.035",
    intelligence: ["Market data", "Sentiment", "AI analysis", "Portfolio optimizer", "Technical signals", "On-chain analytics"],
    color: "bg-orange-500",
    textColor: "text-white",
    category: "Growth",
  },
  apex: {
    name: "Apex",
    ens: "apex.flowbroker.eth",
    monthlyEstimate: "~$50",
    perDecision: "~$0.045",
    intelligence: ["All 8 core services", "Injective orderbook"],
    color: "bg-amber-500",
    textColor: "text-black",
    category: "Alpha",
  },
  titan: {
    name: "Titan",
    ens: "titan.flowbroker.eth",
    monthlyEstimate: "~$75",
    perDecision: "~$0.060",
    intelligence: ["All 11 services", "Priority execution"],
    color: "bg-red-600",
    textColor: "text-white",
    category: "Alpha",
  },
}

const monthlyValues: Record<BrokerType, number> = {
  guardian: 3,
  sentinel: 5,
  steady: 10,
  navigator: 15,
  growth: 25,
  momentum: 35,
  apex: 50,
  titan: 75,
}

const perDecisionValues: Record<BrokerType, number> = {
  guardian: 0.0002,
  sentinel: 0.0005,
  steady: 0.008,
  navigator: 0.015,
  growth: 0.025,
  momentum: 0.035,
  apex: 0.045,
  titan: 0.060,
}

export default function ActivatePage({ params }: { params: Promise<{ broker: string }> }) {
  const { broker: brokerParam } = use(params)
  const [depositAmount, setDepositAmount] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  
  const brokerKey = brokerParam as BrokerType
  const broker = brokerData[brokerKey] || brokerData.navigator

  const suggestedAmounts = [50, 100, 250, 500]

  const getEstimates = () => {
    const amount = Number(depositAmount)
    if (!amount || amount <= 0) return null
    
    const perDecision = perDecisionValues[brokerKey] || 0.015
    const monthly = monthlyValues[brokerKey] || 15
    
    return {
      decisions: Math.floor(amount / perDecision).toLocaleString(),
      months: Math.floor(amount / monthly),
    }
  }

  const estimates = getEstimates()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${broker.color} ${broker.textColor}`}>
              Activating {broker.name}
            </span>
            <h1 className="mt-6 text-3xl md:text-4xl font-light text-foreground">
              Activate <span className="font-serif italic text-primary">{broker.ens}</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-light">
              Deposit USDC to start your autonomous broker
            </p>
          </div>

          {/* Broker Summary */}
          <Card className="bg-card border-border p-6 mb-8">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly estimate</p>
                <p className="text-2xl font-mono text-primary">{broker.monthlyEstimate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Per decision</p>
                <p className="text-2xl font-mono text-foreground">{broker.perDecision}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="text-xl font-medium text-foreground">{broker.category}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Intelligence services</p>
              <div className="flex flex-wrap gap-2">
                {broker.intelligence.map((service) => (
                  <span key={service} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Deposit Form */}
          <Card className="bg-card border-border p-8 mb-8">
            <h2 className="text-xl font-medium text-foreground mb-6">
              Deposit USDC
            </h2>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2">
                Amount (USDC)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-background border-border text-foreground text-lg pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  USDC
                </span>
              </div>
            </div>

            {/* Suggested Amounts */}
            <div className="flex flex-wrap gap-2 mb-8">
              {suggestedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(String(amount))}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    depositAmount === String(amount)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Estimate */}
            {estimates && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
                <p className="text-sm text-muted-foreground">
                  With ${depositAmount} USDC, your {broker.name} agent can make approximately{" "}
                  <span className="text-primary font-mono">
                    {estimates.decisions}
                  </span>{" "}
                  decisions, or run for about{" "}
                  <span className="text-primary font-mono">
                    {estimates.months}
                  </span>{" "}
                  months at average usage.
                </p>
              </div>
            )}

            {/* Add Arc Testnet to MetaMask */}
            <div className="text-center mb-2">
              <button
                onClick={async () => {
                  if (typeof window !== "undefined" && window.ethereum) {
                    await window.ethereum.request({
                      method: "wallet_addEthereumChain",
                      params: [{
                        chainId: "0x4CEF52",
                        chainName: "Arc Testnet",
                        nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
                        rpcUrls: ["https://rpc.testnet.arc.network"],
                        blockExplorerUrls: ["https://testnet.arcscan.app"],
                      }],
                    });
                  }
                }}
                className="text-xs text-muted-foreground underline hover:text-primary"
              >
                + Add Arc Testnet to MetaMask
              </button>
            </div>
            {/* Real Wallet Payment */}
            <WalletActivation brokerName={brokerParam} depositAmount={depositAmount} />
          </Card>

          {/* Dashboard Link */}
          <div className="text-center">
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              View Live Dashboard →
            </a>
            <p className="text-xs text-muted-foreground mt-2">Opens the broker activity dashboard</p>
          </div>

          {/* Security Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card border-border p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Non-custodial</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your funds stay in your wallet. The agent only uses what it needs per call.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-card border-border p-6">
              <div className="flex items-start gap-4">
                <Zap className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Instant activation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your broker starts working immediately after deposit confirms.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Back Link */}
          <div className="text-center mt-12">
            <Link href="/find-your-broker" className="text-muted-foreground hover:text-primary transition-colors">
              ← Back to quiz
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
