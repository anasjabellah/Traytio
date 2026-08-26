-- Forward-only corrective migration.
--
-- Root cause: the active migration history (src/prisma/migrations) never created
-- the "invitations" and "invoice_number_counters" tables that exist in
-- schema.prisma and in the live database. Replaying the chain on an empty
-- database therefore fails at 20260721_add_org_created_at_composite_indexes
-- with P3006: relation "invitations" does not exist (that migration indexes
-- "invitations"). "invoice_number_counters" is likewise missing from the chain
-- and the schema cannot be reproduced from empty.
--
-- This migration is placed BEFORE 20260721 so the full chain is reproducible
-- from empty, and is idempotent (guarded by information_schema) so it is a safe
-- no-op on databases that already contain these tables (e.g. provisioned via
-- `prisma db push` or an out-of-band init). This preserves migration
-- immutability: no historical migration is rewritten.

-- CreateTable invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invitations'
  ) THEN
    CREATE TABLE "invitations" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
      "token" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
    CREATE INDEX "invitations_organizationId_idx" ON "invitations"("organizationId");
    CREATE INDEX "invitations_email_idx" ON "invitations"("email");
    CREATE INDEX "invitations_organizationId_createdAt_idx" ON "invitations"("organizationId", "createdAt");

    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable invoice_number_counters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoice_number_counters'
  ) THEN
    CREATE TABLE "invoice_number_counters" (
      "organizationId" TEXT NOT NULL,
      "year" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "lastNumber" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "invoice_number_counters_pkey" PRIMARY KEY ("organizationId", "year", "type")
    );
  END IF;
END
$$;
