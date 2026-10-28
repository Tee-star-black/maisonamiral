import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getProductBySlug, products } from "@/data/products";
import { ProductBuyPanel } from "@/components/product-buy-panel";
import { SiteFooter } from "@/components/site-footer";
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
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className={styles.page}>
      <section className={styles.productHero}>
        <div className={styles.visualColumn}>
          <div className={styles.gallery}>
            {product.images.map((src, index) => (
              <figure className={styles.imageFrame} key={src}>
                <Image
                  src={src}
                  alt={product.name + " " + (product.imageLabels[index] ?? "product") + " view"}
                  width={1200}
                  height={1500}
                  sizes="(max-width: 900px) 100vw, 62vw"
                  priority={index === 0}
                />
                <figcaption>{String(index + 1).padStart(2, "0")} / {product.imageLabels[index]}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <aside className={styles.productInfo}>
          <Link href="/shop" className={styles.backLink}>← Back to shop</Link>
          <div className={styles.productIndex}>
            OBJECT {String(products.findIndex((item) => item.slug === product.slug) + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
          </div>
          <p className={styles.eyebrow}>{product.edition} / Johannesburg</p>
          <h1>{product.name}</h1>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.detailBlock}><span>Cut</span><strong>Relaxed unisex tee</strong></div>
          <div className={styles.detailBlock}><span>Sizes</span><strong>S / M / L / XL</strong></div>
          <div className={styles.detailBlock}><span>Origin</span><strong>Johannesburg, South Africa</strong></div>

          <ProductBuyPanel slug={product.slug} />

          <p className={styles.productNote}>
            Made for movement. Designed to become part of your everyday.
          </p>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
