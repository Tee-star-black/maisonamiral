import { getProductBySlug } from "@/data/products";

export const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
] as const;

export type Buyer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
};

export type OrderItem = {
  slug: string;
  size: "S" | "M" | "L" | "XL";
  quantity: number;
  unit_price_cents: number;
  name: string;
};

export function validateBuyer(value: unknown): Buyer | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const field = (key: string, max: number) =>
    typeof item[key] === "string" ? (item[key] as string).trim().slice(0, max + 1) : "";
  const buyer = {
    firstName: field("firstName", 80),
    lastName: field("lastName", 80),
    email: field("email", 254).toLowerCase(),
    phone: field("phone", 30),
    address: field("address", 160),
    suburb: field("suburb", 100),
    city: field("city", 100),
    province: field("province", 30),
    postalCode: field("postalCode", 4),
  };
  if (!buyer.firstName || buyer.firstName.length > 80 ||
      !buyer.lastName || buyer.lastName.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email) ||
      buyer.email.length > 254 ||
      !/^[0-9+()\s-]{8,30}$/.test(buyer.phone) ||
      !buyer.address || buyer.address.length > 160 ||
      !buyer.city || buyer.city.length > 100 ||
      !provinces.includes(buyer.province as (typeof provinces)[number]) ||
      !/^\d{4}$/.test(buyer.postalCode) ||
      buyer.suburb.length > 100) return null;
  return buyer;
}

export function validateItems(raw: unknown): OrderItem[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 12) return null;
  const seen = new Set<string>();
  const items: OrderItem[] = [];
  for (const value of raw) {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    const product = typeof row.slug === "string" ? getProductBySlug(row.slug) : null;
    const size = row.size;
    const quantity = row.quantity;
    if (!product || !["S", "M", "L", "XL"].includes(String(size)) ||
        !Number.isInteger(quantity) || (quantity as number) < 1 ||
        (quantity as number) > 10) return null;
    const key = product.slug + ":" + size;
    if (seen.has(key)) return null;
    seen.add(key);
    items.push({
      slug: product.slug,
      size: size as OrderItem["size"],
      quantity: quantity as number,
      unit_price_cents: Math.round(product.price * 100),
      name: product.name,
    });
  }
  if (items.reduce((sum, item) => sum + item.quantity, 0) > 20) return null;
  return items;
}

export function getDeliveryFee() {
  const raw = process.env.MAISON_DELIVERY_FEE_CENTS;
  if (!raw || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 && value <= 100000 ? value : null;
}

export function getCommerceReady() {
  return Boolean(
    process.env.YOCO_SECRET_KEY &&
    process.env.YOCO_WEBHOOK_SECRET &&
    process.env.MAISON_SUPABASE_URL &&
    process.env.MAISON_SUPABASE_SERVICE_ROLE_KEY &&
    process.env.MAISON_SITE_URL &&
    getDeliveryFee() !== null,
  );
}
