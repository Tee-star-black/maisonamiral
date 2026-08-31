"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { CartLink } from "@/components/cart/CartLink";
import { MaisonFooter } from "@/components/layout/MaisonFooter";

const leftNavItems = [
  ["Shop", "/shop"],
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
  subscribe: ["CORRESPONDENCE", "HOUSE NOTES", "EDITION 001", "MAISON"],
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
  const words = useMemo(
    () => pageWords[pageKey] ?? ["MAISON AMIRAL", "JOHANNESBURG", "OBJECT", "FORM"],
    [pageKey],
  );

  return (
    <div className={`maison-frame page-${pageKey} ${isHome ? "is-home" : "is-inner"}`}>
      <header className="global-nav">
        <nav className="global-nav-side global-nav-left" aria-label="Primary navigation left">
          {leftNavItems.map(([label, href]) => (
            <Link key={`${label}-${href}`} className={pathname === href ? "is-active" : ""} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <Link className="global-ship-mark" href="/" aria-label="Maison Amiral home">
          <svg className="ship-emblem-svg" viewBox="0 0 129 256" role="img" aria-label="Maison Amiral ship emblem">
            <defs>
              <filter id="nav-ship-solid" x="-20%" y="-20%" width="140%" height="140%">
                <feMorphology in="SourceAlpha" operator="dilate" radius="1.25" result="expanded" />
                <feFlood floodColor="currentColor" result="paint" />
                <feComposite in="paint" in2="expanded" operator="in" />
              </filter>
            </defs>
            <image href="/graphics/ship.png" width="129" height="256" filter="url(#nav-ship-solid)" />
          </svg>
        </Link>

        <nav className="global-nav-side global-nav-right" aria-label="Primary navigation right">
          <Link className={pathname === "/subscribe" ? "is-active" : ""} href="/subscribe">
            Subscribe
          </Link>
          <div className={pathname === "/cart" ? "nav-cart is-active" : "nav-cart"}>
            <CartLink />
          </div>
        </nav>
      </header>

      <div className="ambient-wheel ambient-wheel-right" aria-hidden="true">
        <Image src="/graphics/wheel.png" alt="" width={900} height={900} priority={false} />
      </div>
      <div className="ambient-wheel ambient-wheel-left" aria-hidden="true">
        <Image src="/graphics/wheel.png" alt="" width={620} height={620} priority={false} />
      </div>

      <div className="scattered-words" aria-hidden="true">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className={`scatter-word scatter-${index + 1}`}>{word}</span>
        ))}
      </div>

      <div className="site-page-content">{children}</div>
      <MaisonFooter />
    </div>
  );
}
