"use client";

import { useState } from "react";
import Link from "next/link";
import { getProductBySlug } from "@/data/products";
import { addToCart, SIZES, type GarmentSize } from "@/lib/cart";
import styles from "./product-buy-panel.module.css";

export function ProductBuyPanel({ slug }: { slug: string }) {
  const accessory = getProductBySlug(slug)?.category === "accessory";
  const [size, setSize] = useState<GarmentSize | null>(accessory ? "ONE SIZE" : null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  function handleAdd() {
    if (!size && !accessory) {
      setError("Choose a size before adding this piece to your cart.");
      return;
    }
    addToCart(slug, accessory ? "ONE SIZE" : size!, quantity);
    setAdded(true);
    setError("");
  }

  return (
    <div className={styles.panel}>
      <p className={styles.label}>{accessory ? "SIZE / ONE SIZE" : "SELECT SIZE"}</p>
      {!accessory && <div className={styles.sizes} role="group" aria-label="T-shirt size">
        {SIZES.filter((value) => value !== "ONE SIZE").map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={size === value}
            onClick={() => { setSize(value); setAdded(false); setError(""); }}
          >{value}</button>
        ))}
      </div>}
      <div className={styles.quantityRow}>
        <span className={styles.label}>QUANTITY</span>
        <div className={styles.quantity}>
          <button type="button" disabled={quantity <= 1} aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
          <output aria-live="polite">{quantity}</output>
          <button type="button" disabled={quantity >= 10} aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}>+</button>
        </div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="button" onClick={handleAdd} className={styles.add}>ADD TO CART <span>↗</span></button>
      {added && (
        <p className={styles.success} role="status">
          Added to your cart. <Link href="/cart">View cart →</Link>
        </p>
      )}
      <p className={styles.note}>A flat R40 delivery fee is added once per order. EFT details are provided with your invoice.</p>
    </div>
  );
}
