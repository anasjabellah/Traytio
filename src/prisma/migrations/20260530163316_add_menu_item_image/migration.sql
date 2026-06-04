-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "imageUrl" TEXT;

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "menu_menu_items" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "defaultQty" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "menu_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commande_tasks" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commande_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commande_attachments" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commande_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commande_activities" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commande_activities_pkey" PRIMARY KEY ("id")
);

-- AlterTable commandes
ALTER TABLE "commandes"
    ADD COLUMN "transportFees"  DECIMAL(65,30) DEFAULT 0,
    ADD COLUMN "deliveryFees"   DECIMAL(65,30) DEFAULT 0,
    ADD COLUMN "equipmentFees"  DECIMAL(65,30) DEFAULT 0,
    ADD COLUMN "discountType"   "DiscountType",
    ADD COLUMN "discountValue"  DECIMAL(65,30) DEFAULT 0,
    ADD COLUMN "discountAmount" DECIMAL(65,30) DEFAULT 0,
    ADD COLUMN "clientBudget"   DECIMAL(65,30),
    ADD COLUMN "contactName"    TEXT,
    ADD COLUMN "contactPhone"   TEXT,
    ADD COLUMN "internalNotes"  TEXT,
    ADD COLUMN "clientNotes"    TEXT,
    ADD COLUMN "pdfUrl"         TEXT,
    ADD COLUMN "sentAt"         TIMESTAMP(3),
    ADD COLUMN "sentVia"        TEXT;

-- AlterTable commande_items
ALTER TABLE "commande_items"
    ADD COLUMN "notes"      TEXT,
    ADD COLUMN "menuItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "menu_menu_items_menuId_menuItemId_key" ON "menu_menu_items"("menuId", "menuItemId");

-- CreateIndex
CREATE INDEX "commande_tasks_commandeId_idx" ON "commande_tasks"("commandeId");

-- CreateIndex
CREATE INDEX "commande_attachments_commandeId_idx" ON "commande_attachments"("commandeId");

-- CreateIndex
CREATE INDEX "commande_activities_commandeId_idx" ON "commande_activities"("commandeId");

-- AddForeignKey
ALTER TABLE "menu_menu_items" ADD CONSTRAINT "menu_menu_items_menuId_fkey"
    FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_menu_items" ADD CONSTRAINT "menu_menu_items_menuItemId_fkey"
    FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commande_tasks" ADD CONSTRAINT "commande_tasks_commandeId_fkey"
    FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commande_attachments" ADD CONSTRAINT "commande_attachments_commandeId_fkey"
    FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commande_activities" ADD CONSTRAINT "commande_activities_commandeId_fkey"
    FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commande_items" ADD CONSTRAINT "commande_items_menuItemId_fkey"
    FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
