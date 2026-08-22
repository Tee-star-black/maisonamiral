"use client";

import Image from "next/image";
import Link from "next/link";
import { CartLink } from "@/components/cart/CartLink";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, getProduct } from "@/data/products";

export default function CartPage() {
  const { items, subtotal, hydrated, updateQuantity, removeItem } = useCart();

  return (
    <main className="commerce-page">
      <header className="site-header shop-header">
        <Link className="brand" href="/">MAISON AMIRAL</Link>
        <nav className="desktop-nav"><Link href="/shop">Shop</Link><Link href="/collections">Collections</Link><Link href="/lookbook">Lookbook</Link></nav>
        <div className="header-actions"><Link href="/shop">Continue shopping</Link><CartLink /></div>
      </header>

      <section className="cart-shell">
        <div className="commerce-title-row">
          <div><p className="eyebrow">Maison Amiral / Bag</p><h1>Your bag.</h1></div>
          <span>{hydrated ? `${items.reduce((sum, item) => sum + item.quantity, 0)} piece${items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}` : ""}</span>
        </div>

        {!hydrated ? (
          <p className="commerce-muted">Loading bag…</p>
        ) : items.length === 0 ? (
          <div className="empty-cart">
            <p>Your bag is empty.</p>
            <Link className="commerce-primary-link" href="/shop">Explore Edition 001 →</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-lines">
              {items.map((item) => {
                const product = getProduct(item.slug);
                if (!product) return null;
                const image = product.images.front ?? product.images.editorialFront;
                return (
                  <article className="cart-line" key={`${item.slug}-${item.size}`}>
                    <Link className="cart-line-image" href={`/product/${product.slug}`}>
                      {image && <Image src={image} alt={product.name} fill sizes="180px" className="contain-image" />}
                    </Link>
                    <div className="cart-line-copy">
                      <div>
                        <p className="product-index">{product.collection}</p>
                        <Link href={`/product/${product.slug}`}><h2>{product.shortName}</h2></Link>
                        <p>Size {item.size}</p>
                      </div>
                      <div className="cart-line-actions">
                        <div className="quantity-control" aria-label={`Quantity for ${product.shortName}`}>
                          <button type="button" onClick={() => updateQuantity(item.slug, item.size, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.slug, item.size, item.quantity + 1)}>+</button>
                        </div>
                        <button className="remove-button" type="button" onClick={() => removeItem(item.slug, item.size)}>Remove</button>
                      </div>
                    </div>
                    <p className="cart-line-price">{formatPrice(product.price * item.quantity)}</p>
                  </article>
                );
              })}
            </div>

            <aside className="cart-summary">
              <p className="eyebrow">Order summary</p>
              <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div className="summary-row"><span>Shipping</span><span>Confirmed at checkout</span></div>
              <div className="summary-total"><span>Total before shipping</span><strong>{formatPrice(subtotal)}</strong></div>
              <Link className="checkout-button" href="/checkout">Proceed to checkout <span>→</span></Link>
              <p className="secure-note">Secure payment handled by PayFast.</p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
