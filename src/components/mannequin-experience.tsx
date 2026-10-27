"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { formatPrice, products } from "@/data/products";
import styles from "./mannequin-experience.module.css";

const Mannequin = dynamic(
  () =>
    import("./mannequin/realistic-mannequin-3d").then(
      (module) => module.RealisticMannequin3D,
    ),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading} role="status">
        Preparing the studio…
      </div>
    ),
  },
);
const angles = [
  { label: "Front", angle: 0 },
  { label: "Side", angle: Math.PI / 2 },
  { label: "Back", angle: Math.PI },
];

export function MannequinExperience() {
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState(3);
  const [mode, setMode] = useState<"model" | "photos">("model");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [view, setView] = useState({ angle: 0, revision: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotating, setRotating] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const product = products[activeIndex];
  const hasPhotography = product.images.length > 0;
  const showPhotos = mode === "photos" || unavailable;
  const photos = product.images;

  function chooseProduct(index: number) {
    setActiveIndex(index);
    setPhotoIndex(0);
    setMode("model");
  }

  function chooseView(angle: number) {
    setRotating(false);
    setView((previous) => ({ angle, revision: previous.revision + 1 }));
  }

  return (
    <section
      id="shop-the-look"
      className={styles.experience}
      aria-labelledby={titleId}
    >
      <header className={styles.heading}>
        <p className={styles.eyebrow}>MA / The garment studio</p>
        <h2 id={titleId}>The garment studio.</h2>
        <p>Inspect the shape, surface and fit.</p>
      </header>
      <div className={styles.sheet}>
        <div className={styles.layout}>
          <div className={styles.study}>
            <div className={styles.stageHeader}>
              <span>
                MAISON AMIRAL{" "}
                <span className={styles.studioLabel}>/ STUDIO</span>
              </span>
              <div
                className={styles.modeSwitch}
                role="group"
                aria-label="Presentation"
              >
                <button
                  type="button"
                  aria-pressed={!showPhotos}
                  disabled={unavailable}
                  onClick={() => setMode("model")}
                >
                  3D view
                </button>
                <button
                  type="button"
                  aria-pressed={showPhotos}
                  disabled={!hasPhotography}
                  onClick={() => setMode("photos")}
                >
                  Photographs
                </button>
              </div>
            </div>
            <div className={styles.stage}>
              {showPhotos ? (
                hasPhotography ? (
                  <Image
                    src={photos[photoIndex]}
                    alt={`${product.name}, ${product.imageLabels[photoIndex] ?? "product"} view`}
                    fill
                    sizes="(max-width: 900px) 100vw, 65vw"
                    className={styles.productPhoto}
                  />
                ) : (
                  <div className={styles.loading}>
                    3D is unavailable on this device.{" "}
                    <Link href={`/shop/${product.slug}`}>
                      View product details
                    </Link>
                  </div>
                )
              ) : (
                <Mannequin
                  shirtTone={product.tone}
                  productName={product.name}
                  artwork={product.artwork}
                  view={view}
                  zoom={zoom}
                  rotating={rotating}
                  onUnavailable={setUnavailable}
                  onInteract={() => setRotating(false)}
                />
              )}
              <span className={styles.stageNote}>
                {showPhotos
                  ? "Product photography"
                  : hasPhotography
                    ? product.artwork
                      ? "Digital garment study / Original printed artwork"
                      : "Shape and colour preview / Original artwork not supplied"
                    : "Shape and colour preview / Photography not supplied"}
              </span>
            </div>
            {unavailable && (
              <p className={styles.fallbackNote} role="status">
                The 3D view is unavailable. Product photographs remain
                available.
              </p>
            )}
            <div className={styles.controls}>
              {showPhotos ? (
                <div
                  className={styles.views}
                  role="group"
                  aria-label="Product photographs"
                >
                  {photos.map((photo, index) => (
                    <button
                      key={photo}
                      type="button"
                      aria-pressed={photoIndex === index}
                      onClick={() => setPhotoIndex(index)}
                    >
                      {
                        product.imageLabels[index] ?? `View ${index + 1}`
                      }
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div
                    className={styles.views}
                    role="group"
                    aria-label="Mannequin angle"
                  >
                    {angles.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => chooseView(item.angle)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.tools}>
                    <button
                      type="button"
                      aria-label="Zoom out"
                      disabled={zoom <= 1}
                      onClick={() =>
                        setZoom((value) => Math.max(1, value - 0.25))
                      }
                    >
                      −
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      disabled={zoom >= 1.75}
                      onClick={() =>
                        setZoom((value) => Math.min(1.75, value + 0.25))
                      }
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label="Rotate automatically"
                      aria-pressed={rotating}
                      onClick={() => setRotating((value) => !value)}
                    >
                      {rotating ? "Pause" : "Rotate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        chooseView(0);
                        setZoom(1);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <aside
            className={styles.details}
            aria-label="Choose a collection piece"
          >
            <div
              className={styles.productDetails}
              aria-live="polite"
              aria-atomic="true"
            >
              <p className={styles.eyebrow}>
                {product.edition} / {String(activeIndex + 1).padStart(2, "0")}
              </p>
              <h3>{product.name}</h3>
              <p className={styles.price}>{formatPrice(product.price)}</p>
              <p className={styles.copy}>{product.shortDescription}</p>
            </div>
            <dl className={styles.specifications}>
              <div>
                <dt>Colour</dt>
                <dd>
                  {product.slug === "emblem-tee" ||
                  product.slug === "guerrilla-tee"
                    ? "Black"
                    : product.slug === "automobile-tee"
                      ? "Stone"
                      : "Ecru"}
                </dd>
              </div>
              <div>
                <dt>Collection</dt>
                <dd>Edition 001</dd>
              </div>
            </dl>
            <Link href={`/shop/${product.slug}`} className={styles.enterButton}>
              View piece <span aria-hidden="true">↗</span>
            </Link>
            <div className={styles.collection}>
              <p className={styles.eyebrow}>Explore the collection</p>
              <div role="group" aria-label="Collection pieces">
                {products.map((item, index) => (
                  <button
                    key={item.slug}
                    type="button"
                    className={styles.selector}
                    aria-pressed={activeIndex === index}
                    onClick={() => chooseProduct(index)}
                  >
                    <span
                      className={styles.swatch}
                      style={{ backgroundColor: item.tone }}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                    <span aria-hidden="true">
                      {activeIndex === index ? "—" : "+"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className={styles.referenceNote}>
              {hasPhotography
                ? "Artwork is taken from the original product photographs. Refer to photographs for exact fabric, fit and print detail."
                : "Colour and silhouette preview. Original artwork and photography are not yet available for this piece."}
            </p>
          </aside>
        </div>
        <footer className={styles.footer}>
          <span>Johannesburg / Edition 001</span>
          <span>
            {showPhotos
              ? "Select a photograph to explore"
              : "Drag left or right to turn · Use + to see details"}
          </span>
        </footer>
      </div>
    </section>
  );
}
