import Image from "next/image";
import Link from "next/link";

const shopLinks = [
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Lookbook", "/lookbook"],
] as const;

const journalLinks = [
  ["Journal", "/journal"],
  ["Editorial", "/editorial"],
  ["House notes", "/subscribe"],
] as const;

const informationLinks = [
  ["Shipping", "/shipping"],
  ["Returns", "/returns"],
  ["Contact", "/contact"],
] as const;

export function MaisonFooter() {
  return (
    <footer className="ma-footer">
      <div className="ma-footer-top-grid">
        <section className="ma-footer-statement ma-footer-cell">
          <p className="ma-footer-kicker">Maison Amiral / Johannesburg</p>
          <h2>Objects for movement, memory and quiet confidence.</h2>
        </section>

        <nav className="ma-footer-cell ma-footer-links" aria-label="Shop links">
          <p className="ma-footer-label">Shop</p>
          {shopLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>

        <nav className="ma-footer-cell ma-footer-links" aria-label="Journal links">
          <p className="ma-footer-label">Journal</p>
          {journalLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>

        <nav className="ma-footer-cell ma-footer-links" aria-label="Information links">
          <p className="ma-footer-label">Information</p>
          {informationLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>

        <div className="ma-footer-cell ma-footer-mark" aria-label="Maison Amiral house mark">
          <Image
            className="ma-footer-ship"
            src="/graphics/ship.png"
            alt="Maison Amiral ship emblem"
            width={49}
            height={96}
          />
          <span className="ma-footer-mark-caption">HOUSE MARK / 001</span>
        </div>
      </div>

      <div className="ma-footer-info-grid">
        <section className="ma-footer-cell ma-subscribe-panel">
          <p className="ma-footer-label">Subscribe</p>
          <p>Collection notes, new releases and occasional observations from the house.</p>
          <form className="ma-subscribe-form" action="/subscribe" method="get">
            <label className="sr-only" htmlFor="ma-footer-email">Email address</label>
            <input id="ma-footer-email" name="email" type="email" placeholder="Enter your email" autoComplete="email" />
            <button type="submit" aria-label="Continue to subscribe">→</button>
          </form>
        </section>

        <section className="ma-footer-cell ma-footer-address">
          <p className="ma-footer-label">Address</p>
          <p>Johannesburg<br />South Africa</p>
          <Link href="/contact">Direction ↗</Link>
        </section>

        <section className="ma-footer-cell ma-footer-contact">
          <p className="ma-footer-label">Contact</p>
          <a href="mailto:support@maisonamiral.co.za">support@maisonamiral.co.za</a>
          <div className="ma-footer-mini-rule" />
          <p className="ma-footer-label">Edition</p>
          <span>Edition 001 / 2026</span>
        </section>

        <section className="ma-footer-cell ma-footer-social">
          <p className="ma-footer-label">Social</p>
          <span>Instagram</span>
          <span>Johannesburg</span>
          <span>Maison Amiral</span>
        </section>
      </div>

      <div className="ma-footer-blueprint" aria-label="Maison Amiral wordmark">
        <span className="ma-footer-cross cross-a">+</span>
        <span className="ma-footer-cross cross-b">+</span>
        <span className="ma-footer-cross cross-c">+</span>
        <span className="ma-footer-blueprint-text">MAISON AMIRAL</span>
        <div className="ma-footer-measure measure-top" />
        <div className="ma-footer-measure measure-bottom" />
      </div>

      <div className="ma-footer-bottom">
        <span>© 2026 Maison Amiral. All rights reserved.</span>
        <span>Johannesburg, South Africa</span>
        <div className="ma-footer-legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms & Conditions</Link>
          <Link href="/shipping">Shipping</Link>
        </div>
      </div>
    </footer>
  );
}
