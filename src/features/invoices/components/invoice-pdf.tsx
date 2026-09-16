import path from "node:path";
import { Document, Page, View, Text, StyleSheet, Font, Image } from "@react-pdf/renderer";

const fontDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "DM Sans",
  fonts: [
    { src: path.join(fontDir, "DMSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontDir, "DMSans-Medium.ttf"), fontWeight: 500 },
    { src: path.join(fontDir, "DMSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontDir, "Inter-Regular.woff"), fontWeight: 400 },
    { src: path.join(fontDir, "Inter-Medium.woff"), fontWeight: 500 },
    { src: path.join(fontDir, "Inter-SemiBold.woff"), fontWeight: 600 },
  ],
});

Font.register({
  family: "Poppins",
  fonts: [
    { src: path.join(fontDir, "Poppins-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontDir, "Poppins-Medium.ttf"), fontWeight: 500 },
    { src: path.join(fontDir, "Poppins-SemiBold.ttf"), fontWeight: 600 },
  ],
});

// Neutral palette — kept in sync with the two accent colors the user controls.
const C = {
  gray: "#4f4f4f",
  muted: "#848484",
  line: "#e9e9e9",
  hair: "#f2f2f2",
  panel: "#fafafa",
  green: "#059669",
  amber: "#d97706",
  white: "#ffffff",
};

const buildStyles = (primary: string, secondary: string) => StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 44,
    paddingBottom: 72,
    fontSize: 9,
    fontFamily: "DM Sans",
    color: secondary,
  },

  /* ── Header ── */
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  hLeft: { flexGrow: 1, flexShrink: 1, flexDirection: "row", alignItems: "center" },
  logo: { width: 52, height: 52, objectFit: "contain", marginRight: 12, flexShrink: 0 },
  hBody: { flexShrink: 1 },
  hName: { fontSize: 15, fontWeight: 600, color: secondary, letterSpacing: -0.2 },
  hMeta: { fontSize: 7.5, color: C.gray, lineHeight: 1.45, marginTop: 2 },
  hRight: { flexShrink: 0, alignItems: "flex-end", paddingLeft: 14 },
  docType: { fontSize: 22, fontWeight: 600, color: primary, letterSpacing: 4 },
  hNum: { fontSize: 10, fontWeight: 600, color: secondary, marginTop: 5 },
  hDate: { fontSize: 7.5, color: C.gray, marginTop: 2 },
  divider: { height: 1.4, backgroundColor: primary, marginTop: 13, marginBottom: 20 },

  /* ── Parties / event / document info ── */
  infoBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 3,
    backgroundColor: C.panel,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  infoDiv: { width: 1, backgroundColor: C.line, marginVertical: 2 },
  infoCol: { flex: 1, paddingHorizontal: 8 },
  infoTitle: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 6 },
  infoName: { fontSize: 10, fontWeight: 600, color: secondary, marginBottom: 3, lineHeight: 1.35 },
  infoLine: { fontSize: 8, color: C.gray, lineHeight: 1.5 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1.5 },
  metaLabel: { fontSize: 7.5, color: C.muted },
  metaValue: { fontSize: 7.5, color: secondary, fontWeight: 500, textAlign: "right", paddingLeft: 8 },

  /* ── Line items ── */
  table: { marginBottom: 16 },
  thead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: secondary,
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  thText: { fontSize: 7, color: C.white, textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.hair,
  },
  tdText: { fontSize: 8.5, color: secondary },
  tdDesc: { width: "44%", paddingRight: 10 },
  tdQty: { width: "12%", textAlign: "center" },
  tdUnit: { width: "22%", textAlign: "right" },
  tdTotal: { width: "22%", textAlign: "right", fontWeight: 600 },

  /* ── Financial summary · full width, labels left / amounts right ── */
  totals: { width: "100%", marginTop: 16, borderTopWidth: 1, borderTopColor: C.hair, paddingTop: 8 },
  trRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 2 },
  trLabel: { fontSize: 8, color: C.gray },
  trValue: { fontSize: 8.5, color: secondary, fontWeight: 500, textAlign: "right" },
  feeLabel: { fontSize: 7.5, color: C.muted, paddingLeft: 12 },
  feeValue: { fontSize: 8, color: secondary, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 2.5,
    borderTopColor: primary,
    marginTop: 5,
    paddingTop: 7,
  },
  totalLabel: { fontSize: 12, fontWeight: 600, color: secondary },
  totalValue: { fontSize: 12, fontWeight: 600, color: primary, textAlign: "right" },
  padRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5, marginTop: 2 },
  padLabel: { fontSize: 8, color: C.gray },
  padValue: { fontSize: 8.5, color: secondary, fontWeight: 500, textAlign: "right" },
  paidRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  paidLabel: { fontSize: 8, color: C.green },
  paidValue: { fontSize: 8.5, color: C.green, fontWeight: 600, textAlign: "right" },
  remainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: 1,
    borderTopColor: C.line,
    marginTop: 4,
    paddingTop: 6,
  },
  remainLabel: { fontSize: 9, fontWeight: 600, color: secondary },
  remainValue: { fontSize: 9, fontWeight: 600, textAlign: "right" },

  /* ── Notes / conditions ── */
  notes: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  nTitle: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 4 },
  nText: { fontSize: 8, color: C.gray, lineHeight: 1.55, marginBottom: 8 },

  /* ── Footer (repeat on every page) ── */
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    paddingTop: 7,
  },
  fLeft: { flexShrink: 1, paddingRight: 12 },
  fBrand: { fontSize: 7.5, fontWeight: 600, color: secondary },
  fMeta: { fontSize: 6.5, color: C.muted, lineHeight: 1.45, marginTop: 1 },
  fRight: { flexShrink: 0, alignItems: "flex-end", textAlign: "right" },

  missing: { fontSize: 8.5, color: C.muted },
});

