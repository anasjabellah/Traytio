import { z } from "zod";
import { assertBillingEnvSafe, resolveBillingEnv } from "@/features/billing/lib/billing-env";

/**
 * Centralized environment validation (P0 env cleanup).
 *
 * SECURITY:
 * - Never log secret values.
 * - Validation errors contain only variable names + safe explanations.
 * - Server secrets are never exposed through public env.
 * - No NEXT_PUBLIC_ secret is allowed.
 *
 * USAGE:
 * - Server-only code: import { serverEnv } or validateServerEnv()
 * - Client-safe code: import { publicEnv } (only NEXT_PUBLIC_ vars)
 * - Do NOT import serverEnv in client components.
 *
 * Next.js compatibility:
 * - Validation is lazy and production-strict only when VERCEL_ENV=production.
 * - Local `npm run build` (NODE_ENV=production but VERCEL_ENV!=production)
 *   remains sandbox-friendly and does NOT require live ChariPay keys.
 */

function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === "production";
}

// ---------------------------------------------------------------------------
// Public (browser-safe) schema — ONLY NEXT_PUBLIC_ vars.
// ---------------------------------------------------------------------------

const publicEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1).default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1).default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().min(1).default("/dashboard"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().min(1).default("/dashboard"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_APP_URL is required")
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "NEXT_PUBLIC_APP_URL must be a valid URL"),
});

// ---------------------------------------------------------------------------
// Server-only schema — private vars.
// Most are optional in development to keep local build/test working.
// In Vercel production, critical vars are required (fail fast).
// ---------------------------------------------------------------------------

const serverEnvSchemaBase = z.object({
  DATABASE_URL: z.string().min(1).optional().or(z.literal("")),
  DIRECT_URL: z.string().min(1).optional().or(z.literal("")),
  CLERK_SECRET_KEY: z.string().min(1).optional().or(z.literal("")),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional().or(z.literal("")),
  CLERK_TEST_PUBLISHABLE_KEY: z.string().optional().or(z.literal("")),
  CLERK_TEST_SECRET_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  CLOUDINARY_API_KEY: z.string().optional().or(z.literal("")),
  CLOUDINARY_API_SECRET: z.string().optional().or(z.literal("")),
  RESEND_API_KEY: z.string().optional().or(z.literal("")),
  RESEND_FROM_EMAIL: z.string().optional().or(z.literal("")),
  CHARIPAY_API_KEY: z.string().optional().or(z.literal("")),
  CHARIPAY_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  BILLING_ENV: z.enum(["sandbox", "production"]).optional().or(z.literal("")),
  UPSTASH_REDIS_REST_URL: z.string().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),
  // Legacy Lemon Squeezy — optional, not required
  LEMON_SQUEEZY_API_KEY: z.string().optional().or(z.literal("")),
  LEMON_SQUEEZY_STORE_ID: z.string().optional().or(z.literal("")),
  LEMON_SQUEEZY_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  LEMON_SQUEEZY_STARTER_VARIANT_ID: z.string().optional().or(z.literal("")),
  LEMON_SQUEEZY_PROFESSIONAL_VARIANT_ID: z.string().optional().or(z.literal("")),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchemaBase> & { BILLING_ENV?: string };

function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

/**
 * Validate public (browser-safe) env. Throws on missing/invalid.
 * Safe to call in any context (server or client).
 */
export function validatePublicEnv(env: Record<string, string | undefined> = process.env): PublicEnv {
  const parsed = publicEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid public environment: ${formatZodError(parsed.error)}`);
  }
  return parsed.data as PublicEnv;
}

/**
 * Validate server env. In development/test, most vars are optional.
 * In Vercel production (VERCEL_ENV=production), critical vars are required
 * and BILLING_ENV must be explicitly "production" with a live ChariPay key.
 */
export function validateServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = serverEnvSchemaBase.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${formatZodError(parsed.error)}`);
  }
  const data = parsed.data as ServerEnv;

  if (isProductionDeploy()) {
    const missing: string[] = [];
    if (!data.DATABASE_URL) missing.push("DATABASE_URL");
    if (!data.DIRECT_URL) missing.push("DIRECT_URL");
    if (!data.CLERK_SECRET_KEY) missing.push("CLERK_SECRET_KEY");
    if (!data.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!data.CHARIPAY_API_KEY) missing.push("CHARIPAY_API_KEY");
    if (!data.CHARIPAY_WEBHOOK_SECRET) missing.push("CHARIPAY_WEBHOOK_SECRET");
    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }
    // BILLING_ENV must be explicitly production — never silently default to sandbox in prod
    if (data.BILLING_ENV !== "production") {
      throw new Error("BILLING_ENV must be explicitly set to 'production' in production deployment");
    }
    // Validate ChariPay live key matches production env (fail closed, no secret logged)
    assertBillingEnvSafe(data.CHARIPAY_API_KEY!, { BILLING_ENV: "production", NODE_ENV: "production" });
    // App URL must be production Vercel URL, not localhost
    const appUrl = (env as Record<string, string | undefined>).NEXT_PUBLIC_APP_URL;
    if (appUrl && appUrl.includes("localhost")) {
      throw new Error("NEXT_PUBLIC_APP_URL must not be localhost in production");
    }
  }

  return data;
}

/**
 * Validate both public and server env together.
 * In production, also validates billing env consistency.
 */
export function validateEnv(env: Record<string, string | undefined> = process.env): {
  public: PublicEnv;
  server: ServerEnv;
} {
  const pub = validatePublicEnv(env);
  const srv = validateServerEnv(env);
  return { public: pub, server: srv };
}

// Lazy validated exports — validated on first access, cached thereafter.
// Server env validation is NOT run at import time in non-production to keep
// `npm run build` working locally with sandbox credentials.
export const publicEnv: PublicEnv = new Proxy({} as PublicEnv, {
  get(_target, prop) {
    if (!cachedPublicEnv) cachedPublicEnv = validatePublicEnv();
    return (cachedPublicEnv as unknown as Record<string, unknown>)[prop as string];
  },
});

export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    if (!cachedServerEnv) cachedServerEnv = validateServerEnv();
    return (cachedServerEnv as unknown as Record<string, unknown>)[prop as string];
  },
});

// Helpers for critical paths that want explicit validation without proxy
export function getPublicEnv(): PublicEnv {
  if (!cachedPublicEnv) cachedPublicEnv = validatePublicEnv();
  return cachedPublicEnv;
}

export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) cachedServerEnv = validateServerEnv();
  return cachedServerEnv;
}
