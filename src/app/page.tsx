import Image from "next/image";
import Link from "next/link";
import { formatPrice, products } from "@/data/products";

const stories = [
  {
    number: "001",
    title: "Automobile Study",
    copy: "A graphic study of motion, machinery and the visual codes that shaped Edition 001.",
    href: "/product/automobile-tee",
    cta: "Discover the piece",
  },
  {
    number: "002",
    title: "Guerrilla Form",
    copy: "Street language reduced to structure, contrast and a deliberate uniform for movement.",
    href: "/product/guerrilla-tee",
    cta: "Explore the story",
  },
  {
    number: "003",
    title: "House Emblem",
    copy: "The Maison mark treated as an object: restrained, repeatable and built to outlive a season.",
    href: "/product/emblem-tee",
    cta: "View the emblem",
  },
] as const;

export default function Home() {
  const arrivals = products.slice(0, 3);

  return (
    <main className="si-home">
      <section className="si-hero">
        <video className="si-hero-video" src="/video/flag.mp4" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        <div className="si-hero-shade" />

        <div className="si-hero-copy">
          <p className="si-overline">EDITION 001 / JOHANNESBURG</p>
          <h1>Objects for<br />movement.</h1>
          <p className="si-lede">A first collection built around machinery, memory and quiet confidence.</p>
          <Link className="si-cta light" href="/shop">Shop now</Link>
        </div>
      </section>

      <section className="si-arrivals si-section">
        <div className="si-section-head">
          <div>
            <p className="si-overline">NEW ARRIVALS</p>
            <h2>Edition 001</h2>
          </div>
          <Link className="si-cta" href="/shop">Shop all</Link>
        </div>

        <div className="si-product-grid">
          {arrivals.map((product, index) => {
            const image = product.images.editorialFront ?? product.images.front;
            return (
              <article className="si-product-card" key={product.slug}>
                <Link className="si-product-image" href={`/product/${product.slug}`}>
                  {image ? (
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 760px) 100vw, 33vw"
                      className="si-cover"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="si-product-placeholder">MAISON AMIRAL</div>
                  )}
                  <span className="si-product-number">{String(index + 1).padStart(2, "0")}</span>
                </Link>
                <div className="si-product-info">
                  <div>
                    <p>{product.shortName}</p>
                    <span>{product.collection}</span>
                  </div>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="si-categories si-section">
        <div className="si-section-head compact">
          <div>
            <p className="si-overline">SHOP BY CATEGORY</p>
            <h2>House codes</h2>
          </div>
        </div>
        <div className="si-category-grid">
          <Link href="/shop" className="si-category-card light-card">
            <span>01</span><strong>T-shirts</strong><small>Edition 001</small>
          </Link>
          <Link href="/collections" className="si-category-card dark-card">
            <span>02</span><strong>Collections</strong><small>Current & archive</small>
          </Link>
          <Link href="/lookbook" className="si-category-card image-card">
            <Image src="/products/emblem-tee/back2.jpeg" alt="Maison Amiral lookbook" fill sizes="33vw" className="si-cover" />
            <div className="si-category-overlay" />
            <span>03</span><strong>Lookbook</strong><small>Johannesburg studies</small>
          </Link>
        </div>
      </section>

      <section className="si-research">
        <div className="si-research-media">
          <Image src="/graphics/wheel.png" alt="Maison Amiral wheel study" width={1000} height={1000} className="si-wheel" />
        </div>
        <div className="si-research-copy">
          <p className="si-overline">HOUSE NOTE / 001</p>
          <h2>Form follows movement.</h2>
          <p>
            Maison Amiral studies mechanical forms, maritime codes and South African street culture. Each object is reduced until only the parts that matter remain: proportion, graphic tension, material and movement.
          </p>
          <Link className="si-cta" href="/editorial">Discover the house</Link>
        </div>
      </section>

      <section className="si-stories si-section">
        <div className="si-section-head compact">
          <div>
            <p className="si-overline">EDITORIAL INDEX</p>
            <h2>Studies / Edition 001</h2>
          </div>
        </div>

        <div className="si-story-list">
          {stories.map((story) => (
            <article className="si-story" key={story.number}>
              <span className="si-story-number">{story.number}</span>
              <div>
                <h3>{story.title}</h3>
                <p>{story.copy}</p>
              </div>
              <Link className="si-cta" href={story.href}>{story.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="si-campaign">
        <Image src="/products/emblem-tee/frontedit.jpeg" alt="Maison Amiral Edition 001 campaign" fill sizes="100vw" className="si-cover" />
        <div className="si-campaign-shade" />
        <div className="si-campaign-copy">
          <p className="si-overline">004 / EDITION 001</p>
          <h2>Presence<br />without noise.</h2>
          <Link className="si-cta light" href="/shop">Explore the collection</Link>
        </div>
      </section>
    </main>
  );
}
