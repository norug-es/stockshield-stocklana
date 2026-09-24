# Architecture

```text
                         ┌──────────────────────┐
                         │   StockShield UI     │
                         │ Next.js / Phantom    │
                         └──────────┬───────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
          ┌────────────────┐ ┌──────────────┐ ┌───────────────┐
          │ PreStocks API  │ │   Pyth Pro   │ │   SWAT Core   │
          │ token/mark/SPV │ │ price/oracle │ │ threat/graph  │
          └───────┬────────┘ └──────┬───────┘ └───────┬───────┘
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ StockShield Policy   │
                         │ price/oracle/liquidity│
                         │ wallet/execution     │
                         └──────────┬───────────┘
                                    │
                           ALLOW / WARN / BLOCK
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
             Solana risk attestation      production route gate
                  (MVP: Memo)             (DEX / Meteora later)
```

## Trust boundary

All API secrets stay server-side. The browser receives normalized public market/risk values only. Pyth API keys and SWAT API keys are never exposed through `NEXT_PUBLIC_*` variables.
