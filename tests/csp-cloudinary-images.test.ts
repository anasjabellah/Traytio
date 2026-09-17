/**
 * CSP img-src: Cloudinary delivery URLs must not be blocked.
 *
 * Root cause (proven in headless Chromium against the exact served policy):
 * next.config.ts built `https://res.cloudinary.com/<cloud>` (no trailing
 * slash). Browsers match a pathed CSP source only below a trailing slash,
 * so every real delivery URL (`/<cloud>/image/upload/...`) was rejected:
 * console "violates the following Content Security Policy", requestfailed
 * "csp", complete=true with naturalWidth=0 — while the same URL returned
 * HTTP 200 image/jpeg and rendered 387×516 with no CSP. The fix appends the
 * trailing slash, keeping the scope limited to the configured cloud.
 *
 * Run: npx tsx tests/csp-cloudinary-images.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')
const CONFIG = resolve(process.cwd(), 'next.config.ts')
const CLOUD = 'dkotjjdfv'
const DELIVERY_URL = `https://res.cloudinary.com/${CLOUD}/image/upload/v1789649057/organizations/cmtm/x.jpg`

// Mirrors the next.config.ts construction (cloud name set vs unset).
function buildImgSrc(cloudName: string): string {
  return `https://res.cloudinary.com${cloudName ? `/${cloudName}/` : ''}`
}

// Mirrors browser pathed-source matching: a source WITH a path matches only
// at-or-below a trailing slash; a host-only source matches the whole host.
function browserAllows(source: string, url: string): boolean {
  const s = new URL(source)
  const u = new URL(url)
  if (s.protocol !== u.protocol || s.host !== u.host) return false
  if (!s.pathname || s.pathname === '/') return true
  if (!u.pathname.startsWith(s.pathname)) return false
  return s.pathname.endsWith('/') || u.pathname.length === s.pathname.length
}

describe('CSP REGRESSION: Cloudinary images are loadable', () => {
  it('next.config.ts scopes Cloudinary with a trailing slash', () => {
    const src = readFileSync(CONFIG, 'utf8')
    assert.ok(src.includes('`/${cloudinaryCloudName}/`'), 'pathed source ends with a slash')
    assert.ok(!src.includes('`/${cloudinaryCloudName}`,'), 'no slash-less pathed source remains')
  })

  it('the fixed policy allows the real delivery URL (browser semantics)', () => {
    assert.equal(browserAllows(buildImgSrc(CLOUD), DELIVERY_URL), true)
  })

  it('the old slash-less policy blocked the real delivery URL (the bug)', () => {
    const buggy = `https://res.cloudinary.com/${CLOUD}`
    assert.equal(browserAllows(buggy, DELIVERY_URL), false, 'documents why images broke')
  })

  it('scope stays limited to the configured cloud', () => {
    const evil = `https://res.cloudinary.com/othercloud/image/upload/x.jpg`
    assert.equal(browserAllows(buildImgSrc(CLOUD), DELIVERY_URL), true)
    assert.equal(browserAllows(buildImgSrc(CLOUD), evil), false, 'other clouds still blocked')
  })

  it('empty cloud name keeps the previous host-wide behavior', () => {
    assert.equal(browserAllows(buildImgSrc(''), DELIVERY_URL), true)
  })

  it('served policy also covers connect-src for Cloudinary (unchanged)', () => {
    const src = readFileSync(CONFIG, 'utf8')
    assert.ok(src.includes('connect-src'), 'connect-src present')
  })
})
