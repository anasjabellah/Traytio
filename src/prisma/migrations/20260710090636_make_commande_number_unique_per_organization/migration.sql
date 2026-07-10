-- Drop the global unique constraint on number
DROP INDEX "commandes_number_key";

-- Create composite unique constraint scoped to organization
CREATE UNIQUE INDEX "commandes_organizationId_number_key" ON "commandes"("organizationId", "number");
