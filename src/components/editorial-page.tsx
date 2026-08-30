import Link from "next/link";

type EditorialPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
};

export function EditorialPage({ eyebrow, title, intro, children }: EditorialPageProps) {
  return (
    <main style={{ minHeight: "100vh", background: "#f3f0e8", color: "#121212" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 4vw", borderBottom: "1px solid rgba(0,0,0,.18)" }}>
        <Link href="/" style={{ fontWeight: 700, letterSpacing: ".08em" }}>MAISON AMIRAL</Link>
        <nav style={{ display: "flex", gap: 24, fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em" }}>
          <Link href="/shop">Shop</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>
      <section style={{ padding: "clamp(5rem,12vw,10rem) 4vw 7rem", maxWidth: 1200 }}>
        <p style={{ textTransform: "uppercase", letterSpacing: ".14em", fontSize: 12, marginBottom: 24 }}>{eyebrow}</p>
        <h1 style={{ fontSize: "clamp(3.6rem,11vw,9rem)", lineHeight: .86, letterSpacing: "-.055em", fontWeight: 500, margin: 0, maxWidth: 1100 }}>{title}</h1>
        <p style={{ maxWidth: 700, fontSize: "clamp(1.05rem,2vw,1.35rem)", lineHeight: 1.6, marginTop: 48 }}>{intro}</p>
        {children && <div style={{ marginTop: 64 }}>{children}</div>}
      </section>
      <footer style={{ padding: "40px 4vw", borderTop: "1px solid rgba(0,0,0,.18)", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
        <span>© 2026 Maison Amiral</span>
        <span>Johannesburg, South Africa</span>
      </footer>
    </main>
  );
}
