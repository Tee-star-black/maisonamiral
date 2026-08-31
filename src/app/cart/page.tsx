"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, getProduct } from "@/data/products";

export default function CartPage() {
  const { items, subtotal, hydrated, updateQuantity, removeItem } = useCart();
  const pieceCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="commerce-page cart-page-premium">
      <section className="cart-shell">
        <div className="cart-hero">
          <div className="cart-hero-meta">
            <span>MAISON AMIRAL / BAG</span>
            <span>{hydrated ? `${pieceCount.toString().padStart(2, "0")} OBJECT${pieceCount === 1 ? "" : "S"}` : ""}</span>
          </div>
          <h1>BAG.</h1>
          <div className="cart-hero-foot">
            <span>FLAGSHIP / 001</span>
            <span>JOHANNESBURG</span>
          </div>
        </div>

        {!hydrated ? (
          <p className="commerce-muted cart-loading">Loading bag…</p>
        ) : items.length === 0 ? (
          <div className="empty-cart premium-empty-cart">
            <div className="premium-empty-index">00 / 00</div>
            <p>Your bag is quiet.</p>
            <Link className="commerce-primary-link" href="/shop">Explore Edition 001 →</Link>
          </div>
        ) : (
          <div className="cart-layout premium-cart-layout">
            <div className="cart-lines premium-cart-lines">
              <div className="cart-list-head">
                <span>Selection</span>
                <span>Details</span>
                <span>Value</span>
              </div>

              {items.map((item, index) => {
                const product = getProduct(item.slug);
                if (!product) return null;
                const image = product.images.editorialFront ?? product.images.front;

                return (
                  <article className="cart-line premium-cart-line" key={`${item.slug}-${item.size}`}>
                    <div className="cart-line-index">{String(index + 1).padStart(2, "0")}</div>

                    <Link className="cart-line-image premium-cart-image" href={`/product/${product.slug}`}>
                      {image && (
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 120px, 220px"
                          className="contain-image"
                        />
                      )}
                      <span className="cart-image-code">OBJECT / {String(index + 1).padStart(2, "0")}</span>
                    </Link>

                    <div className="cart-line-copy premium-cart-copy">
                      <div>
                        <p className="product-index">{product.collection}</p>
                        <Link href={`/product/${product.slug}`}><h2>{product.shortName}</h2></Link>
                        <div className="cart-product-meta">
                          <span>SIZE / {item.size}</span>
                          <span>QTY / {String(item.quantity).padStart(2, "0")}</span>
                        </div>
                      </div>

                      <div className="cart-line-actions premium-cart-actions">
                        <div className="quantity-control premium-quantity" aria-label={`Quantity for ${product.shortName}`}>
                          <button type="button" onClick={() => updateQuantity(item.slug, item.size, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                          <span>{String(item.quantity).padStart(2, "0")}</span>
                          <button type="button" onClick={() => updateQuantity(item.slug, item.size, item.quantity + 1)} aria-label="Increase quantity">+</button>
                        </div>
                        <button className="remove-button premium-remove" type="button" onClick={() => removeItem(item.slug, item.size)}>Remove selection</button>
                      </div>
                    </div>

                    <div className="cart-line-price premium-cart-price">
                      <span>R / ZAR</span>
                      <strong>{formatPrice(product.price * item.quantity)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="cart-summary premium-cart-summary">
              <div className="cart-summary-code">AMIRAL / ORDER STUDY</div>
              <p className="eyebrow">Order summary</p>
              <h2>Selected<br />objects.</h2>

              <div className="premium-summary-rows">
                <div className="summary-row"><span>Objects</span><strong>{pieceCount.toString().padStart(2, "0")}</strong></div>
                <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <div className="summary-row"><span>Delivery</span><span>Confirmed at checkout</span></div>
              </div>

              <div className="summary-total premium-summary-total">
                <span>Total before delivery</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <Link className="checkout-button premium-checkout-button" href="/checkout">
                <span>Continue to checkout</span>
                <span>→</span>
              </Link>

              <div className="cart-signature">
                <span>AMIRAL SIGNATURE / BAG 001</span>
                <span>26.2041° S / 28.0473° E</span>
                <span>JOHANNESBURG, SOUTH AFRICA</span>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
