import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { EditorialPage } from "@/components/editorial-page";
import { formatPrice, products } from "@/data/products";
import styles from "./shop.module.css";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop the Maison Amiral collection from Johannesburg.",
};

function ProductVisual({ slug, name, artMark, image }: { slug: string; name: string; artMark: string; image?: string }) {
  if (image) {
    return <Image
      src={image}
      alt={`${name}, photographed garment`}
      fill
      sizes="(max-width: 760px) 100vw, 50vw"
      className={styles.image}
    />;
  }
  if (slug === "flag-staple-tee") {
    return <div className={styles.editorialStudy}>
      <video className={styles.video} autoPlay muted loop playsInline aria-label="Maison Amiral flag editorial film">
        <source src="/video/flag.mp4" type="video/mp4" />
      </video>
      <span className={styles.editorialNote}>Editorial reference / Garment photo pending</span>
    </div>;
  }
  return <div className={styles.art} aria-hidden="true">
    <span className={styles.artMark}>{artMark}</span>
    <span className={styles.artSubline}>Johannesburg / Edition 001</span>
  </div>;
}

export default function ShopPage() {
  return (
    <EditorialPage
      eyebrow="Collection / 001"
      title="The first objects."
      intro="Three studies in movement, machinery, memory and restraint. Designed in Johannesburg and built to hold presence without asking for it."
    >
      <div className={styles.collectionIntro}>
        <span>Edition 001 / {products.length} objects</span>
        <span>R450 each</span>
      </div>

      <div className={styles.grid}>
        {products.map((product, index) => (
          <Link
            href={`/shop/${product.slug}`}
            key={product.slug}
            className={`${styles.card} ${index % 2 === 1 ? styles.offsetCard : ""}`}
          >
            <div
              className={styles.visual}
              style={{
                "--product-tone": product.tone,
                "--product-ink": product.ink,
              } as CSSProperties}
            >
              <ProductVisual
                slug={product.slug}
                name={product.name}
                artMark={product.artMark}
                image={product.images[0]}
              />
              <span className={styles.mediaLabel}>
                {String(index + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
              </span>
              <span className={styles.viewLabel}>View object ↗</span>
            </div>

            <article className={styles.meta}>
              <div>
                <p className={styles.edition}>{product.edition}</p>
                <h2>{product.name}</h2>
                <p className={styles.description}>{product.shortDescription}</p>
              </div>
              <p className={styles.price}>{formatPrice(product.price)}</p>
            </article>
          </Link>
        ))}
      </div>
    </EditorialPage>
  );
}
