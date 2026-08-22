"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, type Product } from "@/data/products";
import { useCart } from "./CartProvider";

export function ProductPurchase({ product }: { product: Product }) {
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  function addToBag() {
    if (!size) return;
    addItem(product.slug, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <>
      <div className="size-block">
        <div className="size-heading">
          <span>Size</span>
          <span>{size ? `Selected: ${size}` : "Select a size"}</span>
        </div>
        <div className="size-grid" aria-label="Available sizes">
          {product.sizes.map((value) => (
            <button
              type="button"
              key={value}
              className={`size-button${size === value ? " size-button-active" : ""}`}
              aria-pressed={size === value}
              onClick={() => setSize(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <button
        className="add-to-bag"
        type="button"
        onClick={addToBag}
        disabled={!size}
      >
        <span>{added ? "Added to bag" : size ? "Add to bag" : "Select size"}</span>
        <span>{formatPrice(product.price)}</span>
      </button>

      {added && (
        <button className="view-bag-button" type="button" onClick={() => router.push("/cart")}>
          View bag →
        </button>
      )}
    </>
  );
}
