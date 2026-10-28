"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCart } from "@/lib/cart";

type PaymentState = "checking" | "pending" | "paid" | "failed" | "cancelled" | "unavailable";

export function PaymentReturn({
  orderId, cancelled, failed,
}: {
  orderId: string;
  cancelled: boolean;
  failed: boolean;
}) {
  const [state, setState] = useState<PaymentState>(
    cancelled ? "cancelled" : failed ? "failed" : "checking",
  );

  useEffect(() => {
    if (!orderId) return;
    let closed = false;
    let done = false;
    let attempts = 0;
    const check = async () => {
      try {
        const response = await fetch("/api/orders/" + encodeURIComponent(orderId), { cache: "no-store" });
        if (!response.ok) throw new Error("Unavailable");
        const result = await response.json() as { status: string };
        if (closed) return;
        if (result.status === "paid") {
          done = true;
          setState("paid");
          clearCart();
          return;
        }
        if (result.status === "failed" || result.status === "cancelled") {
          setState(result.status);
          return;
        }
        if (!cancelled && !failed) setState("pending");
      } catch {
        if (!closed && !cancelled && !failed) setState("unavailable");
      }
    };
    void check();
    const timer = window.setInterval(() => {
      if (++attempts > 30 || closed || done) {
        window.clearInterval(timer);
        return;
      }
      void check();
    }, 5000);
    return () => { closed = true; window.clearInterval(timer); };
  }, [orderId, cancelled, failed]);

  const paid = state === "paid";
  const heading = paid ? "Payment confirmed."
    : state === "cancelled" ? "Checkout cancelled."
    : state === "failed" ? "Payment not completed."
    : state === "unavailable" ? "Checking your order."
    : "Awaiting confirmation.";
  const detail = paid
    ? "Your payment has been verified. Your order is recorded for fulfilment."
    : state === "cancelled" || state === "failed"
      ? "No successful payment has been recorded for this order. Your items remain in your cart."
      : "We're waiting for a verified confirmation from our payment provider. Do not make another payment while a transaction is pending.";

  return (
    <section style={{ maxWidth: 780, paddingBottom: 150 }} aria-live="polite">
      <h1 style={{ fontSize: "clamp(3rem, 7vw, 7rem)", marginBottom: 35 }}>{heading}</h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: "#555" }}>{detail}</p>
      {orderId && <p style={{ fontSize: 11, color: "#666", marginTop: 30 }}>REFERENCE / {orderId}</p>}
      <div style={{ display: "flex", gap: 25, flexWrap: "wrap", marginTop: 42, fontSize: 12 }}>
        <Link href={paid ? "/shop" : "/cart"} style={{ borderBottom: "1px solid currentColor", paddingBottom: 10 }}>
          {paid ? "Continue shopping →" : "Return to cart →"}
        </Link>
        <Link href="/" style={{ borderBottom: "1px solid currentColor", paddingBottom: 10 }}>
          Home →
        </Link>
      </div>
    </section>
  );
}
