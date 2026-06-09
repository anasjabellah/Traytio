-- Add missing indexes for clients module performance
CREATE INDEX IF NOT EXISTS "clients_organization_id_total_spent_idx" ON "clients" ("organizationId", "totalSpent");
CREATE INDEX IF NOT EXISTS "clients_organization_id_last_order_at_idx" ON "clients" ("organizationId", "lastOrderAt");
CREATE INDEX IF NOT EXISTS "commandes_client_id_status_idx" ON "commandes" ("clientId", "status");
