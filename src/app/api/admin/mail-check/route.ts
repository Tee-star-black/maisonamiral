import { timingSafeEqual } from "node:crypto";
import { sendOrderEmail, type Invoice } from "@/lib/eft-invoice";
import { STORE_ORDER_RECIPIENTS } from "@/lib/order-recipients";
import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";
export const maxDuration = 45;
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});

function authorized(request: Request) {
  const secret = process.env.MAISON_MAIL_TEST_SECRET;
  const expires = Number(process.env.MAISON_MAIL_TEST_EXPIRES);
  if (!secret || secret.length < 32 || !Number.isFinite(expires) || Date.now() >= expires) return false;
  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from("Bearer " + secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Not found" }, 404);
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAISON_RESEND_FROM;
  const id = process.env.MAISON_MAIL_TEST_ID;
  if (!key || !from || !id) return json({ error: "Mail test not configured" }, 503);
  const invoice: Invoice = {
    id,
    buyer: { firstName: "Delivery", lastName: "Test", email: "test@example.invalid", phone: "",
      address: "TEST ONLY", suburb: "", city: "", province: "", postalCode: "" },
    items: [{ slug: "emblem-tee", size: "M", quantity: 1, unit_price_cents: 45000, name: "Emblem Tee — test example" }],
    subtotalCents: 45000, deliveryCents: 0, totalCents: 45000,
    bank: { bankName: "", accountHolder: "", accountNumber: "", branchCode: "", accountType: "" },
  };
  const results = [];
  // Sequential sends stay within Resend's default API rate limit.
  for (const to of STORE_ORDER_RECIPIENTS) {
    try {
      const emailId = await sendOrderEmail(to, invoice, key, from, true, true);
      results.push({ to, accepted: true, id: emailId });
    } catch (error) {
      results.push({ to, accepted: false, error: error instanceof Error ? error.message : "Send failed" });
    }
  }
  return json({ results });
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: "Not found" }, 404);
  if (new URL(request.url).searchParams.get("check") === "database") {
    try {
      await Promise.all([
        storeDb("maison_orders", "GET", { query: { select: "id,notification_status,status", limit: "0" } }),
        storeDb("maison_subscribers", "GET", { query: { select: "email,consent_at", limit: "0" } }),
      ]);
      return json({ databaseConnected: true, ordersReady: true, subscribersReady: true });
    } catch (error) {
      return json({ databaseConnected: false, error: error instanceof Error ? error.message : "Database check failed" }, 503);
    }
  }
  const ids = new URL(request.url).searchParams.getAll("id");
  if (!ids.length || ids.length > 2 || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return json({ error: "Invalid email IDs" }, 400);
  const results = [];
  for (const id of ids) {
    const response = await fetch("https://api.resend.com/emails/" + id, {
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY }, cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json();
    results.push(response.ok
      ? { id, to: data.to, status: data.last_event }
      : { id, httpStatus: response.status, error: data.message });
  }
  return json({ results });
}
