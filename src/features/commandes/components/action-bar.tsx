"use client"

import { motion } from "framer-motion";
import { Save, FileText, Send, Check } from "lucide-react";

function BarBtn({ icon, label, primary, ghost }: { icon: React.ReactNode; label: string; primary?: boolean; ghost?: boolean }) {
  return (
    <button className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
      primary
        ? "bg-gradient-gold text-gold-foreground hover:shadow-gold"
        : ghost
        ? "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        : "bg-foreground text-primary-foreground hover:shadow-gold"
    }`}>
      {icon} <span className="hidden md:inline">{label}</span>
    </button>
  );
}

export function ActionBar({ total }: { total: number }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[min(1180px,calc(100%-2rem))]"
    >
      <div className="glass shadow-glass rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-gradient-charcoal text-primary-foreground flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total commande</div>
            <motion.div key={total} initial={{ y: -2, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-xl tabular-nums leading-tight">
              {total.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <BarBtn icon={<Save className="h-3.5 w-3.5" />} label="Brouillon" ghost />
          <BarBtn icon={<FileText className="h-3.5 w-3.5" />} label="Devis" />
          <BarBtn icon={<Send className="h-3.5 w-3.5" />} label="WhatsApp" ghost />
          <BarBtn icon={<Check className="h-3.5 w-3.5" />} label="Créer la commande" primary />
        </div>
      </div>
    </motion.div>
  );
}
