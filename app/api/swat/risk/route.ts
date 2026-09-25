import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const path = process.env.SWAT_ASSET_RISK_PATH;
  if (!path) return NextResponse.json({ source: 'UNCONFIGURED', risk: null, suspiciousExposurePct: null });
  const asset = new URL(req.url).searchParams.get('asset');
  if (!asset) return NextResponse.json({ error: 'asset is required' }, { status: 400 });
  const base = process.env.SWAT_BASE_URL || 'https://bitcoiners.norug.es';
  const apiKey = process.env.SWAT_API_KEY;
  try {
    const expandedPath = path.replaceAll('{mint}', encodeURIComponent(asset)).replaceAll('{asset}', encodeURIComponent(asset));
    const url = new URL(expandedPath, `${base.replace(/\/$/, '')}/`);
    if (expandedPath === path) url.searchParams.set('asset', asset);
    const r = await fetch(url, { headers: apiKey && apiKey !== 'change-this-master-key' ? { 'X-API-Key': apiKey } : undefined, cache: 'no-store' });
    if (!r.ok) throw new Error(`SWAT HTTP ${r.status}`);
    const raw = await r.json();
    const riskValue = Number(raw.risk ?? raw.risk_score ?? raw.score);
    const risk = Number.isFinite(riskValue) && riskValue >= 0 && riskValue <= 1 ? riskValue * 100 : riskValue;
    const exposure = Number(raw.suspiciousExposurePct ?? raw.suspicious_exposure_pct ?? raw.exposure);
    return NextResponse.json({ source: 'LIVE', risk: Number.isFinite(risk) ? risk : null, suspiciousExposurePct: Number.isFinite(exposure) ? exposure : null, quality: raw.analysis_quality ?? null, reasons: raw.risk_reasons ?? [] });
  } catch (error) {
    return NextResponse.json({ source: 'ERROR', risk: null, suspiciousExposurePct: null, error: String(error) }, { status: 502 });
  }
}
