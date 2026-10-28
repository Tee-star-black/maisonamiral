import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.MAISON_SUPABASE_URL || !process.env.MAISON_SUPABASE_SERVICE_ROLE_KEY)
    return Response.json({ error: "Email notifications are not yet available." }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? "0") > 4000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!raw || typeof raw !== "object")
    return Response.json({ error: "Invalid details." }, { status: 400 });
  const body = raw as Record<string, unknown>;
  if (typeof body.website === "string" && body.website.length) {
    return Response.json({ ok: true });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || body.consent !== true)
    return Response.json({ error: "Enter a valid email and agree to receive updates." }, { status: 400 });
  try {
    await storeDb("maison_subscribers", "POST", {
      query: { on_conflict: "email" },
      body: { email, consent_at: new Date().toISOString() },
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to save your email. Please try again." }, { status: 503 });
  }
}
