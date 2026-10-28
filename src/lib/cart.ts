"use client";

import { useSyncExternalStore } from "react";
import { getProductBySlug } from "@/data/products";

export const SIZES = ["S", "M", "L", "XL"] as const;
export type GarmentSize = (typeof SIZES)[number];

export type CartLine = {
  slug: string;
  size: GarmentSize;
  quantity: number;
};

const STORAGE_KEY = "maison-amiral-cart-v1";
const EMPTY: CartLine[] = [];
let lines: CartLine[] = EMPTY;
let hydrated = false;
const subscribers = new Set<() => void>();

function emit() {
  for (const listener of subscribers) listener();
}

function sanitise(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const valid = new Map<string, CartLine>();
  for (const entry of value.slice(0, 50)) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Partial<CartLine>;
    if (typeof raw.slug !== "string" || !getProductBySlug(raw.slug)) continue;
    if (!SIZES.includes(raw.size as GarmentSize)) continue;
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) continue;
    const key = raw.slug + ":" + raw.size;
    valid.set(key, { slug: raw.slug, size: raw.size as GarmentSize, quantity });
    if (valid.size >= 12) break;
  }
  return [...valid.values()];
}

function parse(raw: string | null): CartLine[] {
  try {
    return sanitise(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function start() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    lines = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    lines = [];
  }
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      lines = parse(event.newValue);
      emit();
    }
  });
  emit();
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  start();
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return lines;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(next: CartLine[]) {
  start();
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // A blocked storage API should not prevent the in-session shopping bag.
  }
  emit();
}

export function addToCart(slug: string, size: GarmentSize, quantity = 1) {
  if (!getProductBySlug(slug) || !SIZES.includes(size)) return;
  start();
  const increment = Math.min(10, Math.max(1, Math.trunc(quantity)));
  const existing = lines.find((line) => line.slug === slug && line.size === size);
  if (existing) {
    update(lines.map((line) =>
      line === existing ? { ...line, quantity: Math.min(10, line.quantity + increment) } : line,
    ));
  } else {
    update([...lines, { slug, size, quantity: increment }]);
  }
}

export function changeQuantity(slug: string, size: GarmentSize, quantity: number) {
  if (!Number.isInteger(quantity)) return;
  if (quantity <= 0) {
    update(lines.filter((line) => line.slug !== slug || line.size !== size));
    return;
  }
  update(lines.map((line) =>
    line.slug === slug && line.size === size
      ? { ...line, quantity: Math.min(10, quantity) }
      : line,
  ));
}

export function removeFromCart(slug: string, size: GarmentSize) {
  update(lines.filter((line) => line.slug !== slug || line.size !== size));
}

export function clearCart() {
  update([]);
}

export function cartCount(items: CartLine[]) {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(items: CartLine[]) {
  return items.reduce(
    (sum, line) => sum + (getProductBySlug(line.slug)?.price ?? 0) * line.quantity,
    0,
  );
}
