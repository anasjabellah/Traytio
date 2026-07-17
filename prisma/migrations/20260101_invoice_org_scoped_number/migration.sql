-- Alter Invoice.number from globally unique to unique per organization.
-- Replaces the single-column unique index with a composite (organizationId, number) unique index.
-- Safe: verified no intra-organization duplicate numbers exist before applying.

-- DropIndex
DROP INDEX "invoices_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "invoices_organizationId_number_key" ON "invoices"("organizationId", "number");
