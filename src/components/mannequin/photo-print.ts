import * as THREE from "three";
import type { ProductPrint } from "@/data/products";

/**
 * Converts a small, photographed print area into a curved UV decal.
 * The source remains the original catalogue image, never generated lettering.
 * Photography is a visual reference, not an exact print master.
 */
export function loadPhotoPrint(
  reference: ProductPrint,
  onReady: (texture: THREE.CanvasTexture) => void,
  onError?: () => void,
): () => void {
  const image = new window.Image();
  let cancelled = false;

  image.onload = () => {
    if (cancelled) return;
    try {
      const size = 1024;
      const atlas = document.createElement("canvas");
      atlas.width = size;
      atlas.height = size;
      const ctx = atlas.getContext("2d", { willReadFrequently: reference.transparentBlack === true });
      if (!ctx) throw new Error("Cannot create print texture");

      const { crop, placement } = reference;
      const sx = Math.round(crop.x * image.naturalWidth);
      const sy = Math.round(crop.y * image.naturalHeight);
      const sw = Math.min(image.naturalWidth - sx, Math.max(1, Math.round(crop.width * image.naturalWidth)));
      const sh = Math.min(image.naturalHeight - sy, Math.max(1, Math.round(crop.height * image.naturalHeight)));
      const dx = Math.round(placement.x * size);
      const dy = Math.round(placement.y * size);
      const dw = Math.round(placement.width * size);
      const dh = Math.round(placement.height * size);

      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

      // Photographs of black shirts include shadows between ink elements.
      // Only remove near-neutral dark fabric, not bright coloured print pixels.
      if (reference.transparentBlack) {
        const pixels = ctx.getImageData(dx, dy, dw, dh);
        const data = pixels.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const light = Math.max(r, g, b);
          const chroma = light - Math.min(r, g, b);
          const retained = THREE.MathUtils.smoothstep(
            Math.max(light, chroma * 2.1), 38, 96,
          );
          data[i + 3] = Math.round(data[i + 3] * retained);
        }
        ctx.putImageData(pixels, dx, dy);
      }

      // Feather the photographic crop edge to prevent a visible rectangle.
      // The one-piece white Automobile front print deliberately skips this.
      if (reference.transparentBlack) {
        const edge = Math.max(3, Math.round(Math.min(dw, dh) * 0.025));
        const pixels = ctx.getImageData(dx, dy, dw, dh);
        for (let y = 0; y < dh; y += 1) {
          for (let x = 0; x < dw; x += 1) {
            const distance = Math.min(x, y, dw - 1 - x, dh - 1 - y);
            const opacity = THREE.MathUtils.smoothstep(distance, 0, edge);
            const alphaIndex = (y * dw + x) * 4 + 3;
            pixels.data[alphaIndex] = Math.round(pixels.data[alphaIndex] * opacity);
          }
        }
        ctx.putImageData(pixels, dx, dy);
      }

      const texture = new THREE.CanvasTexture(atlas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.generateMipmaps = true;
      if (cancelled) texture.dispose();
      else onReady(texture);
    } catch {
      if (!cancelled) onError?.();
    }
  };
  image.onerror = () => { if (!cancelled) onError?.(); };
  image.src = reference.image;

  return () => {
    cancelled = true;
    image.onload = null;
    image.onerror = null;
    image.removeAttribute("src");
  };
}
