import type { Metadata } from "next";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main style={{ maxWidth: 600, padding: "90px 22px", margin: "0 auto", minHeight: "60vh" }}>
    <p style={{ letterSpacing: "0.15em", fontSize: 11 }}>MAISON AMIRAL / EMAIL</p>
    <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontFamily: "Georgia,serif", fontWeight: 400 }}>Unsubscribe from updates.</h1>
    <p>Stop receiving new drop notifications and Maison Amiral release announcements.</p>
    <form action="/api/newsletter/unsubscribe" method="post">
      <input name="token" type="hidden" value={token ?? ""} />
      <button style={{ background: "#202420", color: "#fff", border: 0, padding: "18px 24px", marginTop: 20, cursor: "pointer" }}>UNSUBSCRIBE</button>
    </form>
  </main>;
}
