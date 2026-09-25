import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

const MAINNET_RPCS = [
  process.env.SOLANA_MAINNET_RPC,
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com'
].filter((rpc): rpc is string => Boolean(rpc));

export async function GET(req: Request) {
  const mint = new URL(req.url).searchParams.get('mint');
  if (!mint) return NextResponse.json({ error: 'mint is required' }, { status: 400 });

  try {
    const publicKey = new PublicKey(mint);
    let account;
    let connection: Connection | undefined;
    let lastError: unknown;
    for (const rpc of MAINNET_RPCS) {
      try {
        connection = new Connection(rpc, 'confirmed');
        account = await connection.getParsedAccountInfo(publicKey);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!account || !connection) throw lastError || new Error('No Solana RPC available');

    const [largestAccountsResult, signaturesResult] = await Promise.allSettled([
      connection.getTokenLargestAccounts(publicKey),
      connection.getSignaturesForAddress(publicKey, { limit: 8 })
    ]);
    const largestAccounts = largestAccountsResult.status === 'fulfilled' ? largestAccountsResult.value.value : [];
    const signatures = signaturesResult.status === 'fulfilled' ? signaturesResult.value : [];

    if (!account.value || !('parsed' in account.value.data)) {
      return NextResponse.json({ source: 'LIVE', exists: false, mint, network: 'mainnet-beta' });
    }

    const info = account.value.data.parsed.info;
    const extensions = Array.isArray(info.extensions) ? info.extensions : [];
    const metadata = extensions.find((extension: { extension?: string }) => extension.extension === 'tokenMetadata')?.state;

    return NextResponse.json({
      source: 'LIVE',
      exists: true,
      mint,
      network: 'mainnet-beta',
      program: account.value.owner.toBase58(),
      decimals: info.decimals,
      supply: info.supply,
      mintAuthority: info.mintAuthority ?? null,
      freezeAuthority: info.freezeAuthority ?? null,
      metadata: metadata ? { name: metadata.name, symbol: metadata.symbol, uri: metadata.uri } : null,
      largestAccounts: largestAccounts.map((holder) => ({ address: holder.address.toBase58(), amount: holder.uiAmountString })),
      recentTransactions: signatures.map((signature) => ({
        signature: signature.signature,
        slot: signature.slot,
        blockTime: signature.blockTime,
        status: signature.err ? 'FAILED' : 'CONFIRMED'
      })),
      scanners: {
        explorer: `https://explorer.solana.com/address/${mint}?cluster=mainnet-beta`,
        solscan: `https://solscan.io/token/${mint}`,
        rugcheck: `https://rugcheck.xyz/tokens/${mint}`,
        birdeye: `https://birdeye.so/token/${mint}?chain=solana`
      },
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ source: 'ERROR', exists: false, mint, error: String(error) }, { status: 502 });
  }
}