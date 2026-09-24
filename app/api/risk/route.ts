import { NextResponse } from 'next/server';
import { assessRisk } from '@/lib/risk';

export async function POST(req: Request) {
  const input = await req.json();
  return NextResponse.json(assessRisk(input));
}
