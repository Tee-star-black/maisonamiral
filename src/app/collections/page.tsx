import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EditorialPage } from "@/components/editorial-page";
import { formatPrice, products } from "@/data/products";
import styles from "./collections.module.css";

export const metadata: Metadata = {
  title: "Collections",
  description: "Maison Amiral Edition 001. Three original T-shirts from Johannesburg.",
};

export default function CollectionsPage() {
  return (
    <EditorialPage
      eyebrow="Collections / 001"
      title="Edition 001."
      intro="Three pieces. One collection. Explore the original Maison Amiral garment photographs and discover the fit, details and stories behind each shirt."
    >
      <div className={styles.heading}>
        <span>THREE PIECES / JOHANNESBURG</span>
        <Link href="/shop">SHOP ALL <span aria-hidden="true">↗</span></Link>
      </div>
      <div className={styles.grid}>
        {products.map((product, i) => (
          <Link className={styles.card} href={"/shop/" + product.slug} key={product.slug}>
            <div className={styles.image}>
              <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 780px) 100vw, 33vw" />
              <span>{String(i + 1).padStart(2, "0")} / 03</span>
            </div>
            <div className={styles.caption}>
              <h2>{product.name}</h2><span>{formatPrice(product.price)}</span>
            </div>
            <p>{product.shortDescription}</p>
          </Link>
        ))}
      </div>
    </EditorialPage>
  );
}
