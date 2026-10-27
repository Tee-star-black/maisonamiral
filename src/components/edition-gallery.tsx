import Image from "next/image";
import Link from "next/link";
import styles from "./edition-gallery.module.css";

const images = [
  { src: "/products/edition-001/emblem/on-model.webp", alt: "Emblem Tee worn in the original editorial portrait", className: styles.heroImage },
  { src: "/products/edition-001/emblem/front.webp", alt: "Emblem Tee front showing the original artwork", className: styles.tallImage },
  { src: "/products/edition-001/emblem/back.webp", alt: "Emblem Tee reverse artwork", className: styles.productImage },
] as const;

export function EditionGallery() {
  return (
    <section className={styles.section} aria-labelledby="edition-gallery-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Edition 001 / Emblem study</p>
          <h2 id="edition-gallery-title">Seen in motion.</h2>
        </div>
        <p className={styles.copy}>
          The Emblem Tee from every angle. Editorial frames, product detail and the quiet geometry of the first Maison Amiral edition.
        </p>
      </div>

      <div className={styles.grid}>
        {images.map((image, index) => (
          <Link
            key={image.src}
            href="/shop/emblem-tee"
            className={`${styles.frame} ${image.className}`}
            aria-label={`View Emblem Tee product page, image ${index + 1}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={index < 2 ? "(max-width: 800px) 100vw, 60vw" : "(max-width: 800px) 50vw, 30vw"}
              className={styles.image}
              priority={index === 0}
            />
            <span className={styles.imageIndex}>{String(index + 1).padStart(2, "0")}</span>
          </Link>
        ))}
      </div>

      <div className={styles.footerRow}>
        <span>Johannesburg / South Africa</span>
        <Link href="/shop/emblem-tee">Explore the Emblem Tee ↗</Link>
      </div>
    </section>
  );
}
