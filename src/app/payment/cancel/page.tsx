import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <main className="payment-result-page">
      <Link className="payment-brand" href="/">MAISON AMIRAL</Link>
      <section className="payment-result-card">
        <p className="eyebrow">Payment cancelled</p>
        <h1>Still in your bag.</h1>
        <p>No payment was completed. Your selected pieces remain in your bag so you can return to checkout when ready.</p>
        <div className="payment-actions">
          <Link className="checkout-button" href="/checkout">Return to checkout <span>→</span></Link>
          <Link className="text-link" href="/cart">Review bag</Link>
        </div>
      </section>
    </main>
  );
}
