import { describe, expect, it } from 'vitest';
import { assessRisk } from './risk';

describe('assessRisk missing market data', () => {
  it('blocks safely when the token price is unavailable', () => {
    const result = assessRisk({ markPrice: 100, tokenPrice: null });
    expect(result).toMatchObject({ decision: 'BLOCK', divergencePct: null });
    expect(result.reasons).toContain('Reference or on-chain token price unavailable');
  });
});
