import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getProductBySlug, products } from "@/data/products";
import styles from "./page.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>MAISON AMIRAL</Link>
        <Link href="/shop" className={styles.backLink}>← Collection 001</Link>
      </header>

      <section className={styles.productHero}>
        <div className={styles.visualColumn}>
          {product.images.length > 0 ? (
            <div className={styles.gallery}>
              {product.images.map((image, index) => (
                <figure className={styles.imageFrame} key={image}>
                  <Image
                    src={image}
                    alt={`${product.name} ${index % 2 === 0 ? "front" : "back"} view`}
                    width={1200}
                    height={1500}
                    sizes="(max-width: 900px) 100vw, 62vw"
                    priority={index === 0}
                  />
                </figure>
              ))}
            </div>
          ) : (
            <div className={styles.artPlaceholder} style={{ "--product-tone": product.tone, "--product-ink": product.ink } as CSSProperties}>
              <span>{product.artMark}</span>
              <small>Edition 001 / Product visual in preparation</small>
            </div>
          )}
        </div>

        <aside className={styles.productInfo}>
          <p className={styles.eyebrow}>{product.edition}</p>
          <h1>{product.name}</h1>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.detailBlock}>
            <span>Silhouette</span>
            <strong>Relaxed unisex tee</strong>
          </div>
          <div className={styles.detailBlock}>
            <span>Sizes</span>
            <strong>S / M / L / XL</strong>
          </div>
          <div className={styles.detailBlock}>
            <span>Origin</span>
            <strong>Johannesburg, South Africa</strong>
          </div>

          <Link href="/contact" className={styles.enquireLink}>
            Enquire about this piece <span aria-hidden="true">↗</span>
          </Link>
        </aside>
      </section>
    </main>
  );
}
