"use client";

import { useEffect } from "react";

/**
 * A single delegated handler creates a brief yellow editorial spark on clicks.
 * This does not delay navigation, block form controls, or change the scroll.
 */
export function ClickFeedback() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function onClick(event: MouseEvent) {
      if (reducedMotion.matches || !(event.target instanceof Element)) return;
      const control = event.target.closest("a[href], button, summary, [role='button']");
      if (!control || control.matches(":disabled, [aria-disabled='true']")) return;

      const rect = control.getBoundingClientRect();
      const keyboardClick = event.detail === 0;
      const x = keyboardClick ? rect.left + rect.width / 2 : event.clientX;
      const y = keyboardClick ? rect.top + rect.height / 2 : event.clientY;
      const burst = document.createElement("span");
      burst.className = "ma-click-burst";
      burst.setAttribute("aria-hidden", "true");
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;
      burst.addEventListener("animationend", () => burst.remove(), { once: true });
      document.body.appendChild(burst);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
