// src/lib/request-body-limit.ts
//
// Shared streaming body-size guard for route handlers.
//
// Content-Length is client-controlled and MUST NOT be treated as the
// authoritative limit: an attacker can omit it (chunked transfer) or forge a
// small value while sending an arbitrarily large body. `request.formData()`
// (and `text()`/`json()`) buffer the entire body in memory first, so a
// Content-Length-only gate is a memory-exhaustion DoS risk.
//
// This helper consumes the raw request body stream and counts ACTUAL bytes,
// aborting the read (and returning `{ ok: false }`) as soon as the cap is
// exceeded. The caller can therefore never buffer more than `maxBytes` (+ one
// chunk) of the raw body, regardless of what the client declares. Callers
// re-inject the bounded buffer into a new Request, so a forged or missing
// Content-Length cannot bypass the effective limit.

export type BoundedBodyResult = { ok: true; data: Uint8Array<ArrayBuffer> } | { ok: false };

/**
 * Read the request body stream, aborting as soon as more than `maxBytes`
 * of actual bytes have been pulled. Returns the bounded bytes on success.
 *
 * - `body === null` (no request body): treated as an empty, valid body.
 * - `maxBytes <= 0`: refuses to read (nothing may be accepted).
 * - A read error is propagated for the caller to map to its generic error
 *   path — it is not the same as "too large".
 */
export async function readBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<BoundedBodyResult> {
  if (maxBytes <= 0) return { ok: false };
  if (body === null) return { ok: true, data: new Uint8Array(0) };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (chunks.length === 0) return { ok: true, data: new Uint8Array(0) };

  const data = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, data };
}