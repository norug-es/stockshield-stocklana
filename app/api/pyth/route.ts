import { NextResponse } from 'next/server';
import { parsePythEvidence } from '@/lib/pyth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.PYTH_PRO_API_KEY;
  const feedId = process.env.PYTH_PRO_FEED_ID;
  const channel = process.env.PYTH_PRO_CHANNEL || 'fixed_rate@200ms';
  const numericFeedId = feedId == null ? null : Number(feedId);

  if (!key || numericFeedId == null || !Number.isInteger(numericFeedId) || numericFeedId < 0) {
    return NextResponse.json({
      source: 'UNCONFIGURED',
      reason: 'Set PYTH_PRO_API_KEY and a numeric PYTH_PRO_FEED_ID for live market data',
      feedId: null,
      price: null,
      confidencePct: null,
      ageSec: null,
      marketSession: null
    });
  }

  try {
    const r = await fetch('https://pyth-lazer.dourolabs.app/v1/latest_price', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceFeedIds: [numericFeedId],
        properties: ['price', 'confidence', 'market_session', 'feed_update_timestamp'],
        formats: [],
        parsed: true,
        channel
      }),
      cache: 'no-store'
    });
    if (!r.ok) throw new Error(`Pyth HTTP ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const evidence = parsePythEvidence(data);
    if (evidence.price == null) throw new Error('Pyth response did not contain a parseable price');
    return NextResponse.json({ source: 'LIVE', feedId: numericFeedId, ...evidence, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ source: 'ERROR', error: String(error) }, { status: 502 });
  }
}
