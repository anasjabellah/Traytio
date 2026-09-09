import {
  CommandePaymentStatus,
  CommandeStatus,
  DiscountType,
  EventStatus,
  EventType,
  InvoiceStatus,
  InvoiceType,
  MenuCategory,
  MenuItemCategory,
  OrgRole,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  StockCategory,
  UserRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const D = (value: number | string) => new Prisma.Decimal(value);

const nodeEnv = process.env.NODE_ENV ?? "development";
if (nodeEnv === "production" || process.env.VERCEL_ENV === "production") {
  console.error(
    "Seed refused: this seed is for local development only. NODE_ENV is denied in production. Run `npm run prisma:seed` locally.",
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const IDs = {
  org: "seed-org-dev-events",
  client: "seed-client-atlas",
  event: "seed-event-gala-2026",
  menuSignature: "seed-menu-signature",
  menuBuffet: "seed-menu-buffet",
  miOlive: "seed-mi-olive-bread",
  miCouscous: "seed-mi-couscous",
  miPastry: "seed-mi-pastry",
  miJuice: "seed-mi-fruit-juice",
  stockTomatoes: "seed-stock-tomatoes",
  stockCouscous: "seed-stock-couscous",
  stockChicken: "seed-stock-chicken",
  stockWater: "seed-stock-water",
  commande: "seed-cmd-gala-2026",
  commandeItemMenu: "seed-citem-menu",
  commandeItemChina: "seed-citem-china",
  invoice: "seed-inv-gala-2026",
  payment: "seed-pay-gala-2026",
} as const;

const menuItems = [
  {
    id: IDs.miOlive,
    name: "Brioche de thon",
    category: MenuItemCategory.FOOD,
    unitPrice: D(18),
    unit: "pcs",
  },
  {
    id: IDs.miCouscous,
    name: "Couscous royal",
    category: MenuItemCategory.FOOD,
    unitPrice: D(45),
    unit: "couvert",
  },
  {
    id: IDs.miPastry,
    name: "Corne de gazelle",
    category: MenuItemCategory.DESSERTS,
    unitPrice: D(14),
    unit: "pcs",
  },
  {
    id: IDs.miJuice,
    name: "Jus d'orange frais",
    category: MenuItemCategory.DRINKS,
    unitPrice: D(12),
    unit: "verre",
  },
];

async function main() {
  if (nodeEnv === "test") {
    console.warn("Seed skipped: NODE_ENV=test (never seed a test/e2e database).");
    return;
  }

  const org = await prisma.organization.upsert({
    where: { id: IDs.org },
    update: {},
    create: {
      id: IDs.org,
      name: "Dev Events Traiteur",
      slug: "dev-events",
      email: "hello@example.com",
      phone: "+212 000 000 000",
      address: "Boulevard Mohammed V",
      city: "Casablanca",
      country: "MA",
      plan: "starter",
      primaryColor: "#C9A96E",
      secondaryColor: "#1a1a1a",
      pdfFontFamily: "DM Sans",
      companyName: "Dev Events Traiteur",
      companyAddress: "Boulevard Mohammed V, Casablanca",
      companyPhone: "+212 000 000 000",
      companyEmail: "hello@example.com",
      companyWebsite: "https://example.com",
      companyICE: "000000000000000",
      companyIF: "00000000",
      companyRC: "000000",
      invoicePrefix: "FAC",
      quotePrefix: "DEV",
      paymentDelayDays: 30,
      invoiceTerms: "Paiement à réception.",
      invoiceNotes: "Merci de votre confiance.",
      invoiceFooter: "Document généré pour le développement local.",
    },
  });

  const client = await prisma.client.upsert({
    where: { id: IDs.client },
    update: {},
    create: {
      id: IDs.client,
      organizationId: org.id,
      name: "Association Atlas",
      email: "contact@example.com",
      phone: "+212 000 000 000",
      address: "12 Rue des Orangers",
      city: "Rabat",
      postalCode: "10000",
      notes: "Client de démonstration (seed).",
    },
  });

  const event = await prisma.event.upsert({
    where: { id: IDs.event },
    update: {},
    create: {
      id: IDs.event,
      organizationId: org.id,
      clientId: client.id,
      name: "Gala annuel 2026",
      type: EventType.CORPORATE,
      status: EventStatus.PLANNED,
      startDate: new Date("2026-03-14T19:00:00.000Z"),
      endDate: new Date("2026-03-15T01:00:00.000Z"),
      location: "Casablanca",
      guestCount: 80,
      budget: D(42000),
      contactPerson: "Responsable événement",
      contactPhone: "+212 000 000 000",
      notes: "Événement de démonstration (seed).",
    },
  });

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        organizationId: org.id,
        name: item.name,
        category: item.category,
        unitPrice: item.unitPrice,
        unit: item.unit,
      },
    });
  }

  const menus = [
    {
      id: IDs.menuSignature,
      name: "Menu Gala Signature",
      category: MenuCategory.WEDDING,
      pricePerPerson: D(420),
      minPersons: 80,
      maxPersons: 300,
      itemIds: [IDs.miOlive, IDs.miCouscous, IDs.miPastry, IDs.miJuice],
    },
    {
      id: IDs.menuBuffet,
      name: "Menu Buffet Corporate",
      category: MenuCategory.BUFFET,
      pricePerPerson: D(260),
      minPersons: 50,
      maxPersons: 200,
      itemIds: [IDs.miCouscous, IDs.miPastry, IDs.miJuice],
    },
  ];

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: {},
      create: {
        id: menu.id,
        organizationId: org.id,
        name: menu.name,
        category: menu.category,
        pricePerPerson: menu.pricePerPerson,
        minPersons: menu.minPersons,
        maxPersons: menu.maxPersons,
      },
    });
    for (const menuItemId of menu.itemIds) {
      await prisma.menuMenuItem.upsert({
        where: { menuId_menuItemId: { menuId: menu.id, menuItemId } },
        update: { defaultQty: 1 },
        create: { menuId: menu.id, menuItemId },
      });
    }
  }

  const stock = [
    { id: IDs.stockTomatoes, name: "Tomates", category: StockCategory.INGREDIENT, quantity: 24, unit: "kg", minQuantity: 5, unitPrice: D(9) },
    { id: IDs.stockCouscous, name: "Couscous", category: StockCategory.INGREDIENT, quantity: 60, unit: "kg", minQuantity: 10, unitPrice: D(14) },
    { id: IDs.stockChicken, name: "Poulet", category: StockCategory.INGREDIENT, quantity: 40, unit: "kg", minQuantity: 8, unitPrice: D(32) },
    { id: IDs.stockWater, name: "Eau minérale 1L", category: StockCategory.BEVERAGE, quantity: 120, unit: "bouteille", minQuantity: 24, unitPrice: D(4) },
  ];

  for (const item of stock) {
    await prisma.stockItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, organizationId: org.id },
    });
  }

  const commandeItems = [
    {
      id: IDs.commandeItemMenu,
      name: "Menu Gala Signature",
      quantity: 80,
      unitPrice: D(420),
      totalPrice: D(33600),
      menuId: IDs.menuSignature,
    },
    {
      id: IDs.commandeItemChina,
      name: "Pack vaisselle premium",
      quantity: 4,
      unitPrice: D(200),
      totalPrice: D(800),
      menuId: null,
    },
  ];

  const menuSubtotal = commandeItems.reduce(
    (sum, item) => sum.plus(item.totalPrice),
    D(0),
  );
  const feesTotal = D(600).plus(1000);
  const discountAmount = D(2000);
  const preTax = menuSubtotal.plus(feesTotal).minus(discountAmount);
  const taxRate = 10;
  const taxAmount = preTax.times(taxRate).dividedBy(100);
  const totalAmount = preTax.plus(taxAmount);
  const acomptePercent = 30;
  const acompteAmount = totalAmount.times(acomptePercent).dividedBy(100);
  const paidAmount = acompteAmount;
  const remainingAmount = totalAmount.minus(paidAmount);

  const commande = await prisma.commande.upsert({
    where: { organizationId_number: { organizationId: org.id, number: "CMD-DEV-2026-001" } },
    update: {},
    create: {
      id: IDs.commande,
      organizationId: org.id,
      clientId: client.id,
      eventId: event.id,
      number: "CMD-DEV-2026-001",
      status: CommandeStatus.CONFIRMED,
      eventType: EventType.CORPORATE,
      eventDate: new Date("2026-03-14T19:00:00.000Z"),
      guestCount: 80,
      location: "Casablanca",
      menuId: IDs.menuSignature,
      menuName: "Menu Gala Signature",
      pricePerPerson: D(420),
      totalAmount,
      acomptePercent,
      acompteAmount,
      paidAmount,
      remainingAmount,
      paymentStatus: CommandePaymentStatus.DEPOSIT_PAID,
      notes: "Commande de démonstration (seed).",
      transportFees: D(600),
      deliveryFees: D(0),
      equipmentFees: D(1000),
      discountType: DiscountType.FIXED,
      discountValue: D(2000),
      discountAmount,
      taxRate: D(taxRate),
      taxLabel: "TVA",
      taxAmount,
      clientBudget: D(42000),
      contactName: "Responsable événement",
      contactPhone: "+212 000 000 000",
      clientNotes: "Livraison en salle, dressage inclus.",
      internalNotes: "Contact initial par téléphone.",
    },
  });

  for (const item of commandeItems) {
    await prisma.commandeItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        commandeId: commande.id,
        menuId: item.menuId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      },
    });
  }

  const invoice = await prisma.invoice.upsert({
    where: { organizationId_number: { organizationId: org.id, number: "FAC-DEV-2026-001" } },
    update: {},
    create: {
      id: IDs.invoice,
      organizationId: org.id,
      commandeId: commande.id,
      number: "FAC-DEV-2026-001",
      type: InvoiceType.FACTURE,
      status: InvoiceStatus.SENT,
      issueDate: new Date("2026-01-15T00:00:00.000Z"),
      dueDate: new Date("2026-02-14T00:00:00.000Z"),
      totalAmount,
      paidAmount,
      notes: "Facture de démonstration (seed).",
    },
  });

  await prisma.payment.upsert({
    where: { id: IDs.payment },
    update: {},
    create: {
      id: IDs.payment,
      organizationId: org.id,
      commandeId: commande.id,
      invoiceId: invoice.id,
      amount: paidAmount,
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      reference: "PAY-DEV-2026-001",
      notes: "Acompte 30% (seed).",
    },
  });

  const ownerClerkId = process.env.SEED_OWNER_CLERK_ID;
  if (ownerClerkId) {
    const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
    const owner = await prisma.user.upsert({
      where: { clerkId: ownerClerkId },
      update: {},
      create: {
        clerkId: ownerClerkId,
        email: ownerEmail,
        firstName: "Dev",
        lastName: "Owner",
        role: UserRole.ADMIN,
      },
    });
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
      update: { role: OrgRole.OWNER },
      create: {
        userId: owner.id,
        organizationId: org.id,
        role: OrgRole.OWNER,
      },
    });
    console.log(`Linked ${ownerEmail} to ${org.slug} as OWNER.`);
  }

  console.log("Seed complete (dev dataset):");
  console.log(`  Organization: ${org.slug} (${org.id})`);
  console.log(`  Client: ${client.name}, Event: ${event.name}`);
  console.log(`  Mes menus: ${menus.length}, Menu items: ${menuItems.length}, Stock items: ${stock.length}`);
  console.log(
    `  Commande ${commande.number} / Invoice ${invoice.number} / Payment ${paidAmount.toString()} MAD`,
  );
  if (!ownerClerkId) {
    console.log(
      "No owner linked. To attach your Clerk account, rerun with SEED_OWNER_CLERK_ID=... (and optional SEED_OWNER_EMAIL).",
    );
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });