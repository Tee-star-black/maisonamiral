"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, products } from "@/data/products";
import { RealisticMannequin3D } from "./mannequin/realistic-mannequin-3d-v2";
import styles from "./mannequin-experience.module.css";

const TRANSITION_MS = 360;
const showroomProducts = products.filter((product) => Boolean(product.prints?.front));
type NavigateEvent = { preventDefault: () => void };

export function MannequinExperience() {
  const router = useRouter();
  const id = useId();
  const titleId = `${id}-title`;
  const noteId = `${id}-note`;
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, showroomProducts.findIndex((p) => p.slug === "emblem-tee")));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timer = useRef<number | null>(null);
  const navigating = useRef(false);
  const product = showroomProducts[activeIndex];
  const href = `/shop/${product.slug}`;
  const photo = product.images[0];

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      document.body.style.cursor = "default";
    };
  }, []);

  function cancelTransition() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    navigating.current = false;
    setIsTransitioning(false);
  }

  function chooseProduct(index: number) {
    cancelTransition();
    setActiveIndex(index);
  }

  function beginOpen() {
    if (navigating.current) return;
    navigating.current = true;
    setIsTransitioning(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      router.push(href);
    }, TRANSITION_MS);
  }

  function openProduct(event: NavigateEvent) {
    if (navigating.current) {
      event.preventDefault();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    beginOpen();
  }


  return (
    <section id="shop-the-look" className={styles.experience} aria-labelledby={titleId}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Maison Amiral / The fitting room</p>
          <h2 id={titleId}>Anatomy of a <em>look.</em></h2>
        </div>
        <p className={styles.intro}>
          The original Edition 001 pieces, styled on a sculptural mannequin.<br />Rotate the look and explore the piece that speaks to you.
        </p>
      </header>

      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <span>MA / Edition 001</span>
          <span>Figure {String(activeIndex + 1).padStart(2, "0")}</span>
          <span>Atelier garment / 360°</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.study}>
            <div className={styles.drawing} role="group" aria-label={`${product.name}, interactive 3D mannequin`} aria-describedby={noteId}>
              <span className={styles.plateNumber} aria-hidden="true">0{activeIndex + 1}</span>

              <svg className={styles.leaders} viewBox="0 0 1000 780" preserveAspectRatio="none" aria-hidden="true">
                <path d="M45 269 H225 L365 250" />
                <path d="M45 470 H225 L356 420" />
                <circle cx="365" cy="250" r="4" />
                <circle cx="356" cy="420" r="4" />
              </svg>

              <Link href={href} onNavigate={openProduct} className={styles.pieceCallout} draggable={false}>
                <span className={styles.label}>01 / The piece</span>
                <strong>{product.name}</strong>
                <span>{formatPrice(product.price)} <span aria-hidden="true">↗</span></span>
              </Link>

              <div className={styles.detailCallout}>
                <span className={styles.label}>02 / The model</span>
                <p>Anatomical mannequin.<br />Original collection prints.</p>
              </div>

              <div className={`${styles.figureWrap} ${isTransitioning ? styles.figureFocus : ""}`}>
                <RealisticMannequin3D
                  shirtTone={product.tone}
                  productName={product.name}
                  frontArtwork={product.prints?.front}
                  backArtwork={product.prints?.back}
                  productImage={photo}
                  onProductOpen={beginOpen}
                />
              </div>

              <span className={styles.viewCaption}>360° / Atelier garment</span>
            </div>

            <div className={styles.viewControls}>
              <div className={styles.views} role="group" aria-label="3D interaction instructions">
                <button type="button" disabled>Drag / rotate</button>
                <button type="button" disabled>Controls / zoom</button>
              </div>
              <div className={styles.tiltControls} role="group" aria-label="Scene status">
                <button type="button" disabled>Studio light</button>
                <button type="button" disabled>Edition 001</button>
              </div>
            </div>
          </div>

          <aside className={styles.details} aria-label="Choose a collection piece">
            <p className={styles.label}>Select a piece</p>
            <div aria-live="polite" aria-atomic="true">
              <h3>{product.name}</h3>
              <p className={styles.price}>{formatPrice(product.price)} <span>/ {product.edition}</span></p>
            </div>

            {photo ? (
              <Link href={href} onNavigate={openProduct} className={styles.photograph}>
                <Image src={photo} alt={`${product.name} editorial photograph`} fill sizes="(max-width: 640px) 85vw, (max-width: 1100px) 40vw, 270px" />
                <span>Product photograph <span aria-hidden="true">↗</span></span>
              </Link>
            ) : (
              <div className={styles.missingPhoto}>
                <p>3D material study</p>
                <span>Product photography has not yet been supplied for this piece.</span>
              </div>
            )}

            <p className={styles.copy}>{product.shortDescription}</p>
            <Link href={href} onNavigate={openProduct} className={styles.enterButton}>
              {isTransitioning ? "Opening piece" : "Explore piece"} <span aria-hidden="true">↗</span>
            </Link>

            <div className={styles.selectorList} role="group" aria-label="Collection pieces">
              {showroomProducts.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  className={styles.selector}
                  aria-pressed={activeIndex === index}
                  onClick={() => chooseProduct(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.selectorThumb} aria-hidden="true">
                    <Image src={item.images[0]} alt="" fill sizes="42px" />
                  </span>
                  <strong>{item.name}</strong>
                  <span aria-hidden="true">{activeIndex === index ? "↗" : "+"}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <footer className={styles.sheetFooter}>
          <p id={noteId}>A 3D fitting-room interpretation using the collection's real photographed artwork. Refer to product photographs for exact colours, placement and construction.</p>
          <span>Drag to rotate / Use zoom controls / Select the garment to explore</span>
        </footer>
      </div>
    </section>
  );
}
