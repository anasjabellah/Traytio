// ---------------------------------------------------------------------------
// Billing environment separation (P0).
//
// ChariPay uses ONE base URL for sandbox and production — the API key alone
// selects the environment (chari_sk_test_* vs chari_sk_live_*). That makes
// key/environment mismatch the primary misconfiguration risk: a sandbox key
// in production silently bills nothing real (all test traffic), while a live
// key outside production could charge real money from a dev machine.
//
// Rules (fail closed, no fallbacks):
//   BILLING_ENV=production  → requires a live key, refuses test keys.
//   anything else (incl. unset) → sandbox mode, requires a test key,
//     refuses live keys.
// Production code must never fall back to sandbox credentials and sandbox
// must never accept production credentials.
// ---------------------------------------------------------------------------

export const BILLING_TEST_KEY_PREFIX = 'chari_sk_test_';
export const BILLING_LIVE_KEY_PREFIX = 'chari_sk_live_';

export type BillingEnv = 'sandbox' | 'production';

export class BillingConfigError extends Error {
  readonly code = 'BILLING_CONFIG_ERROR' as const;
  constructor(message = 'Billing misconfigured') {
    super(message);
    this.name = 'BillingConfigError';
  }
}

type EnvLike = { BILLING_ENV?: string; NODE_ENV?: string };

function readEnv(env: NodeJS.ProcessEnv | EnvLike | undefined): EnvLike {
  if (env) return env;
  return process.env as EnvLike;
}

/**
 * Resolve the billing environment. Explicit BILLING_ENV wins; otherwise
 * production Node implies production billing, everything else is sandbox.
 */
export function resolveBillingEnv(env?: NodeJS.ProcessEnv | EnvLike): BillingEnv {
  const e = readEnv(env);
  if (e.BILLING_ENV === 'production') return 'production';
  if (e.BILLING_ENV === 'sandbox') return 'sandbox';
  return e.NODE_ENV === 'production' ? 'production' : 'sandbox';
}

export function isTestKey(apiKey: string): boolean {
  return apiKey.startsWith(BILLING_TEST_KEY_PREFIX);
}

export function isLiveKey(apiKey: string): boolean {
  return apiKey.startsWith(BILLING_LIVE_KEY_PREFIX);
}

/**
 * Fail closed on any key/environment mismatch. Unknown key shapes (neither
 * prefix) are rejected everywhere — a credential we cannot classify is a
 * credential we must not use.
 */
export function assertBillingEnvSafe(
  apiKey: string,
  env?: NodeJS.ProcessEnv | EnvLike,
): BillingEnv {
  const billingEnv = resolveBillingEnv(env);
  if (billingEnv === 'production' && !isLiveKey(apiKey)) {
    throw new BillingConfigError(
      'Refusing production billing without a live ChariPay key.',
    );
  }
  if (billingEnv === 'sandbox' && !isTestKey(apiKey)) {
    throw new BillingConfigError(
      'Refusing sandbox billing without a test ChariPay key.',
    );
  }
  return billingEnv;
}
