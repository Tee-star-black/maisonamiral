"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./store-header.module.css";

export function MobileNavigation({ links }: { links: readonly (readonly [string, string])[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const close = () => { if (menu.current) menu.current.open = false; };
    close();
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        close();
        menu.current?.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [pathname]);
  return <details ref={menu} className={styles.mobileMenu}>
    <summary aria-label="Navigation menu">Menu <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18" /></svg></summary>
    <nav aria-label="Mobile navigation">{links.map(([label, href]) =>
      <Link key={href} href={href} onClick={() => { if (menu.current) menu.current.open = false; }}>{label}</Link>
    )}</nav>
  </details>;
}
