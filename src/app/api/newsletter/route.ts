import { sendNewsletterConfirmation } from "@/lib/newsletter-mail";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.MAISON_NEWSLETTER_SECRET || !process.env.RESEND_API_KEY ||
      !process.env.MAISON_RESEND_FROM ||
      !process.env.MAISON_SUPABASE_URL || !process.env.MAISON_SUPABASE_SERVICE_ROLE_KEY)
    return Response.json({ error: "Drop notifications are not configured yet." }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? "0") > 4000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  const origin = request.headers.get("origin");
  if (origin && !["https://www.maisonamiral.co.za", "https://maisonamiral.co.za"].includes(origin) &&
      !/^http:\/\/localhost(:\d+)?$/.test(origin))
    return Response.json({ error: "Origin not allowed." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!raw || typeof raw !== "object")
    return Response.json({ error: "Invalid details." }, { status: 400 });
  const body = raw as Record<string, unknown>;
  if (typeof body.website === "string" && body.website.length)
    return Response.json({ ok: true });
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 || body.consent !== true)
    return Response.json({ error: "Enter a valid email and agree to receive updates." }, { status: 400 });
  try {
    await sendNewsletterConfirmation(email);
    return Response.json({ ok: true, message: "Check your inbox to confirm your subscription." });
  } catch {
    return Response.json({ error: "Confirmation email could not be sent. Please try again." }, { status: 503 });
  }
}
