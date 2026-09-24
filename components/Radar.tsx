'use client';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';

export default function RiskRadar({ dimensions }: { dimensions: Record<string, number> }) {
  const data = [
    ['Price', dimensions.priceIntegrity],
    ['Oracle', dimensions.oracleHealth],
    ['Liquidity', dimensions.liquidity],
    ['Wallets', dimensions.walletRisk],
    ['Execution', dimensions.executionSafety]
  ].map(([metric, value]) => ({ metric, value }));

  return (
    <div className="chartWrap">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#a8b4c5', fontSize: 11 }} />
          <Radar dataKey="value" stroke="#61f7c6" fill="#61f7c6" fillOpacity={0.18} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
