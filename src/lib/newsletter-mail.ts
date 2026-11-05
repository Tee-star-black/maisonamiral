import "server-only";
import { createNewsletterToken } from "./newsletter-tokens";

const site = "https://www.maisonamiral.co.za";
export async function sendNewsletterConfirmation(email: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAISON_RESEND_FROM;
  if (!key?.startsWith("re_") || !from) throw new Error("Resend not configured");
  const confirmUrl = site + "/newsletter/confirm?token=" +
    encodeURIComponent(createNewsletterToken(email, "confirm"));
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [email], subject: "Confirm your Maison Amiral drop updates",
      text: `Thanks for your interest in Maison Amiral. Confirm your email to receive future drop announcements: ${confirmUrl}\n\nIf you didn't subscribe, ignore this email. The link expires after 48 hours.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:36px;color:#202420"><p style="letter-spacing:3px">MAISON AMIRAL</p><h1>You're almost on the list.</h1><p>Confirm your email to receive early access and new collection announcements.</p><p><a href="${confirmUrl}" style="display:inline-block;padding:16px 24px;background:#202420;color:#fff;text-decoration:none">CONFIRM SUBSCRIPTION</a></p><p style="color:#777">This link expires in 48 hours. If you didn't request this, no action is needed.</p></div>`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Confirmation email could not be sent");
}
