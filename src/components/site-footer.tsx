import Link from "next/link";
import styles from "./site-footer.module.css";

const explore = [
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["The studio", "/#fitting-studio"],
  ["Journal", "/journal"],
] as const;

const information = [
  ["Contact", "/contact"],
  ["Shipping", "/shipping"],
  ["Returns", "/returns"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.overline}>
          <span>MA / INDEPENDENT CLOTHING</span>
          <span>JOHANNESBURG · EDITION 001</span>
        </div>
        <div className={styles.content}>
          <div className={styles.intro}>
            <p className={styles.label}>A considered wardrobe / 001</p>
            <h2>Less noise.<br /><em>More presence.</em></h2>
            <Link href="/shop" className={styles.cta}>
              Explore the collection <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.navigation}>
            <nav aria-label="Explore Maison Amiral">
              <h3>Explore</h3>
              {explore.map(([title, href]) => (
                <Link key={href} href={href}>{title}</Link>
              ))}
            </nav>
            <nav aria-label="Customer information">
              <h3>Information</h3>
              {information.map(([title, href]) => (
                <Link key={href} href={href}>{title}</Link>
              ))}
            </nav>
          </div>
        </div>
        <div className={styles.wordmark} aria-hidden="true">MAISON AMIRAL</div>
        <div className={styles.baseline}>
          <span>© 2026 MAISON AMIRAL</span>
          <span>JOHANNESBURG / SOUTH AFRICA</span>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </div>
    </footer>
  );
}
