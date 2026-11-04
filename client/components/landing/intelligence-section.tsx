"use client"

import { Card } from "@/components/ui/card"
import {
  TrendingUp,
  MessageSquare,
  Brain,
  LineChart,
  Shield,
  Link2,
  Globe,
  PieChart,
  Zap,
  FileText,
} from "lucide-react"

const intelligenceServices = [
  {
    name: "Market data feed",
    ens: "marketdata.flowbroker.eth",
    cost: "$0.000002/call",
    description: "Real-time prices, volume, spreads",
    icon: TrendingUp,
  },
  {
    name: "News sentiment scorer",
    ens: "sentiment.flowbroker.eth",
    cost: "$0.0003/call",
    description: "Bullish/bearish score in real-time",
    icon: MessageSquare,
  },
  {
    name: "AI analysis engine",
    ens: "aianalysis.flowbroker.eth",
    cost: "$0.015/analysis",
    description: "LLM streaming, stops when agent has enough",
    icon: Brain,
  },
  {
    name: "Pattern recognition",
    ens: "patterns.flowbroker.eth",
    cost: "$0.0005/call",
    description: "Chart patterns, supports, resistances",
    icon: LineChart,
  },
  {
    name: "Risk calculator",
    ens: "riskcalc.flowbroker.eth",
    cost: "$0.0004/call",
    description: "VaR, implied volatility, correlations",
    icon: Shield,
  },
  {
    name: "On-chain analytics",
    ens: "onchain.flowbroker.eth",
    cost: "$0.001/call",
    description: "Whale movements, DeFi TVL, exchange flows",
    icon: Link2,
  },
  {
    name: "Macro signals",
    ens: "macro.flowbroker.eth",
    cost: "$0.0008/call",
    description: "Fed decisions, inflation, GDP data",
    icon: Globe,
  },
  {
    name: "Portfolio optimizer",
    ens: "portfolio.flowbroker.eth",
    cost: "$0.005/call",
    description: "MPT allocation, rebalancing signals",
    icon: PieChart,
  },
  {
    name: "Execution optimizer",
    ens: "execution.flowbroker.eth",
    cost: "$0.002/call",
    description: "Smart order routing, slippage minimization",
    icon: Zap,
  },
  {
    name: "Report generator",
    ens: "reports.flowbroker.eth",
    cost: "$0.015/call",
    description: "Decision summary for your dashboard",
    icon: FileText,
  },
]

export function IntelligenceSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
            Intelligence <span className="font-serif italic text-primary">layer</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-light max-w-2xl mx-auto">
            11 services your broker can tap into. Pay only for what it uses.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {intelligenceServices.map((service, index) => (
            <Card
              key={service.name}
              className="bg-card border-border p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-medium text-foreground">
                      {service.name}
                    </h3>
                    <span className="flex-shrink-0 text-sm font-mono text-primary">
                      {service.cost}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-mono text-primary/70">
                    {service.ens}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground font-light">
                    {service.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
