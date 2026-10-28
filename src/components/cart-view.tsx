"use client";

import Image from "next/image";
import Link from "next/link";
import { cartCount, cartSubtotal, changeQuantity, removeFromCart, useCart } from "@/lib/cart";
import { formatPrice, getProductBySlug } from "@/data/products";
import styles from "./cart-view.module.css";

export function CartView() {
  const items = useCart();
  const subtotal = cartSubtotal(items);

  if (!items.length) {
    return (
      <section className={styles.empty}>
        <p>Your cart is empty.</p>
        <Link href="/shop">Explore the collection <span aria-hidden="true">↗</span></Link>
      </section>
    );
  }

  return (
    <div className={styles.layout}>
      <section className={styles.items} aria-label="Items in cart">
        <div className={styles.listHead}>
          <span>THE PIECES</span><span>{cartCount(items)} ITEM{cartCount(items) !== 1 ? "S" : ""}</span>
        </div>
        {items.map((item) => {
          const product = getProductBySlug(item.slug);
          if (!product) return null;
          return (
            <article className={styles.line} key={item.slug + ":" + item.size}>
              <Link className={styles.photo} href={"/shop/" + product.slug}>
                <Image src={product.images[0]} alt={product.name} width={240} height={300} sizes="120px" />
              </Link>
              <div className={styles.details}>
                <p className={styles.edition}>EDITION 001 / {item.size}</p>
                <Link href={"/shop/" + product.slug} className={styles.name}>{product.name}</Link>
                <p className={styles.unit}>{formatPrice(product.price)} each</p>
                <div className={styles.actions}>
                  <div className={styles.quantity}>
                    <button type="button" aria-label={"Remove one " + product.name}
                      onClick={() => changeQuantity(item.slug, item.size, item.quantity - 1)}>−</button>
                    <output aria-label="Quantity">{item.quantity}</output>
                    <button type="button" aria-label={"Add one " + product.name}
                      disabled={item.quantity >= 10}
                      onClick={() => changeQuantity(item.slug, item.size, item.quantity + 1)}>+</button>
                  </div>
                  <button className={styles.remove} type="button"
                    onClick={() => removeFromCart(item.slug, item.size)}>Remove</button>
                </div>
              </div>
              <strong className={styles.total}>{formatPrice(product.price * item.quantity)}</strong>
            </article>
          );
        })}
        <Link className={styles.back} href="/shop">← Continue shopping</Link>
      </section>

      <aside className={styles.summary} aria-label="Order summary">
        <h2>Order summary.</h2>
        <div className={styles.summaryLine}><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className={styles.summaryLine}><span>Delivery</span><span>Calculated at checkout</span></div>
        <div className={styles.grandTotal}><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <p>Final delivery charge and order total are shown before payment.</p>
        <Link href="/checkout" className={styles.checkout}>PROCEED TO CHECKOUT <span>↗</span></Link>
      </aside>
    </div>
  );
}
