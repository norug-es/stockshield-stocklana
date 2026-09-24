# SWAT StockShield — Stocklana 2026

**The pre-trade security and price-integrity layer for tokenized stocks on Solana.**

StockShield answers one question before a user signs: **is the on-chain exposure behaving like the asset I think I am buying, and is the execution environment safe enough to proceed?**

## Why this wedge

Tokenized stocks add new trust surfaces: token mint, issuer/SPV, oracle, liquidity venue, market makers, wallets, smart contracts and execution routing. StockShield evaluates those surfaces as one policy decision: `ALLOW`, `WARN`, or `BLOCK`.

## What works in this MVP

- Live **PreStocks** API adapter (`/api/prestocks/:symbol`) with transparent offline fallback.
- **Price-integrity engine** comparing mark/reference price vs token price.
- Composite StockShield score: price integrity, oracle health, liquidity, wallet risk and execution safety.
- **ATTACK MODE**: explicitly synthetic adversarial scenario showing automatic trade blocking.
- **SWAT Core connectivity** check against `SWAT_BASE_URL/openapi.json`.
- **Pyth Pro adapter** server-side, enabled by environment variables.
- Phantom connection and optional **Solana on-chain risk attestation** through the Memo program.
- Clear disclosure: the MVP attests a risk decision but does **not** pretend to execute a stock swap.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Live integration configuration

### Pyth

Set server-only variables:

```bash
PYTH_PRO_API_KEY=...
PYTH_PRO_FEED_ID=...
PYTH_PRO_CHANNEL=fixed_rate@200ms
```

The backend calls Pyth Pro `POST /v1/latest_price`; never expose the API key to the browser.

### SWAT

```bash
SWAT_BASE_URL=https://bitcoiners.norug.es
SWAT_API_KEY=...
```

The current MVP only verifies SWAT availability because the exact asset-risk endpoint must be mapped from the production OpenAPI. Do not invent a route. Add that mapping through `SWAT_ASSET_RISK_PATH` once confirmed.

### Solana

Default: devnet.

```bash
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

The `Attest safe execution` button writes a compact risk decision using the Solana Memo program. This creates a verifiable E2E blockchain artifact without pretending that a token trade happened.

## Submission positioning

### Main track

**Problem:** tokenized equities improve access but create new trust and execution surfaces. Users lack one pre-trade safety layer spanning reference price, token price, oracle freshness, liquidity, wallets and threat intelligence.

**Solution:** StockShield turns those signals into an explainable, enforceable pre-trade policy.

**Why Solana:** the asset, liquidity and execution live on Solana; the decision can be published and enforced at transaction time rather than as an off-chain report.

### PreStocks bounty

Use only PreStocks pre-IPO tokens in the PreStocks-specific demo. The current dashboard defaults to `OPENAI` from the official PreStocks API.

### Pyth bounty

Pyth data should affect `ALLOW/WARN/BLOCK`, not merely render a chart. Recommended production mapping:

1. Resolve the underlying equity feed and tokenized-stock feed.
2. Ingest price, confidence, market session and update timestamp.
3. Compute underlying-vs-token divergence.
4. Reject or warn on stale/low-confidence data.
5. Persist the feed evidence in the execution attestation.

### Meteora bounty — implemented controller, deployment evidence pending

The app now ships the official `@meteora-ag/dynamic-bonding-curve-sdk` and a **Risk-Adaptive DBC Controller**:

- low risk → normal fee schedule
- elevated divergence/volatility → defensive fee schedule
- critical integrity failure → front-end execution gate + operator alert
- graduation rules remain native to Meteora DBC/DAMM v2

`/api/meteora/status` verifies the DBC program and any configured StockShield config/pool accounts directly on Solana. The UI deliberately says `NO STOCKSHIELD POOL CLAIMED` until at least one supplied address decodes as a real DBC account. Configure `METEORA_NORMAL_CONFIG`, `METEORA_DEFENSIVE_CONFIG`, and `METEORA_POOL_ADDRESS` only after their transactions confirm. `BLOCK` never selects a config or constructs an execution.

The DBC program ID documented by Meteora is:

`dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`

## 3-minute demo script

**0:00–0:20 — Hook**

> Tokenizing a stock does not tokenize the trust around it. A tokenized asset depends on an issuer, oracle, liquidity venue, wallets and smart contracts. StockShield verifies that chain before you sign.

**0:20–0:55 — Real asset**

Open OpenAI PreStocks. Point out live PreStocks source, mark/reference value, on-chain token price, premium/discount and mint address.

**0:55–1:25 — Risk engine**

Show the radar and explain that reference/token divergence, oracle health, liquidity, wallet exposure and SWAT threat data produce an enforceable policy — not a decorative score.

**1:25–1:55 — Solana proof**

Connect Phantom on devnet and click `Attest safe execution`. Show the resulting transaction signature. Explain that the demo records the risk decision on Solana; production routing would place the gate immediately before the swap.

**1:55–2:30 — ATTACK MODE**

Click `Run ATTACK MODE`. The synthetic scenario creates a large price deviation and suspicious-wallet risk. StockShield flips to `BLOCK`; the execution action is disabled by policy.

**2:30–3:00 — Close**

> Brokerage apps tell you what you can buy. StockShield tells wallets, DEXs and brokers whether the execution can be trusted. We are building the security middleware for tokenized capital markets on Solana.

## Integrity rules for the hackathon demo

1. Never label fallback/synthetic data as live.
2. Never claim a Meteora deployment until there is a real transaction/pool/config.
3. Never call the Solana Memo attestation a stock purchase.
4. Show the exact transaction signature for any claimed on-chain action.
5. In the README/submission, disclose open-source components and external APIs.

The UI enforces these claims with source badges, `UNAVAILABLE` values instead of invented live signals, a full Solana Explorer link for attestations, a synthetic label on ATTACK MODE, and on-chain verification before it labels a Meteora account as configured.

Open-source runtime components: Next.js, React, Solana Web3.js, Meteora Dynamic Bonding Curve SDK, Recharts and Lucide. External services: PreStocks, Pyth Pro, SWAT Core, Solana RPC and Solana Explorer.

## Immediate next steps — implementation status

1. **Implemented:** mapped the production OpenAPI route `/api/solana/meteora/token/{mint}/launch-risk`; `SWAT_ASSET_RISK_PATH` remains configurable and its response is never treated as live after an error.
2. **Implemented, credentials pending:** Pyth parsing now normalizes price, confidence, session and freshness and feeds the policy only for a successful live response. Set `PYTH_PRO_API_KEY` and `PYTH_PRO_FEED_ID` to perform the live validation.
3. **Implemented, funded transaction pending:** official Meteora DBC SDK, adaptive policy, account verification and Explorer evidence are in place. Creating a config/pool still requires an operator wallet, intentional tokenomics and fees; no deployment is claimed without those.
4. **Deployment-ready:** `npm run build` and the included multi-stage `Dockerfile` support Vercel or Dokploy. No external deployment is claimed because this checkout has no deployment target/token configured.
5. **Rehearsal-ready:** the UI contains the timed demo guide and evidence checklist. Record only after Pyth is `LIVE`, any claimed Meteora account is `VERIFIED`, and the attestation signature opens successfully.

### Verification

```bash
npm test
npm run lint
npm run build
docker build -t stockshield .
docker run --env-file .env.local -p 3000:3000 stockshield
```
