# Client App — User Onboarding

Landing page, broker quiz, and USDC payment flow. Users discover which broker fits their risk profile and deposit USDC to activate it.

The payment flow describes the original upstream integration, not a verified deposit flow for this fork. Without an owned `NEXT_PUBLIC_WC_PROJECT_ID`, wallet, network-add and deposit controls are disabled. Public browsing still works; see the root README before enabling wallet UI or funding inherited addresses.

## User flow

```mermaid
graph LR
    A[Landing] --> B[Find Your Broker quiz]
    B -->|5 questions| C[Broker recommended]
    C --> D[/activate/steady]
    D -->|Connect MetaMask| E[Arc Testnet]
    E -->|Pay USDC| F[Broker wallet]
    F -->|POST /activate| G[Backend notified]
    G -->|WebSocket broadcast| H[Dashboard shows activation]
    H --> I[View Live Dashboard]
```

## What happens after payment

When a user pays, the client sends the transaction hash to the backend (`POST /activate`). The dashboard receives a WebSocket event and shows the activation in the "Recent Activations" panel — connecting the two apps in real time.

## Broker profiles

8 brokers, matched to user answers:

| Broker | Profile | Monthly cost | Risk |
|--------|---------|-------------|------|
| Guardian | Conservative | ~$3 | Low |
| Sentinel | Conservative | ~$5 | Low |
| Steady | Balanced | ~$10 | Medium |
| Navigator | Balanced | ~$15 | Medium |
| Growth | Growth | ~$25 | Med-High |
| Momentum | Growth | ~$35 | Med-High |
| Apex | Alpha | ~$50 | High |
| Titan | Alpha | ~$75 | High |

All broker metadata (APY, risk, cost, providers) is stored in ENS text records on `flowbroker.eth` and read at runtime.

## Wallet integration

Uses RainbowKit + wagmi configured for Arc Testnet (chain ID 5042002). The payment calls `transfer(address, uint256)` on USDC (`0x3600...`) to the broker's wallet on Arc.

```bash
# Add Arc Testnet to MetaMask
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Symbol: USDC
Explorer: https://testnet.arcscan.app
```

## Run locally

```bash
cd client
npm install

# Uses Reown WalletConnect
NEXT_PUBLIC_WC_PROJECT_ID="your_owned_32_character_hex_project_id" npm run dev
```
