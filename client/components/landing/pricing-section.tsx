"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const pricingPlans = [
  {
    name: "Guardian",
    price: "~$3",
    period: "/month",
    category: "Conservative",
    categoryColor: "bg-emerald-500/20 text-emerald-400",
    features: [
      "Market data only",
      "Maximum capital protection",
      "Low risk",
    ],
    ens: "guardian.flowbroker.eth",
  },
  {
    name: "Sentinel",
    price: "~$5",
    period: "/month",
    category: "Conservative",
    categoryColor: "bg-emerald-500/20 text-emerald-400",
    features: [
      "Market data + News sentiment",
      "Cautious growth",
      "Low-Medium risk",
    ],
    ens: "sentinel.flowbroker.eth",
  },
  {
    name: "Steady",
    price: "~$10",
    period: "/month",
    category: "Balanced",
    categoryColor: "bg-blue-500/20 text-blue-400",
    features: [
      "Market + Sentiment + AI analysis",
      "Informed decisions",
      "Medium risk",
    ],
    ens: "steady.flowbroker.eth",
  },
  {
    name: "Navigator",
    price: "~$15",
    period: "/month",
    category: "Balanced",
    categoryColor: "bg-blue-500/20 text-blue-400",
    popular: true,
    features: [
      "Full analysis + Portfolio optimizer",
      "Active rebalancing",
      "Medium risk",
    ],
    ens: "navigator.flowbroker.eth",
  },
  {
    name: "Growth",
    price: "~$25",
    period: "/month",
    category: "Growth",
    categoryColor: "bg-purple-500/20 text-purple-400",
    features: [
      "5 intelligence services",
      "Technical signals included",
      "Medium-High risk",
    ],
    ens: "growth.flowbroker.eth",
  },
  {
    name: "Momentum",
    price: "~$35",
    period: "/month",
    category: "Growth",
    categoryColor: "bg-purple-500/20 text-purple-400",
    features: [
      "6 intelligence services",
      "On-chain analytics",
      "Medium-High risk",
    ],
    ens: "momentum.flowbroker.eth",
  },
  {
    name: "Apex",
    price: "~$50",
    period: "/month",
    category: "Alpha",
    categoryColor: "bg-amber-500/20 text-amber-400",
    features: [
      "8 core services + Injective orderbook",
      "Maximum intelligence",
      "High risk",
    ],
    ens: "apex.flowbroker.eth",
  },
  {
    name: "Titan",
    price: "~$75",
    period: "/month",
    category: "Alpha",
    categoryColor: "bg-amber-500/20 text-amber-400",
    features: [
      "All 11 services",
      "Priority execution",
      "High risk",
    ],
    ens: "titan.flowbroker.eth",
  },
]

export function PricingSection() {
  return (
    <section className="py-20 md:py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
            Choose your <span className="font-serif italic text-primary">broker</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-light">
            8 brokers, 4 risk profiles — pay only for the intelligence used
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative bg-card border-border p-5 flex flex-col ${
                plan.popular ? "border-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-foreground">{plan.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.categoryColor}`}>
                    {plan.category}
                  </span>
                </div>
                <p className="text-xs font-mono text-primary/70 mb-2">
                  {plan.ens}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-light text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground font-light">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                size="sm"
                className={
                  plan.popular
                    ? "w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    : "w-full border-border text-foreground hover:bg-secondary"
                }
              >
                <Link href="/find-your-broker">Get {plan.name}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
