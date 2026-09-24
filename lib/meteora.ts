export const METEORA_DBC_PROGRAM_ID = 'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN';

export type ExecutionPolicy = {
  mode: 'NORMAL' | 'DEFENSIVE' | 'HALT';
  feeBps: number | null;
  executionAllowed: boolean;
  operatorAlert: boolean;
  configAddress: string | null;
  reason: string;
};

export function meteoraPolicy(
  decision: 'ALLOW' | 'WARN' | 'BLOCK',
  configs: { normal?: string; defensive?: string } = {},
): ExecutionPolicy {
  if (decision === 'BLOCK') {
    return { mode: 'HALT', feeBps: null, executionAllowed: false, operatorAlert: true, configAddress: null, reason: 'Integrity policy blocks transaction construction' };
  }
  if (decision === 'WARN') {
    return { mode: 'DEFENSIVE', feeBps: 300, executionAllowed: true, operatorAlert: true, configAddress: configs.defensive ?? null, reason: 'Elevated risk selects the defensive pre-created DBC configuration' };
  }
  return { mode: 'NORMAL', feeBps: 100, executionAllowed: true, operatorAlert: false, configAddress: configs.normal ?? null, reason: 'Risk is within the normal execution policy' };
}
