"use client";
import { products, type MaisonProduct } from "@/data/products";
// Browser-only catalogue cache. Server modules continue to use immutable seed data.
let current: MaisonProduct[] | null = null;
export function setClientCatalogue(rows: MaisonProduct[]) {
  current = rows;
}
export function getProductBySlug(slug: string) {
  return (current ?? products).find((product) => product.slug === slug);
}
