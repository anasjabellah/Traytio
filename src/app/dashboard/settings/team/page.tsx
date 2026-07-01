"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, UserPlus, Mail, Shield, Trash2, Crown, X, Loader2, AlertTriangle,
  CheckCircle2, Search, Sparkles, RefreshCw, Clock, UserCheck, ChevronDown,
} from "lucide-react"
import { PageGuard } from "@/components/ui/page-guard"
import { RoleBadge } from "@/components/ui/role-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRole } from "@/hooks/use-role"
import type { Module, Action } from "@/lib/permissions"
import { useTeam } from "@/features/team/hooks/use-team"
import { TEAM_KPI_DEFS } from "@/features/team/constants"
import { KpiCard } from "@/shared/components/kpi-card"
import { inviteMember } from "@/features/team/actions/invite-member"
import { changeMemberRole } from "@/features/team/actions/change-member-role"
import { removeMember } from "@/features/team/actions/remove-member"
import { transferOwnership } from "@/features/team/actions/transfer-ownership"
import { cancelInvitation } from "@/features/team/actions/cancel-invitation"
import { toast } from "sonner"
import type { OrgRole } from "@prisma/client"
import type { TeamMember } from "@/features/team/types"
import { TeamMemberCard } from "@/features/team/components/TeamMemberCard"

const ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "MEMBER", label: "Membre" },
]

function Avatar({ name, email }: { name: string | null; email: string }) {
  const initial = (name ?? email).charAt(0).toUpperCase()
  return (
    <div className="size-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-sm font-semibold text-amber-800 shrink-0 ring-2 ring-white shadow-sm">
      {initial}
    </div>
  )
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })

