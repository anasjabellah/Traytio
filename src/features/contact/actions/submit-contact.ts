"use server"

import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"
import { COMMON } from "@/lib/notify/messages"
import { contactSchema } from "../validations/contact-schema"

async function submitContactHandler(data: Record<string, unknown>) {
  try {
    const parsed = contactSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? COMMON.INVALID_DATA }
    }

    console.log("[contact]", { ...parsed.data, submittedAt: new Date().toISOString() })

    return {
      success: true,
      data: {
        id: `ct_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        submittedAt: new Date().toISOString(),
      },
    }
  } catch (err) {
    return { success: false, error: normalizeActionError(err, COMMON.UNEXPECTED_ERROR) }
  }
}

export const submitContact = withActionGuard(submitContactHandler, { name: "contact:create", public: true })
