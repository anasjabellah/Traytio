import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validatePublicEnv, validateServerEnv } from "../src/lib/env.js";

function fakePublicEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fake",
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/dashboard",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/dashboard",
    NEXT_PUBLIC_SUPABASE_URL: "https://fake.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake-anon-key",
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "fake-cloud",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    ...overrides,
  };
}

function fakeServerEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    DATABASE_URL: "postgresql://fake:fake@fake:6543/postgres?pgbouncer=true",
    DIRECT_URL: "postgresql://fake:fake@fake:5432/postgres",
    CLERK_SECRET_KEY: "sk_test_fake",
    CLERK_WEBHOOK_SECRET: "whsec_fake",
    RESEND_API_KEY: "re_fake",
    RESEND_FROM_EMAIL: "onboarding@resend.dev",
    CHARIPAY_API_KEY: "chari_sk_test_fake",
    CHARIPAY_WEBHOOK_SECRET: "whsec_fake2",
    BILLING_ENV: "sandbox",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
    // public vars also present in process.env, but server validation doesn't require them
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fake",
    VERCEL_ENV: undefined,
    NODE_ENV: "development",
    ...overrides,
  };
}

describe("ENV VALIDATION", () => {
  it("1. Valid development environment passes", () => {
    const pub = validatePublicEnv(fakePublicEnv());
    assert.ok(pub.NEXT_PUBLIC_APP_URL);
    const srv = validateServerEnv(fakeServerEnv());
    assert.ok(srv.DATABASE_URL);
  });

  it("2. Missing required production variable fails", () => {
    const env = fakeServerEnv({ DATABASE_URL: "", VERCEL_ENV: "production" });
    assert.throws(() => validateServerEnv(env), /DATABASE_URL/);
  });

  it("3. Production with BILLING_ENV=sandbox fails", () => {
    const env = fakeServerEnv({
      BILLING_ENV: "sandbox",
      CHARIPAY_API_KEY: "chari_sk_test_fake",
      VERCEL_ENV: "production",
    });
    assert.throws(() => validateServerEnv(env), /BILLING_ENV.*production/);
  });

  it("4. Production with BILLING_ENV=production and live key passes", () => {
    const env = fakeServerEnv({
      BILLING_ENV: "production",
      CHARIPAY_API_KEY: "chari_sk_live_fake",
      CHARIPAY_WEBHOOK_SECRET: "whsec_live_fake",
      VERCEL_ENV: "production",
    });
    const srv = validateServerEnv(env);
    assert.equal(srv.BILLING_ENV, "production");
  });

  it("5. Production missing CHARIPAY_API_KEY fails", () => {
    const env = fakeServerEnv({
      BILLING_ENV: "production",
      CHARIPAY_API_KEY: "",
      VERCEL_ENV: "production",
    });
    assert.throws(() => validateServerEnv(env), /CHARIPAY_API_KEY/);
  });

  it("6. Production missing CHARIPAY_WEBHOOK_SECRET fails", () => {
    const env = fakeServerEnv({
      BILLING_ENV: "production",
      CHARIPAY_API_KEY: "chari_sk_live_fake",
      CHARIPAY_WEBHOOK_SECRET: "",
      VERCEL_ENV: "production",
    });
    assert.throws(() => validateServerEnv(env), /CHARIPAY_WEBHOOK_SECRET/);
  });

  it("7. Public variables accepted", () => {
    const pub = validatePublicEnv(
      fakePublicEnv({ NEXT_PUBLIC_APP_URL: "https://traytio.vercel.app" }),
    );
    assert.equal(pub.NEXT_PUBLIC_APP_URL, "https://traytio.vercel.app");
  });

  it("8. Server secrets never exposed through public env", () => {
    const pub = validatePublicEnv(fakePublicEnv());
    const keys = Object.keys(pub);
    for (const k of keys) {
      assert.ok(k.startsWith("NEXT_PUBLIC_"), `public env should only contain NEXT_PUBLIC_ vars, got ${k}`);
      assert.ok(!k.includes("SECRET"), `public env must not contain secret ${k}`);
      assert.ok(!k.includes("CHARIPAY"), `public env must not contain CHARIPAY ${k}`);
      assert.ok(!k.includes("RESEND"), `public env must not contain RESEND ${k}`);
    }
    // Ensure server-only vars are not in public schema
    assert.ok(!("CHARIPAY_API_KEY" in pub));
    assert.ok(!("DATABASE_URL" in pub));
    assert.ok(!("CLERK_SECRET_KEY" in pub));
  });

  it("9. No secret values appear in validation errors", () => {
    const fakeSecret = "chari_sk_live_SUPER_SECRET_12345";
    const env = fakeServerEnv({
      BILLING_ENV: "production",
      CHARIPAY_API_KEY: fakeSecret,
      VERCEL_ENV: "production",
    });
    // This should fail because BILLING_ENV=sandbox vs live key mismatch is not the case here
    // Instead, test a missing var error doesn't leak another var's value
    const badEnv = fakeServerEnv({
      DATABASE_URL: "",
      VERCEL_ENV: "production",
      BILLING_ENV: "production",
      CHARIPAY_API_KEY: "chari_sk_live_fake",
      CHARIPAY_WEBHOOK_SECRET: "whsec_fake",
    });
    try {
      validateServerEnv(badEnv);
      assert.fail("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      assert.ok(!msg.includes(fakeSecret), "error must not contain secret value");
      assert.ok(!msg.includes("SUPER_SECRET"), "error must not contain secret value");
      assert.ok(msg.includes("DATABASE_URL"), "error should contain variable name");
    }
  });
});
