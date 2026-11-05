# Dashboard App

Real-time visualization of the agent economy. Shows 8 brokers buying intelligence from 10 providers, executing Uniswap trades, and coordinating through the network.

This describes the original upstream integration. In this fork, Injective data is live, other provider signals remain simulated, and Vercel uses read-only HTTP polling with Start disabled. Wallet/payment/trading execution is not verified; see the root README for deployment and owned-wallet setup.

## What you see

```mermaid
graph LR
    BE[Backend API] -->|WebSocket| WS[useWebSocket hook]
    WS -->|payments| FV[Flow tab<br/>React Flow graph]
    WS -->|payments| CF[Calls tab<br/>x402 payment log]
    WS -->|decisions| DT[Decisions tab<br/>AI reasoning trail]
    WS -->|trades| TR[Trades tab<br/>Uniswap swaps]
    WS -->|coordination| FV
    BE -->|REST| ST[Settlement tab<br/>Gateway batch proof]
    BE -->|REST| CRE[CRE tab<br/>workflow logs]
    BE -->|REST| EN[ENS tab<br/>live price changes]
```

## Tabs

**Flow** — React Flow graph. Broker nodes (red) on the left, provider nodes (green) on the right. Animated edges appear as brokers pay providers. ERC-8004 identity link on each broker node.

**Calls** — Every x402 payment logged in real time. Click any row to see the full Circle Gateway response: scheme, authorization type, network, settlement status.

**Decisions** — AI reasoning trail. Shows what intelligence each broker collected and what decision it made before trading.

**Trades** — Uniswap swaps. Each entry shows tokenIn, tokenOut, routing strategy, and Sepolia Etherscan link. Different brokers use different token pairs based on their risk profile.

**Settlement** — Circle Gateway batch status. Shows how individual nanopayments accumulate into single onchain transactions. Displays gas savings.

**CRE** — Chainlink workflow execution logs. Click to run all 3 workflows and see real simulation output.

**ENS** — Live price change demo. Update a provider price in ENS, watch brokers adapt.

**Protocols** — Technical details for Arc, ENS, and Chainlink — with live demos embedded.

## Run locally

```bash
cd app
npm install

# Read-only dashboard against your separately running local backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_WS_URL= npm run dev
# Opens at http://localhost:3000
```

Run your own backend at that local address; the dashboard no longer defaults to the original project's API. For the combined Vercel deployment, use `/api` and leave `NEXT_PUBLIC_WS_URL` empty. Without an owned `NEXT_PUBLIC_WC_PROJECT_ID`, wallet controls stay disabled.
