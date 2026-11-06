import { createNewsletterToken, verifyNewsletterToken } from "@/lib/newsletter-tokens";
import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let token: FormDataEntryValue | null;
  try { token = (await request.formData()).get("token"); } catch { return new Response("Invalid request", { status: 400 }); }
  const email = verifyNewsletterToken(token, "confirm");
  if (!email) return new Response("Invalid or expired confirmation link.", { status: 400 });
  try {
    await storeDb("maison_subscribers", "POST", {
      query: { on_conflict: "email" },
      body: { email, consent_at: new Date().toISOString() },
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    const destination = new URL("/newsletter/confirmed", request.url);
    destination.searchParams.set("manage", createNewsletterToken(email, "unsubscribe"));
    return Response.redirect(destination, 303);
  } catch { return new Response("Subscription could not be completed. Please try again.", { status: 503 }); }
}
