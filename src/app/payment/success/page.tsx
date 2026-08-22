"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

type PendingOrder = {
  orderId: string;
  customer: { firstName: string; lastName: string; email: string };
  createdAt: string;
};

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PendingOrder | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("maison-amiral-pending-order");
    if (raw) {
      try {
        setOrder(JSON.parse(raw) as PendingOrder);
      } catch {
        setOrder(null);
      }
    }
    clearCart();
  }, [clearCart]);

  const orderId = searchParams.get("order") || order?.orderId || "Maison Amiral order";

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
