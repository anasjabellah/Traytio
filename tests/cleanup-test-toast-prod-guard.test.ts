/**
 * Cleanup — /test-toast must never be served in production
 *
 * The page is a dev-only notification playground. It is already excluded from
 * indexing (robots meta + robots.txt disallow), but it was still directly
 * reachable at /test-toast on a production deploy.
 *
 * Guard added: the page server-renders `notFound()` unless running under a
 * development server (`process.env.NODE_ENV !== "development"`), the same gate
 * already used by lib/log-timer.ts, lib/resend.ts, prisma/seed.ts, etc.
 *
 * These source-contract checks (repo convention: no DB, no @clerk/@prisma
 * imports) prove the page cannot be served outside development builds.
 *
 * Run: npx tsx tests/cleanup-test-toast-prod-guard.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

function listSrcFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...listSrcFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const toastPage = readFileSync(resolve(SRC_ROOT, 'app', 'test-toast', 'page.tsx'), 'utf8')

describe('src/app/test-toast — production exposure guard', () => {
  it('renders notFound() outside of development environments', () => {
    assert.match(toastPage, /notFound\s*\(\s*\)/, 'page must call notFound()')
    assert.match(
      toastPage,
      /process\.env\.NODE_ENV\s*!==\s*["']development["']/,
      'page must gate on NODE_ENV !== "development"',
    )
    assert.doesNotMatch(
      toastPage,
      /return\s+<TestToastClient\s*\/>\s*;[\s\S]*process\.env\.NODE_ENV/,
      'the return must come after the guard, never before it',
    )
  })

  it('still serves the client component under a development server', () => {
    assert.match(toastPage, /return\s+<TestToastClient\s*\/>/, 'dev path must render the tester')
  })

  it('is disallowed for crawlers in robots.txt', () => {
    const robots = readFileSync(resolve(SRC_ROOT, 'app', 'robots.ts'), 'utf8')
    assert.match(robots, /["']\/test-toast["']/, 'robots.ts must keep disallowing /test-toast')
  })

  it('is not linked from any other route/component in src', () => {
    const offenders = listSrcFiles(SRC_ROOT).filter((file) => {
      if (file.includes('test-toast') || file.endsWith('robots.ts')) return false
      const content = readFileSync(file, 'utf8')
      return content.includes('/test-toast') || content.includes('href="/test-toast"') || content.includes("pathname === '/test-toast'")
    })
    assert.deepEqual(
      offenders,
      [],
      `Unexpected /test-toast references: ${offenders.join(', ')}`,
    )
  })
})