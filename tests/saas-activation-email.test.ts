/**
 * SaaS activation email (Phase 3B) — focused tests.
 *
 * Covers: recipient, first name, plan, activation URL format + app-URL
 * source, /sign-up?token= presence, 7-day expiry notice, no localhost
 * hardcoding, no internal IDs/secrets, Resend via existing infra, Resend
 * failure → controlled failure (tenant untouched by construction: the
 * sender performs zero database writes), token never logged.
 * Resend is injected (fake) — no real email is ever sent.
 *
 * Run: npx tsx tests/saas-activation-email.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildSaasActivationEmailHtml } from '../src/emails/saas-activation-email.js'
import {
  sendSaaSActivationEmail,
  buildActivationUrl,
  type ResendClientLike,
} from '../src/features/billing/lib/activation-email.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const TOKEN = 'tok_purchase_abc123'
const EXPIRES = new Date('2026-10-01T00:00:00.000Z')

function html() {
  return buildSaasActivationEmailHtml({
    firstName: 'Sara',
    plan: 'STARTER',
    activationUrl: 'https://app.example.com/sign-up?token=' + TOKEN,
    expiresAt: EXPIRES,
  })
}

function fakeClient(opts: { fail?: boolean; throws?: boolean; seen?: Array<Record<string, unknown>> } = {}): ResendClientLike {
  return {
    emails: {
      send: async (args: Record<string, unknown>) => {
        opts.seen?.push(args)
        if (opts.throws) throw new Error('smtp down')
        return { error: opts.fail ? { message: 'rejected' } : null }
      },
    },
  }
}

describe('SAAS EMAIL: template content', () => {
  it('correct recipient is used at send time', async () => {
    const seen: Array<Record<string, unknown>> = []
    const res = await sendSaaSActivationEmail(
      { to: 'sara@exemple.com', firstName: 'Sara', plan: 'STARTER', token: TOKEN },
      { client: fakeClient({ seen }) },
    )
    assert.equal(res.success, true)
    assert.equal(seen.length, 1)
    assert.equal(seen[0].to, 'sara@exemple.com')
  })

  it('first name and plan included', () => {
    const body = html()
    assert.ok(body.includes('Sara'), 'first name present')
    assert.ok(body.includes('Starter'), 'plan label present')
    assert.ok(body.includes('TUR'), 'branding present')
  })

  it('activation URL generated correctly from configured app URL', () => {
    const url = buildActivationUrl(TOKEN)
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    assert.ok(url.startsWith(base + '/sign-up?token=' + TOKEN), 'URL built from configured app URL + token path')
    const src = read('src/features/billing/lib/activation-email.ts')
    assert.ok(src.includes('process.env.NEXT_PUBLIC_APP_URL'), 'uses the existing app-URL convention')
    assert.ok(!src.includes('vercel.app') && !src.includes('traytio.ma'), 'no hardcoded production domain')
  })

  it('7-day expiration notice present', () => {
    const body = html()
    assert.ok(body.includes('1 octobre 2026') || body.includes('octobre'), 'expiry date rendered in French')
    assert.ok(body.includes('expire'), 'expiry notice wording')
  })

  it('no internal IDs or secrets exposed', () => {
    const body = html()
    for (const token of ['idempotency', 'clerkId', 'user_', 'org_', 'sub_', 'sk_', 'whsec', 'Bearer']) {
      assert.equal(body.toLowerCase().includes(token.toLowerCase()), false, `template must not contain ${token}`)
    }
    // Only the token inside the activation URL may appear.
    const withoutUrl = body.replace(/https?:\/\/\S+/g, '')
    assert.ok(!withoutUrl.includes(TOKEN), 'raw token appears only inside the URL')
  })
})

describe('SAAS EMAIL: sender behavior', () => {
  it('Resend called through existing infrastructure', async () => {
    const seen: Array<Record<string, unknown>> = []
    await sendSaaSActivationEmail(
      { to: 'sara@exemple.com', firstName: 'Sara', plan: 'PROFESSIONAL', token: TOKEN },
      { client: fakeClient({ seen }) },
    )
    assert.ok(String(seen[0].from).startsWith('TUR <'), 'existing TUR sender identity')
    assert.ok(String(seen[0].subject).length > 0, 'subject set')
    assert.ok(String(seen[0].html).includes('Professionnel'), 'professional plan label')
  })

  it('Resend failure returns a controlled failure', async () => {
    const rejected = await sendSaaSActivationEmail(
      { to: 'sara@exemple.com', firstName: 'Sara', plan: 'STARTER', token: TOKEN },
      { client: fakeClient({ fail: true }) },
    )
    assert.deepEqual(rejected.success, false)
    const threw = await sendSaaSActivationEmail(
      { to: 'sara@exemple.com', firstName: 'Sara', plan: 'STARTER', token: TOKEN },
      { client: fakeClient({ throws: true }) },
    )
    assert.deepEqual(threw.success, false)
  })

  it('provisioning data intact on email failure (sender writes nothing)', () => {
    const src = read('src/features/billing/lib/activation-email.ts')
    assert.ok(!src.includes('prisma'), 'sender performs zero database writes')
    assert.ok(!src.includes('purchaseClaim.update') && !src.includes('consum'), 'claim never consumed/invalidated here')
  })

  it('token and URL never logged', () => {
    const src = read('src/features/billing/lib/activation-email.ts')
    assert.ok(!src.includes('console.log'), 'no info logging of sensitive values')
    const logs = [...src.matchAll(/console\.\w+\(([^)]*)\)/g)].map((m) => m[1])
    for (const args of logs) {
      assert.ok(!args.includes('token') && !args.includes('Url') && !args.includes('html'), 'logs carry recipient only')
    }
  })

  it('team invitation email behavior preserved', () => {
    const src = read('src/emails/invitation-email.ts')
    assert.ok(src.includes('buildInvitationEmailHtml'), 'team template intact')
    const invite = read('src/features/team/actions/invite-member.ts')
    assert.ok(invite.includes('buildInvitationEmailHtml'), 'team flow still uses its template')
    assert.ok(!invite.includes('saas-activation') && !invite.includes('SaasActivation'), 'team flow untouched by SaaS email')
  })
})
