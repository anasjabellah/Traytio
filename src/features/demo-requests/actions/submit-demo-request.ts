"use server"

import { withActionGuard } from "@/lib/action-guard"
import { normalizeActionError } from "@/lib/action-error"
import { COMMON } from "@/lib/notify/messages"
import { demoRequestSchema } from "../validations/demo-request-schema"

async function submitDemoRequestHandler(data: Record<string, unknown>) {
  try {
    const parsed = demoRequestSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? COMMON.INVALID_DATA }
    }

    const { message, ...rest } = parsed.data

    // TODO: Persist demo request to database once the DemoRequest model is created.
    console.log("[demo-request]", { ...rest, message: message || null, submittedAt: new Date().toISOString() })

    return {
      success: true,
      data: {
        id: `dr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        status: "pending" as const,
        submittedAt: new Date().toISOString(),
      },
    }
  } catch (err) {
    return { success: false, error: normalizeActionError(err, COMMON.UNEXPECTED_ERROR) }
  }
}

export const submitDemoRequest = withActionGuard(submitDemoRequestHandler, { name: "demo-requests:create", public: true })
