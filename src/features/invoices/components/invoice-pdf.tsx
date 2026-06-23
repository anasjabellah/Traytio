import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAfJthTg.ttf", fontWeight: 600 },
  ],
});

const GOLD = "#C9A96E";
const DARK = "#1a1a1a";
const GRAY_LABEL = "#888888";
const GRAY_LINE = "#e2e2e2";
const GRAY_LIGHT = "#f7f7f7";

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: "DM Sans", fontSize: 9, color: DARK },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 36, paddingBottom: 22, borderBottom: `2px solid ${GOLD}` },
  headerLeft: { flex: 1, paddingRight: 40 },
  orgNameBlock: { marginBottom: 8 },
  orgName: { fontSize: 20, fontWeight: 600, color: GOLD, letterSpacing: -0.3 },
  orgDetailRow: { flexDirection: "row", marginTop: 2 },
  orgDetail: { fontSize: 8, color: GRAY_LABEL, lineHeight: 1.6 },
  headerRight: { alignItems: "flex-end", minWidth: 180 },
  docType: { fontSize: 26, fontWeight: 600, color: DARK, letterSpacing: -0.5 },
  docNumber: { fontSize: 10, color: GRAY_LABEL, marginTop: 3 },
  sectionLabel: { fontSize: 7, color: GRAY_LABEL, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  infoBlock: { flex: 1 },
  clientName: { fontSize: 11, fontWeight: 600, color: DARK, marginBottom: 3 },
  clientDetail: { fontSize: 9, color: GRAY_LABEL, lineHeight: 1.7 },
  detailRow: { flexDirection: "row", marginBottom: 2 },
  detailLabel: { fontSize: 8, color: GRAY_LABEL, width: 80 },
  detailValue: { fontSize: 9, color: DARK, flex: 1 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: GRAY_LIGHT, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 2 },
  tableHeaderCell: { fontSize: 7, color: GRAY_LABEL, textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottom: `1px solid ${GRAY_LINE}` },
  tableCell: { fontSize: 9, color: DARK },
  colName: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "22%", textAlign: "right" },
  colTotal: { width: "23%", textAlign: "right" },
  totals: { marginTop: 18, marginLeft: "auto", width: "48%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: GRAY_LABEL },
  totalValue: { fontSize: 9, color: DARK, fontWeight: 500 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTop: `2px solid ${GOLD}`, marginTop: 5 },
  grandTotalLabel: { fontSize: 13, fontWeight: 600, color: DARK },
  grandTotalValue: { fontSize: 13, fontWeight: 600, color: GOLD },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  paymentLabel: { fontSize: 9, color: GRAY_LABEL },
  paymentValue: { fontSize: 9, color: DARK },
  remainingRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTop: `1px solid ${GRAY_LINE}`, marginTop: 3 },
  remainingLabel: { fontSize: 10, fontWeight: 600, color: DARK },
  remainingValue: { fontSize: 10, fontWeight: 600 },
  notes: { marginTop: 28, paddingTop: 18, borderTop: `1px solid ${GRAY_LINE}` },
  notesText: { fontSize: 8, color: GRAY_LABEL, lineHeight: 1.6, marginTop: 6 },
  footerContainer: { position: "absolute", bottom: 28, left: 44, right: 44 },
  footer: { borderTop: `1px solid ${GRAY_LINE}`, paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#bbbbbb" },
  missing: { fontSize: 9, color: "#cccccc", fontStyle: "italic" },
});

function formatMAD(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type InvoicePDFProps = {
  org: { name: string; address?: string | null; city?: string | null; country?: string | null; phone?: string | null; email?: string | null };
  client: { name: string; email?: string | null; phone?: string | null } | null;
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
    notes: string | null;
    clientNotes: string | null;
    items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  };
};

