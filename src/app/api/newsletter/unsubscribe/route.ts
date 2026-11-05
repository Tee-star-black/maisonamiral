import { verifyNewsletterToken } from "@/lib/newsletter-tokens";
import { storeDb } from "@/lib/maison-store-db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let token: FormDataEntryValue | null;
  try { token = (await request.formData()).get("token"); } catch { return new Response("Invalid request", { status: 400 }); }
  const email = verifyNewsletterToken(token, "unsubscribe");
  if (!email) return new Response("Invalid unsubscribe link.", { status: 400 });
  try {
    await storeDb("maison_subscribers", "DELETE", { query: { email: "eq." + email }, prefer: "return=minimal" });
    return Response.redirect(new URL("/newsletter/unsubscribed", request.url), 303);
  } catch { return new Response("Unable to unsubscribe. Contact support@maisonamiral.co.za.", { status: 503 }); }
}
