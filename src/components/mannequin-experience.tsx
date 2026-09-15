"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, products } from "@/data/products";
import { LookFigure, type LookView } from "./look-figure";
import styles from "./mannequin-experience.module.css";

const TILT_LIMIT = 18;
const TRANSITION_MS = 360;

type Drag = { id: number; x: number; y: number; tilt: number; moved: boolean };
type NavigateEvent = { preventDefault: () => void };

export function MannequinExperience() {
  const router = useRouter();
  const id = useId();
  const titleId = `${id}-title`;
  const noteId = `${id}-note`;
  const [activeIndex, setActiveIndex] = useState(3);
  const [view, setView] = useState<LookView>("front");
  const [tilt, setTilt] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timer = useRef<number | null>(null);
  const navigating = useRef(false);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const product = products[activeIndex];
  const alternateView: LookView = view === "front" ? "back" : "front";
  const href = `/shop/${product.slug}`;
  const photoIndex = view === "back" && product.images[1] ? 1 : 0;
  const photo = product.images[photoIndex];

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
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
    drag.current = null;
    suppressClick.current = false;
    setActiveIndex(index);
    setTilt(0);
  }

  function chooseView(nextView: LookView) {
    cancelTransition();
    drag.current = null;
    suppressClick.current = false;
    setView(nextView);
    setTilt(0);
  }

  // onNavigate preserves modified clicks, new tabs and native no-JS links.
  function openProduct(event: NavigateEvent) {
    if (navigating.current) {
      event.preventDefault();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    navigating.current = true;
    setIsTransitioning(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      router.push(href);
    }, TRANSITION_MS);
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    // Buttons change views; only the figure and sheet are draggable.
    if (!event.isPrimary || event.button !== 0 || navigating.current) return;
    suppressClick.current = false;
    if ((event.target as Element).closest("button")) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tilt, moved: false };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = drag.current;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (!origin.moved) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      origin.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    suppressClick.current = true;
    setTilt(Math.max(-TILT_LIMIT, Math.min(TILT_LIMIT, origin.tilt + dx * 0.12)));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    if (event.type === "pointercancel") suppressClick.current = false;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section id="shop-the-look" className={styles.experience} aria-labelledby={titleId}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Maison Amiral / The wardrobe study</p>
          <h2 id={titleId}>Anatomy of a <em>look.</em></h2>
        </div>
        <p className={styles.intro}>One silhouette. Every perspective.<br />Select the piece. Make it yours.</p>
      </header>

      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <span>MA / Edition 001</span>
          <span>Figure {String(activeIndex + 1).padStart(2, "0")}</span>
          <span>Front &amp; reverse</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.study}>
            <div
              className={styles.drawing}
              role="group"
              aria-label={`${product.name}, ${view} silhouette`}
              aria-describedby={noteId}
              onDragStart={(event) => event.preventDefault()}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={() => { drag.current = null; }}
              onClickCapture={(event) => {
                if (suppressClick.current && event.detail > 0) {
                  suppressClick.current = false;
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              onKeyDown={(event) => { if (event.key === "Escape") cancelTransition(); }}
            >
              <span className={styles.plateNumber} aria-hidden="true">0{activeIndex + 1}</span>
              <svg className={styles.leaders} viewBox="0 0 1000 780" preserveAspectRatio="none" aria-hidden="true">
                <path d="M45 269 H241 L407 242 H480" />
                <path d="M45 470 H230 L381 350 H459" />
                <circle cx="480" cy="242" r="4" />
                <circle cx="459" cy="350" r="4" />
              </svg>

              <Link href={href} onNavigate={openProduct} className={styles.pieceCallout} draggable={false}>
                <span className={styles.label}>01 / The piece</span>
                <strong>{product.name}</strong>
                <span>{formatPrice(product.price)} <span aria-hidden="true">&#8599;</span></span>
              </Link>
              <div className={styles.detailCallout}>
                <span className={styles.label}>02 / The silhouette</span>
                <p>Front to back.<br />A different perspective.</p>
                <button type="button" onClick={() => chooseView(alternateView)}>View {alternateView} <span aria-hidden="true">&#8594;</span></button>
              </div>

              <div
                className={`${styles.figureWrap} ${isTransitioning ? styles.figureFocus : ""}`}
                style={{ "--tilt": `${tilt}deg` } as CSSProperties}
              >
                <LookFigure product={product} view={view} className={styles.figure} />
                <Link
                  href={href}
                  onNavigate={openProduct}
                  className={styles.garmentHitArea}
                  draggable={false}
                  aria-label={`Explore ${product.name}, ${formatPrice(product.price)}`}
                >
                  <span className={styles.hotspot} aria-hidden="true">01 <span>&#8599;</span></span>
                </Link>
              </div>

              <button
                type="button"
                className={styles.reverse}
                onClick={() => chooseView(alternateView)}
                aria-label={`Show ${alternateView} of the ${product.name} silhouette`}
              >
                <LookFigure product={product} view={alternateView} className={styles.figure} />
                <span>03 / {alternateView} view <span aria-hidden="true">&#8599;</span></span>
              </button>
              <span className={styles.viewCaption}>{view} / Illustrated silhouette</span>
            </div>

            <div className={styles.viewControls}>
              <div className={styles.views} role="group" aria-label="Figure view">
                <button type="button" aria-pressed={view === "front"} onClick={() => chooseView("front")}>Front</button>
                <button type="button" aria-pressed={view === "back"} onClick={() => chooseView("back")}>Back</button>
              </div>
              <div className={styles.tiltControls} role="group" aria-label="Perspective controls">
                <button type="button" aria-label="Tilt left" onClick={() => setTilt((value) => Math.max(-TILT_LIMIT, value - 6))}>&#8592;</button>
                <button type="button" onClick={() => setTilt(0)}>Reset</button>
                <button type="button" aria-label="Tilt right" onClick={() => setTilt((value) => Math.min(TILT_LIMIT, value + 6))}>&#8594;</button>
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
                <Image src={photo} alt={`${product.name}, ${photoIndex === 0 ? "front" : "back"} editorial photograph`} fill sizes="(max-width: 640px) 85vw, (max-width: 1100px) 40vw, 270px" />
                <span>Product photograph <span aria-hidden="true">&#8599;</span></span>
              </Link>
            ) : (
              <div className={styles.missingPhoto}>
                <p>Illustrated study</p>
                <span>Product photographs have not been supplied for this piece.</span>
              </div>
            )}
            <p className={styles.copy}>{product.shortDescription}</p>
            <Link href={href} onNavigate={openProduct} className={styles.enterButton}>
              {isTransitioning ? "Opening piece" : "Explore piece"} <span aria-hidden="true">&#8599;</span>
            </Link>
            <div className={styles.selectorList} role="group" aria-label="Collection pieces">
              {products.map((item, index) => (
                <button key={item.slug} type="button" className={styles.selector} aria-pressed={activeIndex === index} onClick={() => chooseProduct(index)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.swatch} style={{ backgroundColor: item.tone }} aria-hidden="true" />
                  <strong>{item.name}</strong>
                  <span aria-hidden="true">{activeIndex === index ? "\u2197" : "+"}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <footer className={styles.sheetFooter}>
          <p id={noteId}>Illustrated styling study, not an exact fit or print preview. Trousers and shoes are styling only. Refer to product photographs for garment detail.</p>
          <span>Drag gently to tilt / Tap 01 to explore</span>
        </footer>
      </div>
    </section>
  );
}
