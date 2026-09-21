-- Link billing webhook events to their organization (optional: null when
-- the event cannot be attributed yet; org is otherwise resolved from payload).
-- Follow-up to 20260921120000_add_saas_billing_foundation, which created the
-- table without the Organization reverse relation Prisma requires.

ALTER TABLE "billing_webhook_events" ADD COLUMN "organizationId" TEXT;

CREATE INDEX "billing_webhook_events_organizationId_idx" ON "billing_webhook_events"("organizationId");

ALTER TABLE "billing_webhook_events" ADD CONSTRAINT "billing_webhook_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
