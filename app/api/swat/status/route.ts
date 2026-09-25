import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.SWAT_BASE_URL || 'https://bitcoiners.norug.es';
  const apiKey = process.env.SWAT_API_KEY;
  if (!apiKey || apiKey === 'change-this-master-key') {
    return NextResponse.json({ connected: false, source: 'UNCONFIGURED', base });
  }
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/openapi.json`, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store'
    });
    return NextResponse.json({ connected: r.ok, source: r.ok ? 'LIVE' : 'ERROR', status: r.status, base });
  } catch (error) {
    return NextResponse.json({ connected: false, source: 'ERROR', base, error: String(error) });
  }
}
