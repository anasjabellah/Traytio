"use server"

import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"
import { COMMON } from "@/lib/notify/messages"
import { prisma } from "@/lib/prisma"
import { demoRequestSchema } from "../validations/demo-request-schema"

async function submitDemoRequestHandler(data: Record<string, unknown>) {
  const parsed = demoRequestSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? COMMON.INVALID_DATA }
  }

  const { message, privacyAccepted, ...rest } = parsed.data

  try {
    const created = await prisma.demoRequest.create({
      data: {
        fullName: rest.fullName,
        companyName: rest.companyName,
        email: rest.email,
        phone: rest.phone,
        city: rest.city,
        country: rest.country,
        companySize: rest.companySize,
        monthlyEvents: rest.monthlyEvents,
        message: message || null,
        privacyAccepted: privacyAccepted === true,
        status: "pending",
      },
      select: { id: true },
    })

    return {
      success: true,
      data: {
        id: created.id,
        status: "pending" as const,
        submittedAt: new Date().toISOString(),
      },
    }
  } catch (err) {
    // Database failure must never surface as a success. The raw error is
    // logged server-side (normalizeActionError) but only a generic message is
    // returned to the client.
    return { success: false, error: normalizeActionError(err, COMMON.UNEXPECTED_ERROR) }
  }
}

export const submitDemoRequest = withActionGuard(submitDemoRequestHandler, { name: "demo-requests:create", public: true })
