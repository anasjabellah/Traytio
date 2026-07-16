import { COMMON } from "@/lib/notify/messages/common";
import { ZodError } from "zod";

/**
 * Normalizes an unexpected exception into a client-safe error message.
 *
 * - Known/safe messages (Zod validation) are preserved (already client-friendly).
 * - Any other error (DB failures, network, serialization, raw `Error.message`)
 *   is logged server-side and replaced with the provided safe fallback so that
 *   internal details are never leaked to the client.
 */
export function normalizeActionError(
  e: unknown,
  fallback: string = COMMON.UNEXPECTED_ERROR,
): string {
  if (e instanceof ZodError) {
    return e.issues[0]?.message ?? fallback;
  }

  console.error("[action-error]", e);

  return fallback;
}
