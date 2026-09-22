/**
 * No public self-registration — regression tests.
 *
 * Business rule: Traytio accounts are created via team invitation (existing
 * members) or, in the future, post-purchase provisioning — never via a
 * public sign-up CTA. The login page must not offer registration, and bare
 * /sign-up visits redirect to /sign-in, while the invitation/activation
 * chain (accept-invite → /sign-up?token → fallback) keeps working.
 *
 * Conventions: fs source-contract checks + tiny gate replica — no
 * @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/auth-no-public-signup.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

// Replica of the /sign-up route gate decision.
function signUpGate(searchParams: { token?: string }): 'render' | 'redirect:/sign-in' {
  if (!searchParams.token) return 'redirect:/sign-in'
  return 'render'
}

describe('AUTH NO-PUBLIC-SIGNUP: login page', () => {
  it('1. sign-in page hides the public sign-up footer row', () => {
    const src = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(src.includes('footerAction'), 'touches the footer action row')
    assert.ok(src.includes('display: "none"') || src.includes("display: 'none'"), 'hides it')
  })

  it('1b. shared Clerk appearance is not weakened for other pages', () => {
    const shared = read('src/features/auth/lib/clerk-appearance.ts')
    assert.ok(shared.includes('footerActionLink'), 'SignUp-page link styling preserved')
    const signIn = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(signIn.includes('...authAppearance'), 'base appearance still spread in')
    assert.ok(signIn.includes('...authAppearance.elements'), 'base elements still spread in')
  })

  it('3. normal login still renders (SignIn untouched otherwise)', () => {
    const src = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(src.includes('<SignIn'), 'SignIn component present')
  })

  it('4. forgot-password affordance untouched (formFieldAction preserved)', () => {
    const shared = read('src/features/auth/lib/clerk-appearance.ts')
    assert.ok(shared.includes('formFieldAction'), 'forgot-password styling preserved in shared theme')
    const signIn = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(!/formFieldAction\s*:/.test(signIn), 'sign-in override does not restyle it')
  })
})

describe('AUTH NO-PUBLIC-SIGNUP: /sign-up route gate', () => {
  it('2. bare /sign-up redirects to /sign-in', () => {
    assert.equal(signUpGate({}), 'redirect:/sign-in')
    const src = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    assert.ok(src.includes('redirect("/sign-in")'), 'route redirects bare visits')
  })

  it('2b. invitation token renders the activation form', () => {
    assert.equal(signUpGate({ token: 'abc' }), 'render')
    const src = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    assert.ok(src.includes('<SignUp'), 'SignUp renders for invited users')
    assert.ok(
      src.includes('fallbackRedirectUrl') && src.includes('/accept-invite?token='),
      'post-signup returns to the invitation flow',
    )
  })

  it('2c. /sign-up delisted from sitemap (no SEO entry point)', () => {
    const src = read('src/app/sitemap.ts')
    assert.ok(!src.includes('/sign-up'), 'sign-up removed from sitemap')
    assert.ok(src.includes('/sign-in'), 'sign-in still listed')
  })
})

describe('AUTH NO-PUBLIC-SIGNUP: invitation chain preserved', () => {
  it('5/6. accept-invite links new users into the token-gated sign-up', () => {
    const src = read('src/app/accept-invite/accept-invite-client.tsx')
    assert.ok(src.includes('/sign-up?token='), 'invite page passes its token to sign-up')
    assert.ok(src.includes('SignInButton'), 'existing-account sign-in path kept')
    assert.ok(!src.includes('SignUpButton'), 'unparameterized Clerk sign-up entry removed')
  })

  it('5/6b. server-side invite validation untouched', () => {
    const src = read('src/features/team/actions/accept-invite.ts')
    assert.ok(src.includes('invitation.email'), 'email-match gate present')
  })

  it('7. Clerk user-provisioning webhook untouched', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes('user.created'), 'provisioning trigger present')
    assert.ok(src.includes('role: OrgRole.OWNER'), 'owner membership creation present')
  })

  it('8. Lemon Squeezy webhook has no signup/provisioning code added', () => {
    const src = read('src/app/api/webhooks/lemonsqueezy/route.ts')
    assert.ok(!src.includes('clerkClient'), 'no Clerk user creation smuggled in')
    assert.ok(!src.includes('/sign-up'), 'no signup redirect logic in billing webhook')
  })
})

describe('AUTH SPLIT COMPOSITION: Traytio-native 21st-style layout', () => {
  it('sign-in page renders the dedicated SignInView (no marketing column)', () => {
    const src = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(src.includes('<SignInView'), 'sign-in uses the dedicated view')
    assert.ok(src.includes('<SignIn'), 'Clerk SignIn still rendered')
    assert.ok(src.includes('footerAction'), 'sign-up CTA stays hidden')
    assert.ok(!src.includes('AuthLayout'), 'split marketing layout not used on sign-in')
    assert.ok(!src.includes('BrandPanel'), 'no hero on sign-in')
  })

  it('single visible title: ours in the column, Clerk native header hidden on sign-in only', () => {
    const view = read('src/features/auth/components/signin-view.tsx')
    assert.ok(view.includes('Se connecter'), 'column carries the one H1')
    assert.ok(view.includes('Accédez à votre espace de gestion.'), 'column subtitle present')
    const page = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(page.includes('headerTitle: { display: "none" }'), 'Clerk native title hidden on sign-in')
    assert.ok(page.includes('headerSubtitle: { display: "none" }'), 'Clerk native subtitle hidden on sign-in')
  })

  it('visual panel is Traytio-native (no reference content)', () => {
    const view = read('src/features/auth/components/signin-view.tsx')
    assert.ok(view.includes('DashboardMockup'), 'reuses the Traytio mockup')
    assert.ok(view.includes('Pilotez vos événements'), 'Traytio statement present')
    for (const banned of ['Charlotte', 'SolaceUI', 'solaceui.com', 'Sign up with', 'InputField']) {
      assert.ok(!view.includes(banned), `no reference content (${banned})`)
    }
    assert.ok(!view.includes('FlutedGlass') && !view.includes('paper-design'), 'no shader dependency')
  })

  it('form follows the subtitle with tight, intentional spacing', () => {
    const view = read('src/features/auth/components/signin-view.tsx')
    assert.ok(view.includes('<div className="mt-6">{children}</div>'), '24px wrapper gap, no dead space')
    assert.ok(view.includes('max-w-[440px]'), 'form zone still bounded at 440px')
    assert.ok(view.includes('hidden lg:block'), 'visual panel desktop-only')
    assert.ok(view.includes('grid-cols-1'), 'single column on mobile')
    const page = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(page.includes('header: { marginBottom: "0" }'), 'hidden header container contributes no margin')
  })
  it('sign-up page keeps the split layout with BrandPanel', () => {
    const signUp = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    assert.ok(!signUp.includes('SignInView'), 'sign-up does not use the sign-in view')
    const layout = read('src/features/auth/components/auth-layout.tsx')
    assert.ok(layout.includes('<BrandPanel />'), 'BrandPanel preserved for split mode')
  })

  it('Clerk card is chromeless only on sign-in (shared theme keeps its card)', () => {
    const page = read('src/app/sign-in/[[...sign-in]]/page.tsx')
    assert.ok(page.includes('backgroundColor: "transparent"'), 'sign-in flattens the Clerk card into its container')
    const shared = read('src/features/auth/lib/clerk-appearance.ts')
    assert.ok(shared.includes('footerActionLink'), 'shared theme intact for other surfaces')
  })
})

describe('AUTH CLERK INPUT: identifiable premium field', () => {
  const src = () => read('src/features/auth/lib/clerk-appearance.ts')

  it('input has explicit ivory background, visible border, radius and 52px height', () => {
    const s = src()
    assert.ok(s.includes('backgroundColor: "#F7F4EE"'), 'warm ivory field, distinct from the page')
    assert.ok(s.includes('border: "1px solid #BDB5A8"'), 'visible 1px border')
    assert.ok(s.includes('borderRadius: "0.75rem"'), '12px radius')
    assert.ok(s.includes('height: "3.25rem"'), '52px height')
    assert.ok(s.includes('minHeight: "3.25rem"'), 'min-height guards against collapse')
    assert.ok(s.includes('padding: "0 1rem"'), '16px horizontal padding')
    assert.ok(s.includes('boxShadow: "0 1px 4px rgba(0,0,0,0.05)"'), 'subtle depth')
  })

  it('input text and placeholder colors guarantee readability', () => {
    const s = src()
    assert.ok(s.includes('color: "#171717"'), 'dark input text')
    assert.ok(s.includes('color: "#66615A"'), 'readable warm-gray placeholder')
  })

  it('focus state brightens to white with gold border, no browser blue', () => {
    const s = src()
    assert.ok(s.includes('backgroundColor: "#FFFFFF"'), 'focus brightens the field')
    assert.ok(s.includes('borderColor: "#C9A96E"'), 'gold focus border')
    assert.ok(s.includes('boxShadow: "0 0 0 3px rgba(200,155,65,0.14)"'), 'soft gold focus ring')
  })

  it('label keeps 14px medium dark rhythm above the input', () => {
    const s = src()
    assert.ok(s.includes('fontWeight: 500'), 'medium label preserved')
    assert.ok(s.includes('marginBottom: "0.5rem"'), '8px label-to-input spacing')
  })

  it('no appearance rule strips the input (transparent/borderless/collapsed)', () => {
    const s = src()
    assert.ok(!s.includes('background: "transparent"') || s.includes('backgroundColor: "#ffffff"'), 'no transparent override wins')
    assert.ok(!/formFieldInput: \{[^}]*border:\s*"none"/.test(s), 'no border:none on the input')
  })
})
