import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient, DYNAMIC_BONDING_CURVE_PROGRAM_ID } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { meteoraPolicy } from '@/lib/meteora';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rpc = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
  const normal = process.env.METEORA_NORMAL_CONFIG || undefined;
  const defensive = process.env.METEORA_DEFENSIVE_CONFIG || undefined;
  const poolAddress = process.env.METEORA_POOL_ADDRESS || undefined;
  try {
    const connection = new Connection(rpc, 'confirmed');
    const program = await connection.getAccountInfo(DYNAMIC_BONDING_CURVE_PROGRAM_ID);
    const client = new DynamicBondingCurveClient(connection, 'confirmed');
    const [normalConfig, defensiveConfig, pool] = await Promise.all([
      normal ? client.state.getPoolConfig(new PublicKey(normal)) : null,
      defensive ? client.state.getPoolConfig(new PublicKey(defensive)) : null,
      poolAddress ? client.state.getPool(new PublicKey(poolAddress)) : null,
    ]);
    return NextResponse.json({
      source: 'ON_CHAIN', programId: DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58(), programDeployed: Boolean(program?.executable),
      configured: Boolean(normalConfig || defensiveConfig || pool), normalConfigVerified: Boolean(normalConfig),
      defensiveConfigVerified: Boolean(defensiveConfig), poolVerified: Boolean(pool), poolAddress: pool ? poolAddress : null,
      policies: { ALLOW: meteoraPolicy('ALLOW', { normal, defensive }), WARN: meteoraPolicy('WARN', { normal, defensive }), BLOCK: meteoraPolicy('BLOCK') },
    });
  } catch (error) {
    return NextResponse.json({ source: 'ERROR', programId: DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58(), configured: false, error: String(error) }, { status: 502 });
  }
}
