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

const C = {
  gray: "#666",
  line: "#e5e5e5",
  light: "#f5f5f5",
  muted: "#999",
};

const buildStyles = (primary: string, secondary: string) => StyleSheet.create({
  page: { padding: 48, fontSize: 9, fontFamily: "DM Sans", color: secondary },

  header: { marginBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexDirection: "row", gap: 14, alignItems: "center", flexShrink: 1 },
  logo: { width: 64, height: 64, objectFit: "contain", flexShrink: 0 },
  hCompany: { fontSize: 21, fontWeight: 600, color: primary, letterSpacing: -0.3 },
  hLine: { fontSize: 7.5, color: C.gray, lineHeight: 1.35, marginTop: 2 },
  headerRight: { alignItems: "flex-end", flexShrink: 0 },
  badge: { backgroundColor: primary, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 3 },
  badgeText: { fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 2 },
  docNum: { fontSize: 9, color: C.gray, marginTop: 5 },
  hr: { height: 2.5, backgroundColor: primary, marginVertical: 16, borderRadius: 1.5 },

  infoRow: { flexDirection: "row", gap: 20, marginBottom: 18 },
  infoCard: { flex: 1, backgroundColor: C.light, borderRadius: 3, padding: 10 },
  infoTitle: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  infoName: { fontSize: 10, fontWeight: 600, color: secondary, marginBottom: 2 },
  infoLine: { fontSize: 7.5, color: C.gray, lineHeight: 1.35 },
  infoHRow: { flexDirection: "row", gap: 4 },
  infoLabel: { fontSize: 7.5, color: C.muted },
  infoVal: { fontSize: 7.5, color: secondary, fontWeight: 500 },

  tableWrap: { marginBottom: 14 },
  th: { flexDirection: "row", backgroundColor: secondary, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 2 },
  thCell: { fontSize: 7, color: "#fff", textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 },
  td: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 9, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: "center" },
  tdCell: { fontSize: 9, color: secondary },
  colD: { width: "44%" },
  colQ: { width: "14%", textAlign: "center" },
  colP: { width: "21%", textAlign: "right" },
  colT: { width: "21%", textAlign: "right" },

  totals: { marginLeft: "auto", width: "46%", marginBottom: 14 },
  tr: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  tl: { fontSize: 8, color: C.gray },
  tv: { fontSize: 9, color: secondary, fontWeight: 500 },
  fh: { fontSize: 8.5, fontWeight: 600, color: secondary },
  fs: { fontSize: 8, color: C.gray, paddingLeft: 8 },
  discountV: { fontSize: 9, fontWeight: 500, color: "#059669" },
  discountL: { fontSize: 8, color: "#059669" },
  gtWrap: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTopWidth: 2.5, borderTopColor: primary, marginTop: 2 },
  gtL: { fontSize: 13, fontWeight: 700, color: secondary },
  gtV: { fontSize: 13, fontWeight: 700, color: primary },
  pi: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  piL: { fontSize: 8, color: C.gray },
  piV: { fontSize: 9, color: secondary },
  rl: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.line, marginTop: 1.5 },
  rlL: { fontSize: 9, fontWeight: 600, color: secondary },
  rlV: { fontSize: 9, fontWeight: 600 },

  notes: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, marginBottom: 14 },
  nTitle: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
  nText: { fontSize: 8, color: C.gray, lineHeight: 1.35 },

  footer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, flexDirection: "row", justifyContent: "space-between" },
  fText: { fontSize: 7, color: "#bbb" },

  missing: { fontSize: 9, color: "#ccc", fontStyle: "italic" },
});

