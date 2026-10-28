import { randomUUID } from "node:crypto";
import { getCommerceReady, getDeliveryFee, validateBuyer, validateItems } from "@/lib/commerce";
import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";

function result(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  return result({
    enabled: getCommerceReady(),
    deliveryCents: getDeliveryFee(),
    currency: "ZAR",
  });
}

export async function POST(request: Request) {
  if (!getCommerceReady()) {
    return result({ error: "Secure checkout is not yet configured for this store." }, 503);
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 16000) return result({ error: "Invalid checkout request." }, 413);
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return result({ error: "Invalid checkout request." }, 400);
  }
  if (!input || typeof input !== "object")
    return result({ error: "Invalid checkout details." }, 400);
  const body = input as Record<string, unknown>;
  const buyer = validateBuyer(body.customer);
  const items = validateItems(body.items);
  if (!buyer || !items) return result({
    error: "Check the delivery details, sizes and quantities, then try again.",
  }, 400);

  const deliveryCents = getDeliveryFee();
  if (deliveryCents === null) return result({ error: "Delivery pricing is unavailable." }, 503);
  const subtotalCents = items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);
  const totalCents = subtotalCents + deliveryCents;
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > 5000000)
    return result({ error: "Order total is outside accepted limits." }, 400);

  const orderId = randomUUID();
  const site = process.env.MAISON_SITE_URL;
  if (!site) return result({ error: "Checkout is not configured." }, 503);
  let siteUrl: URL;
  try {
    siteUrl = new URL(site);
    if (siteUrl.protocol !== "https:" && siteUrl.hostname !== "localhost")
      throw new Error("Invalid origin");
  } catch {
    return result({ error: "Checkout origin is invalid." }, 503);
  }

  try {
    await storeDb("maison_orders", "POST", {
      body: {
        id: orderId,
        first_name: buyer.firstName,
        last_name: buyer.lastName,
        email: buyer.email,
        phone: buyer.phone,
        address: buyer.address,
        suburb: buyer.suburb,
        city: buyer.city,
        province: buyer.province,
        postal_code: buyer.postalCode,
        items,
        subtotal_cents: subtotalCents,
        delivery_cents: deliveryCents,
        total_cents: totalCents,
        status: "pending",
      },
      prefer: "return=minimal",
    });
  } catch {
    return result({ error: "Could not securely save the order. No payment was started." }, 503);
  }

  try {
    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.YOCO_SECRET_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        amount: totalCents,
        currency: "ZAR",
        clientReferenceId: orderId,
        metadata: { orderId },
        successUrl: new URL("/checkout/return?order=" + orderId, siteUrl).toString(),
        cancelUrl: new URL("/checkout/return?order=" + orderId + "&cancelled=1", siteUrl).toString(),
        failureUrl: new URL("/checkout/return?order=" + orderId + "&failed=1", siteUrl).toString(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Gateway rejected checkout");
    const payload = await response.json() as { id?: string; redirectUrl?: string };
    if (!payload.id || !payload.redirectUrl) throw new Error("Gateway response invalid");
    const redirect = new URL(payload.redirectUrl);
    if (redirect.protocol !== "https:" ||
        (redirect.hostname !== "yoco.com" && !redirect.hostname.endsWith(".yoco.com")))
      throw new Error("Unexpected gateway redirect");

    await storeDb("maison_orders", "PATCH", {
      query: { id: "eq." + orderId },
      body: { yoco_checkout_id: payload.id, updated_at: new Date().toISOString() },
      prefer: "return=minimal",
    });
    return result({ redirectUrl: redirect.toString(), orderId });
  } catch {
    return result({ error: "Payment could not be started. Please try again; no payment was taken." }, 502);
  }
}
