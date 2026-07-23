-- Add composite indexes for dashboard/query performance, remove redundant indexes.
-- Uses CONCURRENTLY to avoid locking writes during creation.
-- Applied manually via psql since CONCURRENTLY cannot run inside a transaction.

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_organizationId_status_createdAt_idx" ON "payments"("organizationId", "status", "createdAt");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "events_organizationId_status_idx" ON "events"("organizationId", "status");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "commandes_organizationId_status_createdAt_idx" ON "commandes"("organizationId", "status", "createdAt");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "menus_organizationId_isActive_idx" ON "menus"("organizationId", "isActive");

-- CreateIndex CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS "menu_items_organizationId_isActive_idx" ON "menu_items"("organizationId", "isActive");

-- DropIndex (duplicate — covered by @unique on invitations.token)
DROP INDEX CONCURRENTLY IF EXISTS "invitations_token_idx";

-- DropIndex (redundant — covered by events_organizationId_startDate_endDate_idx)
DROP INDEX CONCURRENTLY IF EXISTS "events_organizationId_startDate_idx";
