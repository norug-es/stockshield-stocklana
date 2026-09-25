import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.PYTH_PRO_API_KEY;
  if (!key) return NextResponse.json({ source: 'UNCONFIGURED', feeds: [] });

  try {
    const response = await fetch('https://pyth.dourolabs.app/v1/symbols?entitled_only=true', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Pyth symbols HTTP ${response.status}: ${await response.text()}`);
    const symbols = await response.json();
    const feeds = (Array.isArray(symbols) ? symbols : symbols.data ?? [])
      .filter((feed: { asset_type?: string; state?: string }) => feed.asset_type === 'equity' && feed.state === 'stable')
      .map((feed: { pyth_lazer_id: number; symbol: string; description: string; min_channel: string; state: string }) => ({
        id: feed.pyth_lazer_id,
        symbol: feed.symbol,
        description: feed.description,
        minChannel: feed.min_channel,
        state: feed.state
      }));
    return NextResponse.json({ source: 'LIVE', feeds, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ source: 'ERROR', feeds: [], error: String(error) }, { status: 502 });
  }
}