import { getCatalogue } from "@/lib/catalogue";
import { ArrowIcon } from "@/components/ui-icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { formatPrice } from "@/data/products";
import styles from "./shop.module.css";

export const metadata: Metadata = {
  title: "Shop Graphic Tees & Accessories in South Africa",
  alternates: { canonical: "/shop" },
  openGraph: { url: "/shop", images: ["/opengraph-image"] },
  description: "Shop Maison Amiral graphic T-shirts and original accessories designed in Johannesburg. Explore Edition 001 and the Boat Floating Wheel.",
};

export default async function ShopPage() {
  const products = await getCatalogue();
  return (
    <main className={styles.page}>
      <header className={styles.catalogHeader}>
        <div className={styles.kicker}><span>MAISON AMIRAL / SHOP</span><span>JOHANNESBURG · 2026</span></div>
        <div className={styles.headingRow}>
          <div>
            <h1>Shop the collection<span>.</span></h1>
            <p>Considered pieces for everyday wear. Discover the full Maison Amiral collection.</p>
          </div>
          <span className={styles.count}>{String(products.length).padStart(2, "0")} PIECES</span>
        </div>
      </header>

      <section className={styles.catalog} aria-label="Maison Amiral products">
        <div className={styles.toolbar}>
          <span>ALL PRODUCTS <span className={styles.toolbarCount}>({products.length})</span></span>
          <span>CLOTHING &amp; ACCESSORIES</span>
        </div>
        <div className={styles.grid}>
          {products.map((product) => (
            <Link href={`/shop/${product.slug}`} key={product.slug} className={styles.card}>
              <div className={styles.visual}>
                <Image
                  src={product.images[0]}
                  alt={`${product.name} product photograph`}
                  fill
                  sizes="(max-width: 520px) 50vw, (max-width: 960px) 33vw, 25vw"
                  className={styles.image}
                />
                <span className={styles.quickView}>VIEW PRODUCT <ArrowIcon direction="up-right" /></span>
              </div>
              <div className={styles.meta}>
                <div className={styles.info}>
                  <span className={styles.category}>{product.category === "accessory" ? "ACCESSORIES" : "CLOTHING"} / {product.edition}</span>
                  <h2>{product.name}</h2>
                </div>
                <span className={styles.price}>{formatPrice(product.price)}</span>
              </div>
            </Link>
          ))}
        </div>
        <p className={styles.delivery}>Free delivery on clothing · R40 for orders containing the Boat Floating Wheel · Prices in ZAR</p>
      </section>
      <SiteFooter />
    </main>
  );
}
