-- Add composite (organizationId, createdAt) indexes to 5 tables for pagination performance.
-- Uses CONCURRENTLY to avoid locking writes during creation.
-- Applied manually via psql since CONCURRENTLY cannot run inside a transaction.

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_organizationId_createdAt_idx" ON "payments"("organizationId", "createdAt");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "menus_organizationId_createdAt_idx" ON "menus"("organizationId", "createdAt");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "invoices_organizationId_createdAt_idx" ON "invoices"("organizationId", "createdAt");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_organizations_organizationId_createdAt_idx" ON "user_organizations"("organizationId", "createdAt");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "invitations_organizationId_createdAt_idx" ON "invitations"("organizationId", "createdAt");
