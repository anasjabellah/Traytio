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

  header: { marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexDirection: "row", gap: 14, alignItems: "center", flexShrink: 1 },
  logo: { width: 64, height: 64, objectFit: "contain", flexShrink: 0 },
  hCompany: { fontSize: 21, fontWeight: 600, color: primary, letterSpacing: -0.3 },
  hLine: { fontSize: 7.5, color: C.gray, lineHeight: 1.35, marginTop: 2 },
  headerRight: { alignItems: "flex-end", flexShrink: 0 },
  badge: { backgroundColor: primary, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 3 },
  badgeText: { fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 2 },
  docNum: { fontSize: 9, color: C.gray, marginTop: 5 },
  hr: { height: 2.5, backgroundColor: primary, marginVertical: 14, borderRadius: 1.5 },

  titleBlock: { marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 600, color: secondary, letterSpacing: -0.3 },
  titleSub: { fontSize: 8, color: C.gray, lineHeight: 1.35, marginTop: 4 },

  infoRow: { flexDirection: "row", gap: 20, marginBottom: 14 },
  infoCard: { flex: 1, backgroundColor: C.light, borderRadius: 3, padding: 10 },
  infoTitle: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  infoName: { fontSize: 10, fontWeight: 600, color: secondary, marginBottom: 2 },
  infoLine: { fontSize: 7.5, color: C.gray, lineHeight: 1.35 },
  infoHRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  infoLabel: { fontSize: 7.5, color: C.muted },
  infoVal: { fontSize: 7.5, color: secondary, fontWeight: 500 },

  tableWrap: { marginBottom: 14 },
  th: { flexDirection: "row", backgroundColor: secondary, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 2 },
  thCell: { fontSize: 7, color: "#fff", textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 },
  td: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 9, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: "center" },
  tdCell: { fontSize: 9, color: secondary },
  colC: { width: "48%" },
  colM: { width: "26%", textAlign: "right" },
  colS: { width: "26%", textAlign: "right" },

  notes: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, marginBottom: 14 },
  nTitle: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
  nText: { fontSize: 8, color: C.gray, lineHeight: 1.35, whiteSpace: "pre-wrap" },

  footer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, flexDirection: "row", justifyContent: "space-between" },
  fText: { fontSize: 7, color: "#bbb" },

  missing: { fontSize: 9, color: "#ccc", fontStyle: "italic" },
});

const TYPE_LABELS: Record<string, string> = {
  WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
  ANNIVERSARY: "Cocktail", HOLIDAY: "Gala", OTHER: "Privé",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifié", CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé",
};

function formatMAD(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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
  invoiceFooter: string | null;
};

type EventPDFProps = {
  settings?: PdfSettings;
  org: { name: string; logo?: string | null; address?: string | null; city?: string | null; country?: string | null; phone?: string | null; email?: string | null };
  client: { name: string; email?: string | null; phone?: string | null } | null;
  event: {
    name: string;
    type: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
    guestCount: number | null;
    budget: number | null;
    contactPerson: string | null;
    contactPhone: string | null;
    notes: string | null;
  };
  commandes: Array<{ number: string; status: string; totalAmount: number }>;
};

