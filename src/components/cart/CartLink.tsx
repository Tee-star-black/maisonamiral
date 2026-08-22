"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count, hydrated } = useCart();
  return <Link href="/cart">Bag · {hydrated ? count : 0}</Link>;
}
