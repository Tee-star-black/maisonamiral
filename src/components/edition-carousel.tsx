"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, products } from "@/data/products";
import styles from "./edition-carousel.module.css";

const SLIDE_INTERVAL = 6000;
const pad = (index: number) => String(index + 1).padStart(2, "0");

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotion() {
  return false;
}

export function EditionCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [playPreference, setPlayPreference] = useState<boolean | null>(null);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
  const isPlaying = playPreference ?? !prefersReducedMotion;
  const activeProduct = products[activeIndex];

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !isPlaying || products.length < 2) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((previous) => (previous + 1) % products.length);
    }, SLIDE_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying, visible]);

  function choose(index: number) {
    setActiveIndex((index + products.length) % products.length);
  }

  return (
    <section
      id="collection"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="edition-heading"
      aria-roledescription="carousel"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>01 / THE COLLECTION</p>
          <h2 id="edition-heading">Edition 001.</h2>
        </div>
        <div className={styles.intro}>
          <p>Three objects. One point of view.<br />Designed in Johannesburg.</p>
          <Link href="/shop">View all pieces <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.showcase}>
          <Link
            href={"/shop/" + activeProduct.slug}
            className={styles.stage}
            aria-label={"View " + activeProduct.name}
          >
            {products.map((product, index) => {
              const active = index === activeIndex;
              return (
                <div
                  key={product.slug}
                  className={styles.media + (active ? " " + styles.mediaActive : "")}
                  aria-hidden="true"
                >
                  <Image
                    src={product.images[0]}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 55vw"
                    priority={index === 0}
                    className={styles.image}
                  />
                </div>
              );
            })}
            <span className={styles.stageNumber} aria-hidden="true">
              MA / {pad(activeIndex)} — {String(products.length).padStart(2, "0")}
            </span>
            <span className={styles.stageCorner} aria-hidden="true">VIEW PIECE ↗</span>
          </Link>

          <div className={styles.caption} aria-live={isPlaying ? "off" : "polite"} aria-atomic="true">
            <div className={styles.captionTitle} key={activeProduct.slug}>
              <small>EDITION 001 / {pad(activeIndex)}</small>
              <strong>{activeProduct.name}</strong>
            </div>
            <span className={styles.captionPrice}>{formatPrice(activeProduct.price)}</span>
          </div>
        </div>

        <div className={styles.index}>
          <div className={styles.indexHeading}>
            <span>THE OBJECTS / INDEX</span>
            <span>{pad(activeIndex)} / {String(products.length).padStart(2, "0")}</span>
          </div>

          <div className={styles.indexItems} role="group" aria-label="Choose a T-shirt to preview">
            {products.map((product, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={product.slug}
                  type="button"
                  className={styles.indexItem + (active ? " " + styles.indexItemActive : "")}
                  aria-pressed={active}
                  onClick={() => choose(index)}
                >
                  <span className={styles.itemNumber}>{pad(index)}</span>
                  <span className={styles.itemCopy}>
                    <strong>{product.name}</strong>
                    <small>{product.shortDescription}</small>
                  </span>
                  <span className={styles.itemArrow} aria-hidden="true">{active ? "●" : "↗"}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.controls}>
            <div className={styles.navigation} role="group" aria-label="Slideshow controls">
              <button type="button" onClick={() => choose(activeIndex - 1)} aria-label="Previous T-shirt">
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" onClick={() => choose(activeIndex + 1)} aria-label="Next T-shirt">
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <button
              type="button"
              className={styles.playButton}
              aria-label={isPlaying ? "Pause automatic slideshow" : "Play automatic slideshow"}
              aria-pressed={!isPlaying}
              onClick={() => setPlayPreference(!isPlaying)}
            >
              <span className={styles.playIcon} aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
              {isPlaying ? "PAUSE" : "PLAY"}
            </button>
          </div>
          <p className={styles.footnote}>
            {isPlaying ? "AUTOMATIC ADVANCE / 06 SEC" : "SLIDESHOW PAUSED"}
            <span>JOHANNESBURG / 2026</span>
          </p>
        </div>
      </div>
    </section>
  );
}
