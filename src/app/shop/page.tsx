import Image from "next/image";
import Link from "next/link";
import { formatPrice, products } from "@/data/products";

function ProductVisual({ product, index }: { product: (typeof products)[number]; index: number }) {
  const image = product.images.editorialFront ?? product.images.front;

  if (image) {
    return (
      <Image
        src={image}
        alt={product.name}
        fill
        sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw"
        className="cover-image"
        priority={index < 3}
      />
    );
  }

  return (
    <div className="shop-placeholder" aria-label={`${product.name} image pending`}>
      <span className="shop-placeholder-label">Edition 001</span>
      <strong>{product.shortName}</strong>
      <span className="shop-placeholder-note">Archive image pending</span>
    </div>
  );
}

export default function ShopPage() {
  return (
    <main className="shop-page">
      <section className="shop-intro section-pad">
        <div className="shop-intro-top">
          <p className="eyebrow">Maison Amiral / Shop</p>
          <span className="shop-count">{products.length.toString().padStart(2, "0")} objects / Edition 001</span>
        </div>

        <div className="shop-intro-main">
          <h1>Edition 001.</h1>
          <div className="shop-intro-copy">
            <p>A study in movement, machinery and restraint. Three pieces. One first edition.</p>
            <p>Johannesburg, South Africa.</p>
          </div>
        </div>
      </section>

      <section className="shop-dark-interlude" aria-label="Edition 001 house statement">
        <div className="shop-dark-meta">
          <span>MA / 001</span>
          <span>OBJECTS IN MOTION</span>
          <span>JOHANNESBURG / 2026</span>
        </div>
        <div className="shop-dark-word" aria-hidden="true">AMIRAL</div>
        <div className="shop-dark-copy">
          <p className="eyebrow">House code / 01</p>
          <p>Quiet from a distance.<br />Specific up close.</p>
          <span>Built around proportion, graphic tension and movement.</span>
        </div>
        <div className="shop-dark-rule" aria-hidden="true" />
      </section>

      <section className="shop-collection" aria-label="Maison Amiral Edition 001">
        <div className="shop-collection-meta">
          <span>Collection / 001</span>
          <span>Three objects</span>
          <span>Johannesburg / 2026</span>
        </div>

        <div className="shop-grid">
          {products.map((product, index) => (
            <article className={`shop-card shop-card-${index + 1}`} key={product.slug}>
              <Link className="shop-card-image" href={`/product/${product.slug}`}>
                <ProductVisual product={product} index={index} />
                <span className="shop-card-number">{(index + 1).toString().padStart(2, "0")}</span>
                <span className="shop-card-view">View piece ↗</span>
              </Link>

              <div className="shop-card-info">
                <div className="shop-card-heading">
                  <div>
                    <p className="product-index">{product.collection}</p>
                    <Link href={`/product/${product.slug}`}>
                      <h2>{product.shortName}</h2>
                    </Link>
                  </div>
                  <span className="shop-card-price">{formatPrice(product.price)}</span>
                </div>
                <p className="shop-card-description">{product.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shop-closing section-pad">
        <div className="shop-closing-index">001 / 003</div>
        <p className="eyebrow">House note / 001</p>
        <p className="shop-closing-copy">We release slowly. Each object earns its place before it enters the collection.</p>
        <Link className="text-link" href="/editorial">Read the editorial <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