export function InvoicePDF({ org, client, invoice, commande }: InvoicePDFProps) {
  const itemsSubtotal = commande.items.reduce((s, i) => s + i.totalPrice, 0);
  const totalFees = (commande.transportFees ?? 0) + (commande.deliveryFees ?? 0) + (commande.equipmentFees ?? 0);
  const discountAmount = commande.discountAmount ?? 0;
  const isDiscountPercentage = commande.discountType === "PERCENTAGE";
  const discountLabel = isDiscountPercentage && commande.discountValue
    ? `Remise (${commande.discountValue}%)`
    : "Remise";
  const remaining = invoice.totalAmount - invoice.paidAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header org={org} invoice={invoice} />
        <InfoSection client={client} invoice={invoice} commande={commande} />
        <ItemsTable items={commande.items} />
        <TotalsSection
          itemsSubtotal={itemsSubtotal}
          totalFees={totalFees}
          transportFees={commande.transportFees}
          deliveryFees={commande.deliveryFees}
          equipmentFees={commande.equipmentFees}
          discountAmount={discountAmount}
          discountLabel={discountLabel}
          totalAmount={invoice.totalAmount}
          paidAmount={invoice.paidAmount}
          acompteAmount={commande.acompteAmount}
          remaining={remaining}
        />
        <NotesSection notes={invoice.notes ?? commande.clientNotes} />
        <Footer />
      </Page>
    </Document>
  );
}

function Header({ org, invoice }: { org: InvoicePDFProps["org"]; invoice: InvoicePDFProps["invoice"] }) {
  const hasOrgAddress = org.address || org.city || org.country;
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.orgNameBlock}>
          <Text style={styles.orgName}>{org.name || "Votre société"}</Text>
        </View>
        {hasOrgAddress && (
          <View>
            {org.address && <Text style={styles.orgDetail}>{org.address}</Text>}
            {org.city && org.country ? (
              <Text style={styles.orgDetail}>{org.city}, {org.country}</Text>
            ) : org.city ? (
              <Text style={styles.orgDetail}>{org.city}</Text>
            ) : org.country ? (
              <Text style={styles.orgDetail}>{org.country}</Text>
            ) : null}
          </View>
        )}
        {org.phone && <Text style={[styles.orgDetail, { marginTop: 3 }]}>Tél: {org.phone}</Text>}
        {org.email && <Text style={styles.orgDetail}>{org.email}</Text>}
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.docType}>{invoice.type === "DEVIS" ? "DEVIS" : "FACTURE"}</Text>
        <Text style={styles.docNumber}>N° {invoice.number}</Text>
      </View>
    </View>
  );
}

function InfoSection({ client, invoice, commande }: { client: InvoicePDFProps["client"]; invoice: InvoicePDFProps["invoice"]; commande: InvoicePDFProps["commande"] }) {
  const hasEventInfo = commande.notes;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoBlock}>
        <Text style={styles.sectionLabel}>Adressé à</Text>
        {client ? (
          <View>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.email && <Text style={styles.clientDetail}>{client.email}</Text>}
            {client.phone && <Text style={styles.clientDetail}>Tél: {client.phone}</Text>}
          </View>
        ) : (
          <Text style={styles.missing}>Client non renseigné</Text>
        )}
      </View>
      <View style={[styles.infoBlock, { alignItems: "flex-end" }]}>
        <Text style={[styles.sectionLabel, { textAlign: "right" as const }]}>Détails du document</Text>
        <View style={{ width: 200 }}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date d&apos;émission</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date d&apos;échéance</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
          {hasEventInfo && (
            <View style={[styles.detailRow, { marginTop: 4 }]}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={[styles.detailValue, { color: GRAY_LABEL, fontSize: 8 }]}>{commande.notes}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function ItemsTable({ items }: { items: InvoicePDFProps["commande"]["items"] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.colName]}>Article</Text>
        <Text style={[styles.tableHeaderCell, styles.colQty]}>Quantité</Text>
        <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prix unitaire</Text>
        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
      </View>
      {items.map((item, i) => (
        <View style={i % 2 === 1 ? [styles.tableRow, { backgroundColor: GRAY_LIGHT }] : styles.tableRow} key={i}>
          <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
          <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
          <Text style={[styles.tableCell, styles.colPrice]}>{formatMAD(item.unitPrice)}</Text>
          <Text style={[styles.tableCell, styles.colTotal]}>{formatMAD(item.totalPrice)}</Text>
        </View>
      ))}
    </View>
  );
}