function formatMAD(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type PdfSettings = {
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
};

type InvoicePDFProps = {
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
  const taxLabel = commande.taxLabel ?? "TVA";
  const remaining = invoice.totalAmount - invoice.paidAmount;
  const docLabel = invoice.type === "DEVIS" ? "DEVIS" : "FACTURE";
  const companyName = settings?.companyName || org.name;
  const companyAddr = settings?.companyAddress || [org.address, org.city, org.country].filter(Boolean).join(", ") || null;
  const companyPhone = settings?.companyPhone || org.phone || null;
  const companyEmail = settings?.companyEmail || org.email || null;
  const companyWebsite = settings?.companyWebsite || null;

  const metaLines: string[] = [];
  if (companyAddr) metaLines.push(companyAddr);
  if (companyPhone) metaLines.push(`Tél: ${companyPhone}`);
  if (companyEmail) metaLines.push(companyEmail);
  if (companyWebsite) metaLines.push(companyWebsite);
  const companyICE = settings?.companyICE;
  const companyIF = settings?.companyIF;
  const companyRC = settings?.companyRC;
  const ids = [companyICE && `ICE: ${companyICE}`, companyIF && `IF: ${companyIF}`, companyRC && `RC: ${companyRC}`].filter(Boolean) as string[];
  if (ids.length) metaLines.push(ids.join(" · "));

  return (
    <Document>
      <Page size="A4" style={[s.page, { fontFamily }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {org.logo ? <Image style={s.logo} src={org.logo} /> : null}
            <View>
              <Text style={s.hCompany}>{companyName}</Text>
              {metaLines.map((line, i) => (
                <Text key={i} style={s.hLine}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={s.headerRight}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{docLabel}</Text>
            </View>
            <Text style={s.docNum}>N° {invoice.number}</Text>
          </View>
        </View>

        <View style={s.hr} />

        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Adressé à</Text>
            {client ? (
              <>
                <Text style={s.infoName}>{client.company ? `${client.company} (${client.name})` : client.name}</Text>
                {client.email ? <Text style={s.infoLine}>{client.email}</Text> : null}
                {client.phone ? <Text style={s.infoLine}>Tél: {client.phone}</Text> : null}
                {client.address ? <Text style={s.infoLine}>{client.address}</Text> : null}
                {client.city ? <Text style={s.infoLine}>{client.city}{client.postalCode ? ` ${client.postalCode}` : ""}</Text> : null}
                {client.siret ? <Text style={s.infoLine}>SIRET: {client.siret}</Text> : null}
              </>
            ) : (
              <Text style={s.missing}>Client non renseigné</Text>
            )}
          </View>

          {commande.eventDate || commande.eventLocation || commande.guestCount || commande.menuName ? (
            <View style={s.infoCard}>
              <Text style={s.infoTitle}>Événement</Text>
              {commande.menuName ? <Text style={s.infoName}>{commande.menuName}</Text> : null}
              {commande.eventDate ? <Text style={s.infoLine}>Date: {formatDate(commande.eventDate)}</Text> : null}
              {commande.eventLocation ? <Text style={s.infoLine}>Lieu: {commande.eventLocation}</Text> : null}
              {commande.guestCount ? <Text style={s.infoLine}>{commande.guestCount} invités</Text> : null}
            </View>
          ) : null}

          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Document</Text>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Émission</Text>
              <Text style={s.infoVal}>{formatDate(invoice.issueDate)}</Text>
            </View>
            {invoice.dueDate ? (
              <View style={s.infoHRow}>
                <Text style={s.infoLabel}>Échéance</Text>
                <Text style={s.infoVal}>{formatDate(invoice.dueDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {commande.items.length > 0 ? (
          <View style={s.tableWrap}>
            <View style={s.th}>
              <Text style={[s.thCell, s.colD]}>Description</Text>
              <Text style={[s.thCell, s.colQ]}>Qté</Text>
              <Text style={[s.thCell, s.colP]}>Prix unitaire</Text>
              <Text style={[s.thCell, s.colT]}>Total</Text>
            </View>
            {commande.items.map((item, i) => (
              <View style={[s.td, i % 2 === 1 ? { backgroundColor: C.light } : {}]} key={i}>
                <Text style={[s.tdCell, s.colD]}>{item.name}</Text>
                <Text style={[s.tdCell, s.colQ]}>{item.quantity}</Text>
                <Text style={[s.tdCell, s.colP]}>{formatMAD(item.unitPrice)}</Text>
                <Text style={[s.tdCell, s.colT]}>{formatMAD(item.totalPrice)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Totals
          s={s}
          primary={primary}
          secondary={secondary}
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

        {(invoice.notes || commande.clientNotes || settings?.invoiceTerms) ? (
          <View style={s.notes}>
            {invoice.notes || commande.clientNotes ? (
              <>
                <Text style={s.nTitle}>Notes</Text>
                <Text style={s.nText}>{invoice.notes || commande.clientNotes}</Text>
              </>
            ) : null}
            {settings?.invoiceTerms ? (
              <>
                <Text style={[s.nTitle, (invoice.notes || commande.clientNotes) ? { marginTop: 8 } : {}]}>Conditions générales</Text>
                <Text style={s.nText}>{settings.invoiceTerms}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        <View style={s.footer}>
          <Text style={s.fText}>{settings?.invoiceFooter || "Généré par TUR — Suite traiteur premium"}</Text>
          <Text style={s.fText}>Généré le {new Date().toLocaleDateString("fr-FR")}</Text>
        </View>
      </Page>
    </Document>
  );
}

/* ─────────────────────── Totals sub-component ─────────────────────── */

function Totals({
  s, primary, secondary,
  itemsSubtotal, totalFees, transportFees, deliveryFees, equipmentFees,
  discountAmount, discountLabel, taxAmount, taxLabel,
  totalAmount, paidAmount, acompteAmount, remaining,
}: {
  s: ReturnType<typeof buildStyles>; primary: string; secondary: string;
  itemsSubtotal: number; totalFees: number;
  transportFees: number | null; deliveryFees: number | null; equipmentFees: number | null;
  discountAmount: number; discountLabel: string; taxAmount: number; taxLabel: string;
  totalAmount: number; paidAmount: number; acompteAmount: number; remaining: number;
}) {
  const showFees = transportFees || deliveryFees || equipmentFees;
  return (
    <View style={s.totals}>
      <View style={s.tr}>
        <Text style={s.tl}>Sous-total</Text>
        <Text style={s.tv}>{formatMAD(itemsSubtotal)}</Text>
      </View>

      {showFees ? (
        <>
          <View style={[s.tr, { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 2, marginTop: 1 }]}>
            <Text style={s.fh}>Frais</Text>
            <Text style={s.fh}>{formatMAD(totalFees)}</Text>
          </View>
          {transportFees ? (
            <View style={s.tr}>
              <Text style={s.fs}>Transport</Text>
              <Text style={[s.tv, { fontSize: 8 }]}>{formatMAD(transportFees)}</Text>
            </View>
          ) : null}
          {deliveryFees ? (
            <View style={s.tr}>
              <Text style={s.fs}>Livraison</Text>
              <Text style={[s.tv, { fontSize: 8 }]}>{formatMAD(deliveryFees)}</Text>
            </View>
          ) : null}
          {equipmentFees ? (
            <View style={s.tr}>
              <Text style={s.fs}>Équipement</Text>
              <Text style={[s.tv, { fontSize: 8 }]}>{formatMAD(equipmentFees)}</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {discountAmount > 0 ? (
        <View style={s.tr}>
          <Text style={s.discountL}>{discountLabel}</Text>
          <Text style={s.discountV}>-{formatMAD(discountAmount)}</Text>
        </View>
      ) : null}

      {taxAmount > 0 ? (
        <View style={s.tr}>
          <Text style={s.tl}>{taxLabel}</Text>
          <Text style={s.tv}>{formatMAD(taxAmount)}</Text>
        </View>
      ) : null}

      <View style={s.gtWrap}>
        <Text style={s.gtL}>Total</Text>
        <Text style={s.gtV}>{formatMAD(totalAmount)}</Text>
      </View>

      {acompteAmount > 0 ? (
        <View style={[s.pi, { marginTop: 3 }]}>
          <Text style={s.piL}>Acompte requis</Text>
          <Text style={s.piV}>{formatMAD(acompteAmount)}</Text>
        </View>
      ) : null}
      {paidAmount > 0 ? (
        <View style={s.pi}>
          <Text style={[s.piL, { color: "#059669" }]}>Déjà payé</Text>
          <Text style={[s.piV, { color: "#059669" }]}>{formatMAD(paidAmount)}</Text>
        </View>
      ) : null}
      <View style={s.rl}>
        <Text style={s.rlL}>Solde restant</Text>
        <Text style={[s.rlV, { color: remaining > 0 ? "#d97706" : "#059669" }]}>
          {remaining > 0 ? formatMAD(remaining) : "Soldé"}
        </Text>
      </View>
    </View>
  );
}