const madFormat = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMAD(n: number): string {
  return madFormat.format(n);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export type PdfSettings = {
  primaryColor: string;
  secondaryColor: string;
  pdfFontFamily: string;
  companyName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  companyICE: string | null;
  companyIF: string | null;
  companyRC: string | null;
  invoicePrefix: string;
  quotePrefix: string;
  paymentDelayDays: number;
  invoiceFooter: string | null;
  invoiceTerms: string | null;
  invoiceNotes: string | null;
};

export type InvoicePDFProps = {
  settings?: PdfSettings;
  org: { name: string; logo?: string | null; address?: string | null; city?: string | null; country?: string | null; phone?: string | null; email?: string | null };
  client: { name: string; email?: string | null; phone?: string | null; address?: string | null; city?: string | null; postalCode?: string | null; company?: string | null; siret?: string | null } | null;
  invoice: {
    number: string;
    type: "DEVIS" | "FACTURE";
    issueDate: Date;
    dueDate: Date | null;
    totalAmount: number;
    paidAmount: number;
    notes: string | null;
  };
  commande: {
    number: string | null;
    totalAmount: number;
    acompteAmount: number;
    paidAmount: number;
    remainingAmount: number;
    transportFees: number | null;
    deliveryFees: number | null;
    equipmentFees: number | null;
    discountType: string | null;
    discountValue: number | null;
    discountAmount: number | null;
    taxRate: number | null;
    taxLabel: string | null;
    taxAmount: number | null;
    notes: string | null;
    clientNotes: string | null;
    eventDate: Date | null;
    eventLocation: string | null;
    guestCount: number | null;
    menuName: string | null;
    items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  };
};

export function InvoicePDF({ settings, org, client, invoice, commande }: InvoicePDFProps) {
  const primary = settings?.primaryColor ?? "#C9A96E";
  const secondary = settings?.secondaryColor ?? "#1a1a1a";
  const fontFamily = settings?.pdfFontFamily ?? "DM Sans";
  const s = buildStyles(primary, secondary);

  const itemsSubtotal = commande.items.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalFees = (commande.transportFees ?? 0) + (commande.deliveryFees ?? 0) + (commande.equipmentFees ?? 0);
  const discountAmount = commande.discountAmount ?? 0;
  const discountPct = commande.discountType === "PERCENTAGE" && commande.discountValue ? ` (${commande.discountValue}%)` : "";
  const taxAmount = commande.taxAmount ?? 0;
  const taxLabel = (commande.taxLabel ?? "TVA") + (commande.taxRate ? ` (${commande.taxRate}%)` : "");
  const remaining = invoice.totalAmount - invoice.paidAmount;
  const docLabel = invoice.type === "DEVIS" ? "DEVIS" : "FACTURE";
  const isQuote = invoice.type === "DEVIS";
  const companyName = settings?.companyName || org.name;
  const companyAddr = settings?.companyAddress || [org.address, org.city, org.country].filter(Boolean).join(", ") || null;
  const companyPhone = settings?.companyPhone || org.phone || null;
  const companyEmail = settings?.companyEmail || org.email || null;
  const companyWebsite = settings?.companyWebsite || null;
  const companyICE = settings?.companyICE || null;
  const companyIF = settings?.companyIF || null;
  const companyRC = settings?.companyRC || null;
  const ids = [companyICE && `ICE: ${companyICE}`, companyIF && `IF: ${companyIF}`, companyRC && `RC: ${companyRC}`].filter(Boolean) as string[];
  const idsText = ids.length ? ids.join(" · ") : null;

  const headerLines: string[] = [];
  if (companyAddr) headerLines.push(companyAddr);
  if (companyPhone) headerLines.push(`Tél: ${companyPhone}`);
  if (companyEmail) headerLines.push(companyEmail);
  if (companyWebsite) headerLines.push(companyWebsite);
  if (idsText) headerLines.push(idsText);

  const footerLines: string[] = [];
  if (companyPhone) footerLines.push(`Tél: ${companyPhone}`);
  if (companyEmail) footerLines.push(companyEmail);
  if (companyWebsite) footerLines.push(companyWebsite);
  if (idsText) footerLines.push(idsText);

  const dueLabel = isQuote ? "Validité" : "Échéance";

  return (
    <Document title={`${docLabel} ${invoice.number}`} author={companyName} creator="TUR — Suite traiteur premium">
      <Page size="A4" style={[s.page, { fontFamily }]}>
        {/* ── Header · repeated on every page ── */}
        <View fixed style={s.header}>
          <View style={s.hLeft}>
            {org.logo ? <Image style={s.logo} src={org.logo} /> : null}
            <View style={s.hBody}>
              <Text style={s.hName}>{companyName}</Text>
              {headerLines.map((line, i) => (
                <Text key={i} style={s.hMeta}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={s.hRight}>
            <Text style={s.docType}>{docLabel}</Text>
            <Text style={s.hNum}>N° {invoice.number}</Text>
            <Text style={s.hDate}>Émise le {formatDate(invoice.issueDate)}</Text>
            {invoice.dueDate ? <Text style={s.hDate}>{dueLabel} : {formatDate(invoice.dueDate)}</Text> : null}
          </View>
        </View>
        <View fixed style={s.divider} />

        {/* ── Client / Événement / Document ── */}
        <View style={s.infoBox} wrap={false}>
          <View style={s.infoCol}>
            <Text style={s.infoTitle}>Client</Text>
            {client ? (
              <View>
                <Text style={s.infoName}>{client.company ? `${client.company}${client.name ? ` — ${client.name}` : ""}` : client.name}</Text>
                {client.email ? <Text style={s.infoLine}>{client.email}</Text> : null}
                {client.phone ? <Text style={s.infoLine}>Tél: {client.phone}</Text> : null}
                {client.address ? <Text style={s.infoLine}>{client.address}</Text> : null}
                {client.city ? <Text style={s.infoLine}>{client.city}{client.postalCode ? ` ${client.postalCode}` : ""}</Text> : null}
                {client.siret ? <Text style={s.infoLine}>SIRET: {client.siret}</Text> : null}
              </View>
            ) : (
              <Text style={s.missing}>Client non renseigné</Text>
            )}
          </View>

          {commande.number || commande.menuName || commande.eventDate || commande.eventLocation || commande.guestCount ? (
            <>
              <View style={s.infoDiv} />
              <View style={s.infoCol}>
                <Text style={s.infoTitle}>Commande / Événement</Text>
                {commande.number ? <Text style={s.infoName}>Réf. {commande.number}</Text> : null}
                {commande.menuName ? <Text style={s.infoName}>{commande.menuName}</Text> : null}
                {commande.eventDate ? <Text style={s.infoLine}>Date: {formatDate(commande.eventDate)}</Text> : null}
                {commande.eventLocation ? <Text style={s.infoLine}>Lieu: {commande.eventLocation}</Text> : null}
                {commande.guestCount ? <Text style={s.infoLine}>{commande.guestCount} invités</Text> : null}
              </View>
            </>
          ) : null}

          <View style={s.infoDiv} />
          <View style={s.infoCol}>
            <Text style={s.infoTitle}>Document</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>N°</Text>
              <Text style={s.metaValue}>{invoice.number}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Type</Text>
              <Text style={s.metaValue}>{docLabel}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Émission</Text>
              <Text style={s.metaValue}>{formatDate(invoice.issueDate)}</Text>
            </View>
            {invoice.dueDate ? (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>{dueLabel}</Text>
                <Text style={s.metaValue}>{formatDate(invoice.dueDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Line items ── */}
        {commande.items.length > 0 ? (
          <View style={s.table}>
            <View style={s.thead} wrap={false}>
              <Text style={[s.thText, s.tdDesc]}>Description</Text>
              <Text style={[s.thText, s.tdQty]}>Qté</Text>
              <Text style={[s.thText, s.tdUnit]}>Prix unitaire</Text>
              <Text style={[s.thText, s.tdTotal]}>Total</Text>
            </View>
            {commande.items.map((item, i) => (
              <View style={[s.tr, i % 2 === 1 ? { backgroundColor: C.panel } : {}]} key={i} wrap={false}>
                <Text style={[s.tdText, s.tdDesc]}>{item.name}</Text>
                <Text style={[s.tdText, s.tdQty]}>{item.quantity}</Text>
                <Text style={[s.tdText, s.tdUnit]}>{formatMAD(item.unitPrice)}</Text>
                <Text style={[s.tdText, s.tdTotal]}>{formatMAD(item.totalPrice)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Financial summary ── */}
        <Totals
          s={s}
          isQuote={isQuote}
          itemsSubtotal={itemsSubtotal}
          totalFees={totalFees}
          transportFees={commande.transportFees}
          deliveryFees={commande.deliveryFees}
          equipmentFees={commande.equipmentFees}
          discountAmount={discountAmount}
          discountLabel={`Remise${discountPct}`}
          taxAmount={taxAmount}
          taxLabel={taxLabel}
          totalAmount={invoice.totalAmount}
          paidAmount={invoice.paidAmount}
          acompteAmount={commande.acompteAmount}
          remaining={remaining}
        />

        {/* ── Notes / conditions ── */}
        {(invoice.notes || commande.clientNotes || settings?.invoiceNotes || settings?.invoiceTerms) ? (
          <View style={s.notes} wrap={false}>
            {invoice.notes || commande.clientNotes || settings?.invoiceNotes ? (
              <>
                <Text style={s.nTitle}>Notes</Text>
                <Text style={s.nText}>{invoice.notes || commande.clientNotes || settings?.invoiceNotes}</Text>
              </>
            ) : null}
            {settings?.invoiceTerms ? (
              <>
                <Text style={[s.nTitle, (invoice.notes || commande.clientNotes || settings?.invoiceNotes) ? { marginTop: 4 } : {}]}>Conditions générales</Text>
                <Text style={s.nText}>{settings.invoiceTerms}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {/* ── Footer · repeated on every page ── */}
        <View fixed style={s.footer}>
          <View style={s.fLeft}>
            <Text style={s.fBrand}>{companyName}</Text>
            {footerLines.length > 0 ? <Text style={s.fMeta}>{footerLines.join("  ·  ")}</Text> : null}
            <Text style={s.fMeta}>{settings?.invoiceFooter || "Généré par TUR — Suite traiteur premium"}</Text>
          </View>
          <View style={s.fRight}>
            <Text style={s.fMeta} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
            <Text style={s.fMeta}>Généré le {new Date().toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/* ─────────────────────── Totals sub-component ─────────────────────── */

function Totals({
  s, isQuote,
  itemsSubtotal, totalFees, transportFees, deliveryFees, equipmentFees,
  discountAmount, discountLabel, taxAmount, taxLabel,
  totalAmount, paidAmount, acompteAmount, remaining,
}: {
  s: ReturnType<typeof buildStyles>; isQuote: boolean;
  itemsSubtotal: number; totalFees: number;
  transportFees: number | null; deliveryFees: number | null; equipmentFees: number | null;
  discountAmount: number; discountLabel: string; taxAmount: number; taxLabel: string;
  totalAmount: number; paidAmount: number; acompteAmount: number; remaining: number;
}) {
  const showFees = transportFees || deliveryFees || equipmentFees;
  return (
    <View style={s.totals} wrap={false}>
      <View style={s.trRow}>
        <Text style={s.trLabel}>Sous-total</Text>
        <Text style={s.trValue}>{formatMAD(itemsSubtotal)}</Text>
      </View>

      {showFees ? (
        <>
          <View style={s.trRow}>
            <Text style={s.trLabel}>Frais</Text>
            <Text style={s.trValue}>{formatMAD(totalFees)}</Text>
          </View>
          {transportFees ? (
            <View style={s.trRow}>
              <Text style={s.feeLabel}>Transport</Text>
              <Text style={s.feeValue}>{formatMAD(transportFees)}</Text>
            </View>
          ) : null}
          {deliveryFees ? (
            <View style={s.trRow}>
              <Text style={s.feeLabel}>Livraison</Text>
              <Text style={s.feeValue}>{formatMAD(deliveryFees)}</Text>
            </View>
          ) : null}
          {equipmentFees ? (
            <View style={s.trRow}>
              <Text style={s.feeLabel}>Équipement</Text>
              <Text style={s.feeValue}>{formatMAD(equipmentFees)}</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {discountAmount > 0 ? (
        <View style={s.trRow}>
          <Text style={[s.trLabel, { color: C.green }]}>{discountLabel}</Text>
          <Text style={[s.trValue, { color: C.green }]}>-{formatMAD(discountAmount)}</Text>
        </View>
      ) : null}

      {taxAmount > 0 ? (
        <View style={s.trRow}>
          <Text style={s.trLabel}>{taxLabel}</Text>
          <Text style={s.trValue}>{formatMAD(taxAmount)}</Text>
        </View>
      ) : null}

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Total</Text>
        <Text style={s.totalValue}>{formatMAD(totalAmount)}</Text>
      </View>

      {isQuote && acompteAmount > 0 ? (
        <View style={s.padRow}>
          <Text style={s.padLabel}>Acompte requis</Text>
          <Text style={s.padValue}>{formatMAD(acompteAmount)}</Text>
        </View>
      ) : null}
      {paidAmount > 0 ? (
        <View style={s.paidRow}>
          <Text style={s.paidLabel}>Déjà payé</Text>
          <Text style={s.paidValue}>{formatMAD(paidAmount)}</Text>
        </View>
      ) : null}
      <View style={s.remainRow}>
        <Text style={s.remainLabel}>Solde restant</Text>
        <Text style={[s.remainValue, { color: remaining > 0 ? C.amber : C.green }]}>
          {remaining > 0 ? formatMAD(remaining) : "Soldé"}
        </Text>
      </View>
    </View>
  );
}