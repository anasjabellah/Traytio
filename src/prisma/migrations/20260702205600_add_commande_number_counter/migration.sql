CREATE TABLE "commande_number_counters" (
    "organizationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "commande_number_counters_pkey" PRIMARY KEY ("organizationId", "year")
);
