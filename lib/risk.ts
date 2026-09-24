export type RiskInputs = {
  markPrice: number | null;
  tokenPrice: number | null;
  liquidityUsd?: number | null;
  oracleAgeSec?: number | null;
  oracleConfidencePct?: number | null;
  suspiciousExposurePct?: number | null;
  swatRisk?: number | null;
  attackMode?: boolean;
};

export type RiskDecision = {
  score: number;
  risk: number;
  decision: 'ALLOW' | 'WARN' | 'BLOCK';
  divergencePct: number | null;
  reasons: string[];
  dimensions: {
    priceIntegrity: number;
    oracleHealth: number;
    liquidity: number;
    walletRisk: number;
    executionSafety: number;
  };
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function assessRisk(input: RiskInputs): RiskDecision {
  const markPrice = input.markPrice;
  const hasPrices = markPrice != null && markPrice > 0 && input.tokenPrice != null;
  const effectiveToken = input.tokenPrice == null ? null : input.attackMode ? input.tokenPrice * 1.065 : input.tokenPrice;
  const divergencePct = hasPrices && effectiveToken != null && markPrice != null
    ? Math.abs((effectiveToken - markPrice) / markPrice) * 100
    : null;

  const priceIntegrity = divergencePct == null ? 0 : clamp(100 - divergencePct * 12);
  const oracleAge = input.oracleAgeSec;
  const oracleConfidence = input.oracleConfidencePct;
  const oracleHealth = oracleAge == null || oracleConfidence == null
    ? 55
    : clamp(100 - Math.max(0, oracleAge - 30) * 0.9 - oracleConfidence * 18);

  const liquidity = input.liquidityUsd == null
    ? 72
    : clamp(35 + Math.log10(Math.max(1, input.liquidityUsd)) * 9);

  const suspicious = input.suspiciousExposurePct;
  const walletRisk = suspicious == null && input.swatRisk == null
    ? 55
    : clamp(100 - (suspicious ?? 0) * 4 - (input.swatRisk ?? 0) * 0.45);
  const executionSafety = clamp((priceIntegrity * 0.5) + (oracleHealth * 0.2) + (liquidity * 0.15) + (walletRisk * 0.15));

  const score = Math.round(
    priceIntegrity * 0.38 +
    oracleHealth * 0.18 +
    liquidity * 0.16 +
    walletRisk * 0.18 +
    executionSafety * 0.10
  );
  const risk = 100 - score;
  const reasons: string[] = [];

  if (divergencePct == null) reasons.push('Reference or on-chain token price unavailable');
  else if (divergencePct >= 4) reasons.push(`Critical price divergence: ${divergencePct.toFixed(2)}%`);
  else if (divergencePct >= 1.5) reasons.push(`Elevated price divergence: ${divergencePct.toFixed(2)}%`);
  if (oracleAge == null || oracleConfidence == null) reasons.push('Live oracle evidence unavailable');
  else if (oracleAge > 90) reasons.push(`Oracle update is stale: ${oracleAge}s`);
  if (suspicious == null && input.swatRisk == null) reasons.push('Live SWAT wallet evidence unavailable');
  else if (suspicious != null && suspicious >= 5) reasons.push(`Suspicious wallet exposure: ${suspicious.toFixed(1)}%`);
  if ((input.swatRisk ?? 0) >= 70) reasons.push(`SWAT threat risk elevated: ${input.swatRisk}`);
  if (!reasons.length) reasons.push('No blocking anomaly detected by current policy');

  const decision: RiskDecision['decision'] =
    divergencePct == null || divergencePct >= 4 || (oracleAge != null && oracleAge > 180) || (input.swatRisk ?? 0) >= 85 ? 'BLOCK' :
    divergencePct >= 1.5 || score < 72 ? 'WARN' : 'ALLOW';

  return {
    score,
    risk,
    decision,
    divergencePct,
    reasons,
    dimensions: {
      priceIntegrity: Math.round(priceIntegrity),
      oracleHealth: Math.round(oracleHealth),
      liquidity: Math.round(liquidity),
      walletRisk: Math.round(walletRisk),
      executionSafety: Math.round(executionSafety)
    }
  };
}
