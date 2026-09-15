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

export default function ShopPage() {
  return (
    <EditorialPage
      eyebrow="Collection / 001"
      title="The first objects."
      intro="A restrained first collection shaped by movement, machinery and memory."
    >
      <div className={styles.grid}>
        {products.map((product) => (
          <Link href={`/shop/${product.slug}`} key={product.slug} className={styles.card}>
            <div
              className={styles.visual}
              style={{
                "--product-tone": product.tone,
                "--product-ink": product.ink,
              } as CSSProperties}
            >
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={`${product.name} product image`}
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                  className={styles.image}
                />
              ) : (
                <div className={styles.art} aria-hidden="true">
                  <span className={styles.artMark}>{product.artMark}</span>
                </div>
              )}
              <span className={styles.mediaLabel}>
                {product.images[0] ? "Product view" : "Edition study"}
              </span>
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
