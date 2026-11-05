import { timingSafeEqual } from "node:crypto";
import { storeDb } from "@/lib/maison-store-db";
import { createNewsletterToken } from "@/lib/newsletter-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Subscriber = { email: string; consent_at: string };
function authenticated(header: string | null, secret: string) {
  if (!header?.startsWith("Bearer ") || !secret || secret.length < 32) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
const csvCell = (value: string) => '"' + value.replace(/"/g, '""') + '"';
export async function GET(request: Request) {
  const key = process.env.MAISON_NEWSLETTER_ADMIN_TOKEN ?? "";
  if (!authenticated(request.headers.get("authorization"), key))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const subscribers: Subscriber[] = [];
    for (let offset = 0; offset < 10000; offset += 1000) {
      const page = await storeDb<Subscriber[]>("maison_subscribers", "GET", {
        query: { select: "email,consent_at", order: "email.asc", limit: "1000", offset: String(offset) },
      });
      subscribers.push(...page);
      if (page.length < 1000) break;
    }
    const lines = ["email,consent_at,unsubscribe_url"];
    for (const person of subscribers) {
      const unsubscribeUrl = "https://www.maisonamiral.co.za/newsletter/unsubscribe?token=" +
        encodeURIComponent(createNewsletterToken(person.email, "unsubscribe"));
      lines.push([person.email, person.consent_at, unsubscribeUrl].map(csvCell).join(","));
    }
    return new Response(lines.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="maison-amiral-confirmed-subscribers.csv"',
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Subscriber export unavailable" }, { status: 503 });
  }
}
