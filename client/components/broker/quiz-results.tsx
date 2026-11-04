"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, RotateCcw } from "lucide-react"

export type BrokerType = 
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
  badge: string
  badgeColor: string
  description: string
  intelligence: string[]
  avgCost: string
  monthlyEstimate: string
  riskLevel: "Low" | "Low-Medium" | "Medium" | "Medium-High" | "High"
  category: "Conservative" | "Balanced" | "Growth" | "Alpha"
}> = {
  guardian: {
    name: "Guardian",
    ens: "guardian.flowbroker.eth",
    badge: "Your match: Guardian",
    badgeColor: "bg-emerald-600 text-white",
    description: "Maximum capital protection. Your agent only acts on the most reliable market signals with minimal risk exposure.",
    intelligence: ["Market data"],
    avgCost: "~$0.0002",
    monthlyEstimate: "~$3",
    riskLevel: "Low",
    category: "Conservative",
  },
  sentinel: {
    name: "Sentinel",
    ens: "sentinel.flowbroker.eth",
    badge: "Your match: Sentinel",
    badgeColor: "bg-teal-500 text-white",
    description: "Cautious growth with news awareness. Your agent monitors sentiment to avoid market surprises.",
    intelligence: ["Market data", "News sentiment"],
    avgCost: "~$0.0005",
    monthlyEstimate: "~$5",
    riskLevel: "Low-Medium",
    category: "Conservative",
  },
  steady: {
    name: "Steady",
    ens: "steady.flowbroker.eth",
    badge: "Your match: Steady",
    badgeColor: "bg-blue-500 text-white",
    description: "Balanced approach with AI insights. Your agent makes informed decisions without taking unnecessary risks.",
    intelligence: ["Market data", "Sentiment", "AI analysis"],
    avgCost: "~$0.008",
    monthlyEstimate: "~$10",
    riskLevel: "Medium",
    category: "Balanced",
  },
  navigator: {
    name: "Navigator",
    ens: "navigator.flowbroker.eth",
    badge: "Your match: Navigator",
    badgeColor: "bg-indigo-500 text-white",
    description: "Smart portfolio optimization. Your agent actively rebalances to maximize risk-adjusted returns.",
    intelligence: ["Market data", "Sentiment", "AI analysis", "Portfolio optimizer"],
    avgCost: "~$0.015",
    monthlyEstimate: "~$15",
    riskLevel: "Medium",
    category: "Balanced",
  },
  growth: {
    name: "Growth",
    ens: "growth.flowbroker.eth",
    badge: "Your match: Growth",
    badgeColor: "bg-purple-500 text-white",
    description: "Aggressive opportunity seeker. Your agent uses technical analysis to find high-potential entries.",
    intelligence: ["Market data", "Sentiment", "AI analysis", "Portfolio optimizer", "Technical signals"],
    avgCost: "~$0.025",
    monthlyEstimate: "~$25",
    riskLevel: "Medium-High",
    category: "Growth",
  },
  momentum: {
    name: "Momentum",
    ens: "momentum.flowbroker.eth",
    badge: "Your match: Momentum",
    badgeColor: "bg-orange-500 text-white",
    description: "Trend-following powerhouse. Your agent rides market momentum with on-chain analytics support.",
    intelligence: ["Market data", "Sentiment", "AI analysis", "Portfolio optimizer", "Technical signals", "On-chain analytics"],
    avgCost: "~$0.035",
    monthlyEstimate: "~$35",
    riskLevel: "Medium-High",
    category: "Growth",
  },
  apex: {
    name: "Apex",
    ens: "apex.flowbroker.eth",
    badge: "Your match: Apex",
    badgeColor: "bg-amber-500 text-black",
    description: "Maximum intelligence, maximum opportunity. Your agent leverages all available data sources for optimal decisions.",
    intelligence: ["All 8 core services", "Injective orderbook"],
    avgCost: "~$0.045",
    monthlyEstimate: "~$50",
    riskLevel: "High",
    category: "Alpha",
  },
  titan: {
    name: "Titan",
    ens: "titan.flowbroker.eth",
    badge: "Your match: Titan",
    badgeColor: "bg-red-600 text-white",
    description: "Ultimate performance. Your agent uses all 11 intelligence services (including the live Injective orderbook) including priority execution and advanced risk management.",
    intelligence: ["All 11 services", "Priority execution"],
    avgCost: "~$0.060",
    monthlyEstimate: "~$75",
    riskLevel: "High",
    category: "Alpha",
  },
}

const allBrokers: BrokerType[] = ["guardian", "sentinel", "steady", "navigator", "growth", "momentum", "apex", "titan"]

interface QuizResultsProps {
  result: BrokerType
  onReset: () => void
}

export function QuizResults({ result, onReset }: QuizResultsProps) {
  const broker = brokerData[result]

  return (
    <div className="flex-1 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Main Result */}
        <div className="text-center mb-12">
          <span className={`inline-block px-6 py-2 rounded-full text-lg font-medium ${broker.badgeColor}`}>
            {broker.badge}
          </span>

          <div className="mt-8">
            <p className="font-mono text-2xl md:text-3xl text-primary">
              {broker.ens}
            </p>
          </div>

          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            {broker.description}
          </p>
        </div>

        {/* Details Card */}
        <Card className="bg-card border-border p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Intelligence it uses
              </h3>
              <div className="flex flex-wrap gap-2">
                {broker.intelligence.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Monthly estimate
              </h3>
              <p className="text-3xl font-mono text-primary">
                {broker.monthlyEstimate}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Risk level
              </h3>
              <p className="text-xl font-medium text-foreground">
                {broker.riskLevel}
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8"
          >
            <Link href={`/activate/${result}`}>
              Activate {broker.ens}
              <span className="ml-1">→</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake quiz
          </Button>
        </div>

        {/* All Brokers Comparison */}
        <div>
          <h3 className="text-xl font-medium text-foreground text-center mb-8">
            Compare all 8 brokers
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allBrokers.map((brokerKey) => {
              const b = brokerData[brokerKey]
              const isSelected = brokerKey === result

              return (
                <Card
                  key={brokerKey}
                  className={`p-5 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-foreground">{b.name}</h4>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-3 ${
                    b.category === "Conservative" ? "bg-emerald-500/20 text-emerald-400" :
                    b.category === "Balanced" ? "bg-blue-500/20 text-blue-400" :
                    b.category === "Growth" ? "bg-purple-500/20 text-purple-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {b.category}
                  </span>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="text-foreground font-medium">Monthly:</span>{" "}
                      <span className="font-mono text-primary">{b.monthlyEstimate}</span>
                    </p>
                    <p>
                      <span className="text-foreground font-medium">Risk:</span>{" "}
                      {b.riskLevel}
                    </p>
                  </div>
                  {!isSelected && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full mt-4 border-border text-foreground hover:bg-secondary"
                    >
                      <Link href={`/activate/${brokerKey}`}>
                        Choose {b.name}
                      </Link>
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
