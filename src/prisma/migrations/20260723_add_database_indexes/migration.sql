-- Add composite indexes for dashboard/query performance, remove redundant indexes.
CREATE INDEX IF NOT EXISTS "payments_organizationId_status_createdAt_idx" ON "payments"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "events_organizationId_status_idx" ON "events"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "commandes_organizationId_status_createdAt_idx" ON "commandes"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "menus_organizationId_isActive_idx" ON "menus"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "menu_items_organizationId_isActive_idx" ON "menu_items"("organizationId", "isActive");
DROP INDEX IF EXISTS "invitations_token_idx";
DROP INDEX IF EXISTS "events_organizationId_startDate_idx";