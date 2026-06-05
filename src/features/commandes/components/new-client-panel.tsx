"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check } from "lucide-react";
import { PremiumField } from "./premium-field";

type Client = any;

export function NewClientPanel({ onClose, onCreate }: { onClose: () => void; onCreate: (c: NonNullable<Client>) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [vip, setVip] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 right-0 bottom-0 z-[61] w-full max-w-md bg-background border-l border-border shadow-lift flex flex-col"
      >
        <header className="flex items-center justify-between px-7 py-6 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Nouveau</div>
            <h3 className="font-display text-3xl">Créer un client</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-7 py-6 space-y-4">
          <PremiumField label="Nom" value={name} onChange={setName} placeholder="Sophie Lambert" />
          <PremiumField label="Téléphone" value={phone} onChange={setPhone} placeholder="+33 6 12 34 56 78" />
          <PremiumField label="Email" value={email} onChange={setEmail} placeholder="sophie@lambert.fr" />
          <PremiumField label="Adresse" value={address} onChange={setAddress} placeholder="12 rue de Rivoli, Paris" />
          <PremiumField label="Notes" value={notes} onChange={setNotes} placeholder="Préférences, allergies…" multiline />
          <label className="flex items-center justify-between rounded-2xl border border-border bg-surface-soft px-4 py-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 text-gold-deep" />
              <div>
                <div className="text-sm font-medium">Client VIP</div>
                <div className="text-xs text-muted-foreground">Mis en avant dans toutes les listes</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVip(!vip)}
              className={`relative h-6 w-11 rounded-full transition-colors ${vip ? "bg-gradient-gold" : "bg-border"}`}
            >
              <motion.span
                animate={{ x: vip ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
              />
            </button>
          </label>
        </div>
        <footer className="px-7 py-5 border-t border-border flex items-center gap-3 bg-surface-soft">
          <button onClick={onClose} className="flex-1 rounded-full border border-border bg-card py-3 text-sm hover:bg-secondary transition">
            Annuler
          </button>
          <button
            onClick={() =>
              onCreate({
                id: "new-" + Date.now(),
                name: name || "Nouveau client",
                phone, email, vip, events: 0,
              })
            }
            className="flex-1 rounded-full bg-foreground text-primary-foreground py-3 text-sm font-medium hover:shadow-gold transition-all inline-flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" /> Créer le client
          </button>
        </footer>
      </motion.div>
    </>
  );
}
