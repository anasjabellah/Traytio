-- Forward-only corrective migration.
--
-- Root cause: an early migration (20260529204115_simplify_menu_item_categories)
-- created a GLOBAL unique index on invoices:
--     CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");
-- while schema.prisma declares per-organization uniqueness:
--     @@unique([organizationId, number])
-- The commandes table received the matching fix in
-- 20260710090636_make_commande_number_unique_per_organization, but invoices
-- never did. As a result the live database enforces UNIQUE(number) globally,
-- which wrongly rejects two different organizations from issuing the same
-- invoice number (e.g. both "FAC-2026-0001"), and contradicts the schema.
--
-- Goal: enforce UNIQUE("organizationId", "number") and remove the global
-- single-column index.
--
-- This migration is idempotent and safe to re-run:
--   * Drops the old index only if it still exists.
--   * Refuses (RAISE) to create the new constraint if duplicate
--     (organizationId, number) pairs already exist, so data is never
--     silently modified or deleted. Such duplicates must be resolved
--     explicitly before applying.
--   * Creates the composite constraint only if it is not already present.
--   * No historical migration is modified (migration immutability preserved).

-- 1) Drop the global single-column unique index if it exists.
DROP INDEX IF EXISTS "invoices_number_key";

-- 2) Guard: abort loudly if duplicate (organizationId, number) pairs exist.
--    Cross-organization duplicate NUMBERS are valid and must NOT be treated
--    as an error here.
DO $$
DECLARE
  dup_count int;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    SELECT count(*) INTO dup_count FROM (
      SELECT 1 FROM "invoices"
      GROUP BY "organizationId", "number"
      HAVING count(*) > 1
    ) s;
    IF dup_count > 0 THEN
      RAISE EXCEPTION 'A-02 ABORT: % duplicate (organizationId, number) pair(s) exist in "invoices". Resolve them explicitly before applying this migration.', dup_count;
    END IF;
  END IF;
END
$$;

-- 3) Create the composite per-organization unique constraint if absent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'invoices_organizationId_number_key'
    ) THEN
      ALTER TABLE "invoices"
        ADD CONSTRAINT "invoices_organizationId_number_key" UNIQUE ("organizationId", "number");
    END IF;
  END IF;
END
$$;
