type EmailShellOptions = {
  eyebrow: string;
  title: string;
  body: string;
  preheader?: string;
  siteUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function maisonEmailShell({ eyebrow, title, body, preheader = "Maison Amiral correspondence", siteUrl }: EmailShellOptions) {
  const origin = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.maisonamiral.co.za").replace(/\/$/, "");
  const shipUrl = `${origin}/graphics/ship.png`;

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;border-collapse:collapse;border-left:1px solid #d9d9d9;border-right:1px solid #d9d9d9;">
            <tr>
              <td style="padding:28px 30px;border-bottom:1px solid #d9d9d9;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:10px;letter-spacing:2px;text-transform:uppercase;vertical-align:middle;">MAISON AMIRAL<br><span style="color:#777777;">JOHANNESBURG / HOUSE SIGNAL</span></td>
                    <td align="right" style="vertical-align:middle;"><img src="${shipUrl}" alt="Maison Amiral" width="34" style="display:block;width:34px;height:auto;filter:brightness(0);" /></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:54px 30px 42px;">
                <p style="margin:0 0 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6d6d6d;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:52px;line-height:.95;font-weight:400;letter-spacing:-1.6px;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 54px;font-size:14px;line-height:1.65;color:#222222;">${body}</td>
            </tr>
            <tr>
              <td style="background:#111111;color:#ffffff;padding:28px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:9px;line-height:1.6;letter-spacing:1.6px;text-transform:uppercase;">AMIRAL SIGNATURE<br><span style="color:#a8a8a8;">26.2041° S / 28.0473° E<br>JOHANNESBURG, SOUTH AFRICA</span></td>
                    <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:-.4px;">MAISON AMIRAL</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail(firstName?: string) {
  const greeting = firstName ? `Welcome, ${escapeHtml(firstName)}.` : "Welcome to the house.";
  return maisonEmailShell({
    eyebrow: "HOUSE CORRESPONDENCE / 001",
    title: greeting,
    preheader: "You are now part of Maison Amiral House Correspondence.",
    body: `
      <p style="margin:0 0 24px;max-width:560px;">You are now connected to Maison Amiral House Correspondence. We write when there is something worth sending: releases, objects, places, process and occasional signals from Johannesburg.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #d9d9d9;border-bottom:1px solid #d9d9d9;margin:32px 0;">
        <tr><td style="padding:14px 0;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#777;">STATUS</td><td align="right" style="padding:14px 0;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">HOUSE CORRESPONDENCE / ACTIVE</td></tr>
        <tr><td style="padding:14px 0;border-top:1px solid #d9d9d9;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#777;">FREQUENCY</td><td align="right" style="padding:14px 0;border-top:1px solid #d9d9d9;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">OCCASIONAL</td></tr>
      </table>
      <p style="margin:0;color:#666666;font-size:12px;">The Maison does not write often.</p>
    `,
  });
}