export function EventPDF({ settings, org, client, event, commandes }: EventPDFProps) {
  const primary = settings?.primaryColor ?? "#C9A96E";
  const secondary = settings?.secondaryColor ?? "#1a1a1a";
  const fontFamily = settings?.pdfFontFamily ?? "DM Sans";
  const s = buildStyles(primary, secondary);

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
  const ids = [settings?.companyICE && `ICE: ${settings.companyICE}`, settings?.companyIF && `IF: ${settings.companyIF}`, settings?.companyRC && `RC: ${settings.companyRC}`].filter(Boolean) as string[];
  if (ids.length) metaLines.push(ids.join(" · "));

  const typeLabel = TYPE_LABELS[event.type] || event.type || "—";
  const statusLabel = STATUS_LABELS[event.status] || event.status || "—";

  const endDate = event.endDate ? new Date(event.endDate) : null;
  const durationHours = endDate && endDate > new Date(event.startDate)
    ? Math.round((endDate.getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60) * 10) / 10
    : null;

  const totalPaid = commandes.reduce((sum, c) => sum + c.totalAmount, 0);
  const remaining = event.budget ? Math.max(0, event.budget - totalPaid) : null;

  return (
    <Document>
      <Page size="A4" style={[s.page, { fontFamily }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {org.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
              <Image style={s.logo} src={org.logo} />
            ) : null}
            <View>
              <Text style={s.hCompany}>{companyName}</Text>
              {metaLines.map((line, i) => (
                <Text key={i} style={s.hLine}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={s.headerRight}>
            <View style={s.badge}>
              <Text style={s.badgeText}>ÉVÉNEMENT</Text>
            </View>
            <Text style={s.docNum}>Créé le {formatDate(new Date(event.startDate))}</Text>
          </View>
        </View>

        <View style={s.hr} />

        <View style={s.titleBlock}>
          <Text style={s.title}>{event.name}</Text>
          <Text style={s.titleSub}>{statusLabel} · {typeLabel}</Text>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Client</Text>
            {client ? (
              <>
                <Text style={s.infoName}>{client.name}</Text>
                {client.email ? <Text style={s.infoLine}>{client.email}</Text> : null}
                {client.phone ? <Text style={s.infoLine}>Tél: {client.phone}</Text> : null}
                {!client.email && !client.phone ? <Text style={s.missing}>Aucun contact renseigné</Text> : null}
              </>
            ) : (
              <Text style={s.missing}>Aucun client assigné</Text>
            )}
          </View>

          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Contact</Text>
            {event.contactPerson || event.contactPhone ? (
              <>
                {event.contactPerson ? <Text style={s.infoName}>{event.contactPerson}</Text> : null}
                {event.contactPhone ? <Text style={s.infoLine}>Tél: {event.contactPhone}</Text> : null}
              </>
            ) : (
              <Text style={s.missing}>Aucun contact renseigné</Text>
            )}
          </View>

          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Réception</Text>
            {event.location ? (
              <>
                <Text style={s.infoName}>{event.location}</Text>
                <Text style={s.infoLine}>{formatDate(new Date(event.startDate))}</Text>
                <Text style={s.infoLine}>
                  {formatTime(new Date(event.startDate))}{event.endDate ? ` → ${formatTime(new Date(event.endDate))}` : ""}
                </Text>
                {event.guestCount ? <Text style={s.infoLine}>{event.guestCount} invités</Text> : null}
              </>
            ) : (
              <>
                <Text style={s.infoLine}>{formatDate(new Date(event.startDate))}</Text>
                <Text style={s.infoLine}>
                  {formatTime(new Date(event.startDate))}{event.endDate ? ` → ${formatTime(new Date(event.endDate))}` : ""}
                </Text>
                {event.guestCount ? <Text style={s.infoLine}>{event.guestCount} invités</Text> : null}
              </>
            )}
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Budget prévu</Text>
              <Text style={s.infoVal}>{event.budget ? formatMAD(event.budget) : "Non défini"}</Text>
            </View>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Durée</Text>
              <Text style={s.infoVal}>{durationHours !== null ? `${durationHours}h` : "Non définie"}</Text>
            </View>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Statut</Text>
              <Text style={s.infoVal}>{statusLabel}</Text>
            </View>
          </View>

          <View style={s.infoCard}>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Total commandes</Text>
              <Text style={s.infoVal}>{commandes.length > 0 ? formatMAD(totalPaid) : "—"}</Text>
            </View>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Paiements reçus</Text>
              <Text style={[s.infoVal, { color: "#059669" }]}>{formatMAD(totalPaid)}</Text>
            </View>
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Reste à couvrir</Text>
              <Text style={[s.infoVal, { color: remaining !== null && remaining > 0 ? "#d97706" : "#059669" }]}>
                {remaining !== null ? (remaining > 0 ? formatMAD(remaining) : "Soldé") : "N/A"}
              </Text>
            </View>
          </View>

          <View style={s.infoCard}>
            {endDate && endDate.toDateString() !== new Date(event.startDate).toDateString() ? (
              <View style={s.infoHRow}>
                <Text style={s.infoLabel}>Date de fin</Text>
                <Text style={s.infoVal}>{formatDate(endDate)}</Text>
              </View>
            ) : null}
            <View style={s.infoHRow}>
              <Text style={s.infoLabel}>Créé le</Text>
              <Text style={s.infoVal}>{formatDate(new Date(event.startDate))}</Text>
            </View>
          </View>
        </View>

        {commandes.length > 0 ? (
          <View style={s.tableWrap}>
            <View style={s.th}>
              <Text style={[s.thCell, s.colC]}>Commande</Text>
              <Text style={[s.thCell, s.colM]}>Montant</Text>
              <Text style={[s.thCell, s.colS]}>Statut</Text>
            </View>
            {commandes.map((c, i) => (
              <View style={[s.td, i % 2 === 1 ? { backgroundColor: C.light } : {}]} key={i}>
                <Text style={[s.tdCell, s.colC]}>{c.number}</Text>
                <Text style={[s.tdCell, s.colM]}>{formatMAD(c.totalAmount)}</Text>
                <Text style={[s.tdCell, s.colS]}>{c.status}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {event.notes ? (
          <View style={s.notes}>
            <Text style={s.nTitle}>Notes</Text>
            <Text style={s.nText}>{event.notes}</Text>
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