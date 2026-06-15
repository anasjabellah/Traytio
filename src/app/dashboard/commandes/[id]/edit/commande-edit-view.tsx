"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, ShoppingBag } from "lucide-react";
import { updateCommande } from "@/features/commandes/actions/update-commande";
import { COMMANDE_STATUS_LABELS } from "@/features/commandes/constants";
import type { CommandeWithDetails } from "@/features/commandes/types";

const STATUS_KEYS = Object.keys(COMMANDE_STATUS_LABELS);

export default function CommandeEditView({ commande }: { commande: CommandeWithDetails }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    number: commande.number,
    status: commande.status,
    eventDate: commande.eventDate ? new Date(commande.eventDate).toISOString().split("T")[0] : "",
    guestCount: commande.guestCount ?? "",
    location: commande.location ?? "",
    totalAmount: commande.totalAmount,
    notes: commande.notes ?? "",
  });

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = await updateCommande(commande.id, {
        number: form.number,
        clientId: commande.clientId,
        status: form.status,
        eventDate: form.eventDate || null,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        location: form.location || null,
        totalAmount: Number(form.totalAmount),
        notes: form.notes || null,
      });
      if (resp.success) {
        router.push(`/dashboard/commandes/${commande.id}`);
        router.refresh();
      } else {
        setError(resp.error ?? "Erreur lors de la sauvegarde");
      }
    } catch (e: any) {
      setError(e.message ?? "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[700px] px-6 py-8 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link
              href={`/dashboard/commandes/${commande.id}`}
              className="size-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft"
            >
              <ArrowLeft className="size-3.5 text-muted-foreground" />
            </Link>
            <ShoppingBag className="size-3 text-[var(--gold-deep)]" />
            <span>Modifier la commande</span>
          </div>

          <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05] mb-2">
            {commande.number}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Modifiez les informations de la commande ci-dessous.
          </p>

          <div className="rounded-2xl border border-border bg-card shadow-soft p-6 space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-surface-soft px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                >
                  {STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>{COMMANDE_STATUS_LABELS[key]}</option>
                  ))}
                </select>
              </Field>

              <Field label="Date de l'événement">
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => handleChange("eventDate", e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-surface-soft px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                />
              </Field>

              <Field label="Nombre d'invités">
                <input
                  type="number"
                  value={form.guestCount}
                  onChange={(e) => handleChange("guestCount", e.target.value)}
                  placeholder="0"
                  className="w-full h-11 rounded-xl border border-border bg-surface-soft px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                />
              </Field>

              <Field label="Lieu">
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Lieu de l'événement"
                  className="w-full h-11 rounded-xl border border-border bg-surface-soft px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                />
              </Field>

              <Field label="Montant total (MAD)">
                <input
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) => handleChange("totalAmount", Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-11 rounded-xl border border-border bg-surface-soft px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Notes générales..."
                className="w-full min-h-[100px] rounded-xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A] resize-none"
              />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`/dashboard/commandes/${commande.id}`}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center"
              >
                Annuler
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Tous les services opérationnels
            </div>
            <div>© TUR — Suite traiteur premium</div>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}
