import type { Metadata } from "next";
import Link from "next/link";
import { EditorialPage } from "@/components/editorial-page";
import { formatPrice, products } from "@/data/products";

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
        {products.map((product) => (
          <Link href={`/shop/${product.slug}`} key={product.slug} style={{ borderTop: "1px solid rgba(0,0,0,.25)", paddingTop: 18 }}>
            <article>
              <p style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>{product.edition}</p>
              <h2 style={{ fontSize: 26, fontWeight: 500 }}>{product.name}</h2>
              <p>{formatPrice(product.price)}</p>
            </article>
          </Link>
        ))}
      </div>
    </EditorialPage>
  );
}
