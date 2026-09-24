import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.SWAT_BASE_URL || 'https://bitcoiners.norug.es';
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/openapi.json`, {
      headers: process.env.SWAT_API_KEY ? { 'X-API-Key': process.env.SWAT_API_KEY } : {},
      cache: 'no-store'
    });
    return NextResponse.json({ connected: r.ok, status: r.status, base });
  } catch (error) {
    return NextResponse.json({ connected: false, base, error: String(error) });
  }
}
