import { describe, expect, it } from 'vitest';
import { meteoraPolicy } from './meteora';

describe('meteoraPolicy', () => {
  it('selects normal and defensive configurations', () => {
    expect(meteoraPolicy('ALLOW', { normal: 'normal' })).toMatchObject({ mode: 'NORMAL', feeBps: 100, configAddress: 'normal', executionAllowed: true });
    expect(meteoraPolicy('WARN', { defensive: 'defensive' })).toMatchObject({ mode: 'DEFENSIVE', feeBps: 300, configAddress: 'defensive', operatorAlert: true });
  });
  it('halts before transaction construction on BLOCK', () => {
    expect(meteoraPolicy('BLOCK')).toMatchObject({ mode: 'HALT', feeBps: null, configAddress: null, executionAllowed: false, operatorAlert: true });
  });
});
