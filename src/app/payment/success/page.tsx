"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

type PendingOrder = {
  orderId: string;
  customer: { firstName: string; lastName: string; email: string };
  createdAt: string;
};

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [orderId, setOrderId] = useState("Maison Amiral order");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = window.localStorage.getItem("maison-amiral-pending-order");
    let stored: PendingOrder | null = null;

    if (raw) {
      try {
        stored = JSON.parse(raw) as PendingOrder;
        setOrder(stored);
      } catch {
        stored = null;
      }
    }

    setOrderId(params.get("order") || stored?.orderId || "Maison Amiral order");
    clearCart();
  }, [clearCart]);

  return (
    <main className="payment-result-page">
      <Link className="payment-brand" href="/">MAISON AMIRAL</Link>
      <section className="payment-result-card">
        <p className="eyebrow">Payment received</p>
        <h1>It’s yours.</h1>
        <p>
          Thank you{order?.customer?.firstName ? `, ${order.customer.firstName}` : ""}. Your payment was completed and your order reference is <strong>{orderId}</strong>.
        </p>
        {order?.customer?.email && <p className="commerce-muted">Order contact: {order.customer.email}</p>}
        <div className="payment-actions">
          <Link className="checkout-button" href="/shop">Continue shopping <span>→</span></Link>
          <Link className="text-link" href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
