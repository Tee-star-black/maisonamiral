import Link from "next/link";

const navItems = [
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Lookbook", "/lookbook"],
  ["Editorial", "/editorial"],
  ["Journal", "/journal"],
] as const;

export default function Home() {
  return (
    <main>
      <section className="hero">
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Maison Amiral home">
            MAISON AMIRAL
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="header-actions" aria-label="Store actions">
            <Link href="/search">Search</Link>
            <Link href="/cart">Bag · 0</Link>
          </div>
        </header>

        <div className="hero-grid">
          <div className="hero-kicker">
            <span>Johannesburg</span>
            <span>Edition 001</span>
          </div>

          <div className="hero-title-wrap">
            <h1 className="hero-title">
              MAISON
              <br />
              AMIRAL
            </h1>
          </div>

          <div className="hero-bottom">
            <p className="hero-copy">
              Clothing for movement, memory and the quiet confidence of things
              made with intent.
            </p>

            <Link className="text-link" href="/shop">
              Explore the collection <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="statement section-pad">
        <p className="eyebrow">Maison Amiral / Philosophy</p>
        <div className="statement-grid">
          <h2>
            Silence is
            <br />
            the new luxury.
          </h2>
          <div className="statement-copy">
            <p>
              Maison Amiral lives between tailoring and street culture,
              machinery and memory, restraint and rebellion.
            </p>
            <p>
              We make pieces that do not ask for attention. They hold it.
            </p>
          </div>
        </div>
      </section>

      <section className="featured section-pad">
        <div className="section-heading-row">
          <p className="eyebrow">Selected / 001</p>
          <Link className="text-link" href="/shop">
            View all <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="product-stage">
          <div className="product-art" aria-hidden="true">
            <span className="product-art-word">AMIRAL</span>
          </div>

          <div className="product-meta">
            <div>
              <p className="product-index">01</p>
              <h3>Flagship Emblem Tee</h3>
            </div>
            <div className="product-price">R450</div>
          </div>
        </div>
      </section>

      <section className="editorial-banner">
        <div className="editorial-overlay">
          <p className="eyebrow light">Editorial / Vol. 01</p>
          <h2>Shadow.<br />Structure.<br />Movement.</h2>
          <Link className="text-link light" href="/editorial">
            Read the statement <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <footer className="site-footer section-pad">
        <div className="footer-top">
          <p className="footer-brand">MAISON AMIRAL</p>
          <p className="footer-note">
            Objects for people who prefer presence over noise.
          </p>
        </div>

        <div className="footer-grid">
          <div>
            <p className="footer-label">Explore</p>
            <Link href="/shop">Shop</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/journal">Journal</Link>
          </div>
          <div>
            <p className="footer-label">Information</p>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <p className="footer-label">Legal</p>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Maison Amiral</span>
          <span>Johannesburg, South Africa</span>
          <span>Product of BloomTech</span>
        </div>
      </footer>
    </main>
  );
}
