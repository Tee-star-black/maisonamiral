"use client";

import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, products } from "@/data/products";
import styles from "./mannequin-experience.module.css";

const ROTATION_LIMIT = 26;

export function MannequinExperience() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(3);
  const [rotation, setRotation] = useState(-4);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const dragStart = useRef<{ x: number; rotation: number } | null>(null);
  const didDrag = useRef(false);

  const product = products[activeIndex];

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

    const nextRotation = dragStart.current.rotation + delta * 0.12;
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
    }, 360);
  }

  function handleGarmentKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  }

  function chooseProduct(index: number) {
    setActiveIndex(index);
    setRotation(-4);
    setIsTransitioning(false);
  }

  return (
    <section className={styles.experience} aria-labelledby="mannequin-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Interactive atelier / Edition 001</p>
          <h2 id="mannequin-title">
            Dress the <em>form.</em>
          </h2>
        </div>

        <div className={styles.headingMeta}>
          <span>02 / Digital fitting room</span>
          <p className={styles.intro}>
            Rotate the atelier form, switch the piece, then enter the product story.
          </p>
        </div>
      </div>

      <div className={styles.experienceGrid} style={productStyle}>
        <div
          className={styles.stage}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Interactive atelier form. Drag left or right to rotate."
        >
          <div className={styles.stageWord} aria-hidden="true">
            {product.artMark}
          </div>

          <div className={styles.stageLabel} aria-hidden="true">
            <span>Drag</span>
            <span>↔</span>
            <span>Rotate</span>
          </div>

          <div className={styles.stageEdition} aria-hidden="true">
            MA / 001
          </div>

          <div
            className={`${styles.figureWrap} ${isTransitioning ? styles.figureFocus : ""}`}
            style={{ "--rotation": `${rotation}deg` } as CSSProperties}
          >
            <svg
              className={styles.figure}
              viewBox="0 0 420 700"
              role="img"
              aria-label={`${product.name} displayed on a sculptural fashion form`}
            >
              <defs>
                <linearGradient id="formFinish" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#f0ece3" />
                  <stop offset="0.42" stopColor="#bbb3a6" />
                  <stop offset="0.72" stopColor="#eee9df" />
                  <stop offset="1" stopColor="#989084" />
                </linearGradient>
                <linearGradient id="standFinish" x1="0" x2="1">
                  <stop offset="0" stopColor="#6d675e" />
                  <stop offset="0.5" stopColor="#e0dbd2" />
                  <stop offset="1" stopColor="#5b554e" />
                </linearGradient>
                <filter id="formShadow" x="-35%" y="-25%" width="170%" height="165%">
                  <feDropShadow dx="0" dy="20" stdDeviation="18" floodOpacity="0.42" />
                </filter>
              </defs>

              <g className={styles.formBody} filter="url(#formShadow)">
                <ellipse cx="210" cy="111" rx="31" ry="12" fill="url(#formFinish)" />
                <path
                  d="M184 110 C185 128 181 141 170 153 L250 153 C239 141 235 128 236 110 Z"
                  fill="url(#formFinish)"
                />
                <path
                  d="M210 143 C168 143 139 157 117 185 C137 218 148 255 151 307 C154 362 166 406 190 432 C197 440 203 445 210 449 C217 445 223 440 230 432 C254 406 266 362 269 307 C272 255 283 218 303 185 C281 157 252 143 210 143 Z"
                  fill="url(#formFinish)"
                />
                <path
                  d="M184 433 C191 444 201 450 210 454 C219 450 229 444 236 433 L227 507 L193 507 Z"
                  fill="url(#formFinish)"
                />
              </g>

              <g className={styles.stand} aria-hidden="true">
                <rect x="205" y="500" width="10" height="126" rx="5" fill="url(#standFinish)" />
                <ellipse cx="210" cy="636" rx="82" ry="13" fill="#736c62" />
                <ellipse cx="210" cy="631" rx="82" ry="13" fill="url(#standFinish)" />
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
                  d="M151 162 C169 151 189 146 210 146 C231 146 251 151 269 162 L303 180 L330 228 L292 254 L272 225 L272 345 C257 368 237 381 210 381 C183 381 163 368 148 345 L148 225 L128 254 L90 228 L117 180 Z"
                />
                <path className={styles.shirtShoulderShade} d="M126 182 C153 199 173 207 210 207 C247 207 267 199 294 182" />
                <path className={styles.collar} d="M177 158 C182 181 238 181 243 158" />
                <path className={styles.shirtFold} d="M177 221 C172 258 174 307 181 347" />
                <path className={styles.shirtFold} d="M243 221 C248 258 246 307 239 347" />
                <path className={styles.shirtHem} d="M151 344 C171 356 190 361 210 361 C230 361 249 356 269 344" />
                <text className={styles.shirtMark} x="210" y="276" textAnchor="middle">
                  {product.artMark}
                </text>
              </g>
            </svg>
          </div>

          <button type="button" className={styles.garmentTag} onClick={openProduct}>
            <span>{product.name}</span>
            <strong>{formatPrice(product.price)}</strong>
            <span aria-hidden="true">↗</span>
          </button>
        </div>

        <aside className={styles.controls} aria-label="Select a Maison Amiral piece">
          <div className={styles.activeProduct} aria-live="polite">
            <div className={styles.activeProductTopline}>
              <p>{String(activeIndex + 1).padStart(2, "0")} / 04</p>
              <span>{product.edition}</span>
            </div>

            <div className={styles.productPreview} aria-hidden="true">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt=""
                  fill
                  sizes="180px"
                  className={styles.productPreviewImage}
                />
              ) : (
                <span>{product.artMark}</span>
              )}
            </div>

            <h3>{product.name}</h3>
            <span className={styles.activePrice}>{formatPrice(product.price)}</span>
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
                onClick={() => chooseProduct(index)}
                aria-pressed={index === activeIndex}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.name}</strong>
                <span>{formatPrice(item.price)}</span>
              </button>
            ))}
          </div>

          <p className={styles.interactionHint}>Touch + drag on mobile / mouse + drag on desktop</p>
        </aside>
      </div>
    </section>
  );
}
