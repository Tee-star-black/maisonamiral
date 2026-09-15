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

function ProductStudy({ slug, name, artMark, tone, ink }: { slug: string; name: string; artMark: string; tone: string; ink: string }) {
  if (slug === "automobile-tee") {
    return (
      <div className={styles.studyFrame}>
        <Image
          src="/graphics/wheel.png"
          alt={`${name} automobile study`}
          fill
          sizes="(max-width: 900px) 100vw, 62vw"
          className={`${styles.studyMedia} ${styles.wheelStudy}`}
          priority
        />
        <span className={styles.studyCaption}>Machinery / Motion / 001</span>
      </div>
    );
  }

  if (slug === "flag-staple-tee") {
    return (
      <div className={styles.studyFrame}>
        <video className={styles.studyVideo} autoPlay muted loop playsInline aria-label={`${name} flag study`}>
          <source src="/video/flag.mp4" type="video/mp4" />
        </video>
        <span className={styles.studyCaption}>Flag language / Motion study</span>
      </div>
    );
  }

  return (
    <div
      className={styles.artPlaceholder}
      style={{ "--product-tone": tone, "--product-ink": ink } as CSSProperties}
    >
      <span>{artMark}</span>
      <small>Guerrilla study / Johannesburg / Edition 001</small>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>MAISON AMIRAL</Link>
        <span className={styles.headerEdition}>Edition 001 / Johannesburg</span>
        <Link href="/shop" className={styles.backLink}>← Collection</Link>
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
                  <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <ProductStudy
              slug={product.slug}
              name={product.name}
              artMark={product.artMark}
              tone={product.tone}
              ink={product.ink}
            />
          )}
        </div>

        <aside className={styles.productInfo}>
          <div className={styles.productIndex}>Object {String(products.findIndex((item) => item.slug === product.slug) + 1).padStart(2, "0")} / 04</div>
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
          <div className={styles.detailBlock}>
            <span>Edition</span>
            <strong>001 / First objects</strong>
          </div>

          <Link href="/contact" className={styles.enquireLink}>
            Enquire about this piece <span aria-hidden="true">↗</span>
          </Link>

          <p className={styles.productNote}>
            Maison Amiral pieces are designed as objects to live with, not seasonal noise.
          </p>
        </aside>
      </section>
    </main>
  );
}
