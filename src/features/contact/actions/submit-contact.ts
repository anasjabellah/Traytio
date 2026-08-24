"use server"

import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"
import { COMMON } from "@/lib/notify/messages"
import { prisma } from "@/lib/prisma"
import { contactSchema } from "../validations/contact-schema"

async function submitContactHandler(data: Record<string, unknown>) {
  const parsed = contactSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? COMMON.INVALID_DATA }
  }

  try {
    const created = await prisma.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      },
      select: { id: true },
    })

    return {
      success: true,
      data: {
        id: created.id,
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

export const submitContact = withActionGuard(submitContactHandler, { name: "contact:create", public: true })
