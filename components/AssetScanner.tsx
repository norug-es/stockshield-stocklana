'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, LoaderCircle, ShieldAlert } from 'lucide-react';

type ScannerResult = {
  source: string;
  exists: boolean;
  mint: string;
  network?: string;
  program?: string;
  decimals?: number;
  supply?: string;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  metadata?: { name?: string; symbol?: string; uri?: string } | null;
  largestAccounts?: { address: string; amount: string | null }[];
  recentTransactions?: { signature: string; slot: number; blockTime: number | null; status: string }[];
  scanners?: Record<string, string>;
  error?: string;
};

export default function AssetScanner({ mint }: { mint: string }) {
  const [result, setResult] = useState<ScannerResult | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/scanner?mint=${encodeURIComponent(mint)}`)
      .then((response) => response.json())
      .then((data: ScannerResult) => { if (active) setResult(data); })
      .catch(() => { if (active) setResult({ source: 'ERROR', exists: false, mint }); });
    return () => { active = false; };
  }, [mint]);

  return (
    <section className="panel scannerPanel">
      <div className="row between wrap">
        <div>
          <div className="label">ON-CHAIN SCANNER</div>
          <h3>Mint integrity and transaction evidence</h3>
        </div>
        <span className={`evidence ${result?.source === 'LIVE' && result.exists ? 'verified' : 'unconfigured'}`}>
          {result == null ? 'CHECKING' : result.source === 'LIVE' && result.exists ? 'MAINNET VERIFIED' : result.source}
        </span>
      </div>
      {result == null ? <div className="scannerLoading"><LoaderCircle size={16} /> Reading Solana mainnet...</div> : result.error ? <div className="scannerError"><ShieldAlert size={16} /> Scanner unavailable: {result.error}</div> : !result.exists ? <div className="scannerError"><ShieldAlert size={16} /> This mint was not found on Solana mainnet.</div> : (
        <>
          <div className="scannerFacts">
            <Metric label="Network" value={result.network || 'mainnet-beta'} />
            <Metric label="Token program" value={result.program === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' ? 'Token-2022' : 'SPL Token'} />
            <Metric label="Decimals" value={String(result.decimals ?? 'UNAVAILABLE')} />
            <Metric label="Recent signatures" value={String(result.recentTransactions?.length ?? 0)} />
          </div>
          <div className="scannerAuthorities">
            <span>Mint authority <b>{shortAddress(result.mintAuthority)}</b></span>
            <span>Freeze authority <b>{shortAddress(result.freezeAuthority)}</b></span>
            {result.metadata?.uri && <a href={result.metadata.uri} target="_blank" rel="noreferrer">Token metadata <ExternalLink size={13} /></a>}
          </div>
          <div className="scannerLinks">
            {Object.entries(result.scanners || {}).map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}<ExternalLink size={13} /></a>)}
          </div>
          <div className="transactionList">
            <div className="label">LATEST MINT ACTIVITY</div>
            {result.recentTransactions?.length ? result.recentTransactions.map((transaction) => <a key={transaction.signature} href={`https://explorer.solana.com/tx/${transaction.signature}?cluster=mainnet-beta`} target="_blank" rel="noreferrer"><span>{transaction.status}</span><b>{transaction.signature.slice(0, 10)}...{transaction.signature.slice(-8)}</b><small>{transaction.blockTime ? new Date(transaction.blockTime * 1000).toLocaleString() : 'Time unavailable'}</small><ExternalLink size={13} /></a>) : <p className="tiny">No recent signatures returned by the RPC.</p>}
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><b>{value}</b></div>;
}

function shortAddress(address: string | null | undefined) {
  return address ? `${address.slice(0, 6)}...${address.slice(-6)}` : 'NONE';
}
