-- Add payment workflow foundation
-- Creates CommandePaymentStatus enum, paymentStatus on commandes, commandeId on payments

CREATE TYPE "CommandePaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'DEPOSIT_PAID', 'PAID', 'REFUNDED');

ALTER TABLE "commandes" ADD COLUMN "paymentStatus" "CommandePaymentStatus" NOT NULL DEFAULT 'UNPAID';

ALTER TABLE "payments" ADD COLUMN "commandeId" TEXT NOT NULL;

ALTER TABLE "payments" ADD CONSTRAINT "payments_commande_id_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "payments_commande_id_idx" ON "payments" ("commandeId");
