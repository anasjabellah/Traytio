-- Add idempotencyKey column to payments table for idempotent payment creation
-- The unique constraint on (organizationId, idempotencyKey) ensures that
-- the same logical payment request cannot be recorded twice within the same organization.

ALTER TABLE "payments" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "payments_organizationId_idempotencyKey_key" ON "payments"("organizationId", "idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;