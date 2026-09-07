import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Global setup for Playwright E2E tests.
 * Must be called before any tests that use @clerk/testing helpers.
 *
 * Requires CLERK_TEST_PUBLISHABLE_KEY and CLERK_TEST_SECRET_KEY
 * to be set in the environment (CI secrets or .env.local).
 * These are TEST credentials only — never use production keys.
 */
export default async function globalSetup() {
  const publishableKey = process.env.CLERK_TEST_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_TEST_SECRET_KEY;

  if (!publishableKey) {
    throw new Error(
      'CLERK_TEST_PUBLISHABLE_KEY is not set. ' +
      'Configure it in your CI secrets or .env.local (Clerk test instance publishable key).',
    );
  }
  if (!secretKey) {
    throw new Error(
      'CLERK_TEST_SECRET_KEY is not set. ' +
      'Configure it in your CI secrets or .env.local (Clerk test instance secret key).',
    );
  }

  await clerkSetup({
    publishableKey,
    secretKey,
  });
}
