# Stocklana Submission Copy

## Project name
SWAT StockShield

## One-liner
The pre-trade security and price-integrity layer for tokenized stocks on Solana.

## Description
Tokenized stocks make markets more accessible, but they introduce new trust surfaces that brokerage apps were never designed to expose: the token representation, issuer/SPV, oracle, liquidity pool, wallets, market makers, smart contracts and execution route.

StockShield evaluates those surfaces immediately before signing. It compares reference and on-chain prices, checks oracle health, models liquidity and wallet risk, incorporates SWAT threat intelligence, and converts the evidence into an explainable `ALLOW`, `WARN`, or `BLOCK` policy.

The demo uses live PreStocks data when available, has a server-side Pyth adapter, checks SWAT Core connectivity, and can publish a safe-execution risk attestation to Solana through Phantom. A clearly labeled synthetic ATTACK MODE demonstrates how a manipulated-price/wallet-risk scenario automatically flips the policy to `BLOCK`.

StockShield is designed as middleware for wallets, DEXs, issuers, brokers and institutional desks—not as another stock dashboard.

## Why Solana
The tokenized asset and its liquidity/execution environment live on Solana. That means safety can be evaluated and enforced at transaction time, and the evidence can be anchored on-chain rather than remaining an external report.

## Tagline
**Tokenizing a stock doesn't tokenize the trust around it. StockShield does the verification before you sign.**
