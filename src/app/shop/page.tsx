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
  if (slug === "automobile-tee") {
    return (
      <Image
        src="/graphics/wheel.png"
        alt={`${name} visual study`}
        fill
        sizes="(max-width: 760px) 100vw, 50vw"
        className={`${styles.image} ${styles.wheelImage}`}
      />
    );
  }

  if (slug === "flag-staple-tee") {
    return (
      <video className={styles.video} autoPlay muted loop playsInline aria-label={`${name} moving flag study`}>
        <source src="/video/flag.mp4" type="video/mp4" />
      </video>
    );
  }

  if (image) {
    return (
      <Image
        src={image}
        alt={`${name} product image`}
        fill
        sizes="(max-width: 760px) 100vw, 50vw"
        className={styles.image}
      />
    );
  }

  return (
    <div className={styles.art} aria-hidden="true">
      <span className={styles.artMark}>{artMark}</span>
      <span className={styles.artSubline}>Johannesburg / Edition 001</span>
    </div>
  );
}

export default function ShopPage() {
  return (
    <EditorialPage
      eyebrow="Collection / 001"
      title="The first objects."
      intro="Four studies in movement, machinery, memory and restraint. Designed in Johannesburg and built to hold presence without asking for it."
    >
      <div className={styles.collectionIntro}>
        <span>Edition 001 / 04 objects</span>
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
                {String(index + 1).padStart(2, "0")} / 04
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
