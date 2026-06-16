"use client"

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  entityName: string;
  itemLabel: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  entityName,
  itemLabel,
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        const firstBtn = dialogRef.current?.querySelector("button");
        firstBtn?.focus();
      }, 50);
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onOpenChange(false);
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, loading, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && onOpenChange(false)}
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="size-6 text-red-600" strokeWidth={1.8} />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="font-display text-xl">
                  Supprimer {entityName}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold text-foreground">{itemLabel}</span> ?
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Cette action est irréversible.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {loading ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
