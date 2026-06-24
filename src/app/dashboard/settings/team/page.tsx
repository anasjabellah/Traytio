"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Users, UserPlus, Mail, Shield, Trash2, Crown, ArrowRight, X, Loader2, AlertTriangle, CheckCircle2, Settings, ChevronDown } from "lucide-react"
import { PageGuard } from "@/components/ui/page-guard"
import { RoleBadge } from "@/components/ui/role-badge"
import { useRole } from "@/hooks/use-role"
import { getTeam } from "@/features/team/actions/get-team"
import { inviteMember } from "@/features/team/actions/invite-member"
import { changeMemberRole } from "@/features/team/actions/change-member-role"
import { removeMember } from "@/features/team/actions/remove-member"
import { transferOwnership } from "@/features/team/actions/transfer-ownership"
import { cancelInvitation } from "@/features/team/actions/cancel-invitation"
import { toast } from "sonner"
import type { OrgRole } from "@prisma/client"

type Member = {
  id: string
  userId: string
  role: OrgRole
  createdAt: string
  user: {
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
    createdAt: string
  }
}

type Invitation = {
  id: string
  email: string
  role: OrgRole
  token: string
  createdAt: string
  expiresAt: string
}

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

export default function TeamSettingsPage() {
  const router = useRouter()
  const { can, role: currentRole } = useRole()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

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

  const fetchTeam = useCallback(async () => {
    setLoading(true)
    const res = await getTeam()
    if (res.success && res.data) {
      setMembers(res.data.members)
      setInvitations(res.data.invitations)
    } else {
      toast.error("Erreur", { description: res.error ?? "Impossible de charger l'équipe" })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) {
      toast.error("Email invalide")
      return
    }
    setInviting(true)
    const res = await inviteMember({ email: inviteEmail, role: inviteRole })
    setInviting(false)
    if (res.success) {
      toast.success("Invitation envoyée", { description: `${inviteEmail} a été invité comme ${inviteRole === "ADMIN" ? "Administrateur" : "Membre"}` })
      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole("MEMBER")
      fetchTeam()
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
      fetchTeam()
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
      fetchTeam()
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
      fetchTeam()
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
      fetchTeam()
    } else {
      toast.error(res.error ?? "Erreur")
    }
  }

  const currentUserMember = members.find((m) => m.role === currentRole)

  const canManage = (targetRole: OrgRole) => {
    if (currentRole === "OWNER") return true
    if (currentRole === "ADMIN") return targetRole === "MEMBER"
    return false
  }

  return (
    <PageGuard module="team" action="view">
      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 flex items-center justify-center">
              <Users className="size-5 text-amber-600" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Équipe</h1>
              <p className="text-sm text-muted-foreground">Gérez les membres et les invitations</p>
            </div>
          </div>
          {can("team", "invite") && (
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--gold-deep)] hover:bg-[var(--gold-deep)]/90 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <UserPlus className="size-4" strokeWidth={2} />
              Inviter un membre
            </button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Section */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  <span className="text-sm font-semibold">Membres ({members.length})</span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-muted-foreground/40" />
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="size-10 text-muted-foreground/20 mb-3" strokeWidth={1.2} />
                  <p className="text-sm text-muted-foreground/60">Aucun membre</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {members.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <Avatar name={`${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email} email={member.user.email} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {`${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || "Utilisateur"}
                          </span>
                          {member.role === "OWNER" && (
                            <Crown className="size-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{member.user.email}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>Membre depuis {new Date(member.createdAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {can("team", "change-role") && canManage(member.role) && member.role !== "OWNER" ? (
                          <div className="relative">
                            <select
                              value={member.role}
                              disabled={changingRole === member.id}
                              onChange={(e) => handleChangeRole(member.id, e.target.value as OrgRole)}
                              className="appearance-none bg-transparent border border-border rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium cursor-pointer hover:border-foreground/20 transition-colors disabled:opacity-50"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
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
                        {can("team", "remove") && canManage(member.role) && member.role !== "OWNER" && (
                          <button
                            onClick={() => setConfirmDialog({ type: "remove", memberId: member.id, label: `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email })}
                            className="size-8 rounded-lg border border-border bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-muted-foreground/50 transition-all flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.8} />
                          </button>
                        )}
                        {currentRole === "OWNER" && member.role === "ADMIN" && (
                          <button
                            onClick={() => setConfirmDialog({ type: "transfer", memberId: member.id, label: `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email })}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-xs font-medium text-muted-foreground/60 transition-all"
                            title="Transférer la propriété"
                          >
                            <Crown className="size-3" strokeWidth={1.8} />
                            Transférer
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Invitations Section */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  <span className="text-sm font-semibold">Invitations en attente ({invitations.length})</span>
                </div>
              </div>

              {invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                  <UserPlus className="size-8 text-muted-foreground/20 mb-2" strokeWidth={1.2} />
                  <p className="text-xs text-muted-foreground/60">Aucune invitation en attente</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RoleBadge role={inv.role} />
                          <span className="text-[10px] text-muted-foreground/50">
                            Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      {can("team", "remove") && (
                        <button
                          onClick={() => setConfirmDialog({ type: "cancel-invite", invitationId: inv.id, label: inv.email })}
                          className="size-7 rounded-md hover:bg-red-50 hover:text-red-500 text-muted-foreground/40 transition-all flex items-center justify-center"
                          title="Annuler l'invitation"
                        >
                          <X className="size-3.5" strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Invite Link Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-border/60 bg-amber-50/30 p-4"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.8} />
                <div className="text-xs text-amber-800/80">
                  <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                  <p>
                    Les invitations sont valables 7 jours. Partagez le lien d&apos;invitation avec la personne concernée,
                    ou transmettez-lui le token directement.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Invite Modal */}
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
                    className="size-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-all"
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
                    <Crown className={`size-5 ${confirmDialog.type === "transfer" ? "text-amber-600" : "text-red-500"}`} strokeWidth={1.8} />
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
      </div>
    </PageGuard>
  )
}
