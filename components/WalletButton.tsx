'use client';

import { useState } from 'react';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey?: PublicKey;
      connect: () => Promise<{ publicKey: PublicKey }>;
      signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>;
    };
  }
}

export default function WalletButton({ decision, payload }: { decision: string; payload: Record<string, unknown> }) {
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState('');

  async function connect() {
    if (!window.solana) return setStatus('Phantom not detected');
    const { publicKey } = await window.solana.connect();
    setWallet(publicKey.toBase58());
    setStatus('Wallet connected');
  }

  async function attest() {
    if (decision === 'BLOCK') return setStatus('Blocked by StockShield policy');
    if (!window.solana?.publicKey) return setStatus('Connect Phantom first');
    try {
      const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
      const connection = new Connection(rpc, 'confirmed');
      const memo = JSON.stringify({ app: 'StockShield', v: 1, ...payload }).slice(0, 700);
      const ix = new TransactionInstruction({
        programId: MEMO_PROGRAM,
        keys: [],
        data: Buffer.from(memo, 'utf8')
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = window.solana.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const { signature } = await window.solana.signAndSendTransaction(tx);
      setStatus(signature);
    } catch (e) {
      setStatus(`Transaction failed: ${String(e)}`);
    }
  }

  return (
    <div className="walletBox">
      <div className="walletRow">
        <button className="secondary" onClick={connect}>{wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : 'Connect Phantom'}</button>
        <button className={decision === 'BLOCK' ? 'danger' : 'primary'} onClick={attest}>
          {decision === 'BLOCK' ? 'Trade blocked' : 'Attest safe execution'}
        </button>
      </div>
      <div className="tiny">{status.startsWith('Transaction') || !status || !status.match(/^[1-9A-HJ-NP-Za-km-z]{60,}$/) ? (status || 'Optional on-chain proof uses Solana Memo; this MVP does not execute a stock swap.') : <><span>Attestation signature: </span><a href={`https://explorer.solana.com/tx/${status}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet'}`} target="_blank" rel="noreferrer">{status}</a></>}</div>
    </div>
  );
}
