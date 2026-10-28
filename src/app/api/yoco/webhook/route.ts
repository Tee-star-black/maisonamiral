import { createHmac, timingSafeEqual } from "node:crypto";
import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_")) return new Response(null, { status: 503 });
  if (Number(request.headers.get("content-length") ?? "0") > 150000)
    return new Response(null, { status: 413 });

  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatureHeader = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return new Response(null, { status: 403 });
  const seconds = Number(timestamp);
  if (!Number.isSafeInteger(seconds) || Math.abs(Date.now() / 1000 - seconds) > 180)
    return new Response(null, { status: 403 });

  let raw: string;
  try { raw = await request.text(); }
  catch { return new Response(null, { status: 400 }); }
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const expected = createHmac("sha256", key).update(id + "." + timestamp + "." + raw).digest();
  const verified = signatureHeader.split(/\s+/).some((entry) => {
    if (!entry.startsWith("v1,")) return false;
    try {
      const supplied = Buffer.from(entry.slice(3), "base64");
      return supplied.length === expected.length && timingSafeEqual(expected, supplied);
    } catch { return false; }
  });
  if (!verified) return new Response(null, { status: 403 });

  let event: unknown;
  try { event = JSON.parse(raw); }
  catch { return new Response(null, { status: 400 }); }
  if (!event || typeof event !== "object") return new Response(null, { status: 400 });

  const data = event as {
    type?: string;
    payload?: { amount?: number; currency?: string; id?: string; metadata?: { checkoutId?: string } };
  };
  // The payment event is authoritative. Never mark an order as paid on redirect alone.
  if (data.type !== "payment.succeeded") return new Response(null, { status: 200 });
  const checkoutId = data.payload?.metadata?.checkoutId;
  if (!checkoutId || typeof checkoutId !== "string")
    return new Response(null, { status: 200 });

  try {
    const orders = await storeDb<Array<{ id: string; status: string; total_cents: number; currency: string }>>(
      "maison_orders", "GET", {
        query: {
          select: "id,status,total_cents,currency",
          yoco_checkout_id: "eq." + checkoutId,
          limit: "1",
        },
      },
    );
    if (!orders.length) return new Response(null, { status: 200 });
    const order = orders[0];
    if (order.total_cents !== data.payload?.amount || order.currency !== data.payload?.currency)
      return new Response(null, { status: 422 });
    if (order.status === "paid") return new Response(null, { status: 200 });
    await storeDb("maison_orders", "PATCH", {
      query: { id: "eq." + order.id, status: "eq.pending" },
      body: {
        status: "paid",
        yoco_payment_id: data.payload?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      prefer: "return=minimal",
    });
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
