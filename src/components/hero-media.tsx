"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "@/app/home.module.css";

/** The original film is 1.4 seconds; looping it visibly snaps at the seam. */
export function HeroMedia() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function")
      attempt.catch(() => { if (!cancelled) setPlaying(false); });
    return () => { cancelled = true; video.pause(); };
  }, []);
  return (
    <div className={styles.heroVisual} aria-hidden="true">
      <Image src="/products/emblem/front-edit.jpeg" alt="" fill priority sizes="100vw" className={styles.heroPoster} />
      <video ref={ref} autoPlay muted playsInline preload="auto"
        className={styles.heroVideo + (playing ? " " + styles.heroVideoPlaying : "")}
        poster="/products/emblem/front-edit.jpeg"
        onPlaying={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onError={() => setPlaying(false)}
        onStalled={() => setPlaying(false)}>
        <source src="/video/flag.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
