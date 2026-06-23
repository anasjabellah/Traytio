"use client"

type PreviewProps = {
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyWebsite: string
  companyICE: string
  companyIF: string
  companyRC: string
  primaryColor: string
  secondaryColor: string
  pdfFontFamily: string
  logo: string
  invoiceFooter: string
  invoiceTerms: string
  invoicePrefix: string
  quotePrefix: string
}

const fontStack = (f: string) =>
  f === "Inter" ? "Inter, system-ui, sans-serif"
  : f === "Poppins" ? "Poppins, system-ui, sans-serif"
  : '"DM Sans", system-ui, sans-serif'

const MOCK_ITEMS = [
  { name: "Menu Premium — Entrées", qty: 50, price: 4500 },
  { name: "Menu Premium — Plat principal", qty: 50, price: 12000 },
  { name: "Menu Premium — Dessert", qty: 50, price: 3500 },
]

export function PdfPreview(props: PreviewProps) {
  const font = fontStack(props.pdfFontFamily)
  const p = props.primaryColor
  const s = props.secondaryColor
  const subtotal = MOCK_ITEMS.reduce((a, i) => a + i.price, 0)
  const tax = subtotal * 0.2
  const total = subtotal + tax
  const metaLines = [
    props.companyAddress,
    props.companyPhone && `Tél: ${props.companyPhone}`,
    props.companyEmail,
    props.companyWebsite,
  ].filter(Boolean) as string[]

  return (
    <div className="w-full" style={{ fontFamily: font }}>
      <div className="mx-auto bg-white rounded-2xl shadow-lg border border-border/10 overflow-hidden">
        <div className="px-6 py-6 text-[13px]" style={{ color: s }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {props.logo && (
                <img src={props.logo} alt="" style={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0 }} />
              )}
              <div>
                <p style={{ fontSize: 21, fontWeight: 600, color: p, letterSpacing: "-0.3px" }}>{props.companyName || "Nom de l'entreprise"}</p>
                {metaLines.map((line, i) => (
                  <p key={i} style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35, marginTop: 2 }}>{line}</p>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{ display: "inline-block", background: p, padding: "5px 16px", borderRadius: 3, fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>
                DEVIS
              </span>
              <p style={{ fontSize: 9, color: "#666", marginTop: 5 }}>N° {props.invoicePrefix}-2026-0001</p>
            </div>
          </div>

          <div style={{ height: 2.5, background: p, marginBottom: 16, borderRadius: "1.5px" }} />

          <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
            <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 3, padding: 10 }}>
              <p style={{ fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 5 }}>Adressé à</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: s, marginBottom: 2 }}>Client Exemple</p>
              <p style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35 }}>contact@client.ma</p>
              <p style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35 }}>Tél: +212 6XX XX XX XX</p>
              <p style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35 }}>123 Avenue, Casablanca</p>
            </div>
            <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 3, padding: 10 }}>
              <p style={{ fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 5 }}>Événement</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: s, marginBottom: 2 }}>Menu Premium</p>
              <p style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35 }}>Date: 24 décembre 2026</p>
              <p style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35 }}>Lieu: Casablanca</p>
              <p style={{ fontSize: "7.5px", color: "#666", lineHeight: 1.35 }}>50 invités</p>
            </div>
            <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 3, padding: 10 }}>
              <p style={{ fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 5 }}>Document</p>
              <div style={{ display: "flex", gap: 4 }}>
                <p style={{ fontSize: "7.5px", color: "#999" }}>Émission</p>
                <p style={{ fontSize: "7.5px", color: s, fontWeight: 500 }}>23 juin 2026</p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <p style={{ fontSize: "7.5px", color: "#999" }}>Échéance</p>
                <p style={{ fontSize: "7.5px", color: s, fontWeight: 500 }}>23 juillet 2026</p>
              </div>
            </div>
          </div>

          <table style={{ width: "100%", marginBottom: 14, fontSize: 9 }}>
            <thead>
              <tr style={{ background: s, color: "#fff" }}>
                <th style={{ textAlign: "left", padding: "7px 9px", fontSize: 7, textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 }}>Description</th>
                <th style={{ textAlign: "center", padding: "7px 9px", fontSize: 7, textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 }}>Qté</th>
                <th style={{ textAlign: "right", padding: "7px 9px", fontSize: 7, textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 }}>Prix unitaire</th>
                <th style={{ textAlign: "right", padding: "7px 9px", fontSize: 7, textTransform: "uppercase", letterSpacing: 1, fontWeight: 500 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ITEMS.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e5e5", background: i % 2 === 1 ? "#f5f5f5" : "transparent" }}>
                  <td style={{ padding: "5px 9px", color: s }}>{item.name}</td>
                  <td style={{ padding: "5px 9px", textAlign: "center", color: s }}>{item.qty}</td>
                  <td style={{ padding: "5px 9px", textAlign: "right", color: s }}>{item.price.toLocaleString("fr-FR")} MAD</td>
                  <td style={{ padding: "5px 9px", textAlign: "right", color: s }}>{item.price.toLocaleString("fr-FR")} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>

            <div style={{ marginLeft: "auto", width: "46%", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 2, paddingBottom: 2 }}>
              <span style={{ fontSize: 8, color: "#666" }}>Sous-total</span>
              <span style={{ fontSize: 9, color: s, fontWeight: 500 }}>{subtotal.toLocaleString("fr-FR")} MAD</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 2, paddingBottom: 2 }}>
              <span style={{ fontSize: 8, color: "#666" }}>TVA (20%)</span>
              <span style={{ fontSize: 9, color: s, fontWeight: 500 }}>{tax.toLocaleString("fr-FR")} MAD</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 7, paddingBottom: 7, borderTop: `2.5px solid ${p}`, marginTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: s }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: p }}>{total.toLocaleString("fr-FR")} MAD</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "1.5px", paddingBottom: "1.5px", marginTop: 3 }}>
              <span style={{ fontSize: 8, color: "#666" }}>Acompte requis</span>
              <span style={{ fontSize: 9, color: s }}>{(total * 0.3).toLocaleString("fr-FR")} MAD</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, paddingBottom: 4, borderTop: "1px solid #e5e5e5", marginTop: "1.5px" }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: s }}>Solde restant</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#d97706" }}>{(total * 0.7).toLocaleString("fr-FR")} MAD</span>
            </div>
          </div>

          {props.invoiceTerms && (
            <div style={{ paddingTop: 8, borderTop: "1px solid #e5e5e5", marginBottom: 14 }}>
              <p style={{ fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Conditions générales</p>
              <p style={{ fontSize: 8, color: "#666", lineHeight: 1.35 }}>{props.invoiceTerms}</p>
            </div>
          )}

          <div style={{ paddingTop: 8, borderTop: "1px solid #e5e5e5", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 7, color: "#bbb" }}>{props.invoiceFooter || "Généré par TUR — Suite traiteur premium"}</span>
            <span style={{ fontSize: 7, color: "#bbb" }}>Généré le {new Date().toLocaleDateString("fr-FR")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
