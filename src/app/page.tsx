import Image from "next/image";
import Link from "next/link";
import { CartLink } from "@/components/cart/CartLink";

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
      <section className="hero hero-media">
        <video className="hero-video" src="/video/flag.mp4" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        <div className="hero-shade" />

        <header className="site-header hero-header">
          <Link className="brand" href="/" aria-label="Maison Amiral home">MAISON AMIRAL</Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
          <div className="header-actions" aria-label="Store actions"><Link href="/search">Search</Link><CartLink /></div>
        </header>

        <div className="hero-grid hero-content">
          <div className="hero-kicker"><span>Johannesburg</span><span>Edition 001</span></div>
          <div className="hero-title-wrap"><h1 className="hero-title">MAISON<br />AMIRAL</h1></div>
          <div className="hero-bottom">
            <p className="hero-copy">Clothing for movement, memory and the quiet confidence of things made with intent.</p>
            <Link className="text-link" href="/shop">Explore the collection <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="statement section-pad">
        <p className="eyebrow">Maison Amiral / Philosophy</p>
        <div className="statement-grid">
          <h2>Silence is<br />the new luxury.</h2>
          <div className="statement-copy">
            <p>Maison Amiral lives between tailoring and street culture, machinery and memory, restraint and rebellion.</p>
            <p>We make pieces that do not ask for attention. They hold it.</p>
          </div>
        </div>
      </section>

      <section className="wheel-story section-pad">
        <div className="wheel-copy">
          <p className="eyebrow">Motion / Form</p>
          <h2>Built around movement.</h2>
          <p>Mechanical forms, maritime codes and South African street culture collide in a uniform designed to move between worlds.</p>
        </div>
        <div className="wheel-wrap" aria-hidden="true">
          <Image className="wheel-image" src="/graphics/wheel.png" alt="" width={1100} height={1100} priority={false} />
        </div>
      </section>

      <section className="featured section-pad">
        <div className="section-heading-row">
          <p className="eyebrow">Selected / 001</p>
          <Link className="text-link" href="/shop">View all <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="product-showcase">
          <Link className="product-image product-image-main" href="/product/emblem-tee">
            <Image src="/products/emblem/front-edit.jpeg" alt="Maison Amiral Flagship Emblem Tee" fill sizes="(max-width: 800px) 100vw, 65vw" className="cover-image" />
          </Link>
          <div className="product-side">
            <Link className="product-side-image" href="/product/emblem-tee">
              <Image src="/products/emblem/back-editorial.jpeg" alt="Back detail of the Maison Amiral Flagship Emblem Tee" fill sizes="(max-width: 800px) 100vw, 35vw" className="cover-image" />
            </Link>
            <div className="product-meta">
              <div>
                <p className="product-index">01 / Flagship</p>
                <Link href="/product/emblem-tee"><h3>Emblem Tee</h3></Link>
                <p className="product-description">A restrained house staple built around the Maison Amiral emblem and the visual language of the first collection.</p>
              </div>
              <div className="product-price">R450</div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-detail-strip">
        <div className="detail-image"><Image src="/products/emblem/front.jpeg" alt="Front of Maison Amiral Emblem Tee" fill sizes="50vw" className="contain-image" /></div>
        <div className="detail-image dark-detail"><Image src="/products/emblem/back.jpeg" alt="Back of Maison Amiral Emblem Tee" fill sizes="50vw" className="contain-image" /></div>
      </section>

      <section className="editorial-banner">
        <div className="editorial-overlay">
          <p className="eyebrow light">Editorial / Vol. 01</p>
          <h2>Shadow.<br />Structure.<br />Movement.</h2>
          <Link className="text-link light" href="/editorial">Read the statement <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className="site-footer section-pad">
        <div className="footer-top"><p className="footer-brand">MAISON AMIRAL</p><p className="footer-note">Objects for people who prefer presence over noise.</p></div>
        <div className="footer-grid">
          <div><p className="footer-label">Explore</p><Link href="/shop">Shop</Link><Link href="/collections">Collections</Link><Link href="/journal">Journal</Link></div>
          <div><p className="footer-label">Information</p><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link></div>
          <div><p className="footer-label">Legal</p><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Maison Amiral</span><span>Johannesburg, South Africa</span><span>Product of BloomTech</span></div>
      </footer>
    </main>
  );
}
