import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 size-16 rounded-2xl bg-red-50 ring-1 ring-red-200/60 flex items-center justify-center">
          <ShieldAlert className="size-8 text-red-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-display font-semibold text-foreground mb-2">
          Accès refusé
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette page.
          Contactez le propriétaire de l&apos;organisation si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
