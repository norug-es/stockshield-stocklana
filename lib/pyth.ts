export type PythEvidence = {
  price: number | null;
  confidencePct: number | null;
  ageSec: number | null;
  marketSession: string | null;
};

const finite = (value: unknown) => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

export function parsePythEvidence(raw: unknown, nowMs = Date.now()): PythEvidence {
  const root = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const rows = Array.isArray(root.parsed) ? root.parsed : Array.isArray(root.data) ? root.data : [];
  const row = (rows[0] ?? root) as Record<string, unknown>;
  const priceNode = (row.price && typeof row.price === 'object' ? row.price : row) as Record<string, unknown>;
  const exponent = finite(priceNode.expo ?? row.exponent) ?? 0;
  const rawPrice = finite(priceNode.price ?? row.price);
  const price = rawPrice == null ? null : rawPrice * 10 ** exponent;
  const rawConfidence = finite(priceNode.conf ?? row.confidence);
  const confidence = rawConfidence == null ? null : rawConfidence * 10 ** exponent;
  const timestamp = finite(row.feedUpdateTimestamp ?? row.feed_update_timestamp ?? row.publishTime ?? row.publish_time ?? root.timestamp);
  return {
    price,
    confidencePct: price && confidence != null ? Math.abs(confidence / price) * 100 : null,
    ageSec: timestamp == null ? null : Math.max(0, Math.round(nowMs / 1000 - timestamp)),
    marketSession: typeof row.marketSession === 'string' ? row.marketSession : typeof row.market_session === 'string' ? row.market_session : null,
  };
}
