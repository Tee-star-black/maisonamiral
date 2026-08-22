import Image from "next/image";
import Link from "next/link";
import { formatPrice, products } from "@/data/products";

export default function ShopPage() {
  return (
    <main className="shop-page">
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
          <Link href="/cart">Bag · 0</Link>
        </div>
      </header>

      <section className="shop-intro section-pad">
        <div className="shop-intro-top">
          <p className="eyebrow">Maison Amiral / Shop</p>
          <span className="shop-count">{products.length.toString().padStart(2, "0")} object</span>
        </div>

        <h1>
          Edition
          <br />
          001.
        </h1>

        <div className="shop-intro-copy">
          <p>
            The first Maison Amiral release. Quiet graphics, deliberate form and
            pieces intended to live beyond a single season.
          </p>
          <p>Johannesburg, South Africa.</p>
        </div>
      </section>

      <section className="shop-grid" aria-label="Maison Amiral products">
        {products.map((product, index) => (
          <article className="shop-card" key={product.slug}>
            <Link className="shop-card-image" href={`/product/${product.slug}`}>
              <Image
                src={product.images.editorialFront}
                alt={product.name}
                fill
                sizes="(max-width: 800px) 100vw, 70vw"
                className="cover-image"
                priority={index === 0}
              />
              <span className="shop-card-number">
                {(index + 1).toString().padStart(2, "0")}
              </span>
            </Link>

            <div className="shop-card-info">
              <div>
                <p className="product-index">{product.collection}</p>
                <Link href={`/product/${product.slug}`}>
                  <h2>{product.shortName}</h2>
                </Link>
                <p>{product.description}</p>
              </div>

              <div className="shop-card-side">
                <span>{formatPrice(product.price)}</span>
                <Link className="text-link" href={`/product/${product.slug}`}>
                  View piece <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="shop-closing section-pad">
        <p className="eyebrow">House note / 001</p>
        <p className="shop-closing-copy">
          We release slowly. Each object earns its place before it enters the
          collection.
        </p>
        <Link className="text-link" href="/editorial">
          Read the editorial <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
