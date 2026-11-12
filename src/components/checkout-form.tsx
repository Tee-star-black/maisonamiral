"use client";
import { getProductBySlug } from "@/lib/client-catalogue";
import { useCatalogue } from "@/components/catalogue-provider";

import { ArrowIcon } from "@/components/ui-icons";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { cartSubtotal, clearCart, useCart } from "@/lib/cart";
import { formatPrice, getDeliveryFee } from "@/data/products";
import { provinces, type Buyer } from "@/lib/commerce";
import styles from "./checkout-form.module.css";
import { WheelLoader } from "./wheel-loader";

const emptyBuyer: Buyer = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", suburb: "", city: "", province: "", postalCode: "",
};

type CheckoutConfig = { enabled: boolean; deliveryCents: number | null; currency: "ZAR"; paymentMethod: "eft" };
const money = (cents: number) => "R" + (cents / 100).toFixed(2);

export function CheckoutForm() {
  useCatalogue();
  const attempt = useRef<string | null>(null);
  const items = useCart();
  const subtotal = cartSubtotal(items);
  const deliveryCents = getDeliveryFee(items);
  const [buyer, setBuyer] = useState<Buyer>(emptyBuyer);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{ reference:string; notificationStatus:string; message:string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/checkout", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unavailable");
        return r.json() as Promise<CheckoutConfig>;
      })
      .then((data) => { if (active) setConfig(data); })
      .catch(() => { if (active) setConfig({ enabled: false, deliveryCents: null, currency: "ZAR", paymentMethod: "eft" }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!items.length) Promise.resolve().then(() => {
      try {
        const saved = JSON.parse(window.sessionStorage.getItem("maison-last-receipt") ?? "null");
        if (active && saved && /^MA-[A-F0-9]{12}$/.test(saved.reference) &&
            ["sent", "needs_attention", "pending"].includes(saved.notificationStatus) &&
            Date.now() - saved.savedAt < 86400_000) {
          setConfirmed({reference:saved.reference,notificationStatus:saved.notificationStatus,
            message:"Your order has been recorded. Check your email for the EFT invoice."});
        }
      } catch { /* Receipts remain in email when storage is unavailable. */ }
    });
    return () => { active = false; };
  }, [items.length]);
  const showReceipt = confirmed && !items.length;

  function setField(key: keyof Buyer, value: string) {
    setBuyer((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !items.length || !config?.enabled) return;
    setSubmitting(true);
    setError("");
    try {
      let checkoutId = attempt.current;
      try { checkoutId ??= window.sessionStorage.getItem("maison-eft-checkout-id"); } catch { /* In-memory retry ID remains available. */ }
      if (!checkoutId || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(checkoutId)) {
        checkoutId = window.crypto.randomUUID();
        try { window.sessionStorage.setItem("maison-eft-checkout-id", checkoutId); } catch { /* Storage may be blocked. */ }
      }
      attempt.current = checkoutId;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: buyer, items, checkoutId }),
      });
      const payload = await response.json() as {
        orderId?: string; reference?: string; notificationStatus?: string;
        message?: string; error?: string;
      };
      if (response.status === 409) {
        attempt.current = null;
        try { window.sessionStorage.removeItem("maison-eft-checkout-id"); } catch { /* Storage may be blocked. */ }
      }
      if (!response.ok || !payload.orderId || !payload.reference)
        throw new Error(payload.error ?? "Unable to place your order.");
      const receipt = { reference:payload.reference,
        notificationStatus:payload.notificationStatus ?? "needs_attention",
        message:payload.message ?? "Your order has been recorded." };
      setConfirmed(receipt);
      try { window.sessionStorage.setItem("maison-last-receipt", JSON.stringify({...receipt, savedAt:Date.now()})); } catch { /* The emailed invoice remains available. */ }
      attempt.current = null;
      try { window.sessionStorage.removeItem("maison-eft-checkout-id"); } catch { /* Storage may be blocked. */ }
      clearCart();
      setSubmitting(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to place your order.");
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.layout}>
      {showReceipt && <section role="status" style={{gridColumn:"1 / -1",padding:"28px",border:"1px solid #202420",background:"#f7f7f7"}}>
        <p style={{fontSize:11,letterSpacing:".12em"}}>MAISON AMIRAL / ORDER RECORDED</p>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,58px)",fontWeight:400,margin:"18px 0"}}>Awaiting EFT payment.</h2>
        <p>Your reference: <strong>{confirmed.reference}</strong></p>
        <p>{confirmed.message}</p>
        {confirmed.notificationStatus !== "sent" && <p role="alert">Email delivery needs attention. Keep your order reference and contact Maison Amiral before making payment.</p>}
        <p>Use the invoice reference for your transfer. Your order is only marked paid once the funds are verified.</p>
        <Link href="/shop" style={{display:"inline-block",borderBottom:"1px solid",marginTop:16}}>Return to shop <ArrowIcon direction="up-right" /></Link>
      </section>}
      {!showReceipt && <form id="ma-checkout-form" className={styles.form} onSubmit={submit}>
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
        <Link className={styles.returnLink} href="/cart"><ArrowIcon direction="left" /> Return to cart</Link>
      </form>}

      {!showReceipt && <aside className={styles.summary}>
        <div className={styles.summaryTop}><span>ORDER SUMMARY</span><span>EDITION 001</span></div>
        {items.length ? items.map((item) => {
          const product = getProductBySlug(item.slug);
          if (!product) return null;
          return (
            <div className={styles.item} key={item.slug + ":" + item.size}>
              <div className={styles.photo}><Image src={product.images[0]} alt={product.name} width={90} height={110}/></div>
              <div className={styles.itemDescription}>
                <strong>{product.name}</strong><span>{item.size === "ONE SIZE" ? "One size" : `Size ${item.size}`} / Qty {item.quantity}</span>
              </div>
              <span>{formatPrice(product.price * item.quantity)}</span>
            </div>
          );
        }) : <p className={styles.empty}>Your cart is empty. <Link href="/shop">Shop collection</Link></p>}
        <div className={styles.subtotal}><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <div className={styles.subtotal}><span>Delivery</span><span>
          {deliveryCents ? money(deliveryCents) : "Free"}
        </span></div>
        <div className={styles.total}><span>TOTAL</span><strong>
          {money(subtotal * 100 + deliveryCents)}
        </strong></div>
        {config && !config.enabled && (
          <p className={styles.notice} role="status">
            EFT ordering is not available until our invoice email, banking and database settings are configured.
          </p>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" form="ma-checkout-form" className={styles.pay}
          disabled={!items.length || !config?.enabled || submitting}>
          {submitting ? <><WheelLoader label="Placing order" compact /> PLACING ORDER...</> : "PLACE ORDER & RECEIVE EFT INVOICE"}
          <span aria-hidden="true"><ArrowIcon direction="up-right" /></span>
        </button>
        <p className={styles.security}>By placing an order you acknowledge our <Link href="/privacy" style={{textDecoration:"underline"}}>Privacy Policy</Link>, <Link href="/returns" style={{textDecoration:"underline"}}>Returns Policy</Link> and <Link href="/terms" style={{textDecoration:"underline"}}>Terms</Link>.</p>
        <p className={styles.security}>No card payment is taken. After placing your order, an invoice with EFT banking details is emailed to you. We dispatch only after verifying payment.</p>
      </aside>}
    </div>
  );
}
