import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SWAT StockShield | Stocklana',
  description: 'Pre-trade security and price-integrity layer for tokenized stocks on Solana.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
