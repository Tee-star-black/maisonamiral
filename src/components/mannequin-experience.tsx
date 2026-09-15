"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, products } from "@/data/products";
import styles from "./mannequin-experience.module.css";

const ROTATION_LIMIT = 34;

const backdropBySlug: Record<string, string | undefined> = {
  "automobile-tee": "/graphics/wheel.png",
  "emblem-tee": "/products/emblem/front-edit.jpeg",
};

export function MannequinExperience() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(3);
  const [rotation, setRotation] = useState(-7);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const dragStart = useRef<{ x: number; rotation: number } | null>(null);
  const didDrag = useRef(false);

  const product = products[activeIndex];
  const backdrop = backdropBySlug[product.slug];

  const productStyle = {
    "--shirt-tone": product.tone,
    "--shirt-ink": product.ink,
  } as CSSProperties;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isTransitioning) return;
    dragStart.current = { x: event.clientX, rotation };
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current || isTransitioning) return;

    const delta = event.clientX - dragStart.current.x;
    if (Math.abs(delta) > 4) didDrag.current = true;

    const nextRotation = dragStart.current.rotation + delta * 0.16;
    setRotation(Math.max(-ROTATION_LIMIT, Math.min(ROTATION_LIMIT, nextRotation)));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function openProduct() {
    if (didDrag.current || isTransitioning) return;

    setIsTransitioning(true);
    window.setTimeout(() => {
      router.push(`/shop/${product.slug}`);
    }, 430);
  }

  function handleGarmentKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  }

  return (
    <section className={styles.experience} aria-labelledby="mannequin-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Interactive look / Edition 001</p>
          <h2 id="mannequin-title">Wear the collection.</h2>
        </div>
        <p className={styles.intro}>
          Rotate the figure. Change the piece. Select the garment to enter its product story.
        </p>
      </div>

      <div className={styles.experienceGrid} style={productStyle}>
        <div
          className={styles.stage}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Interactive mannequin. Drag left or right to rotate."
        >
          {backdrop ? (
            <div className={styles.stageBackdrop} aria-hidden="true">
              <Image
                src={backdrop}
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 70vw"
                className={styles.stageBackdropImage}
              />
            </div>
          ) : product.slug === "flag-staple-tee" ? (
            <video className={styles.stageBackdropVideo} autoPlay muted loop playsInline aria-hidden="true">
              <source src="/video/flag.mp4" type="video/mp4" />
            </video>
          ) : (
            <div className={styles.typographicBackdrop} aria-hidden="true">
              GUERRILLA
            </div>
          )}

          <div className={styles.stageLabel} aria-hidden="true">
            <span>Drag</span>
            <span>↔</span>
            <span>Rotate</span>
          </div>

          <div
            className={`${styles.figureWrap} ${isTransitioning ? styles.figureFocus : ""}`}
            style={{ "--rotation": `${rotation}deg` } as CSSProperties}
          >
            <svg
              className={styles.figure}
              viewBox="0 0 360 690"
              role="img"
              aria-label={`${product.name} displayed on a mannequin`}
            >
              <defs>
                <linearGradient id="mannequinSkin" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#eeeae1" />
                  <stop offset="0.5" stopColor="#c9c3b8" />
                  <stop offset="1" stopColor="#f7f4ee" />
                </linearGradient>
                <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="11" stdDeviation="10" floodOpacity="0.16" />
                </filter>
              </defs>

              <g className={styles.body} fill="url(#mannequinSkin)" filter="url(#softShadow)">
                <ellipse cx="180" cy="68" rx="46" ry="57" />
                <rect x="160" y="116" width="40" height="68" rx="18" />
                <path d="M132 173 C151 158 209 158 228 173 L245 322 C228 350 206 365 180 365 C154 365 132 350 115 322 Z" />
                <path d="M121 184 C94 195 77 224 72 269 L62 408 C61 425 72 435 85 429 L103 408 L116 280 Z" />
                <path d="M239 184 C266 195 283 224 288 269 L298 408 C299 425 288 435 275 429 L257 408 L244 280 Z" />
                <path d="M149 348 C137 410 134 481 138 570 L145 665 L174 665 L183 443 L177 365 Z" />
                <path d="M211 348 C223 410 226 481 222 570 L215 665 L186 665 L177 443 L183 365 Z" />
              </g>

              <g
                className={styles.shirt}
                role="button"
                tabIndex={0}
                aria-label={`View ${product.name}, ${formatPrice(product.price)}`}
                onClick={openProduct}
                onKeyDown={handleGarmentKeyDown}
              >
                <path
                  className={styles.shirtShape}
                  d="M132 171 L105 183 L76 224 L111 246 L121 226 L124 333 C143 348 161 354 180 354 C199 354 217 348 236 333 L239 226 L249 246 L284 224 L255 183 L228 171 C218 190 202 200 180 200 C158 200 142 190 132 171 Z"
                />
                <path className={styles.collar} d="M152 176 C160 194 200 194 208 176" />
                <text className={styles.shirtMark} x="180" y="262" textAnchor="middle">
                  {product.artMark}
                </text>
              </g>
            </svg>
          </div>

          <div className={styles.floor} aria-hidden="true" />
        </div>

        <aside className={styles.controls} aria-label="Select a Maison Amiral piece">
          <div className={styles.activeProduct}>
            <p>{String(activeIndex + 1).padStart(2, "0")} / 04</p>
            <h3>{product.name}</h3>
            <span>{formatPrice(product.price)}</span>
            <p className={styles.productCopy}>{product.shortDescription}</p>
            <button type="button" className={styles.enterButton} onClick={openProduct}>
              Explore piece <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className={styles.selectorList}>
            {products.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                className={`${styles.selector} ${index === activeIndex ? styles.selectorActive : ""}`}
                onClick={() => {
                  setActiveIndex(index);
                  setIsTransitioning(false);
                }}
                aria-pressed={index === activeIndex}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.name}</strong>
                <span>{formatPrice(item.price)}</span>
              </button>
            ))}
          </div>

          <p className={styles.interactionHint}>Touch + drag on mobile. Mouse + drag on desktop.</p>
        </aside>
      </div>
    </section>
  );
}
