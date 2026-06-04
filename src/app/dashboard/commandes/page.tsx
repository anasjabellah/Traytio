import Link from "next/link"

export default function CommandesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Commandes</h1>
        <Link
          href="/dashboard/commandes/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          + Nouvelle commande
        </Link>
      </div>
      <p className="text-muted-foreground text-sm">Aucune commande pour le moment.</p>
    </div>
  )
}
