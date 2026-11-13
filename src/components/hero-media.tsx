"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "@/app/home.module.css";

const HERO_FILM = "/video/flag.mp4";
const POSTER = "/products/emblem/front-edit.jpeg";
const CROSSFADE_START_SECONDS = 0.55;
const CROSSFADE_DURATION_MS = 520;
const FILM_RATE = 0.85;

/**
 * The source film is only 1.4 seconds long. Two silent players crossfade
 * before the end instead of showing the hard jump of a native video loop.
 * A still poster remains underneath for blocked autoplay and reduced motion.
 */
export function HeroMedia() {
  const players = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null]);
  const currentPlayer = useRef<0 | 1>(0);
  const switching = useRef(false);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const [active, setActive] = useState<0 | 1>(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    mounted.current = true;
    const first = players.current[0];
    if (!first) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pauseAll = () => players.current.forEach((video) => video?.pause());

    for (const video of players.current) {
      if (video) {
        video.muted = true;
        video.playbackRate = FILM_RATE;
      }
    }

    const resume = () => {
      if (motion.matches || document.visibilityState !== "visible") return;
      const video = players.current[currentPlayer.current];
      if (!video) return;
      void video.play()
        .then(() => { if (mounted.current) setVisible(true); })
        .catch(() => { if (mounted.current) setVisible(false); });
    };

    const onMotionChange = () => {
      if (motion.matches) { pauseAll(); setVisible(false); }
      else resume();
    };

    if (!motion.matches) resume();
    motion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", resume);
    // If the browser initially blocks autoplay, retry unobtrusively after a
    // normal first interaction. Never show a manual film-play control.
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });

    return () => {
      mounted.current = false;
      motion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", resume);
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
      if (cleanupTimer.current !== null) clearTimeout(cleanupTimer.current);
      pauseAll();
    };
  }, []);

  function switchBeforeEnd(from: 0 | 1) {
    if (switching.current || currentPlayer.current !== from) return;
    const nextIndex: 0 | 1 = from === 0 ? 1 : 0;
    const previous = players.current[from];
    const upcoming = players.current[nextIndex];
    if (!previous || !upcoming) return;
    switching.current = true;
    upcoming.pause();
    upcoming.currentTime = 0;
    upcoming.playbackRate = FILM_RATE;

    void upcoming.play().then(() => {
      if (!mounted.current) return;
      currentPlayer.current = nextIndex;
      setActive(nextIndex);
      setVisible(true);
      if (cleanupTimer.current !== null) clearTimeout(cleanupTimer.current);
      cleanupTimer.current = setTimeout(() => {
        previous.pause();
        previous.currentTime = 0;
        switching.current = false;
      }, CROSSFADE_DURATION_MS);
    }).catch(() => {
      switching.current = false;
      // Some mobile browsers won't play a second hidden video. Keep the film
      // running on the original player instead of getting stuck on the poster.
      if (previous.ended) {
        previous.currentTime = 0;
        void previous.play().catch(() => {
          if (mounted.current) setVisible(false);
        });
      }
    });
  }

  function onTimeUpdate(index: 0 | 1) {
    if (index !== currentPlayer.current || switching.current) return;
    const video = players.current[index];
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (video.duration - video.currentTime <= CROSSFADE_START_SECONDS) {
      switchBeforeEnd(index);
    }
  }

  function onEnded(index: 0 | 1) {
    if (index !== currentPlayer.current || switching.current) return;
    // If crossfade could not start in time, an ordinary replay is still
    // better than permanently stopping the hero video.
    const video = players.current[index];
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      if (mounted.current) setVisible(false);
    });
  }

  return (
    <div className={styles.heroVisual} aria-hidden="true">
        <Image src={POSTER} alt="" fill priority sizes="100vw" className={styles.heroPoster} />
        {([0, 1] as const).map((index) => (
          <video
            key={index}
            ref={(video) => { players.current[index] = video; }}
            autoPlay={index === 0}
            muted
            playsInline
            preload="auto"
            poster={POSTER}
            className={styles.heroVideo + (visible && active === index ? " " + styles.heroVideoActive : "")}
            onPlaying={() => {
              if (currentPlayer.current === index && mounted.current) setVisible(true);
            }}
            onTimeUpdate={() => onTimeUpdate(index)}
            onEnded={() => onEnded(index)}
            onError={() => {
              if (currentPlayer.current === index && mounted.current) setVisible(false);
            }}
          >
            <source src={HERO_FILM} type="video/mp4" />
          </video>
        ))}
    </div>
  );
}
