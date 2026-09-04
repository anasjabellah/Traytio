import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Global setup for Playwright E2E tests.
 * Must be called before any tests that use @clerk/testing helpers.
 */
export default async function globalSetup() {
  await clerkSetup({
    publishableKey: 'pk_test_b24tdHVydGxlLTcxLmNsZXJrLmFjY291bnRzLmRldiQ',
    secretKey: 'sk_test_dSAfrzcNooy4dBI3cYeEBVnyaSo4BmeBXzU2k7vcT9',
  });
}
