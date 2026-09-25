import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('https://prestocks.com/api/prestocks', { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`PreStocks HTTP ${response.status}`);
    const assets = await response.json();
    return NextResponse.json({ source: 'LIVE', assets, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ source: 'OFFLINE', assets: [], error: String(error) }, { status: 503 });
  }
}