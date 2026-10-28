import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return Response.json({ error: "Invalid order reference." }, { status: 400 });
  try {
    const orders = await storeDb<Array<{ status: string }>>("maison_orders", "GET", {
      query: { select: "status", id: "eq." + id, limit: "1" },
    });
    if (!orders.length) return Response.json({ error: "Order not found." }, { status: 404 });
    return Response.json({ status: orders[0].status }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Order status is temporarily unavailable." }, { status: 503 });
  }
}
