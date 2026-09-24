const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Professionnel",
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function buildSaasActivationEmailHtml(params: {
  firstName: string
  plan: string
  activationUrl: string
  expiresAt: Date
}): string {
  const { firstName, plan, activationUrl, expiresAt } = params
  const planLabel = PLAN_LABELS[plan] ?? plan
  const expiresFormatted = formatDateFr(expiresAt)
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activez votre compte TUR</title>
</head>
<body style="margin:0;padding:0;background-color:#faf7f2;font-family:'Manrope','DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#C9A96E;">TUR</span>
            </td>
          </tr>
          <tr>
            <td style="height:1px;background-color:#f0ebe3;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 8px 0;">
              <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0;line-height:1.3;">Bonjour ${escapeHtml(firstName)}, votre compte est prêt.</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <span style="font-size:14px;color:#1a1a1a;">Votre abonnement <strong>${escapeHtml(planLabel)}</strong> est configuré. Créez votre mot de passe pour accéder à votre tableau de bord.</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${escapeHtml(activationUrl)}" style="display:inline-block;padding:14px 32px;background-color:#C9A96E;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">Activer mon compte</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <span style="font-size:13px;color:#8c8c8c;line-height:1.5;">Ce lien d&apos;activation expire le ${expiresFormatted}.</span>
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="font-size:13px;color:#8c8c8c;line-height:1.5;">Si vous n&apos;avez pas effectué cet achat, ignorez cet email.</span>
            </td>
          </tr>
          <tr>
            <td style="height:1px;background-color:#f0ebe3;font-size:0;line-height:0;padding-top:24px;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding-top:16px;">
              <span style="font-size:12px;color:#bfbfbf;">&copy; ${year} TUR — Plateforme pour traiteurs professionnels</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
