-- Add extraService to commandes
-- Adds extraService column for extra services pricing

ALTER TABLE "commandes" ADD COLUMN "extraService" DECIMAL DEFAULT 0;
