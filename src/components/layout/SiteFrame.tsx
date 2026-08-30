"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { CartLink } from "@/components/cart/CartLink";

const navItems = [
  ["New", "/shop"],
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Editorial", "/editorial"],
  ["Journal", "/journal"],
] as const;

const pageWords: Record<string, string[]> = {
  home: ["JOHANNESBURG", "EDITION 001", "MOVEMENT", "MEMORY"],
  shop: ["OBJECTS", "EDITION 001", "FORM", "MATERIAL"],
  collections: ["ARCHIVE", "RELEASES", "HOUSE CODES", "001"],
  editorial: ["STUDIES", "MOVEMENT", "SHADOW", "STRUCTURE"],
  journal: ["NOTES", "PROCESS", "OBSERVATION", "HOUSE"],
  product: ["OBJECT", "DETAIL", "PROPORTION", "EDITION 001"],
  cart: ["SELECTION", "OBJECTS", "BAG", "MAISON"],
  checkout: ["ORDER", "DETAILS", "SECURE", "MAISON"],
};

function getPageKey(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/product/")) return "product";
  return pathname.split("/").filter(Boolean)[0] || "home";
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageKey = getPageKey(pathname);
  const isHome = pathname === "/";
  const [shipFailed, setShipFailed] = useState(false);
  const words = useMemo(() => pageWords[pageKey] ?? ["MAISON AMIRAL", "JOHANNESBURG", "OBJECT", "FORM"], [pageKey]);

  return (
    <div className={`maison-frame page-${pageKey} ${isHome ? "is-home" : "is-inner"}`}>
      <header className="global-nav">
        <div className="global-nav-left">
          <Link className="global-wordmark" href="/">MAISON AMIRAL</Link>
          <nav className="global-nav-links" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <Link key={`${label}-${href}`} className={pathname === href ? "is-active" : ""} href={href}>{label}</Link>
            ))}
          </nav>
        </div>

        <Link className="global-ship-mark" href="/" aria-label="Maison Amiral home">
          {!shipFailed ? (
            <Image
              src="/graphics/ship.jpeg"
              alt="Maison Amiral ship mark"
              width={72}
              height={36}
              priority
              onError={() => setShipFailed(true)}
            />
          ) : (
            <span className="ship-fallback" aria-hidden="true">MA</span>
          )}
        </Link>

        <div className="global-nav-actions">
          <Link href="/search">Search</Link>
          <CartLink />
        </div>
      </header>

      <div className="ambient-wheel ambient-wheel-right" aria-hidden="true">
        <Image src="/graphics/wheel.png" alt="" width={900} height={900} priority={false} />
      </div>
      <div className="ambient-wheel ambient-wheel-left" aria-hidden="true">
        <Image src="/graphics/wheel.png" alt="" width={620} height={620} priority={false} />
      </div>

      <div className="scattered-words" aria-hidden="true">
        {words.map((word, index) => <span key={`${word}-${index}`} className={`scatter-word scatter-${index + 1}`}>{word}</span>)}
      </div>

      <div className="site-page-content">{children}</div>
    </div>
  );
}
