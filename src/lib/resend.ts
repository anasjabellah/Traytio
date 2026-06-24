import { Resend } from "resend"

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined
  fromEmail: string | undefined
}

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set")
  }
  return new Resend(apiKey)
}

function resolveFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL
  if (configured) {
    return configured
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[Resend] RESEND_FROM_EMAIL not configured. Using onboarding@resend.dev (Resend test sender). " +
        "Set RESEND_FROM_EMAIL to a verified domain in production."
    )
  }
  return "onboarding@resend.dev"
}

export const resend = globalForResend.resend ?? createResendClient()
export const resendFromEmail = globalForResend.fromEmail ?? resolveFromEmail()

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend
  globalForResend.fromEmail = resendFromEmail
}