export default function TeamSettingsPage() {
  const { can, role: currentRole } = useRole()
  const { members, invitations, isLoading, error, kpis, refresh } = useTeam()

  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<OrgRole>("MEMBER")
  const [inviting, setInviting] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    type: "remove" | "transfer" | "cancel-invite"
    memberId?: string
    invitationId?: string
    label: string
  } | null>(null)

  const [changingRole, setChangingRole] = useState<string | null>(null)

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((m) => {
      if (roleFilter && m.role !== roleFilter) return false
      if (!q) return true
      const name = `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim().toLowerCase()
      return name.includes(q) || m.user.email.toLowerCase().includes(q)
    })
  }, [members, query, roleFilter])

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) {
      toast.error("Email invalide")
      return
    }
    setInviting(true)
    const res = await inviteMember({ email: inviteEmail, role: inviteRole })
    setInviting(false)
    if (res.success) {
      toast.success("Invitation envoyée", {
        description: `${inviteEmail} a été invité comme ${inviteRole === "ADMIN" ? "Administrateur" : "Membre"}`,
      })
      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole("MEMBER")
      refresh()
    } else {
      toast.error(res.error ?? "Erreur lors de l'invitation")
    }
  }

  const handleChangeRole = async (memberId: string, newRole: OrgRole) => {
    setChangingRole(memberId)
    const res = await changeMemberRole({ memberId, newRole })
    setChangingRole(null)
    if (res.success) {
      toast.success("Rôle modifié")
      refresh()
    } else {
      toast.error(res.error ?? "Erreur")
    }
  }

  const handleRemoveMember = async () => {
    if (!confirmDialog || !confirmDialog.memberId) return
    const res = await removeMember(confirmDialog.memberId)
    setConfirmDialog(null)
    if (res.success) {
      toast.success("Membre supprimé")
      refresh()
    } else {
      toast.error(res.error ?? "Erreur")
    }
  }

  const handleTransferOwnership = async () => {
    if (!confirmDialog || !confirmDialog.memberId) return
    const res = await transferOwnership(confirmDialog.memberId)
    setConfirmDialog(null)
    if (res.success) {
      toast.success("Propriété transférée")
      refresh()
    } else {
      toast.error(res.error ?? "Erreur")
    }
  }

  const handleCancelInvitation = async () => {
    if (!confirmDialog || !confirmDialog.invitationId) return
    const res = await cancelInvitation(confirmDialog.invitationId)
    setConfirmDialog(null)
    if (res.success) {
      toast.success("Invitation annulée")
      refresh()
    } else {
      toast.error(res.error ?? "Erreur")
    }
  }

  const canManage = (targetRole: OrgRole) => {
    if (currentRole === "OWNER") return true
    if (currentRole === "ADMIN") return targetRole === "MEMBER"
    return false
  }

  const isSearching = query.length > 0 || !!roleFilter
  const hasNoResults = !isLoading && isSearching && filteredMembers.length === 0
  const hasNoMembers = !isLoading && !isSearching && members.length === 0

  return (
    <PageGuard module="team" action="view">
      <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
        <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

        <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Badge variant="outline" className="gap-1 border-[var(--gold)]/40 bg-[var(--gold-soft)]/40 font-normal text-xs px-2 py-0">
                  <Users className="size-3 text-[var(--gold-deep)]" /> Équipe
                </Badge>
                <span className="text-muted-foreground/40 mx-1">•</span>
                <span>{kpis.totalMembers} membre{kpis.totalMembers > 1 ? 's' : ''}</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                Équipe
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Gérez les membres de votre organisation et leurs permissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {can("team", "invite") && (
                <Button
                  onClick={() => setInviteOpen(true)}
                  className="h-11 min-h-[44px] rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95 gap-2 px-4"
                >
                  <UserPlus className="size-4" /> Inviter un membre
                </Button>
              )}
              <button
                onClick={refresh}
                className="size-11 min-w-[44px] min-h-[44px] rounded-xl border border-border bg-background/60 backdrop-blur text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                title="Actualiser"
              >
                <RefreshCw className={`size-[18px] ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {TEAM_KPI_DEFS.map((def, i) => (
              <KpiCard
                key={def.key}
                label={def.label}
                value={kpis[def.key as keyof typeof kpis] as number}
                icon={def.icon}
                delta={0}
                trend="up"
                spark={[1, 1, 1, 1, 1, 1, 1]}
                delay={i * 0.05}
              />
            ))}
          </div>

          {/* Toolbar */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-soft backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[220px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un membre — nom, email…"
                  className="h-11 rounded-xl border-transparent bg-[var(--surface-soft)] pl-11 text-sm focus-visible:bg-background"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-0 h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20"
              >
                <option value="">Tous les rôles</option>
                <option value="OWNER">Propriétaire</option>
                <option value="ADMIN">Administrateur</option>
                <option value="MEMBER">Membre</option>
              </select>
              {(query || roleFilter) && (
                <button
                  onClick={() => { setQuery(""); setRoleFilter(""); }}
                  className="h-11 px-3 rounded-xl border border-border bg-background text-xs text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
                >
                  <X className="size-3.5" /> Réinitialiser
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}

          {/* Content */}
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* Main: Members Table */}
            <div>
              {isLoading ? (
                <div className="rounded-2xl border border-border bg-card shadow-soft">
                  <div className="px-6 py-5 border-b border-border/50">
                    <div className="h-4 w-32 bg-foreground/[0.06] rounded animate-pulse" />
                  </div>
                  <div className="divide-y divide-border/30">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <div className="size-9 rounded-full bg-foreground/[0.06] animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-40 bg-foreground/[0.06] rounded animate-pulse" />
                          <div className="h-3 w-24 bg-foreground/[0.04] rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-20 bg-foreground/[0.06] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : hasNoMembers ? (
                <EmptyState onCreate={() => setInviteOpen(true)} />
              ) : hasNoResults ? (
                <NoResultsEmpty query={query}                 onClear={() => { setQuery(""); setRoleFilter(""); }} />
              ) : (
                <>
                  <div className="hidden md:block rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Effectif</div>
                        <h3 className="font-display text-xl mt-0.5">Tous les membres</h3>
                      </div>
                      <span className="text-xs text-muted-foreground/60">{filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-y border-border/30">
                            <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Membre</th>
                            <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Rôle</th>
                            <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Statut</th>
                            <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Arrivée</th>
                            <th className="w-[180px]" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {filteredMembers.map((member, idx) => (
                            <TeamRow
                              key={member.id}
                              member={member}
                              idx={idx}
                              currentRole={currentRole}
                              changingRole={changingRole}
                              canManage={canManage}
                              can={can}
                              onRoleChange={handleChangeRole}
                              onRemove={(m) => setConfirmDialog({
                                type: "remove",
                                memberId: m.id,
                                label: `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.email,
                              })}
                              onTransfer={(m) => setConfirmDialog({
                                type: "transfer",
                                memberId: m.id,
                                label: `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.email,
                              })}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl">Tous les membres</h3>
                      <span className="text-xs text-muted-foreground/60">{filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''}</span>
                    </div>
                    {filteredMembers.map((member, idx) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        idx={idx}
                        currentRole={currentRole}
                        changingRole={changingRole}
                        canManage={canManage}
                        can={can}
                        onRoleChange={handleChangeRole}
                        onRemove={(m) => setConfirmDialog({
                          type: "remove",
                          memberId: m.id,
                          label: `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.email,
                        })}
                        onTransfer={(m) => setConfirmDialog({
                          type: "transfer",
                          memberId: m.id,
                          label: `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.email,
                        })}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Invitations Card */}
              <div className="rounded-2xl border border-border bg-card shadow-soft">
                <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  <span className="text-sm font-semibold">Invitations ({invitations.length})</span>
                </div>
                {invitations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                    <div className="size-10 rounded-full bg-foreground/[0.04] flex items-center justify-center mb-2">
                      <UserPlus className="size-4 text-muted-foreground/30" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground/60">Aucune invitation en attente</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-foreground/[0.02] transition-colors">
                        <div className="size-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <Mail className="size-3.5 text-amber-600" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <RoleBadge role={inv.role} />
                            <span className="text-[10px] text-muted-foreground/50">
                              Expire le {formatDate(inv.expiresAt)}
                            </span>
                          </div>
                        </div>
                        {can("team", "remove") && (
                          <button
                            onClick={() => setConfirmDialog({
                              type: "cancel-invite",
                              invitationId: inv.id,
                              label: inv.email,
                            })}
                            className="size-7 rounded-md hover:bg-red-50 hover:text-red-500 text-muted-foreground/40 transition-all flex items-center justify-center shrink-0"
                            title="Annuler l'invitation"
                          >
                            <X className="size-3.5" strokeWidth={1.8} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Shield className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Répartition des rôles
                </div>
                <div className="space-y-2.5">
                  {(["OWNER", "ADMIN", "MEMBER"] as OrgRole[]).map((role) => {
                    const count = members.filter((m) => m.role === role).length
                    const max = members.length || 1
                    const pct = Math.round((count / max) * 100)
                    return (
                      <div key={role}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-foreground font-medium">
                            {role === "OWNER" ? "Propriétaire" : role === "ADMIN" ? "Administrateur" : "Membre"}
                          </span>
                          <span className="text-muted-foreground tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full",
                              role === "OWNER" ? "bg-amber-500" :
                              role === "ADMIN" ? "bg-blue-500" : "bg-emerald-500"
                            )}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick tip */}
              <div className="rounded-2xl border border-border/60 bg-amber-50/30 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div className="text-xs text-amber-800/80">
                    <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                    <p>
                      Les invitations sont valables 7 jours. Seuls les administrateurs et le propriétaire peuvent gérer les membres.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Tous les services opérationnels
            </div>
            <div>© TUR — Suite traiteur premium</div>
          </footer>
        </div>
      </div>

      {/* Invite Dialog */}
      <AnimatePresence>
        {inviteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
            onClick={() => setInviteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Inviter un membre</h2>
                <button
                  onClick={() => setInviteOpen(false)}
                  className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-all"
                >
                  <X className="size-4" strokeWidth={1.8} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20 focus:border-[var(--gold-deep)]/40 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Rôle</label>
                  <div className="flex gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setInviteRole(opt.value)}
                        className={`flex-1 h-10 rounded-xl border text-xs font-semibold transition-all ${
                          inviteRole === opt.value
                            ? "border-[var(--gold-deep)] bg-amber-50 text-amber-800"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/20"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/50 flex items-center justify-end gap-2">
                <button
                  onClick={() => setInviteOpen(false)}
                  className="h-9 px-4 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.includes("@")}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--gold-deep)] hover:bg-[var(--gold-deep)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
                >
                  {inviting ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : <UserPlus className="size-3.5" strokeWidth={2} />}
                  {inviting ? "Invitation..." : "Inviter"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-xl p-6 text-center"
            >
              <div className={`mx-auto size-12 rounded-2xl flex items-center justify-center mb-4 ${
                confirmDialog.type === "transfer" ? "bg-amber-50" : "bg-red-50"
              }`}>
                {confirmDialog.type === "transfer" ? (
                  <Crown className="size-5 text-amber-600" strokeWidth={1.8} />
                ) : (
                  <AlertTriangle className="size-5 text-red-500" strokeWidth={1.8} />
                )}
              </div>

              <h3 className="font-display text-lg font-semibold mb-2">
                {confirmDialog.type === "remove" && "Supprimer le membre"}
                {confirmDialog.type === "transfer" && "Transférer la propriété"}
                {confirmDialog.type === "cancel-invite" && "Annuler l'invitation"}
              </h3>

              <p className="text-sm text-muted-foreground mb-6">
                {confirmDialog.type === "remove" && `Êtes-vous sûr de vouloir supprimer ${confirmDialog.label} de l'organisation ?`}
                {confirmDialog.type === "transfer" && `Transférer la propriété à ${confirmDialog.label} ? Vous deviendrez administrateur.`}
                {confirmDialog.type === "cancel-invite" && `Annuler l'invitation de ${confirmDialog.label} ?`}
              </p>

              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="h-9 px-5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={
                    confirmDialog.type === "remove" ? handleRemoveMember :
                    confirmDialog.type === "transfer" ? handleTransferOwnership :
                    handleCancelInvitation
                  }
                  className={`inline-flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-semibold text-white transition-all ${
                    confirmDialog.type === "transfer"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {confirmDialog.type === "transfer" ? "Transférer" : "Confirmer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageGuard>
  )
}

/* ---------------- Team Row ---------------- */

function TeamRow({
  member, idx, currentRole, changingRole, canManage, can, onRoleChange, onRemove, onTransfer,
}: {
  member: TeamMember
  idx: number
  currentRole: string | null
  changingRole: string | null
  canManage: (role: OrgRole) => boolean
  can: (module: Module, action: Action) => boolean
  onRoleChange: (id: string, role: OrgRole) => void
  onRemove: (member: TeamMember) => void
  onTransfer: (member: TeamMember) => void
}) {
  const name = `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || "Utilisateur"
  const isOwner = member.role === "OWNER"

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.025 }}
      className="group transition-colors hover:bg-foreground/[0.02]"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} email={member.user.email} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate max-w-[180px]">{name}</span>
              {isOwner && <Crown className="size-3.5 text-amber-500 shrink-0" strokeWidth={2} />}
            </div>
            <div className="text-xs text-muted-foreground/60">{member.user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        {can("team", "change-role") && canManage(member.role) && !isOwner ? (
          <div className="relative inline-flex">
            <select
              value={member.role}
              disabled={changingRole === member.id}
              onChange={(e) => onRoleChange(member.id, e.target.value as OrgRole)}
              className="appearance-none bg-transparent border border-border rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium cursor-pointer hover:border-foreground/20 transition-colors disabled:opacity-50"
            >
              <option value="ADMIN">Administrateur</option>
              <option value="MEMBER">Membre</option>
            </select>
            {changingRole === member.id ? (
              <Loader2 className="size-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
            )}
          </div>
        ) : (
          <RoleBadge role={member.role} />
        )}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-emerald-200/50">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Actif
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground tabular-nums">
        {formatDate(member.createdAt)}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isOwner && currentRole === "OWNER" && member.role === "ADMIN" && (
            <button
              onClick={() => onTransfer(member)}
              className="inline-flex items-center gap-1 min-h-[44px] md:min-h-0 md:h-8 px-2.5 rounded-lg border border-border bg-white text-xs font-medium text-muted-foreground/60 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
              title="Transférer la propriété"
            >
              <Crown className="size-3" strokeWidth={1.8} />
              Transférer
            </button>
          )}
          {can("team", "remove") && canManage(member.role) && !isOwner && (
            <button
              onClick={() => onRemove(member)}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-8 rounded-lg border border-border bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-muted-foreground/50 transition-all flex items-center justify-center"
              title="Supprimer"
            >
              <Trash2 className="size-3.5" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  )
}

/* ---------------- Empty states ---------------- */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="grid place-items-center rounded-3xl border border-dashed border-border bg-card/60 py-12 px-6 sm:p-16 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--gold-soft)]">
        <Users className="h-7 w-7 text-[var(--gold-deep)]" />
      </div>
      <h3 className="mt-5 font-display text-2xl tracking-tight text-charcoal">Aucun membre</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Invitez des collaborateurs à rejoindre votre organisation pour travailler ensemble.
      </p>
      <Button onClick={onCreate} className="mt-6 gap-2 bg-gradient-charcoal text-white shadow-lift hover:opacity-90">
        <UserPlus className="size-4" /> Inviter un membre
      </Button>
    </motion.div>
  )
}

function NoResultsEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="size-20 rounded-[1.25rem] border-2 border-dashed border-border/60 bg-background flex items-center justify-center">
          <Search className="size-9 text-muted-foreground/30" strokeWidth={1.2} />
        </div>
        <div>
          <h3 className="font-display text-2xl text-foreground">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Aucun membre ne correspond à votre recherche &laquo; <span className="font-medium text-foreground">{query}</span> &raquo;
          </p>
        </div>
        <button onClick={onClear}
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm"
        >
          <X className="size-4" strokeWidth={1.8} /> Effacer les filtres
        </button>
      </div>
    </div>
  )
}
