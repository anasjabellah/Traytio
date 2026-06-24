const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function buildInvitationEmailHtml(params: {
  organizationName: string
  invitedByEmail: string
  role: string
  invitationLink: string
  expiresAt: Date
}): string {
  const { organizationName, invitedByEmail, role, invitationLink, expiresAt } = params
  const roleLabel = ROLE_LABELS[role] ?? role
  const expiresFormatted = formatDateFr(expiresAt)
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation TUR</title>
</head>
<body style="margin:0;padding:0;background-color:#faf7f2;font-family:'DM Sans','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
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
            <td align="center" style="padding:24px 0;">
              <span style="display:inline-block;width:64px;height:64px;border-radius:50%;background-color:#f5f0e8;text-align:center;line-height:64px;font-size:28px;">✉️</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px 0;line-height:1.3;">Vous êtes invité à rejoindre</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:600;color:#C9A96E;">${organizationName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f2;border-radius:12px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:8px;"><span style="font-size:12px;color:#8c8c8c;font-weight:500;">RÔLE ATTRIBUÉ</span></td>
                      </tr>
                      <tr>
                        <td><span style="font-size:16px;font-weight:600;color:#1a1a1a;">${roleLabel}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px;background-color:#e8e0d6;font-size:0;line-height:0;padding:0 16px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:8px;"><span style="font-size:12px;color:#8c8c8c;font-weight:500;">INVITÉ PAR</span></td>
                      </tr>
                      <tr>
                        <td><span style="font-size:14px;color:#1a1a1a;">${invitedByEmail}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px;background-color:#e8e0d6;font-size:0;line-height:0;padding:0 16px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:8px;"><span style="font-size:12px;color:#8c8c8c;font-weight:500;">EXPIRATION</span></td>
                      </tr>
                      <tr>
                        <td><span style="font-size:14px;color:#1a1a1a;">${expiresFormatted}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <a href="${escapeHtml(invitationLink)}" style="display:inline-block;padding:14px 32px;background-color:#C9A96E;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">Accepter l'invitation</a>
            </td>
          </tr>
          <tr>
            <td align="center">
              <span style="font-size:13px;color:#8c8c8c;line-height:1.5;">Ce lien expire le ${expiresFormatted}.<br>Si vous n'avez pas demandé cette invitation, ignorez cet email.</span>
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
