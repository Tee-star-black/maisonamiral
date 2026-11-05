import type { Metadata } from "next";
export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false, follow: false } };
export default async function ConfirmNewsletter({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main style={{ maxWidth: 600, padding: "90px 22px", margin: "0 auto", minHeight: "60vh" }}>
    <p style={{ letterSpacing: "0.15em", fontSize: 11 }}>MAISON AMIRAL / DROPS</p>
    <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontFamily: "Georgia,serif", fontWeight: 400 }}>Confirm your subscription.</h1>
    <p>Confirm to receive early access announcements and future collection updates.</p>
    <form action="/api/newsletter/confirm" method="post">
      <input type="hidden" name="token" value={token ?? ""} />
      <button style={{ background: "#202420", color: "#fff", padding: "18px 24px", border: 0, marginTop: 20, cursor: "pointer" }}>CONFIRM EMAIL</button>
    </form>
  </main>;
}
