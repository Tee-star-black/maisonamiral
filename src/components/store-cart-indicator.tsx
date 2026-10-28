"use client";

import { cartCount, useCart } from "@/lib/cart";

export function CartIndicator() {
  const items = useCart();
  return <span aria-live="polite">({cartCount(items)})</span>;
}
