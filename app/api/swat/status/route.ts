import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.SWAT_BASE_URL || 'https://bitcoiners.norug.es';
  const apiKey = process.env.SWAT_API_KEY;
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/openapi.json`, {
      headers: apiKey && apiKey !== 'change-this-master-key' ? { 'X-API-Key': apiKey } : undefined,
      cache: 'no-store'
    });
    return NextResponse.json({ connected: r.ok, source: r.ok ? 'LIVE' : 'ERROR', status: r.status, base, authenticated: Boolean(apiKey && apiKey !== 'change-this-master-key') });
  } catch (error) {
    return NextResponse.json({ connected: false, source: 'ERROR', base, error: String(error) });
  }
}
