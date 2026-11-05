import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Unsubscribed", robots: { index: false, follow: false } };
export default function Unsubscribed() {
  return <main style={{ maxWidth: 600, padding: "90px 22px", margin: "0 auto", minHeight: "60vh" }}>
    <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontFamily: "Georgia,serif", fontWeight: 400 }}>You've been unsubscribed.</h1>
    <p>You won't receive further Maison Amiral drop emails unless you sign up again.</p>
    <Link href="/shop" style={{ textDecoration: "underline" }}>Back to shop</Link>
  </main>;
}
