"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { cartSubtotal, useCart } from "@/lib/cart";
import { formatPrice, getProductBySlug } from "@/data/products";
import { provinces, type Buyer } from "@/lib/commerce";
import styles from "./checkout-form.module.css";

const emptyBuyer: Buyer = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", suburb: "", city: "", province: "", postalCode: "",
};

type CheckoutConfig = { enabled: boolean; deliveryCents: number | null; currency: "ZAR" };
const money = (cents: number) => "R" + (cents / 100).toFixed(2);

export function CheckoutForm() {
  const items = useCart();
  const subtotal = cartSubtotal(items);
  const [buyer, setBuyer] = useState<Buyer>(emptyBuyer);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/checkout", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unavailable");
        return r.json() as Promise<CheckoutConfig>;
      })
      .then((data) => { if (active) setConfig(data); })
      .catch(() => { if (active) setConfig({ enabled: false, deliveryCents: null, currency: "ZAR" }); });
    return () => { active = false; };
  }, []);

  function setField(key: keyof Buyer, value: string) {
    setBuyer((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || !config?.enabled) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: buyer, items }),
      });
      const payload = await response.json() as { redirectUrl?: string; error?: string };
      if (!response.ok || !payload.redirectUrl) throw new Error(payload.error ?? "Unable to start payment.");
      const target = new URL(payload.redirectUrl);
      if (target.protocol !== "https:" ||
          (target.hostname !== "yoco.com" && !target.hostname.endsWith(".yoco.com")))
        throw new Error("Unexpected payment page");
      window.location.assign(target.href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start payment.");
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.layout}>
      <form id="ma-checkout-form" className={styles.form} onSubmit={submit}>
        <h2>Your details.</h2>
        <p className={styles.formIntro}>We&apos;ll use these details to prepare and deliver your order.</p>
        <div className={styles.fields}>
          <label><span>First name *</span><input autoComplete="given-name" required maxLength={80}
            value={buyer.firstName} onChange={(e) => setField("firstName", e.target.value)} /></label>
          <label><span>Last name *</span><input autoComplete="family-name" required maxLength={80}
            value={buyer.lastName} onChange={(e) => setField("lastName", e.target.value)} /></label>
          <label><span>Email address *</span><input type="email" autoComplete="email" required maxLength={254}
            value={buyer.email} onChange={(e) => setField("email", e.target.value)} /></label>
          <label><span>Phone number *</span><input type="tel" autoComplete="tel" required maxLength={30} minLength={8}
            value={buyer.phone} onChange={(e) => setField("phone", e.target.value)} /></label>
          <label className={styles.wide}><span>Street address *</span><input autoComplete="street-address" required maxLength={160}
            value={buyer.address} onChange={(e) => setField("address", e.target.value)} /></label>
          <label><span>Suburb</span><input maxLength={100}
            value={buyer.suburb} onChange={(e) => setField("suburb", e.target.value)} /></label>
          <label><span>City *</span><input autoComplete="address-level2" required maxLength={100}
            value={buyer.city} onChange={(e) => setField("city", e.target.value)} /></label>
          <label><span>Province *</span><select required autoComplete="address-level1"
            value={buyer.province} onChange={(e) => setField("province", e.target.value)}>
            <option value="">Select province</option>
            {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
          </select></label>
          <label><span>Postal code *</span><input required inputMode="numeric" pattern="[0-9]{4}"
            autoComplete="postal-code" maxLength={4}
            value={buyer.postalCode} onChange={(e) => setField("postalCode", e.target.value)} /></label>
        </div>
        <Link className={styles.returnLink} href="/cart">← Return to cart</Link>
      </form>

      <aside className={styles.summary}>
        <div className={styles.summaryTop}><span>ORDER SUMMARY</span><span>EDITION 001</span></div>
        {items.length ? items.map((item) => {
          const product = getProductBySlug(item.slug);
          if (!product) return null;
          return (
            <div className={styles.item} key={item.slug + ":" + item.size}>
              <div className={styles.photo}><Image src={product.images[0]} alt={product.name} width={90} height={110}/></div>
              <div className={styles.itemDescription}>
                <strong>{product.name}</strong><span>Size {item.size} / Qty {item.quantity}</span>
              </div>
              <span>{formatPrice(product.price * item.quantity)}</span>
            </div>
          );
        }) : <p className={styles.empty}>Your cart is empty. <Link href="/shop">Shop collection</Link></p>}
        <div className={styles.subtotal}><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className={styles.subtotal}><span>Delivery</span><span>
          {config?.deliveryCents !== null && config?.deliveryCents !== undefined
            ? money(config.deliveryCents) : "Not configured"}
        </span></div>
        <div className={styles.total}><span>TOTAL</span><strong>
          {config?.deliveryCents !== null && config?.deliveryCents !== undefined
            ? money(subtotal * 100 + config.deliveryCents) : "Pending"}
        </strong></div>
        {config && !config.enabled && (
          <p className={styles.notice} role="status">
            Secure payments are being connected. Your cart is saved, but payment cannot begin until the store&apos;s payment, delivery and order-record settings are activated.
          </p>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" form="ma-checkout-form" className={styles.pay}
          disabled={!items.length || !config?.enabled || submitting}>
          {submitting ? "CONNECTING TO YOCO..." : "CONTINUE TO SECURE PAYMENT"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className={styles.security}>Payments are completed on Yoco&apos;s secure hosted checkout. We never receive your card details.</p>
      </aside>
    </div>
  );
}
