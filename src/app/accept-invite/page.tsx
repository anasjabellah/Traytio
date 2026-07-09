"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs"
import { AUTH } from "@/lib/notify/messages"
import { getInvitationByToken } from "@/features/team/actions/get-invitation-by-token"
import { acceptInvite } from "@/features/team/actions/accept-invite"
import { RoleBadge } from "@/components/ui/role-badge"
import { motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, Mail, Building2, Loader2 } from "lucide-react"
import type { OrgRole } from "@prisma/client"

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#faf7f2] to-background p-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground/50" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { isLoaded, isSignedIn, user } = useUser()
  const [invitation, setInvitation] = useState<{
    email: string
    role: OrgRole
    organizationName: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!token) {
      setError(AUTH.ACCEPT.INVALID_LINK)
      return
    }
    getInvitationByToken(token).then((res) => {
      if (res.success && res.data) {
        setInvitation(res.data)
      } else {
        setError(res.error ?? AUTH.ACCEPT.INVALID_OR_EXPIRED)
      }
    })
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true)
    const res = await acceptInvite(token)
    setAccepting(false)
    if (res.success) {
      setAccepted(true)
    } else {
      setError(res.error ?? AUTH.ACCEPT.ERROR)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#faf7f2] to-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8 text-center"
        >
          <div className="mx-auto size-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="size-6 text-red-500" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-xl font-semibold mb-2">Invitation invalide</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-medium"
          >
            Retour au tableau de bord
          </a>
        </motion.div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#faf7f2] to-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8 text-center"
        >
          <Loader2 className="size-8 animate-spin text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{AUTH.ACCEPT.LOADING}</p>
        </motion.div>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#faf7f2] to-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8 text-center"
        >
          <div className="mx-auto size-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="size-6 text-emerald-500" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-xl font-semibold mb-2">{AUTH.ACCEPT.SUCCESS_TITLE}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {AUTH.ACCEPT.SUCCESS_DESCRIPTION_PREFIX} <strong>{invitation.organizationName}</strong>{AUTH.ACCEPT.SUCCESS_DESCRIPTION_SUFFIX}
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-medium"
          >
            Accéder au tableau de bord
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#faf7f2] to-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8"
      >
        <div className="mx-auto size-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <Building2 className="size-6 text-amber-600" strokeWidth={1.8} />
        </div>

        <h1 className="font-display text-xl font-semibold text-center mb-1">
          Invitation à rejoindre
        </h1>
        <p className="text-lg font-semibold text-center text-[var(--gold-deep)] mb-6">
          {invitation.organizationName}
        </p>

        <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Email</span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
              {invitation.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Rôle</span>
            <RoleBadge role={invitation.role} />
          </div>
        </div>

        {!isLoaded ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground/50" />
          </div>
        ) : isSignedIn ? (
          <>
            {user?.emailAddresses?.[0]?.emailAddress !== invitation.email && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" strokeWidth={1.8} />
                <span>
                  {AUTH.ACCEPT.EMAIL_MISMATCH_PREFIX} <strong>{user.emailAddresses?.[0]?.emailAddress}</strong>{AUTH.ACCEPT.EMAIL_MISMATCH_MIDDLE} <strong>{invitation.email}</strong>{AUTH.ACCEPT.EMAIL_MISMATCH_SUFFIX}
                </span>
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting || user?.emailAddresses?.[0]?.emailAddress !== invitation.email}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--gold-deep)] hover:bg-[var(--gold-deep)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {accepting ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <CheckCircle2 className="size-4" strokeWidth={2} />}
              {accepting ? "Acceptation..." : "Accepter l'invitation"}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <SignInButton mode="redirect" fallbackRedirectUrl={`/accept-invite?token=${token}`}>
              <button className="w-full inline-flex items-center justify-center h-12 rounded-xl bg-[var(--gold-deep)] hover:bg-[var(--gold-deep)]/90 text-white text-sm font-semibold transition-all">
                Se connecter pour accepter
              </button>
            </SignInButton>
            <p className="text-center text-xs text-muted-foreground">
              Pas encore de compte ?{" "}
              <SignUpButton mode="redirect" fallbackRedirectUrl={`/accept-invite?token=${token}`}>
                <span className="text-[var(--gold-deep)] hover:underline cursor-pointer">Créer un compte</span>
              </SignUpButton>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
