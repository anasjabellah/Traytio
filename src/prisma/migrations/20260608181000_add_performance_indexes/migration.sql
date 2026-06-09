-- DropIndex (replaced by composite indexes below)
DROP INDEX IF EXISTS "clients_organizationId_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "clients_organizationId_createdAt_idx" ON "clients"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "clients_organizationId_name_idx" ON "clients"("organizationId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_clientId_idx" ON "events"("clientId");
CREATE INDEX IF NOT EXISTS "events_organizationId_createdAt_idx" ON "events"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "events_organizationId_startDate_endDate_idx" ON "events"("organizationId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "commandes_eventId_idx" ON "commandes"("eventId");
CREATE INDEX IF NOT EXISTS "commandes_eventId_createdAt_idx" ON "commandes"("eventId", "createdAt");
