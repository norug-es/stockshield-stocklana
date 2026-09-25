'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, Radio, ShieldCheck, Zap } from 'lucide-react';
import RiskRadar from '@/components/Radar';
import WalletButton from '@/components/WalletButton';
import AssetScanner from '@/components/AssetScanner';
import PythFeedCatalog from '@/components/PythFeedCatalog';
import { assessRisk } from '@/lib/risk';
import { meteoraPolicy } from '@/lib/meteora';

type Asset = {
  name: string;
  symbol: string;
  description: string;
  contract_address: string;
  markPrice: number | null;
  tokenPrice: number | null;
  markValuation: number | null;
  impliedValuation: number | null;
  supply: number | null;
};

const FALLBACK: Asset = {
  name: 'OpenAI PreStocks', symbol: 'OPENAI', description: 'Demo fallback. Live mode fetches PreStocks server-side.',
  contract_address: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF',
  markPrice: 1023.68, tokenPrice: 1050.22, markValuation: 1268267156133, impliedValuation: 1301140000000, supply: 2826.34
};

export default function Home() {
  const [asset, setAsset] = useState<Asset>(FALLBACK);
  const [assets, setAssets] = useState<Asset[]>([FALLBACK]);
  const [dataSource, setDataSource] = useState('LOADING');
  const [attack, setAttack] = useState(false);
  const [swat, setSwat] = useState<'LIVE'|'OFF'|'CHECKING'>('CHECKING');
  const [pyth, setPyth] = useState<{source:string; ageSec:number|null; confidencePct:number|null}>({source:'CHECKING', ageSec:null, confidencePct:null});
  const [swatEvidence, setSwatEvidence] = useState<{source:string; risk:number|null; suspiciousExposurePct:number|null}>({source:'CHECKING', risk:null, suspiciousExposurePct:null});
  const [meteora, setMeteora] = useState<{source:string; configured:boolean; programDeployed?:boolean; poolAddress?:string|null}>({source:'CHECKING', configured:false});

  useEffect(() => {
    fetch('/api/prestocks').then(r => r.json()).then(j => {
      if (Array.isArray(j.assets) && j.assets.length) setAssets(j.assets);
    }).catch(() => undefined);
    fetch('/api/prestocks/OPENAI').then(r => r.json()).then(j => {
      if (j.asset) { setAsset(j.asset); setDataSource(j.source); }
      else setDataSource('FALLBACK');
    }).catch(() => setDataSource('FALLBACK'));

    fetch('/api/swat/status').then(r => r.json()).then(j => setSwat(j.connected ? 'LIVE' : 'OFF')).catch(() => setSwat('OFF'));
    fetch('/api/pyth').then(r => r.json()).then(j => setPyth({ source:j.source, ageSec:j.ageSec ?? null, confidencePct:j.confidencePct ?? null })).catch(() => setPyth({source:'ERROR',ageSec:null,confidencePct:null}));
    fetch('/api/meteora/status').then(r => r.json()).then(setMeteora).catch(() => setMeteora({source:'ERROR',configured:false}));
  }, []);

  useEffect(() => {
    fetch(`/api/swat/risk?asset=${encodeURIComponent(asset.contract_address)}`).then(r => r.json()).then(setSwatEvidence).catch(() => setSwatEvidence({source:'ERROR',risk:null,suspiciousExposurePct:null}));
  }, [asset.contract_address]);

  function selectAsset(symbol: string) {
    const selected = assets.find((item) => item.symbol === symbol);
    if (selected) {
      setAsset(selected);
      setDataSource('LIVE');
      setAttack(false);
    }
  }

  const decision = useMemo(() => assessRisk({
    markPrice: asset.markPrice,
    tokenPrice: asset.tokenPrice,
    oracleAgeSec: pyth.source === 'LIVE' ? pyth.ageSec : null,
    oracleConfidencePct: pyth.source === 'LIVE' ? pyth.confidencePct : null,
    liquidityUsd: null,
    suspiciousExposurePct: attack ? 8.5 : swatEvidence.suspiciousExposurePct,
    swatRisk: attack ? 88 : swatEvidence.risk,
    attackMode: attack
  }), [asset, attack, pyth, swatEvidence]);

  const executionPolicy = meteoraPolicy(decision.decision);

  const effectiveToken = asset.tokenPrice == null ? null : attack ? asset.tokenPrice * 1.065 : asset.tokenPrice;
  const premium = effectiveToken != null && asset.markPrice != null && asset.markPrice > 0
    ? ((effectiveToken - asset.markPrice) / asset.markPrice) * 100
    : null;
  const decisionClass = decision.decision === 'ALLOW' ? 'good' : decision.decision === 'WARN' ? 'warn' : 'bad';

  return (
    <main>
      <header>
        <div>
          <div className="eyebrow">SWAT × SOLANA · STOCKLANA 2026</div>
          <h1>Stock<span>Shield</span></h1>
          <p className="sub">Pre-trade security & price-integrity layer for tokenized capital markets.</p>
        </div>
        <div className="statusStack">
          <Status name="PreStocks" value={dataSource} />
          <Status name="SWAT Core" value={swat} />
          <Status name="Pyth" value={pyth.source} />
          <Status name="Meteora DBC" value={meteora.configured ? 'VERIFIED' : meteora.programDeployed ? 'PROGRAM ONLY' : meteora.source} />
        </div>
      </header>

      <section className="heroGrid">
        <div className="panel assetPanel">
          <div className="row between"><div><div className="label">TOKENIZED ASSET</div><h2>{asset.name}</h2></div><div className="pill">{asset.symbol}</div></div>
          <div className="priceGrid">
            <Metric label="Reference / mark" value={formatUsd(asset.markPrice)} />
            <Metric label="On-chain token" value={formatUsd(effectiveToken)} />
            <Metric label="Premium / discount" value={formatPercent(premium)} danger={premium != null && Math.abs(premium) > 4} />
          </div>
          <div className="contract">Mint <b>{asset.contract_address}</b></div>
          <div className="valuation"><span>Reference valuation</span><b>{formatBillions(asset.markValuation)}</b><span>Implied token valuation</span><b>{formatBillions(asset.impliedValuation)}</b></div>
        </div>

        <div className={`panel scorePanel ${decisionClass}`}>
          <div className="label">STOCKSHIELD SCORE</div>
          <div className="score">{decision.score}<small>/100</small></div>
          <div className="decision">{decision.decision === 'ALLOW' ? <CheckCircle2/> : <AlertTriangle/>}{decision.decision}</div>
          <div className="tiny center">Policy result · price + oracle + liquidity + wallets + SWAT</div>
        </div>
      </section>

      <section className="panel assetSelector">
        <div>
          <div className="label">ASSET VALIDATION SET</div>
          <h3>Choose a PreStocks asset to scan</h3>
          <p className="tiny">The selected asset is re-evaluated across price integrity, oracle, SWAT and Solana mint evidence.</p>
        </div>
        <select value={asset.symbol} onChange={(event) => selectAsset(event.target.value)} aria-label="Select asset">
          {assets.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>)}
        </select>
      </section>

      <AssetScanner key={asset.contract_address} mint={asset.contract_address} />
      <PythFeedCatalog />

      <section className="mainGrid">
        <div className="panel">
          <div className="row between"><div><div className="label">SECURITY RADAR</div><h3>Pre-trade integrity</h3></div><ShieldCheck size={26}/></div>
          <RiskRadar dimensions={decision.dimensions} />
          <div className="dimensionGrid">
            {Object.entries(decision.dimensions).map(([k,v]) => <div key={k}><span>{k.replace(/[A-Z]/g, m => ` ${m}`).toUpperCase()}</span><b>{v}</b></div>)}
          </div>
        </div>

        <div className="panel">
          <div className="row between"><div><div className="label">THREAT ENGINE</div><h3>Why this decision?</h3></div><Activity size={26}/></div>
          <div className="threatList">
            {decision.reasons.map((r,i) => <div className="threat" key={r}><span>{i+1}</span><div><b>{r}</b><small>{attack ? 'Synthetic adversarial scenario for demo' : 'Current policy evaluation'}</small></div></div>)}
          </div>
          <div className="miniGrid">
            <Metric label="Price divergence" value={formatPercent(decision.divergencePct, false)} danger={decision.divergencePct != null && decision.divergencePct >= 4} />
            <Metric label="Wallet exposure" value={attack ? '8.5%' : swatEvidence.suspiciousExposurePct == null ? 'UNAVAILABLE' : `${swatEvidence.suspiciousExposurePct.toFixed(1)}%`} danger={attack} />
            <Metric label="MEV / execution" value={attack ? 'HIGH' : 'LOW'} danger={attack} />
            <Metric label="Oracle age" value={pyth.source === 'LIVE' && pyth.ageSec != null ? `${pyth.ageSec}s` : 'UNAVAILABLE'} />
          </div>
        </div>
      </section>

      <section className="panel execution">
        <div className="row between wrap">
          <div><div className="label">RISK-GATED EXECUTION</div><h3>{decision.decision === 'BLOCK' ? 'Execution automatically blocked' : 'Execution can proceed'}</h3><p>StockShield evaluates the route before a transaction is signed. The MVP can publish the risk decision as an on-chain Solana memo.</p></div>
          <button className={attack ? 'danger' : 'attack'} onClick={() => setAttack(v => !v)}><Zap size={16}/>{attack ? 'Disable attack simulation' : 'Run ATTACK MODE'}</button>
        </div>
        <WalletButton decision={decision.decision} payload={{ symbol: asset.symbol, mint: asset.contract_address, score: decision.score, decision: decision.decision, divergencePct: decision.divergencePct == null ? null : Number(decision.divergencePct.toFixed(3)) }} />
      </section>

      <section className="panel meteoraPanel">
        <div className="row between wrap"><div><div className="label">METEORA RISK-ADAPTIVE DBC CONTROLLER</div><h3>{executionPolicy.mode} · {executionPolicy.feeBps == null ? 'No transaction' : `${executionPolicy.feeBps} bps target fee`}</h3></div><span className={`evidence ${meteora.configured ? 'verified' : 'unconfigured'}`}>{meteora.configured ? 'ON-CHAIN CONFIG VERIFIED' : 'NO STOCKSHIELD POOL CLAIMED'}</span></div>
        <p>{executionPolicy.reason}. Graduation remains native to Meteora DBC → DAMM v2.</p>
        <div className="policyGrid"><Metric label="ALLOW" value="NORMAL · 100 bps"/><Metric label="WARN" value="DEFENSIVE · 300 bps"/><Metric label="BLOCK" value="HALT + ALERT" danger={decision.decision === 'BLOCK'}/></div>
        {meteora.poolAddress && <a className="chainLink" href={`https://explorer.solana.com/address/${meteora.poolAddress}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet'}`} target="_blank" rel="noreferrer">Verify pool on Solana <ExternalLink size={13}/></a>}
      </section>

      <details className="panel demoGuide">
        <summary>3-minute demo guide · evidence-safe checklist</summary>
        <ol><li><b>0:00 Hook</b><span>Explain issuer, oracle, liquidity, wallet and contract trust.</span></li><li><b>0:20 Real asset</b><span>Show PreStocks only when its badge says LIVE; otherwise disclose fallback.</span></li><li><b>0:55 Risk engine</b><span>Show which live or unavailable signals produced the policy.</span></li><li><b>1:25 Solana proof</b><span>Attest and open the full signature in Explorer; call it an attestation, never a purchase.</span></li><li><b>1:55 Attack mode</b><span>Run the clearly labeled synthetic scenario and show BLOCK/HALT.</span></li><li><b>2:30 Close</b><span>Describe StockShield as pre-trade security middleware.</span></li></ol>
      </details>

      <footer><Radio size={14}/> Evidence labels are authoritative: unavailable/fallback data is never live; Attack Mode is synthetic; attestations are not purchases.</footer>
    </main>
  );
}

function Metric({ label, value, danger=false }: {label:string; value:string; danger?:boolean}) {
  return <div className={`metric ${danger ? 'metricDanger' : ''}`}><span>{label}</span><b>{value}</b></div>;
}

function Status({name, value}:{name:string; value:string}) {
  const live = value === 'LIVE';
  const cls = live ? 'dot live' : value === 'CHECKING' || value === 'LOADING' ? 'dot wait' : 'dot off';
  return <div className="status"><i className={cls}/><span>{name}</span><b>{value}</b></div>;
}

function formatUsd(value: number | null) {
  return value == null || !Number.isFinite(value) ? 'UNAVAILABLE' : `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null, signed = true) {
  if (value == null || !Number.isFinite(value)) return 'UNAVAILABLE';
  return `${signed && value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatBillions(value: number | null) {
  return value == null || !Number.isFinite(value) ? 'UNAVAILABLE' : `$${(value / 1e9).toFixed(1)}B`;
}
