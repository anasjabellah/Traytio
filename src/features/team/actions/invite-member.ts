"use server"

import { prisma } from "@/lib/prisma"
import { resend, resendFromEmail } from "@/lib/resend"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { OrgRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { buildInvitationEmailHtml } from "@/emails/invitation-email"

export async function inviteMember(input: { email: string; role: OrgRole }) {
  try {
    const membership = await getCurrentMembership()
    await assertCan("team", "invite")

    const { email, role } = input

    if (!email || !email.includes("@")) {
      return { success: false, error: "Adresse email invalide" }
    }

    if (role === "OWNER") {
      return { success: false, error: "Seul le propriétaire actuel peut transférer la propriété" }
    }

    const existingMember = await prisma.userOrganization.findFirst({
      where: { organizationId: membership.organizationId, user: { email } },
    })
    if (existingMember) {
      return { success: false, error: "Cet utilisateur est déjà membre de l'organisation" }
    }

    const pending = await prisma.invitation.findFirst({
      where: { organizationId: membership.organizationId, email },
    })
    if (pending) {
      return { success: false, error: "Une invitation est déjà en attente pour cet email" }
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invitation = await prisma.invitation.create({
      data: { email, role, token, organizationId: membership.organizationId, expiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const invitationLink = `${appUrl}/accept-invite?token=${token}`

    const [invitedByUser, organization] = await Promise.all([
      prisma.user.findUnique({
        where: { id: membership.userId },
        select: { firstName: true, lastName: true, email: true },
      }),
      prisma.organization.findUnique({
        where: { id: membership.organizationId },
        select: { name: true },
      }),
    ])

    const invitedByName = buildInviterDisplayName(
      invitedByUser?.firstName ?? null,
      invitedByUser?.lastName ?? null,
      invitedByUser?.email ?? null,
    )

    const orgName = buildOrgDisplayName(organization?.name)

    const emailHtml = buildInvitationEmailHtml({
      organizationName: orgName,
      invitedByEmail: invitedByName,
      role,
      invitationLink,
      expiresAt,
    })

    const fromAddress = `TUR <${resendFromEmail}>`
    const toAddress = email
    const subject = `Vous êtes invité à rejoindre ${orgName} sur TUR`

    console.log("[inviteMember] === SENDING EMAIL ===")
    console.log("[inviteMember] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)
    console.log("[inviteMember] from:", fromAddress)
    console.log("[inviteMember] to:", toAddress)
    console.log("[inviteMember] subject:", subject)
    console.log("[inviteMember] emailHtml length:", emailHtml.length)

    const result = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html: emailHtml,
    })

    console.log("[inviteMember] === RESEND RESULT ===")
    console.log("[inviteMember] FULL RESULT:", JSON.stringify(result, null, 2))

    const { error: resendError, data: resendData } = result

    if (resendError) {
      console.error("[inviteMember] === RESEND ERROR ===")
      console.error("[inviteMember] ERROR OBJECT:", resendError)
      console.error("[inviteMember] ERROR NAME:", (resendError as { name?: string }).name)
      console.error("[inviteMember] ERROR MESSAGE:", (resendError as { message?: string }).message)
      console.error("[inviteMember] ERROR STATUS:", (resendError as { statusCode?: number }).statusCode)
      try {
        console.error("[inviteMember] ERROR STRINGIFIED:", JSON.stringify(resendError, null, 2))
      } catch {
        console.error("[inviteMember] ERROR (non-serializable)")
      }
      if (typeof resendError === "object" && resendError !== null) {
        for (const key of Object.keys(resendError as object)) {
          console.error(`[inviteMember] ERROR.${key}:`, (resendError as Record<string, unknown>)[key])
        }
      }
      console.error("[inviteMember] DATA:", resendData)

      await prisma.invitation.delete({ where: { id: invitation.id } })
      return { success: false, error: "Impossible d'envoyer l'email d'invitation. Veuillez réessayer." }
    }

    console.log("[inviteMember] === EMAIL SENT SUCCESSFULLY ===")
    console.log("[inviteMember] RESEND DATA:", JSON.stringify(resendData, null, 2))
    console.log("[inviteMember] Invitation sent to", email, "for org", membership.organizationId)

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    console.error("[inviteMember] Error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to invite member" }
  }
}

function isPlaceholder(value: string): boolean {
  return value.includes("placeholder.local")
}

function buildInviterDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string | null,
): string {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim()
  if (fullName.length > 0) {
    return fullName
  }
  if (email && !isPlaceholder(email)) {
    return email
  }
  return "un administrateur"
}

function buildOrgDisplayName(name: string | null | undefined): string {
  if (!name) return "Mon Organisation"
  if (isPlaceholder(name)) return "Mon Organisation"
  return name
}
