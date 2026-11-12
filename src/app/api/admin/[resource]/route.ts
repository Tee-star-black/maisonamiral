import { z } from "zod";
import {
  db,
  requireAdmin,
  mutate,
  reply,
  failure,
  readJson,
  HttpError,
} from "@/lib/admin/server";
import { productSchema, canTransition } from "@/lib/admin/validation";
const tables = {
  products: "maison_products",
  orders: "maison_orders",
  subscribers: "maison_subscribers",
  emails: "maison_email_events",
  audit: "maison_audit",
} as const;
type Context = { params: Promise<{ resource: string }> };
export async function GET(r: Request, c: Context) {
  try {
    await requireAdmin();
    const { resource } = await c.params;
    if (!(resource in tables)) throw new HttpError(404, "Unknown section.");
    const url = new URL(r.url);
    const page = Math.max(
      0,
      Math.min(100000, Number(url.searchParams.get("page")) || 0),
    );
    let query = db()
      .from(tables[resource as keyof typeof tables])
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * 50, page * 50 + 49);
    const search = url.searchParams.get("search")?.trim().slice(0, 100);
    if (search) {
      const column =
        resource === "products"
          ? "slug"
          : resource === "orders" || resource === "subscribers"
            ? "email"
            : null;
      if (column)
        query = query.ilike(column, "%" + search.replace(/[%_\\]/g, "") + "%");
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return reply({ rows: data, count, page });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(r: Request, c: Context) {
  try {
    const actor = await mutate(r);
    const { resource } = await c.params;
    const body = await readJson(r);
    if (resource === "products") {
      const value = productSchema.parse(body);
      const { data, error } = await db().rpc("maison_save_product", {
        p_actor: actor.id,
        p_data: value,
      });
      if (error) {
        if (error.message.includes("Product changed"))
          throw new HttpError(
            409,
            "This product changed. Refresh before saving.",
          );
        throw error;
      }
      return reply(data);
    }
    if (resource === "orders") {
      const value = z
        .object({
          id: z.string().uuid(),
          from: z.string(),
          status: z.string(),
          paymentConfirmed: z.boolean().optional(),
          tracking: z.string().max(200).optional(),
        })
        .strict()
        .parse(body);
      if (!canTransition(value.from, value.status))
        throw new HttpError(400, "This order status change is not allowed.");
      if (value.status === "paid" && !value.paymentConfirmed)
        throw new HttpError(
          400,
          "Confirm receipt of funds in your bank account.",
        );
      if (value.status === "shipped" && !value.tracking?.trim())
        throw new HttpError(400, "Enter the courier and tracking reference.");
      const { data, error } = await db().rpc("maison_transition_order", {
        p_actor: actor.id,
        p_id: value.id,
        p_from: value.from,
        p_status: value.status,
        p_tracking: value.tracking || null,
      });
      if (error)
        throw new HttpError(
          409,
          "The order changed, or stock is insufficient. Refresh and review.",
        );
      return reply(data);
    }
    if (resource === "subscribers") {
      const { email } = z.object({ email: z.string().email() }).parse(body);
      const { error } = await db().rpc("maison_remove_subscriber", {
        p_actor: actor.id,
        p_email: email,
      });
      if (error) throw error;
      return reply({ ok: true });
    }
    throw new HttpError(404, "Unknown action.");
  } catch (e) {
    if (e instanceof z.ZodError)
      return reply({ error: e.issues.map((i) => i.message).join(". ") }, 400);
    return failure(e);
  }
}
