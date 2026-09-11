/**
 * S-2 Upload body-size limit enforcement — Unit Tests
 *
 * Finding S-2 (high): POST /api/upload protected its body size ONLY with the
 * client-controlled Content-Length header, then called `request.formData()`,
 * which buffers the entire multipart body before the per-file size checks run.
 * Forging a small Content-Length (or omitting it via chunked transfer) would
 * let an attacker push an arbitrarily large body into server memory.
 *
 * Fix:
 *   - src/lib/request-body-limit.ts (NEW shared helper): `readBodyWithLimit`
 *     consumes the raw request-body stream and counts ACTUAL bytes, aborting
 *     as soon as the cap is exceeded. The caller can never buffer more than
 *     `maxBytes` (+ one chunk), regardless of what the header claims.
 *   - src/app/api/upload/route.ts: keeps Content-Length only as an early
 *     rejection optimization, then enforces the authoritative cap via the
 *     streaming helper BEFORE any formData() parsing, and re-parses the
 *     bounded bytes through a reconstructed Request (same built-in multipart
 *     parser, same downstream validation).
 *
 * This file follows the tests/b01..s7 conventions: replicas + fs
 * source-contract checks — no @clerk/@cloudinary/@prisma imports, no DB,
 * no network.
 *
 * Run: npx tsx tests/s2-upload-body-size-limit.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Constants (faithful to route.ts) ─────────────────────────────────────────

const MAX_REQUEST_BYTES = 25 * 1024 * 1024 // 25 MB multipart ceiling
const MAX_SIZE_IMAGES = 10 * 1024 * 1024   // 10 MB
const MAX_SIZE_PDF = 20 * 1024 * 1024      // 20 MB

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.js', '.ts', '.jsx', '.tsx', '.vue',
  '.sh', '.bash', '.zsh', '.fish',
  '.php', '.py', '.rb', '.pl', '.pm',
  '.dll', '.so', '.dylib', '.bin',
  '.html', '.htm', '.svg', '.xml',
]

const ERR_TOO_LARGE = 'Fichier trop volumineux'
const ERR_NO_FILE = 'Aucun fichier fourni'

function hasBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase()
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

// ── Source-stream simulation ────────────────────────────────────────────────
// Generates a body of `totalBytes` in `chunkSize` pieces so tests can prove the
// reader stops pulling after the cap instead of consuming the whole payload.

async function* chunkStream(totalBytes: number, chunkSize: number): AsyncGenerator<Uint8Array> {
  let remaining = totalBytes
  while (remaining > 0) {
    const n = Math.min(chunkSize, remaining)
    remaining -= n
    yield new Uint8Array(n)
  }
}

// ── Replica of src/lib/request-body-limit.ts (readBodyWithLimit) ────────────

type BoundedOutcome = { ok: true; data: Uint8Array; pulled: number } | { ok: false; pulled: number }

async function readBounded(
  body: AsyncGenerator<Uint8Array> | null,
  maxBytes: number,
): Promise<BoundedOutcome> {
  if (maxBytes <= 0) return { ok: false, pulled: 0 }
  if (body === null) return { ok: true, data: new Uint8Array(0), pulled: 0 }
  const parts: Uint8Array[] = []
  let total = 0
  for await (const chunk of body) {
    total += chunk.byteLength
    if (total > maxBytes) {
      return { ok: false, pulled: total } // aborts without reading the rest
    }
    parts.push(chunk)
  }
  const data = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    data.set(p, off)
    off += p.byteLength
  }
  return { ok: true, data, pulled: total }
}

// ── Upload handler replica (faithful wiring of route.ts uploadApi) ──────────

interface ParsedFile {
  mime: string
  size: number
  name: string
}

interface UploadGate {
  authUserId: string | null
  orgId: string | null
  parseFile: (data: Uint8Array) => ParsedFile | null // formData().get('file')
  parseName: (data: Uint8Array) => string | null     // formData().get('name')
  cloudinaryCalls: number
}

interface UploadResult {
  status: number
  error?: string
  url?: string
  pulled?: number
}

async function uploadApiWire(
  declaredLength: number,
  rawBody: AsyncGenerator<Uint8Array> | null,
  gate: UploadGate,
): Promise<UploadResult> {
  if (!gate.authUserId) {
    return { status: 401, error: 'Non authentifié' }
  }

  if (!gate.orgId) {
    return { status: 403, error: 'Aucune organisation trouvée' }
  }

  // Early rejection optimization only — Content-Length is client-controlled.
  if (declaredLength > MAX_REQUEST_BYTES) {
    return { status: 413, error: ERR_TOO_LARGE, pulled: 0 } // body never read
  }

  // Authoritative cap: actual byte counting on the raw stream.
  const bounded = await readBounded(rawBody, MAX_REQUEST_BYTES)
  if (!bounded.ok) {
    return { status: 413, error: ERR_TOO_LARGE, pulled: bounded.pulled }
  }

  const file = gate.parseFile(bounded.data)
  if (!file) {
    return { status: 400, error: ERR_NO_FILE, pulled: bounded.pulled }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mime)) {
    return {
      status: 400,
      error: `Type de fichier non autorisé : ${file.mime}. Formats acceptés : JPEG, PNG, WebP, PDF`,
      pulled: bounded.pulled,
    }
  }

  if (file.mime === 'application/pdf' && file.size > MAX_SIZE_PDF) {
    return {
      status: 400,
      error: `Le fichier PDF dépasse la limite de ${MAX_SIZE_PDF / 1024 / 1024} MB`,
      pulled: bounded.pulled,
    }
  }

  if (file.mime.startsWith('image/') && file.size > MAX_SIZE_IMAGES) {
    return {
      status: 400,
      error: `L'image dépasse la limite de ${MAX_SIZE_IMAGES / 1024 / 1024} MB`,
      pulled: bounded.pulled,
    }
  }

  const fileName = gate.parseName(bounded.data)
  if (fileName && hasBlockedExtension(fileName)) {
    return { status: 400, error: 'Extension de fichier non autorisée', pulled: bounded.pulled }
  }

  // Cloudinary stand-in: the expensive step must not run on any rejected path.
  gate.cloudinaryCalls += 1
  return { status: 200, url: 'https://res.cloudinary.com/org/uploads/x', pulled: bounded.pulled }
}

function fakeGate(overrides: Partial<UploadGate> = {}): UploadGate {
  return {
    authUserId: 'user_1',
    orgId: 'org_a',
    parseFile: (data) => (data.byteLength > 0 ? { mime: 'image/png', size: 2048, name: 'logo.png' } : null),
    parseName: () => 'logo.png',
    cloudinaryCalls: 0,
    ...overrides,
  }
}

// ── 1. SOURCE CONTRACT ───────────────────────────────────────────────────────

describe('S-2 SOURCE CONTRACT: upload body-size enforcement', () => {
  const helperSrc = readFileSync(resolve(SRC_ROOT, 'lib/request-body-limit.ts'), 'utf8')
  const routeSrc = readFileSync(resolve(SRC_ROOT, 'app/api/upload/route.ts'), 'utf8')

  it('defines the shared streaming helper readBodyWithLimit in src/lib', () => {
    assert.ok(helperSrc.includes('export async function readBodyWithLimit('),
      'shared reusable helper must exist in src/lib/request-body-limit.ts')
    assert.ok(helperSrc.includes('getReader()'), 'helper must consume the raw body stream')
    assert.ok(helperSrc.includes('total > maxBytes'), 'helper must abort when ACTUAL bytes exceed the cap')
    assert.ok(helperSrc.includes('await reader.cancel()'), 'helper must cancel the stream on overflow')
  })

  it('route imports and uses the shared helper', () => {
    assert.ok(routeSrc.includes("import { readBodyWithLimit } from '@/lib/request-body-limit'"),
      'route must import the shared helper (no duplicated logic)')
    assert.ok(routeSrc.includes('readBodyWithLimit(request.body, MAX_REQUEST_BYTES)'),
      'route must enforce the cap on the RAW request body stream')
  })

  it('never calls formData() on the raw client request before the cap', () => {
    assert.ok(!routeSrc.includes('await request.formData()'),
      'raw request.formData() must NOT appear (would buffer before the cap)')
    const capIdx = routeSrc.indexOf('readBodyWithLimit(request.body')
    const parseIdx = routeSrc.indexOf('await boundedRequest.formData()')
    assert.ok(capIdx !== -1 && parseIdx !== -1 && capIdx < parseIdx,
      'bounded read must run strictly before any multipart parsing')
  })

  it('still supports Content-Length only as an early optimization, never the sole gate', () => {
    assert.ok(routeSrc.includes('request.headers.get("content-length")'),
      'Content-Length fast path may exist')
    assert.ok(routeSrc.includes('readBodyWithLimit(request.body'),
      'but the authoritative cap on actual bytes must also exist')
    const clIdx = routeSrc.indexOf('content-length')
    const blIdx = routeSrc.indexOf('readBodyWithLimit(request.body')
    assert.ok(clIdx !== -1 && blIdx !== -1,
      'both gates present: header optimization + stream counting enforcement')
  })

  it('re-injects the bounded bytes into a reconstructed Request for parsing', () => {
    assert.ok(routeSrc.includes('new Request(request.url'), 'must rebuild a Request from the bounded buffer')
    assert.ok(routeSrc.includes('body: boundedBody.data'), 'rebuilt body must be the bounded bytes')
    assert.ok(routeSrc.includes('boundedHeaders.delete("content-length")'),
      'stale client-controlled Content-Length is dropped from the rebuilt request')
  })

  it('preserves auth, org scoping, rate limiting, validation and Cloudinary behavior', () => {
    assert.ok(routeSrc.includes('const { userId } = await auth()'), 'authentication preserved')
    assert.ok(routeSrc.includes('const organizationId = await getOrganizationId()'), 'tenant resolution preserved')
    assert.ok(routeSrc.includes('withApiGuard(uploadApi)'), 'api guard (upload rate-limiter) preserved')
    assert.ok(routeSrc.includes("'application/pdf'"), 'PDF per-file limit preserved')
    assert.ok(routeSrc.includes('MAX_SIZE_PDF') && routeSrc.includes('MAX_SIZE_IMAGES'), 'per-file limits preserved')
    assert.ok(routeSrc.includes('ALLOWED_MIME_TYPES'), 'MIME validation preserved')
    assert.ok(routeSrc.includes('hasBlockedExtension'), 'extension blocklist preserved')
    assert.ok(routeSrc.includes('cloudinary.uploader.upload'), 'Cloudinary upload preserved')
    assert.ok(routeSrc.includes('organizations/${organizationId}/uploads'), 'org-scoped Cloudinary folder preserved')
  })

  it('covers every upload route (only one route handler consumes multipart bodies)', () => {
    const apiRoot = resolve(SRC_ROOT, 'app/api')
    const stack = [apiRoot]
    const multipartRoutes: string[] = []
    while (stack.length > 0) {
      const dir = stack.pop()!
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) stack.push(full)
        else if (entry.name.endsWith('.ts') && entry.name.includes('route')) {
          const src = readFileSync(full, 'utf8')
          if (src.includes('formData(')) multipartRoutes.push(join('src/app/api', full.slice(apiRoot.length + 1)).replace(/\\/g, '/'))
        }
      }
    }
    assert.deepEqual(multipartRoutes, ['src/app/api/upload/route.ts'],
      `exactly one multipart route must exist and be protected, found: ${multipartRoutes.join(', ') || 'none'}`)
    assert.ok(routeSrc.includes('readBodyWithLimit'), 'the sole multipart route uses the shared helper')
  })
})

// ── 2. BEHAVIOR: the effective limit cannot be bypassed ──────────────────────

describe('S-2 BEHAVIOR: oversized upload streams are rejected before processing', () => {
  it('an oversized body with declared Content-Length is rejected before the body is read', async () => {
    const gate = fakeGate()
    const res = await uploadApiWire(30 * 1024 * 1024, chunkStream(60 * 1024 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 413)
    assert.equal(res.error, ERR_TOO_LARGE)
    assert.equal(res.pulled, 0, 'no bytes of the body were read')
    assert.equal(gate.cloudinaryCalls, 0, 'expensive upload processing never ran')
  })

  it('a forged TINY Content-Length cannot bypass the effective cap (actual bytes counted)', async () => {
    const gate = fakeGate()
    // Client declares 10 bytes but streams 60 MB (chunked-style attack).
    const res = await uploadApiWire(10, chunkStream(60 * 1024 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 413)
    assert.equal(res.error, ERR_TOO_LARGE)
    assert.ok(res.pulled! < 60 * 1024 * 1024,
      `reader stopped at ${res.pulled} bytes instead of buffering the whole 60 MB body`)
    assert.ok(res.pulled! <= MAX_REQUEST_BYTES + 1024 * 1024,
      'stream was aborted as soon as the cap was crossed (+ one chunk)')
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('a MISSING Content-Length (chunked transfer) cannot bypass the effective cap', async () => {
    const gate = fakeGate()
    const res = await uploadApiWire(0, chunkStream(60 * 1024 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 413)
    assert.equal(res.error, ERR_TOO_LARGE)
    assert.ok(res.pulled! < 60 * 1024 * 1024, `aborted at ${res.pulled} bytes, not 60 MB`)
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('an oversized body that exactly exceeds the cap by one byte is rejected', async () => {
    const gate = fakeGate()
    const res = await uploadApiWire(0, chunkStream(MAX_REQUEST_BYTES + 1, 64 * 1024), gate)
    assert.equal(res.status, 413)
    assert.equal(res.error, ERR_TOO_LARGE)
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('a declared length exactly at the cap still passes through to actual counting', async () => {
    const gate = fakeGate()
    const res = await uploadApiWire(MAX_REQUEST_BYTES, chunkStream(2048, 1024), gate)
    assert.equal(res.status, 200)
    assert.equal(gate.cloudinaryCalls, 1, 'boundary-length request is not rejected by the optimization')
  })
})

// ── 3. BEHAVIOR: valid uploads and existing validation still work ────────────

describe('S-2 BEHAVIOR: valid uploads and downstream validation are intact', () => {
  it('a valid small upload reaches Cloudinary', async () => {
    const gate = fakeGate()
    const res = await uploadApiWire(0, chunkStream(2048, 1024), gate)
    assert.equal(res.status, 200)
    assert.ok(res.url!.startsWith('https://res.cloudinary.com/'), 'returns the Cloudinary URL')
    assert.equal(gate.cloudinaryCalls, 1, 'upload happened exactly once')
    assert.equal(res.pulled, 2048, 'fully read the small bounded body')
  })

  it('MIME validation still rejects a disallowed type before Cloudinary', async () => {
    const gate = fakeGate({ parseFile: () => ({ mime: 'text/html', size: 100, name: 'page.html' }) })
    const res = await uploadApiWire(0, chunkStream(100, 64), gate)
    assert.equal(res.status, 400)
    assert.match(res.error!, /Type de fichier non autorisé : text\/html/)
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('the per-file PDF limit (20 MB) still applies after the body cap', async () => {
    const gate = fakeGate({ parseFile: () => ({ mime: 'application/pdf', size: 21 * 1024 * 1024, name: 'doc.pdf' }) })
    // 21 MB file + multipart overhead stays under the 25 MB body cap, so the
    // per-file check — not the 413 — is what fires.
    const res = await uploadApiWire(0, chunkStream(21 * 1024 * 1024 + 512 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 400)
    assert.match(res.error!, /Le fichier PDF dépasse la limite de 20 MB/)
    assert.equal(gate.cloudinaryCalls, 0, 'per-file limit rejection is distinct from the 413 cap')
  })

  it('the per-file image limit (10 MB) still applies after the body cap', async () => {
    const gate = fakeGate({ parseFile: () => ({ mime: 'image/png', size: 11 * 1024 * 1024, name: 'big.png' }) })
    const res = await uploadApiWire(0, chunkStream(11 * 1024 * 1024 + 256 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 400)
    assert.match(res.error!, /L'image dépasse la limite de 10 MB/)
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('the extension blocklist still rejects a disallowed file name', async () => {
    const gate = fakeGate({ parseName: () => 'payload.ts' })
    const res = await uploadApiWire(0, chunkStream(100, 64), gate)
    assert.equal(res.status, 400)
    assert.equal(res.error, 'Extension de fichier non autorisée')
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('a request without a file field is still rejected as "Aucun fichier fourni"', async () => {
    const gate = fakeGate({ parseFile: () => null })
    const res = await uploadApiWire(0, chunkStream(100, 64), gate)
    assert.equal(res.status, 400)
    assert.equal(res.error, ERR_NO_FILE)
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('authentication still runs first (401 before any body read)', async () => {
    const gate = fakeGate({ authUserId: null })
    const res = await uploadApiWire(0, chunkStream(60 * 1024 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 401)
    assert.equal(res.error, 'Non authentifié')
    assert.equal(res.pulled, undefined, 'no upstream result — body never read')
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('tenant resolution still runs (403 without an organization)', async () => {
    const gate = fakeGate({ orgId: null })
    const res = await uploadApiWire(0, chunkStream(60 * 1024 * 1024, 1024 * 1024), gate)
    assert.equal(res.status, 403)
    assert.equal(res.error, 'Aucune organisation trouvée')
    assert.equal(gate.cloudinaryCalls, 0)
  })

  it('an empty body is accepted by the reader but rejected for missing file (400, not 413)', async () => {
    const gate = fakeGate()
    const res = await uploadApiWire(0, null, gate)
    assert.equal(res.status, 400)
    assert.equal(res.error, ERR_NO_FILE)
    assert.equal(gate.cloudinaryCalls, 0)
  })
})