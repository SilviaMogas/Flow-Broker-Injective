# Flow Broker

8 AI broker agents that autonomously buy financial intelligence, execute trades via Uniswap, and report back to users — paying per API call using Circle Arc nanopayments.

Think of it as your personal AI hedge fund. Pick a risk profile, deposit USDC, and your broker goes to work.

---

## How it works

A user picks a broker (Guardian → safe, Titan → aggressive). The broker pays for intelligence from 10 specialized providers using x402 nanopayments on Arc. When all signals align — it executes a real trade on Uniswap.

```
User → picks broker → broker buys intelligence → AI decides → Uniswap trade
```

Each intelligence call is a real USDC micropayment. Each trade is a real Uniswap swap.

---

## Tech stack

**Circle Arc + x402**
Brokers pay providers per call — $0.000002 for market data, $0.015 for AI analysis. Gas-free, batched by Circle Gateway. All payments verifiable on ArcScan.

**ENS (flowbroker.eth)**
18 subnames (8 brokers + 10 providers). Each subname has text records storing price, capabilities, and identity. Brokers read provider prices from ENS before every call. Change a price in ENS → brokers adapt in 30 seconds.

**Chainlink CRE**
3 automated workflows running on-schedule:
- Health Monitor (every 5 min) — pings all providers, marks down ones inactive
- Dynamic Pricing (every 30 min) — fetches ETH/USD, recalculates provider prices
- Settlement Monitor (every 10 min) — checks Circle Gateway batch status

**Uniswap**
Brokers execute real trades after accumulating signals. Different brokers use different strategies:
- Guardian / Sentinel → ETH → USDC (preserve capital)
- Navigator / Momentum → ETH → UNI (trend + governance)
- Growth / Apex / Titan → ETH → UNI (aggressive alpha)

When a broker buys a risk-on asset (UNI/WETH), it broadcasts a coordination signal to the network. Other brokers can react — emergent coordination without a central coordinator.

**ERC-8004**
All 8 broker agents have registered identities on Arc's official IdentityRegistry. Token IDs #1448–1455.

---

## Live

| | URL |
|---|---|
| User app | https://flowbroker.netlify.app |
| Dashboard | https://flowbroker-app.netlify.app |
| API | https://api.perkmesh.perkos.xyz |
| ENS | [flowbroker.eth](https://sepolia.app.ens.domains/flowbroker.eth) |

---

## Contracts (Arc Testnet — chain 5042002)

| Contract | Address |
|----------|---------|
| AgentRegistry | [0xE9bFA497...](https://testnet.arcscan.app/address/0xE9bFA497e189272109540f9dBA4cb1419F05cdF0) |
| PaymentAccumulator | [0x627eE346...](https://testnet.arcscan.app/address/0x627eE346183AB858c581A8F234ADA37579Ff1b13) |
| PricingOracle | [0xdF5e936A...](https://testnet.arcscan.app/address/0xdF5e936A36A190859C799754AAC848D9f5Abf958) |
| AgenticCommerce | [0xDA5352c2...](https://testnet.arcscan.app/address/0xDA5352c2f54fAeD0aE9f53A17E718a16b410259A) |
| ReputationHook | [0x18d9a536...](https://testnet.arcscan.app/address/0x18d9a536932168bCd066609FB47AB5c1F55b0153) |
| ERC-8004 IdentityRegistry | [0x8004A818...](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |

---

## Injective

This fork adds [Injective](https://injective.com) to Flow Broker:

- **Injective provider (`injective`)**: an 11th paid x402 provider (`/api/injective`). It reads the live Injective mainnet spot orderbook for INJ/USDT and WETH/USDT from the public Injective Indexer and returns mid, spread, depth imbalance and a BULLISH/BEARISH/NEUTRAL signal. Apex and Titan buy it each cycle.
- **Free endpoints**: `GET /api/injective/markets` (orderbook snapshots) and `GET /api/injective/chains` (live chain ID and block for Injective EVM testnet 1439 and mainnet 1776).
- **Wallets**: both web apps offer Injective EVM testnet and mainnet next to Arc Testnet.
- **Dashboard**: new Injective tab with the markets, network status and any Flow Broker contracts deployed on Injective.
- **Contracts**: `Deploy.s.sol` deploys to Injective EVM testnet:

```bash
cd arc/contracts
forge install OpenZeppelin/openzeppelin-contracts --no-git
PRIVATE_KEY=... USDC_ADDRESS=<token on Injective testnet> FORWARDER=<trusted CRE forwarder> \
  forge script script/Deploy.s.sol --rpc-url injective_testnet --broadcast
```

Testnet INJ for gas: https://testnet.faucet.injective.network

## Deploying on Vercel

`vercel.json` deploys the repo as one Vercel project with three services:

| Service | Root | Public path |
| --- | --- | --- |
| `client` | `client/` | `/` |
| `app` (dashboard) | `app/` | `/dashboard` (built with `basePath: "/dashboard"` on Vercel) |
| `backend` | `arc/backend/` | `/api` (Express strips the prefix; paid x402 services stay at `/api/<service>`) |

The browser calls the backend same-origin at `/api`, so no service bindings are needed. On Vercel the backend runs as a function: WebSockets and long-running broker loops (`POST /start`) are off. The dashboard automatically polls `GET /api/dashboard-state` every 5 seconds instead, shows backend capabilities, and disables Start when broker runs or paid services are unavailable. This is a read-only view of the responding instance's in-memory activity, not durable or cross-instance history. REST, x402 and Injective endpoints remain available. Set `SELLER_KEY` in the Vercel project yourself to enable paid endpoints. Run all services locally with `vercel dev`.

Public Injective endpoints and the paid Injective route share a limit of 60 requests per minute per IP (IPv6 grouped by subnet) per backend instance. A blocked request returns `429`, `Retry-After` and `RateLimit` headers before any upstream lookup or payment check. Markets and chain probes each share an in-flight refresh and a 15-second cache (5 seconds when the upstream reports an error). On Vercel only its edge-supplied client IP header is trusted; on other hosts only the socket IP is trusted. The in-memory limiter is not a deployment-wide quota: use Vercel WAF or a shared store for distributed enforcement.

ENS prices are resolved by provider label (`market-data`, `ai-analysis`, etc.) for their endpoint aliases (`search`, `llm`, etc.). `GET /api/prices` exposes effective endpoint prices; legacy ENS label keys remain available when loaded. If ENS is unavailable, explicit defaults for all 11 providers are used. The payment requirement and accounting use the same per-request price.

Backend checks: `cd arc/backend && npm test && npm run typecheck`.

On a long-running backend, each broker run has a cancellation signal. Stop prevents further intelligence/risk calls and queued swaps; it cannot undo payments or transactions already submitted. Start returns `409` until the prior run has drained, and the dashboard shows **Stopping…** during that period. All 11 services, including Injective, remain in the broker catalog when ENS discovery is unavailable; an unknown service is never silently replaced with another provider.

## Project structure

```
client/       User-facing app — quiz, broker selection, USDC payment
app/          Dashboard — live React Flow, trades, CRE logs, ENS demo
arc/          Smart contracts (Foundry) + backend (Express + x402)
ens/          ENS resolver for flowbroker.eth
chainlink/    3 CRE workflows with simulation results
```

---

## Uniswap integration

See `arc/backend/src/server.ts` — `BROKER_STRATEGIES` and `executeUniswapTrade`.

Each broker has a defined token pair strategy. The Routing API (`/quote` with `routingPreference: BEST_PRICE`) finds optimal paths. Coordination signals fire when risk-on assets are bought.

Real trades on Sepolia: see `arc/backend/trade-history.json`.
