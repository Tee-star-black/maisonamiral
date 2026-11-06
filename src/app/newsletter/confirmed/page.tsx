import { verifyNewsletterToken } from "@/lib/newsletter-tokens";
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Subscription confirmed", robots: { index: false, follow: false } };
export default async function Confirmed({searchParams}: {searchParams: Promise<{manage?:string}>}) {
  const {manage} = await searchParams;
  const valid = verifyNewsletterToken(manage,"unsubscribe");
  return <main style={{ maxWidth: 600, padding: "90px 22px", margin: "0 auto", minHeight: "60vh" }}>
    <p style={{ letterSpacing: "0.15em", fontSize: 11 }}>MAISON AMIRAL / DROPS</p>
    <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontFamily: "Georgia,serif", fontWeight: 400 }}>You&apos;re on the list.</h1>
    <p>You&apos;ll hear from Maison Amiral when the next collection is ready.</p>
    {valid && <p style={{marginTop:20}}>Changed your mind? <Link style={{textDecoration:"underline"}} href={"/newsletter/unsubscribe?token="+encodeURIComponent(manage!)}>Unsubscribe from updates</Link></p>}
    <Link href="/shop" style={{ textDecoration: "underline", display: "inline-block", marginTop: 20 }}>Explore the collection</Link>
  </main>;
}
