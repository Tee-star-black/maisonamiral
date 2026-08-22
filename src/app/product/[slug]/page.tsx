import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartLink } from "@/components/cart/CartLink";
import { ProductPurchase } from "@/components/cart/ProductPurchase";
import { formatPrice, getProduct, products } from "@/data/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

function Placeholder({ name, position }: { name: string; position: string }) {
  return (
    <div className="product-placeholder">
      <span>Maison Amiral / Edition 001</span>
      <strong>{name}</strong>
      <small>{position} image pending</small>
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  return (
    <main className="product-page">
      <header className="site-header shop-header">
        <Link className="brand" href="/" aria-label="Maison Amiral home">
          MAISON AMIRAL
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/lookbook">Lookbook</Link>
          <Link href="/editorial">Editorial</Link>
          <Link href="/journal">Journal</Link>
        </nav>
        <div className="header-actions" aria-label="Store actions">
          <Link href="/search">Search</Link>
          <CartLink />
        </div>
      </header>

      <section className="product-layout">
        <div className="product-gallery">
          <div className="product-gallery-item product-gallery-editorial">
            {product.images.editorialFront ? (
              <Image src={product.images.editorialFront} alt={product.name} fill sizes="(max-width: 900px) 100vw, 60vw" className="cover-image" priority />
            ) : (
              <Placeholder name={product.shortName} position="Editorial front" />
            )}
          </div>

          <div className="product-gallery-pair">
            <div className="product-gallery-item product-gallery-clean">
              {product.images.front ? (
                <Image src={product.images.front} alt={`Front view of ${product.name}`} fill sizes="(max-width: 900px) 100vw, 30vw" className="contain-image" />
              ) : (
                <Placeholder name={product.shortName} position="Front" />
              )}
            </div>
            <div className="product-gallery-item product-gallery-dark">
              {product.images.back ? (
                <Image src={product.images.back} alt={`Back view of ${product.name}`} fill sizes="(max-width: 900px) 100vw, 30vw" className="contain-image" />
              ) : (
                <Placeholder name={product.shortName} position="Back" />
              )}
            </div>
          </div>

          <div className="product-gallery-item product-gallery-editorial product-gallery-last">
            {product.images.editorialBack ? (
              <Image src={product.images.editorialBack} alt={`Editorial back view of ${product.name}`} fill sizes="(max-width: 900px) 100vw, 60vw" className="cover-image" />
            ) : (
              <Placeholder name={product.shortName} position="Editorial back" />
            )}
          </div>
        </div>

        <aside className="product-panel">
          <div className="product-panel-inner">
            <div>
              <p className="eyebrow">{product.collection} / 001</p>
              <h1>{product.shortName}</h1>
              <p className="product-panel-price">{formatPrice(product.price)}</p>
            </div>

            <p className="product-panel-description">{product.description}</p>
            <ProductPurchase product={product} />

            <div className="product-facts">
              {product.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </div>

            <div className="product-service-notes">
              <details>
                <summary>Shipping</summary>
                <p>South African delivery information is confirmed during checkout.</p>
              </details>
              <details>
                <summary>Returns</summary>
                <p>Returns are subject to the Maison Amiral returns policy and item condition requirements.</p>
              </details>
            </div>

            <Link className="text-link product-back-link" href="/shop">← Back to shop</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
