"use client";

import { notify } from "@/lib/notify";

const BTN =
  "px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted transition-colors";

export default function TestToastPage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-2xl">Test — Notification System</h1>
        <p className="text-sm text-muted-foreground">
          Click each button to verify the notify API works.
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <button className={BTN} onClick={() => notify.success("Toast opérationnel")}>
            notify.success("Toast opérationnel")
          </button>

          <button className={BTN} onClick={() => notify.error("Une erreur est survenue.")}>
            notify.error("Une erreur est survenue.")
          </button>

          <button className={BTN} onClick={() => notify.warning("Veuillez compléter les champs obligatoires.")}>
            notify.warning("Veuillez compléter les champs obligatoires.")
          </button>

          <button className={BTN} onClick={() => notify.info("Action disponible.")}>
            notify.info("Action disponible.")
          </button>

          <button className={BTN} onClick={() => notify.loading("Téléchargement en cours...")}>
            notify.loading("Téléchargement en cours...")
          </button>

          <button
            className={BTN}
            onClick={() =>
              notify.promise(
                new Promise((r) => setTimeout(r, 2000)),
                {
                  loading: "Création de la commande...",
                  success: "Commande créée avec succès.",
                  error: "Échec de la création.",
                },
              )
            }
          >
            notify.promise(...) — 2s delay
          </button>
        </div>

        <p className="pt-8 text-xs text-muted-foreground">
          Remove this page before deploying. Route:{" "}
          <code className="bg-muted px-1 rounded">/test-toast</code>
        </p>
      </div>
    </main>
  );
}
