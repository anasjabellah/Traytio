"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { resend, resendFromEmail } from "@/lib/resend"
import { getCurrentMembership, assertCan } from "@/lib/assert-role"
import { AUTH } from "@/lib/notify/messages"
import { OrgRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { buildInvitationEmailHtml } from "@/emails/invitation-email"

const inviteMemberSchema = z.object({
  email: z.string().email(AUTH.INVITE.INVALID_EMAIL),
  role: z.nativeEnum(OrgRole),
})

export async function inviteMember(input: { email: string; role: OrgRole }) {
  try {
    const parsed = inviteMemberSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? AUTH.INVITE.ERROR }
    }

    const { email, role } = parsed.data
    const membership = await getCurrentMembership()
    await assertCan("team", "invite")

    if (role === "OWNER") {
      return { success: false, error: AUTH.OWNERSHIP.ONLY_OWNER_CAN_TRANSFER_ALT }
    }

    const existingMember = await prisma.userOrganization.findFirst({
      where: { organizationId: membership.organizationId, user: { email } },
    })
    if (existingMember) {
      return { success: false, error: AUTH.ALREADY_MEMBER }
    }

    const pending = await prisma.invitation.findFirst({
      where: { organizationId: membership.organizationId, email },
    })
    if (pending) {
      return { success: false, error: AUTH.INVITATION.ALREADY_PENDING }
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

    const result = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html: emailHtml,
    })

    const { error: resendError, data: resendData } = result

    if (resendError) {
      const message = typeof resendError === 'object' && resendError !== null
        ? (resendError as { message?: string }).message ?? 'Unknown Resend error'
        : String(resendError)
      console.error("[inviteMember] Resend send failed:", message)

      await prisma.invitation.delete({ where: { id: invitation.id } })
      return { success: false, error: AUTH.INVITE.EMAIL_SEND_FAILED }
    }

    revalidatePath("/dashboard/settings/team")
    return { success: true }
  } catch (err) {
    console.error("[inviteMember] Error:", err)
    return { success: false, error: err instanceof Error ? err.message : AUTH.INVITE.ERROR }
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
