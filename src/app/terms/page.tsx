import Link from "next/link";
import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms", type: "website", images: ["/opengraph-image"] }, title: "Terms", description: "Maison Amiral store terms." };

export default function TermsPage() {
  return <EditorialPage eyebrow="Legal" title="Terms." intro="Ordering, EFT payment and delivery information for the Maison Amiral store.">
    <div style={{maxWidth:760,margin:"0 auto",lineHeight:1.8,display:"grid",gap:28}}>
      <section><h2>Orders and prices</h2><p>Prices are in South African rand (ZAR). Review your items, sizes, quantities and delivery details before placing an order. Contact support@maisonamiral.co.za promptly if you need to correct an order.</p></section>
      <section><h2>EFT payment</h2><p>Checkout records your order and emails an invoice with banking details and a unique payment reference. An invoice is not proof of payment. Use the invoice reference for your transfer. Orders are processed for dispatch after Maison Amiral verifies receipt of the funds. If your invoice does not arrive, contact support before making payment.</p></section>
      <section><h2>Delivery</h2><p>Clothing has free delivery. Orders containing the Boat Floating Wheel have a single R40 delivery fee, including mixed orders and multiple wheels. The checkout total shows this charge. See our <Link href="/shipping" style={{textDecoration:"underline"}}>shipping information</Link>.</p></section>
      <section><h2>Returns and privacy</h2><p>See our <Link href="/returns" style={{textDecoration:"underline"}}>Returns Policy</Link> for returns and faulty items, and our <Link href="/privacy" style={{textDecoration:"underline"}}>Privacy Policy</Link> for how order and subscription information is handled. Nothing here limits your rights under applicable South African consumer law.</p></section>
      <section><h2>Support</h2><p>For order queries, email <a href="mailto:support@maisonamiral.co.za" style={{textDecoration:"underline"}}>support@maisonamiral.co.za</a> with your order reference. Never email your banking password or PIN.</p></section>
    </div>
  </EditorialPage>;
}
