import { describe, expect, it } from 'vitest';
import { parsePythEvidence } from './pyth';

describe('parsePythEvidence', () => {
  it('normalizes price, confidence and freshness', () => {
    const result = parsePythEvidence({ parsed: [{ price: { price: '12345', conf: '25', expo: -2 }, feed_update_timestamp: 100, market_session: 'REGULAR' }] }, 110_000);
    expect(result.price).toBeCloseTo(123.45);
    expect(result.confidencePct).toBeCloseTo(25 / 12345 * 100);
    expect(result).toMatchObject({ ageSec: 10, marketSession: 'REGULAR' });
  });
  it('does not invent missing evidence', () => {
    expect(parsePythEvidence({})).toMatchObject({ price: null, confidencePct: null, ageSec: null });
  });
});
