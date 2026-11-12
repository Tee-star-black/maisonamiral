import "server-only";
import { products as legacy, type MaisonProduct } from "@/data/products";
import { storeDb } from "@/lib/maison-store-db";
export async function getCatalogue(): Promise<MaisonProduct[]> {
  if (process.env.MAISON_CATALOGUE_ENABLED !== "true") return legacy;
  const rows = await storeDb<
    Array<{ data: MaisonProduct; stock: Record<string, number> }>
  >("maison_products", "GET", {
    query: {
      select: "data,stock",
      status: "eq.published",
      order: "created_at.asc",
      limit: "1000",
    },
  });
  return rows.map((r) => ({ ...r.data, stock: r.stock }));
}
