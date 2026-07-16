import { test, expect, type Page } from '@playwright/test';

/**
 * Clients page E2E smoke + CRUD flow.
 *
 * AUTHENTICATION
 * --------------
 * The /dashboard routes are protected by Clerk (`src/proxy.ts` -> clerkMiddleware ->
 * auth.protect()). To exercise the real UI in E2E we use Clerk's official Testing
 * Token flow:
 *   1. Create a test token in the Clerk Dashboard (https://dashboard.clerk.com ->
 *      <your instance> -> API Keys -> Testing token) or via the CLI.
 *   2. Expose it as CLERK_TEST_TOKEN in the environment (e.g. inside .env.local or
 *      the CI secret store).
 *   3. The beforeEach below loads Clerk and sets the token, which authenticates the
 *      browser session for the duration of the test.
 *
 * If CLERK_TEST_TOKEN is missing the auth step fails fast with a clear message.
 */

const TEST_CLIENT_NAME = `E2E Client ${Date.now()}`;
const TEST_CLIENT_EMAIL = `e2e-${Date.now()}@example.com`;
const TEST_CLIENT_PHONE = '+33 6 12 34 56 78';
const TEST_CLIENT_CITY = 'Casablanca';

async function authenticate(page: Page) {
  const token = process.env.CLERK_TEST_TOKEN;
  if (!token) {
    throw new Error(
      'CLERK_TEST_TOKEN is not set. Generate a Clerk testing token and export it ' +
        'before running the Clients E2E suite (see header comment in clients.spec.ts).',
    );
  }
  await page.goto('/dashboard/clients', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (t) => {
    // Clerk exposes a global when @clerk/nextjs is mounted.
    const clerk = (window as unknown as { Clerk?: { load: () => Promise<void>; setToken: (t: string) => Promise<void> } }).Clerk;
    if (!clerk) throw new Error('Clerk global not found on window — is @clerk/nextjs loaded?');
    await clerk.load();
    await clerk.setToken(t);
  }, token);
  // Reload so the middleware/Clerk session propagates for the protected route.
  await page.goto('/dashboard/clients');
}

test.describe('Clients page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('loads with the correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Clients/i);
    await expect(page.getByRole('heading', { name: /clients/i, level: 1 })).toBeVisible();
  });

  test('shows the client grid headers', async ({ page }) => {
    // The toolbar / grid renders client attribute labels.
    await expect(page.getByText(/nom/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/téléphone/i)).toBeVisible();
    await expect(page.getByText(/ville/i)).toBeVisible();
  });

  test('can create a client and then delete it (cleanup)', async ({ page }) => {
    // 1. Open the create dialog.
    await page.getByRole('button', { name: /ajouter un client/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/créer un client/i)).toBeVisible();

    // 2. Fill the form (fields are registered via react-hook-form -> name attr).
    await dialog.locator('input[name="name"]').fill(TEST_CLIENT_NAME);
    await dialog.locator('input[name="email"]').fill(TEST_CLIENT_EMAIL);
    await dialog.locator('input[name="phone"]').fill(TEST_CLIENT_PHONE);
    await dialog.locator('input[name="city"]').fill(TEST_CLIENT_CITY);

    // 3. Submit and verify success toast.
    await dialog.getByRole('button', { name: /créer le client/i }).click();
    await expect(page.getByText(/client (créé|ajouté)/i)).toBeVisible({ timeout: 10_000 });

    // 4. The new client should appear in the grid — search for it to confirm.
    const toolbarSearch = page.getByPlaceholder(/rechercher/i);
    await toolbarSearch.fill(TEST_CLIENT_NAME);
    await expect(page.getByText(TEST_CLIENT_NAME, { exact: false })).toBeVisible({ timeout: 10_000 });

    // 5. Cleanup — delete via the row action then confirm in the dialog.
    const row = page.locator('[data-client-row], .group', { hasText: TEST_CLIENT_NAME }).first();
    await row.getByRole('button', { name: /supprimer/i }).click();
    const confirm = page.getByRole('dialog').getByRole('button', { name: /supprimer|confirmer|oui/i });
    await expect(confirm).toBeVisible();
    await confirm.click();
    await expect(page.getByText(/supprimé|supprimée/i)).toBeVisible({ timeout: 10_000 });

    // 6. Confirm it is gone.
    await toolbarSearch.fill(TEST_CLIENT_NAME);
    await expect(page.getByText(TEST_CLIENT_NAME, { exact: false })).toHaveCount(0, { timeout: 10_000 });
  });
});
