import Image from "next/image";
import Link from "next/link";
import { EditionGallery } from "@/components/edition-gallery";
import { MannequinExperience } from "@/components/mannequin-experience";

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
      <section className="hero hero-campaign">
        <div className="hero-media" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/products/emblem/front-edit.jpeg"
            className="hero-media-image"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src="/video/flag.mp4" type="video/mp4" />
          </video>
          <div className="hero-media-wash" />
        </div>

        <header className="site-header hero-header">
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

        <div className="hero-grid hero-grid-campaign">
          <div className="hero-kicker">
            <span>Johannesburg / South Africa</span>
            <span>Edition 001 / 2026</span>
          </div>

          <div className="hero-title-wrap hero-title-campaign-wrap">
            <p className="hero-edition-mark">Objects for presence</p>
            <h1 className="hero-title hero-title-campaign">
              MAISON
              <br />
              <span>AMIRAL</span>
            </h1>
          </div>

          <div className="hero-bottom">
            <p className="hero-copy">
              Clothing for movement, memory and the quiet confidence of things
              made with intent.
            </p>

            <div className="hero-cta-group">
              <Link className="hero-cta" href="/shop">
                Enter Edition 001 <span aria-hidden="true">↗</span>
              </Link>
              <span className="hero-scroll">Scroll to explore ↓</span>
            </div>
          </div>
        </div>

        <p className="hero-vertical-note" aria-hidden="true">
          Johannesburg atelier / 26.2048° S
        </p>
      </section>

      <div className="collection-ticker" aria-label="Maison Amiral design language">
        <div className="collection-ticker-track">
          <span>Edition 001</span>
          <span>Movement</span>
          <span>Machinery</span>
          <span>Memory</span>
          <span>Johannesburg</span>
          <span>Edition 001</span>
          <span>Movement</span>
          <span>Machinery</span>
          <span>Memory</span>
          <span>Johannesburg</span>
        </div>
      </div>

      <section className="statement section-pad">
        <div className="statement-topline">
          <p className="eyebrow">Maison Amiral / Philosophy</p>
          <span>01 / Manifesto</span>
        </div>

        <div className="statement-grid">
          <h2>
            Silence is
            <br />
            <em>the new luxury.</em>
          </h2>
          <div className="statement-copy">
            <p>
              Maison Amiral lives between tailoring and street culture,
              machinery and memory, restraint and rebellion.
            </p>
            <p>
              We make pieces that do not ask for attention. They hold it.
            </p>
            <Link className="text-link" href="/editorial">
              Read the house statement <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <MannequinExperience />

      <section className="featured section-pad">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Selected / 001</p>
            <h2 className="featured-heading">The house emblem.</h2>
          </div>
          <Link className="text-link" href="/shop/emblem-tee">
            View piece <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <Link className="featured-layout" href="/shop/emblem-tee" aria-label="View Emblem Tee">
          <div className="product-art">
            <Image
              src="/products/emblem/back-editorial.jpeg"
              alt="Maison Amiral Emblem Tee editorial back view"
              fill
              sizes="(max-width: 900px) 100vw, 68vw"
              className="featured-product-image"
            />
            <span className="featured-image-label">Edition 001 / Rear study</span>
          </div>

          <div className="featured-copy-panel">
            <p className="product-index">04 / 04</p>
            <div>
              <h3>Emblem Tee</h3>
              <p>
                The house mark reduced to its clearest form. A relaxed silhouette,
                quiet structure and a graphic identity designed to live beyond a season.
              </p>
            </div>
            <div className="featured-panel-bottom">
              <span>R450</span>
              <span>Explore piece ↗</span>
            </div>
          </div>
        </Link>
      </section>

      <EditionGallery />

      <section className="editorial-banner">
        <video className="editorial-banner-video" autoPlay muted loop playsInline aria-hidden="true">
          <source src="/video/flag.mp4" type="video/mp4" />
        </video>
        <div className="editorial-banner-wash" aria-hidden="true" />
        <div className="editorial-overlay">
          <p className="eyebrow light">Editorial / Vol. 01</p>
          <h2>
            Shadow.<br />
            Structure.<br />
            <em>Movement.</em>
          </h2>
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
