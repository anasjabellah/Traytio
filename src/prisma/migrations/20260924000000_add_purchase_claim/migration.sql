-- Add purchase_claims table for the paid-customer Clerk claim flow (Phase 3A).
-- Single-use activation tokens binding a paid order to its pre-provisioned
-- pending tenant. No changes to existing tables; no data migration.

CREATE TABLE "purchase_claims" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "purchase_claims_token_key" ON "purchase_claims"("token");

CREATE UNIQUE INDEX "purchase_claims_userId_key" ON "purchase_claims"("userId");

CREATE UNIQUE INDEX "purchase_claims_idempotencyKey_key" ON "purchase_claims"("idempotencyKey");

CREATE INDEX "purchase_claims_email_idx" ON "purchase_claims"("email");

CREATE INDEX "purchase_claims_organizationId_idx" ON "purchase_claims"("organizationId");
