-- Add tax support to commandes
-- Adds taxRate, taxLabel, and taxAmount columns for VAT/TVA display on invoices

ALTER TABLE "commandes" ADD COLUMN "taxRate" DECIMAL DEFAULT 0;
ALTER TABLE "commandes" ADD COLUMN "taxLabel" TEXT;
ALTER TABLE "commandes" ADD COLUMN "taxAmount" DECIMAL DEFAULT 0;
