import { z } from "zod";
const image = z
  .string()
  .max(1000)
  .refine(
    (v) =>
      /^\/(?!\/)/.test(v) ||
      /^https:\/\/muhaytmijxxvhbeneoyn\.supabase\.co\/storage\/v1\/object\/public\/maison-products\//.test(
        v,
      ),
    "Use an uploaded product image",
  );
export const productSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    name: z.string().trim().min(2).max(120),
    price: z
      .number()
      .positive()
      .max(50000)
      .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001),
    category: z.enum(["apparel", "accessory"]),
    edition: z.string().trim().min(1).max(80),
    artMark: z.string().max(30).default("MA"),
    shortDescription: z.string().max(300),
    description: z.string().max(5000),
    tone: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .default("#151515"),
    ink: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .default("#ffffff"),
    images: z.array(image).max(12),
    imageLabels: z.array(z.string().max(120)).max(12),
    expectedUpdatedAt: z.string().datetime().optional(),
    status: z.enum(["draft", "published", "archived"]),
    stock: z.record(
      z.string().refine((s) => ["S", "M", "L", "XL", "ONE SIZE"].includes(s)),
      z.number().int().min(0).max(100000),
    ),
  })
  .strict()
  .superRefine((p, c) => {
    if (p.status === "published" && !p.images.length)
      c.addIssue({
        code: "custom",
        message: "Add a photograph before publishing",
      });
    const sizes =
      p.category === "accessory" ? ["ONE SIZE"] : ["S", "M", "L", "XL"];
    if (
      Object.keys(p.stock).some((s) => !sizes.includes(s)) ||
      sizes.some((s) => p.stock[s] === undefined)
    )
      c.addIssue({ code: "custom", message: "Set stock for each valid size" });
  });
export const transitions: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["completed"],
  failed: [],
  cancelled: [],
  completed: [],
};
export function canTransition(from: string, to: string) {
  return transitions[from]?.includes(to) ?? false;
}
