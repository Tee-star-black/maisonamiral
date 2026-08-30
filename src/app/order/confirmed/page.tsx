import { Suspense } from "react";
import OrderConfirmedContent from "./OrderConfirmedContent";

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="payment-result-page">Loading order confirmation...</div>}>
      <OrderConfirmedContent />
    </Suspense>
  );
}
