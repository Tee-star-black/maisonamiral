"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type LastOrder = {
  orderId: string;
  customer: { firstName: string; email: string };
  total: number;
};

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("maison-amiral-last-order");
    if (!raw) return;
    try {
      setOrder(JSON.parse(raw) as LastOrder);
    } catch {
      setOrder(null);
    }
  }, []);

  const orderId = searchParams.get("order") || order?.orderId || "your Maison Amiral order";

  return (
    <main className="payment-result-page">
      <Link className="payment-brand" href="/">MAISON AMIRAL</Link>
      <section className="payment-result-card">
        <p className="eyebrow">Order received</p>
        <h1>Check your inbox.</h1>
        <p>
          {order?.customer?.firstName ? `${order.customer.firstName}, your` : "Your"} order has been created. Your reference is <strong>{orderId}</strong>.
        </p>
        <p>
          We have emailed the invoice, banking details and EFT payment reference to {order?.customer?.email ? <strong>{order.customer.email}</strong> : "the email address entered at checkout"}.
        </p>
        <p className="commerce-muted">Use the exact order reference when making payment so the payment can be matched to your order.</p>
        <div className="payment-actions">
          <Link className="checkout-button" href="/shop">Continue shopping <span>→</span></Link>
          <Link className="text-link" href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
