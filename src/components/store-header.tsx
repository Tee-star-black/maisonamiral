import Image from "next/image";
import Link from "next/link";
import { CartIndicator } from "./store-cart-indicator";
import styles from "./store-header.module.css";

const mainLinks = [
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Journal", "/journal"],
] as const;

const secondaryLinks = [
  ["Lookbook", "/lookbook"],
  ["Contact", "/contact"],
] as const;

export function StoreHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <nav className={styles.desktopNav} aria-label="Shop and explore">
          {mainLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <details className={styles.mobileMenu}>
          <summary aria-label="Open navigation menu">Menu <span aria-hidden="true">☰</span></summary>
          <nav aria-label="Mobile navigation">
            {[...mainLinks, ...secondaryLinks].map(([label, href]) => (
              <Link href={href} key={href}>{label}</Link>
            ))}
          </nav>
        </details>
      </div>

      <Link href="/" className={styles.logo} aria-label="Maison Amiral home">
        <Image src="/Ship.jpg" alt="Maison Amiral ship insignia" width={61} height={84} priority />
      </Link>

      <div className={styles.right}>
        <nav className={styles.desktopNav} aria-label="More Maison Amiral">
          {secondaryLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <Link className={styles.cart} href="/cart" aria-label="View shopping cart">
          Cart <CartIndicator />
        </Link>
      </div>
    </header>
  );
}
