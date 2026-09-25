import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  try {
    const r = await fetch('https://prestocks.com/api/prestocks', { next: { revalidate: 60 } });
    if (!r.ok) throw new Error(`PreStocks HTTP ${r.status}`);
    const all = await r.json();
    const asset = all.find((x: any) => String(x.symbol).toUpperCase() === symbol.toUpperCase());
    if (!asset) return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
    return NextResponse.json({ source: 'LIVE', asset, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ source: 'OFFLINE', error: String(error) }, { status: 503 });
  }
}
