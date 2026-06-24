-- Add createdById column to commandes table
ALTER TABLE "commandes" ADD COLUMN "createdById" TEXT;

-- Add index for creator lookup
CREATE INDEX "commandes_created_by_id_idx" ON "commandes"("createdById");
