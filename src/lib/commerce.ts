import { storeOrderRecipients } from "./order-recipients";
import { getProductBySlug } from "@/data/products";

export const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
] as const;

export type Buyer = {
  firstName: string; lastName: string; email: string; phone: string;
  address: string; suburb: string; city: string; province: string; postalCode: string;
};
export type OrderItem = {
  slug: string; size: "S" | "M" | "L" | "XL" | "ONE SIZE";
  quantity: number; unit_price_cents: number; name: string;
};
export function validateBuyer(value: unknown): Buyer | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const val = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";
  const buyer: Buyer = {
    firstName: val("firstName"), lastName: val("lastName"),
    email: val("email").toLowerCase(), phone: val("phone"),
    address: val("address"), suburb: val("suburb"), city: val("city"),
    province: val("province"), postalCode: val("postalCode"),
  };
  if (!buyer.firstName || buyer.firstName.length > 80 ||
      !buyer.lastName || buyer.lastName.length > 80 ||
      buyer.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email) ||
      !/^[0-9+()\s-]{8,30}$/.test(buyer.phone) ||
      !buyer.address || buyer.address.length > 160 ||
      buyer.suburb.length > 100 || !buyer.city || buyer.city.length > 100 ||
      !provinces.includes(buyer.province as (typeof provinces)[number]) ||
      !/^\d{4}$/.test(buyer.postalCode)) return null;
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
    if (!product || !(product.category === "accessory" ? size === "ONE SIZE" : ["S","M","L","XL"].includes(String(size))) ||
        !Number.isInteger(quantity) || (quantity as number) < 1 ||
        (quantity as number) > 10) return null;
    const key = product.slug + ":" + size;
    if (seen.has(key)) return null;
    seen.add(key);
    items.push({ slug: product.slug, size: size as OrderItem["size"],
      quantity: quantity as number, unit_price_cents: Math.round(product.price * 100),
      name: product.name });
  }
  if (items.reduce((sum, row) => sum + row.quantity, 0) > 20) return null;
  return items;
}
export { getDeliveryFee } from "@/data/products";
export function getEftSettings() {
  const env = process.env;
  const bank = {
    bankName: env.MAISON_BANK_NAME?.trim() ?? "",
    accountHolder: env.MAISON_BANK_ACCOUNT_HOLDER?.trim() ?? "",
    accountNumber: env.MAISON_BANK_ACCOUNT_NUMBER?.trim() ?? "",
    branchCode: env.MAISON_BANK_BRANCH_CODE?.trim() ?? "",
    accountType: env.MAISON_BANK_ACCOUNT_TYPE?.trim() ?? "",
  };
  const sender = env.MAISON_RESEND_FROM?.trim() ?? "";
  const adminRecipients = storeOrderRecipients();
  const key = env.RESEND_API_KEY?.trim() ?? "";
  const hasDb = !!(env.MAISON_SUPABASE_URL && env.MAISON_SUPABASE_SERVICE_ROLE_KEY);
  const bankReady = !!(bank.bankName && bank.accountHolder && bank.accountNumber && bank.branchCode);
  const mailReady = key.startsWith("re_") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender) &&
    adminRecipients.length >= 2 && adminRecipients.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return { bank, sender, adminRecipients, key, enabled: hasDb && bankReady && mailReady };
}
