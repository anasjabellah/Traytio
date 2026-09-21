import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMembership } from '@/lib/assert-role';
import { createBillingCheckout } from '@/features/billing/actions/billing-checkout';

// Thin JSON surface over the billing checkout action (manual testing +
// future UI). Auth: this path is middleware-protected AND the action
// re-resolves identity + role server-side; plan allowlist is zod-enforced
// and variant IDs are server-mapped. No client-controlled billing fields.
const bodySchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL']),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
  }

  try {
    await getCurrentMembership();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await createBillingCheckout(parsed.data);
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
