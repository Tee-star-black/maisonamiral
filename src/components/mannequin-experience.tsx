"use client";

import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, products } from "@/data/products";
import { LookFigure } from "./look-figure";
import { RealisticMannequin3D } from "./mannequin/realistic-mannequin-3d";
import styles from "./mannequin-experience.module.css";

const TRANSITION_MS = 360;
type NavigateEvent = { preventDefault: () => void };

export function MannequinExperience() {
  const router = useRouter();
  const id = useId();
  const titleId = `${id}-title`;
  const noteId = `${id}-note`;
  const [activeIndex, setActiveIndex] = useState(3);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timer = useRef<number | null>(null);
  const navigating = useRef(false);
  const product = products[activeIndex];
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

  const sceneStyle = {
    "--shirt-tone": product.tone,
    "--shirt-ink": product.ink,
    width: "min(66vw, 760px)",
    maxWidth: "100%",
    height: "min(74vh, 760px)",
    minHeight: "560px",
    transform: "none",
  } as CSSProperties;

  return (
    <section id="shop-the-look" className={styles.experience} aria-labelledby={titleId}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Maison Amiral / 3D wardrobe study</p>
          <h2 id={titleId}>Anatomy of a <em>look.</em></h2>
        </div>
        <p className={styles.intro}>
          Rotate the figure. Zoom in. Change the piece.<br />Select the garment to enter its product story.
        </p>
      </header>

      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <span>MA / Edition 001</span>
          <span>Figure {String(activeIndex + 1).padStart(2, "0")}</span>
          <span>Real-time 3D / 360°</span>
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
                <p>Real-time WebGL.<br />Drag to rotate. Scroll to zoom.</p>
              </div>

              <div className={`${styles.figureWrap} ${isTransitioning ? styles.figureFocus : ""}`} style={sceneStyle}>
                <RealisticMannequin3D
                  shirtTone={product.tone}
                  shirtInk={product.ink}
                  artMark={product.artMark}
                  productName={product.name}
                  onProductOpen={beginOpen}
                />
              </div>

              <div className={styles.reverse} aria-label={`${product.name} styling reference`}>
                <LookFigure product={product} view="back" className={styles.figure} />
                <span>03 / silhouette reference</span>
              </div>

              <span className={styles.viewCaption}>360° / Live rendered mannequin</span>
            </div>

            <div className={styles.viewControls}>
              <div className={styles.views} role="group" aria-label="3D interaction instructions">
                <button type="button" disabled>Drag / rotate</button>
                <button type="button" disabled>Wheel / zoom</button>
              </div>
              <div className={styles.tiltControls} role="group" aria-label="Scene status">
                <button type="button" disabled>WebGL</button>
                <button type="button" disabled>Live</button>
              </div>
            </div>
          </div>

          <aside className={styles.details} aria-label="Choose a collection piece">
            <p className={styles.label}>The selected piece</p>
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
              {products.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  className={styles.selector}
                  aria-pressed={activeIndex === index}
                  onClick={() => chooseProduct(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.swatch} style={{ backgroundColor: item.tone }} aria-hidden="true" />
                  <strong>{item.name}</strong>
                  <span aria-hidden="true">{activeIndex === index ? "↗" : "+"}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <footer className={styles.sheetFooter}>
          <p id={noteId}>Interactive 3D styling study. The digital garment communicates silhouette, colour and placement; product photography remains the reference for exact fabric and print detail.</p>
          <span>Drag to rotate / Scroll to zoom / Tap the shirt to explore</span>
        </footer>
      </div>
    </section>
  );
}