function TotalsSection({
  itemsSubtotal, totalFees, transportFees, deliveryFees, equipmentFees,
  discountAmount, discountLabel, totalAmount, paidAmount, acompteAmount, remaining,
}: {
  itemsSubtotal: number;
  totalFees: number;
  transportFees: number | null;
  deliveryFees: number | null;
  equipmentFees: number | null;
  discountAmount: number;
  discountLabel: string;
  totalAmount: number;
  paidAmount: number;
  acompteAmount: number;
  remaining: number;
}) {
  const showFees = transportFees || deliveryFees || equipmentFees;
  return (
    <View style={styles.totals}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Sous-total articles</Text>
        <Text style={styles.totalValue}>{formatMAD(itemsSubtotal)}</Text>
      </View>
      {showFees && <View style={[styles.totalRow, { borderTop: `1px solid ${GRAY_LINE}`, paddingTop: 4, marginTop: 2 }]}>
        <Text style={[styles.totalLabel, { fontWeight: 600, color: DARK }]}>Frais</Text>
        <Text style={[styles.totalValue, { fontWeight: 600 }]}>{formatMAD(totalFees)}</Text>
      </View>}
      {transportFees ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>  Transport</Text>
          <Text style={styles.totalValue}>{formatMAD(transportFees)}</Text>
        </View>
      ) : null}
      {deliveryFees ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>  Livraison</Text>
          <Text style={styles.totalValue}>{formatMAD(deliveryFees)}</Text>
        </View>
      ) : null}
      {equipmentFees ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>  Équipement</Text>
          <Text style={styles.totalValue}>{formatMAD(equipmentFees)}</Text>
        </View>
      ) : null}
      {discountAmount > 0 ? (
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: "#059669" }]}>{discountLabel}</Text>
          <Text style={[styles.totalValue, { color: "#059669" }]}>-{formatMAD(discountAmount)}</Text>
        </View>
      ) : null}
      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>Total</Text>
        <Text style={styles.grandTotalValue}>{formatMAD(totalAmount)}</Text>
      </View>
      {acompteAmount > 0 ? (
        <View style={[styles.paymentRow, { marginTop: 4 }]}>
          <Text style={styles.paymentLabel}>Acompte requis</Text>
          <Text style={styles.paymentValue}>{formatMAD(acompteAmount)}</Text>
        </View>
      ) : null}
      {paidAmount > 0 ? (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, { color: "#059669" }]}>Déjà payé</Text>
          <Text style={[styles.paymentValue, { color: "#059669" }]}>{formatMAD(paidAmount)}</Text>
        </View>
      ) : null}
      <View style={styles.remainingRow}>
        <Text style={styles.remainingLabel}>Solde restant</Text>
        <Text style={remaining > 0 ? [styles.remainingValue, { color: "#d97706" }] : [styles.remainingValue, { color: "#059669" }]}>
          {remaining > 0 ? formatMAD(remaining) : "Soldé"}
        </Text>
      </View>
    </View>
  );
}

function NotesSection({ notes }: { notes: string | null }) {
  if (!notes) return null;
  return (
    <View style={styles.notes}>
      <Text style={styles.sectionLabel}>Notes</Text>
      <Text style={styles.notesText}>{notes}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.footer}>
        <Text style={styles.footerText}>TUR — Suite traiteur premium</Text>
        <Text style={styles.footerText}>Généré le {new Date().toLocaleDateString("fr-FR")}</Text>
      </View>
    </View>
  );
}
