"use client";

import { useState } from "react";
import Link from "next/link";
import { addToCart, SIZES, type GarmentSize } from "@/lib/cart";
import styles from "./product-buy-panel.module.css";

export function ProductBuyPanel({ slug }: { slug: string }) {
  const [size, setSize] = useState<GarmentSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  function handleAdd() {
    if (!size) {
      setError("Choose a size before adding this piece to your cart.");
      return;
    }
    addToCart(slug, size, quantity);
    setAdded(true);
    setError("");
  }

  return (
    <div className={styles.panel}>
      <p className={styles.label}>SELECT SIZE</p>
      <div className={styles.sizes} role="group" aria-label="T-shirt size">
        {SIZES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={size === value}
            onClick={() => { setSize(value); setAdded(false); setError(""); }}
          >{value}</button>
        ))}
      </div>
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
      <p className={styles.note}>Checkout securely through our payment partner once payments are activated.</p>
    </div>
  );
}
