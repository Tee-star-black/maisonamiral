"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CartLink } from "@/components/cart/CartLink";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, getProduct } from "@/data/products";

type CheckoutFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
};

const initialFields: CheckoutFields = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const { items, subtotal, hydrated } = useCart();
  const [fields, setFields] = useState(initialFields);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailedItems = useMemo(
    () => items.map((item) => ({ ...item, product: getProduct(item.slug) })).filter((item) => item.product),
    [items],
  );

  function updateField(name: keyof CheckoutFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payfast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: fields, items }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to prepare payment.");

      window.localStorage.setItem(
        "maison-amiral-pending-order",
        JSON.stringify({ orderId: payload.orderId, customer: fields, items, subtotal, createdAt: new Date().toISOString() }),
      );

      const form = document.createElement("form");
      form.method = "POST";
      form.action = payload.action;
      Object.entries(payload.fields as Record<string, string>).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to prepare payment.");
      setSubmitting(false);
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <main className="commerce-page">
        <header className="site-header shop-header"><Link className="brand" href="/">MAISON AMIRAL</Link><span /><div className="header-actions"><CartLink /></div></header>
        <section className="empty-checkout"><p>Your bag is empty.</p><Link className="commerce-primary-link" href="/shop">Return to shop →</Link></section>
      </main>
    );
  }

  return (
    <main className="commerce-page">
      <header className="site-header shop-header">
        <Link className="brand" href="/">MAISON AMIRAL</Link>
        <nav className="desktop-nav"><Link href="/shop">Shop</Link></nav>
        <div className="header-actions"><Link href="/cart">Back to bag</Link><CartLink /></div>
      </header>

      <section className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <p className="eyebrow">Checkout / Delivery</p>
          <h1>Where should it go?</h1>

          <div className="form-section">
            <h2>Contact</h2>
            <div className="field-grid two-col">
              <label><span>First name</span><input required autoComplete="given-name" value={fields.firstName} onChange={(e) => updateField("firstName", e.target.value)} /></label>
              <label><span>Last name</span><input required autoComplete="family-name" value={fields.lastName} onChange={(e) => updateField("lastName", e.target.value)} /></label>
              <label><span>Email</span><input required type="email" autoComplete="email" value={fields.email} onChange={(e) => updateField("email", e.target.value)} /></label>
              <label><span>Phone</span><input required autoComplete="tel" value={fields.phone} onChange={(e) => updateField("phone", e.target.value)} /></label>
            </div>
          </div>

          <div className="form-section">
            <h2>Delivery address</h2>
            <div className="field-grid">
              <label><span>Address</span><input required autoComplete="address-line1" value={fields.address1} onChange={(e) => updateField("address1", e.target.value)} /></label>
              <label><span>Apartment, suite, etc. (optional)</span><input autoComplete="address-line2" value={fields.address2} onChange={(e) => updateField("address2", e.target.value)} /></label>
            </div>
            <div className="field-grid three-col">
              <label><span>City</span><input required autoComplete="address-level2" value={fields.city} onChange={(e) => updateField("city", e.target.value)} /></label>
              <label><span>Province</span><select required value={fields.province} onChange={(e) => updateField("province", e.target.value)}><option value="">Select</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>North West</option><option>Northern Cape</option><option>Western Cape</option></select></label>
              <label><span>Postal code</span><input required inputMode="numeric" autoComplete="postal-code" value={fields.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} /></label>
            </div>
          </div>

          {error && <p className="checkout-error">{error}</p>}
          <button className="pay-button" type="submit" disabled={submitting || !hydrated}>
            <span>{submitting ? "Opening secure payment…" : "Continue to PayFast"}</span>
            <span>{formatPrice(subtotal)}</span>
          </button>
          <p className="secure-note">You will be redirected to PayFast to complete payment securely.</p>
        </form>

        <aside className="checkout-summary">
          <p className="eyebrow">Your order</p>
          <div className="checkout-items">
            {detailedItems.map((item) => item.product && (
              <div className="checkout-item" key={`${item.slug}-${item.size}`}>
                <div><strong>{item.product.shortName}</strong><span>Size {item.size} · Qty {item.quantity}</span></div>
                <span>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="summary-row"><span>Shipping</span><span>R0 for current launch configuration</span></div>
          <div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
        </aside>
      </section>
    </main>
  );
}
