"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sparkles, Save, ArrowLeft, CloudUpload, X, Palette, Type, Building2, FileText, Eye,
} from "lucide-react"
import { toast } from "sonner"
import { getPdfSettings, updatePdfSettings, type PdfSettings } from "@/features/invoices/actions/pdf-settings-actions"
import { PdfPreview } from "./pdf-preview"

const FONT_OPTIONS = [
  { value: "DM Sans", label: "DM Sans" },
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
]

export default function PdfSettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [form, setForm] = useState<PdfSettings>({
    logo: null,
    primaryColor: "#C9A96E",
    secondaryColor: "#1a1a1a",
    pdfFontFamily: "DM Sans",
    companyName: null,
    companyAddress: null,
    companyPhone: null,
    companyEmail: null,
    companyWebsite: null,
    companyICE: null,
    companyIF: null,
    companyRC: null,
    invoicePrefix: "FAC",
    quotePrefix: "DEV",
    paymentDelayDays: 30,
    invoiceFooter: null,
    invoiceTerms: null,
    invoiceNotes: null,
  })

  useEffect(() => {
    getPdfSettings().then((res) => {
      if (res.success && res.data) {
        setForm(res.data)
      }
      setLoading(false)
    })
  }, [])

  const updateField = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image dépasse la limite de 10 MB")
      return
    }
    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", file.name)
    setUploading(true)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const json = await res.json()
      updateField("logo", json.url)
      toast.success("Logo mis à jour")
    } catch {
      toast.error("Erreur lors du téléchargement du logo")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updatePdfSettings(form)
      if (res.success) {
        toast.success("Paramètres enregistrés")
      } else {
        toast.error(res.error || "Erreur lors de la sauvegarde")
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-soft)] flex items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold-soft)]/40 bg-[var(--gold-soft)]/10 text-[11px] font-medium text-[var(--gold-deep)] tracking-wide mb-4">
            <Sparkles className="size-3" strokeWidth={2} />
            Personnalisation
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                Paramètres PDF
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Personnalisez l&apos;apparence de vos devis et factures
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/invoices")}
                className="h-10 px-4 rounded-xl border border-border bg-card shadow-soft text-sm text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
              >
                <ArrowLeft className="size-4" strokeWidth={1.8} />
                Retour
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-medium shadow-soft hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="size-4" strokeWidth={1.8} />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <Section icon={<Building2 className="size-4" />} title="Informations de l'entreprise" subtitle="Coordonnées affichées sur vos documents PDF">
              <InputRow label="Nom commercial" value={form.companyName ?? ""} onChange={(v) => updateField("companyName", v || null)} placeholder="TUR" />
              <InputRow label="Adresse" value={form.companyAddress ?? ""} onChange={(v) => updateField("companyAddress", v || null)} placeholder="123 Avenue..." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputRow label="Téléphone" value={form.companyPhone ?? ""} onChange={(v) => updateField("companyPhone", v || null)} placeholder="+212 5XX XX XX XX" />
                <InputRow label="Email" value={form.companyEmail ?? ""} onChange={(v) => updateField("companyEmail", v || null)} placeholder="contact@tur.ma" />
              </div>
              <InputRow label="Site web" value={form.companyWebsite ?? ""} onChange={(v) => updateField("companyWebsite", v || null)} placeholder="https://tur.ma" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputRow label="ICE" value={form.companyICE ?? ""} onChange={(v) => updateField("companyICE", v || null)} placeholder="123456789" />
                <InputRow label="IF" value={form.companyIF ?? ""} onChange={(v) => updateField("companyIF", v || null)} placeholder="123456" />
                <InputRow label="RC" value={form.companyRC ?? ""} onChange={(v) => updateField("companyRC", v || null)} placeholder="12345" />
              </div>
            </Section>

            <Section icon={<Palette className="size-4" />} title="Personnalisation PDF" subtitle="Couleurs, typographie et logo">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Logo de l&apos;entreprise</p>
                {form.logo ? (
                  <div className="relative inline-block">
                    <img src={form.logo} alt="Logo" className="h-24 w-24 rounded-2xl border border-border object-cover" />
                    <button type="button" onClick={() => updateField("logo", null)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleLogoUpload(file) }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                      dragOver ? "border-gold bg-gold/5" : "border-border/60 bg-white hover:border-gold/50 hover:bg-gold/5"
                    }`}
                  >
                    <CloudUpload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-xs font-medium text-foreground">Glissez votre logo ici</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">ou cliquez pour sélectionner</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await handleLogoUpload(f); e.target.value = "" } }}
                    />
                    {uploading && <p className="mt-2 text-[11px] text-muted-foreground animate-pulse">Téléchargement...</p>}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1.5">Couleur principale</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer bg-white p-1"
                    />
                    <input
                      value={form.primaryColor}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      className="flex-1 h-10 rounded-xl border border-border bg-white px-3 text-sm focus:outline-none focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20 transition-all"
                      placeholder="#C9A96E"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1.5">Couleur secondaire</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer bg-white p-1"
                    />
                    <input
                      value={form.secondaryColor}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      className="flex-1 h-10 rounded-xl border border-border bg-white px-3 text-sm focus:outline-none focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20 transition-all"
                      placeholder="#1a1a1a"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Police d&apos;écriture</p>
                <select
                  value={form.pdfFontFamily}
                  onChange={(e) => updateField("pdfFontFamily", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm focus:outline-none focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20 transition-all"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </Section>

            <Section icon={<FileText className="size-4" />} title="Paramètres des documents" subtitle="Préfixes, délais, pied de page et mentions">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputRow label="Préfixe facture" value={form.invoicePrefix} onChange={(v) => updateField("invoicePrefix", v)} placeholder="FAC" />
                <InputRow label="Préfixe devis" value={form.quotePrefix} onChange={(v) => updateField("quotePrefix", v)} placeholder="DEV" />
                <InputRow label="Délai de paiement (jours)" value={String(form.paymentDelayDays)} onChange={(v) => updateField("paymentDelayDays", Number(v) || 30)} placeholder="30" type="number" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Pied de page</p>
                <textarea
                  value={form.invoiceFooter ?? ""}
                  onChange={(e) => updateField("invoiceFooter", e.target.value || null)}
                  placeholder="Ex: TUR — Suite traiteur premium · contact@tur.ma · +212 5XX XX XX XX"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20 transition-all"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Conditions générales</p>
                <textarea
                  value={form.invoiceTerms ?? ""}
                  onChange={(e) => updateField("invoiceTerms", e.target.value || null)}
                  placeholder="Ex: Paiement à réception sous 30 jours. Tout litige relève du tribunal de commerce de..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20 transition-all"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Notes par défaut</p>
                <textarea
                  value={form.invoiceNotes ?? ""}
                  onChange={(e) => updateField("invoiceNotes", e.target.value || null)}
                  placeholder="Ex: Merci de votre confiance !"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20 transition-all"
                />
              </div>
            </Section>
          </div>

          <div className="xl:col-span-2">
            <div className="sticky top-8 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Eye className="size-4" strokeWidth={1.8} />
                Aperçu en direct
              </div>
              <PdfPreview
                companyName={form.companyName ?? ""}
                companyAddress={form.companyAddress ?? ""}
                companyPhone={form.companyPhone ?? ""}
                companyEmail={form.companyEmail ?? ""}
                companyWebsite={form.companyWebsite ?? ""}
                companyICE={form.companyICE ?? ""}
                companyIF={form.companyIF ?? ""}
                companyRC={form.companyRC ?? ""}
                primaryColor={form.primaryColor}
                secondaryColor={form.secondaryColor}
                pdfFontFamily={form.pdfFontFamily}
                logo={form.logo ?? ""}
                invoiceFooter={form.invoiceFooter ?? ""}
                invoiceTerms={form.invoiceTerms ?? ""}
                invoicePrefix={form.invoicePrefix}
                quotePrefix={form.quotePrefix}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[1.75rem] border border-border/70 bg-card p-7 shadow-soft hover:shadow-lift transition-shadow"
    >
      <header className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-gradient-gold text-gold-foreground flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      <div className="space-y-4">
        {children}
      </div>
    </motion.section>
  )
}

function InputRow({ label, value, onChange, placeholder, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-1.5">{label}</p>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none transition-all focus:border-[var(--gold-deep)] focus:ring-1 focus:ring-[var(--gold-deep)]/20"
      />
    </div>
  )
}
