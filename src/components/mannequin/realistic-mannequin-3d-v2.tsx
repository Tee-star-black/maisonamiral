"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import type { ProductPrint } from "@/data/products";
import { createAtelierGarment, type AtelierGarment } from "./atelier-garment-mesh";
import { loadShowroomMannequin } from "./mannequin-model";
import { loadPhotoPrint } from "./photo-print";
import styles from "./atelier-garment-3d.module.css";

export type RealisticMannequin3DProps = {
  shirtTone: string;
  productName: string;
  frontArtwork?: ProductPrint;
  backArtwork?: ProductPrint;
  productImage?: string;
  onProductOpen: () => void;
};

type SceneControls = {
  rotate: (direction: number) => void;
  zoom: (direction: number) => void;
  reset: () => void;
};

export function RealisticMannequin3D({
  shirtTone, productName, frontArtwork, backArtwork, productImage, onProductOpen,
}: RealisticMannequin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const garmentRef = useRef<AtelierGarment | null>(null);
  const toneRef = useRef(shirtTone);
  const controlsRef = useRef<SceneControls | null>(null);
  const openRef = useRef(onProductOpen);
  const [fallback, setFallback] = useState(false);
  const [mannequinStatus, setMannequinStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => { openRef.current = onProductOpen; }, [onProductOpen]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: window.devicePixelRatio < 2,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }

    let disposed = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eeece6");
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 2.23, 6.2);
    camera.lookAt(0, 2.23, 0);

    const figure = new THREE.Group();
    const mannequinRoot = new THREE.Group();
    figure.add(mannequinRoot);
    scene.add(figure);

    const garment = createAtelierGarment(toneRef.current);
    garment.group.name = "MAISON_PHOTOGRAPHIC_TEE";
    garment.group.scale.set(0.54, 0.40, 1.33);
    garment.group.position.set(0, 2.43, 0.05);
    figure.add(garment.group);
    garmentRef.current = garment;

    const mannequin = loadShowroomMannequin(
      mannequinRoot, figure,
      () => { if (!disposed) setMannequinStatus("ready"); },
      () => { if (!disposed) setMannequinStatus("unavailable"); },
    );

    const floorMaterial = new THREE.MeshStandardMaterial({ color: "#e0dbd2", roughness: 0.98 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.018;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(new THREE.HemisphereLight("#fffdf8", "#8c867e", 2.2));
    const key = new THREE.DirectionalLight("#fff8ed", 3.2);
    key.position.set(-3.1, 5.5, 5.3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3.5;
    key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#edf0f5", 1.25);
    fill.position.set(4.5, 3.8, 4.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight("#ffffff", 1.6);
    rim.position.set(1.0, 4.2, -4.4);
    scene.add(rim);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let targetYaw = -0.12;
    let targetPitch = 0.01;
    let targetDistance = 6.2;
    let velocity = 0;
    let pointerId: number | null = null;
    let dragged = false;
    let previousX = 0;
    let previousY = 0;
    let hasInteracted = false;
    let running = false;
    let visible = true;
    let frame = 0;
    let lastTime = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      return true;
    };
    const hitShirt = (event: PointerEvent) => {
      if (!updatePointer(event)) return false;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(garment.hitTargets, false).length > 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      dragged = false;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        if (event.pointerType === "mouse") {
          renderer.domElement.style.cursor = hitShirt(event) ? "pointer" : "grab";
        }
        return;
      }
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      previousX = event.clientX;
      previousY = event.clientY;
      targetYaw += dx * 0.009;
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0023, -0.12, 0.12);
      velocity = THREE.MathUtils.clamp(dx * 0.001, -0.025, 0.025);
      hasInteracted = true;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const openProduct = !dragged && event.type === "pointerup" && hitShirt(event);
      pointerId = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.style.cursor = "grab";
      if (openProduct) openRef.current();
    };
    // Avoid hijacking normal page scrolling. Ctrl/trackpad pinch zooms the garment.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      targetDistance = THREE.MathUtils.clamp(targetDistance + event.deltaY * 0.006, 4.7, 9);
      hasInteracted = true;
    };

    const render = () => { mannequin.updateMask(); renderer.render(scene, camera); };
    const resize = () => {
      if (disposed) return;
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 560 ? 40 : 34;
      camera.updateProjectionMatrix();
      render();
    };
    const pause = () => {
      running = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
    };
    const tick = (time: number) => {
      frame = 0;
      if (!running || disposed || document.hidden) return;
      const dt = Math.min((time - (lastTime || time)) / 16.67, 3);
      lastTime = time;
      if (!hasInteracted && !reduceMotion) {
        targetYaw = -0.12 + Math.sin(time * 0.00028) * 0.12;
      }
      if (pointerId === null) {
        targetYaw += velocity * dt;
        velocity *= Math.pow(0.91, dt);
      }
      figure.rotation.y = THREE.MathUtils.lerp(figure.rotation.y, targetYaw, 0.08 * dt);
      figure.rotation.x = THREE.MathUtils.lerp(figure.rotation.x, targetPitch, 0.08 * dt);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetDistance, 0.08 * dt);
      camera.lookAt(0, 2.23, 0);
      render();
      frame = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || disposed || document.hidden || !visible) return;
      running = true;
      lastTime = 0;
      frame = window.requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => { if (document.hidden) pause(); else start(); };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      pause();
      setFallback(true);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("webglcontextlost", onContextLost);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    const viewportObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else pause();
    }, { threshold: 0.02 });
    viewportObserver.observe(mount);

    controlsRef.current = {
      rotate: (direction) => {
        hasInteracted = true;
        targetYaw += direction * (Math.PI / 4);
        velocity = 0;
      },
      zoom: (direction) => {
        hasInteracted = true;
        targetDistance = THREE.MathUtils.clamp(targetDistance + direction * 0.6, 4.7, 9);
      },
      reset: () => {
        targetYaw = -0.12;
        targetPitch = 0.01;
        targetDistance = 6.2;
        velocity = 0;
        hasInteracted = false;
      },
    };

    resize();
    start();
    return () => {
      disposed = true;
      pause();
      resizeObserver.disconnect();
      viewportObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      controlsRef.current = null;
      garmentRef.current = null;
      mannequin.dispose();
      garment.dispose();
      floor.geometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, []);

  useEffect(() => {
    toneRef.current = shirtTone;
    const garment = garmentRef.current;
    if (!garment) return;
    garment.updateTone(shirtTone);
    garment.setPrints();
    let active = true;
    let frontTexture: THREE.CanvasTexture | null = null;
    let backTexture: THREE.CanvasTexture | null = null;
    const cancels: Array<() => void> = [];

    if (frontArtwork) {
      cancels.push(loadPhotoPrint(frontArtwork, (texture) => {
        if (!active) { texture.dispose(); return; }
        frontTexture?.dispose();
        frontTexture = texture;
        garment.setPrints(frontTexture, backTexture);
      }));
    }
    if (backArtwork) {
      cancels.push(loadPhotoPrint(backArtwork, (texture) => {
        if (!active) { texture.dispose(); return; }
        backTexture?.dispose();
        backTexture = texture;
        garment.setPrints(frontTexture, backTexture);
      }));
    }
    return () => {
      active = false;
      cancels.forEach((cancel) => cancel());
      garment.setPrints();
      frontTexture?.dispose();
      backTexture?.dispose();
    };
  }, [shirtTone, frontArtwork, backArtwork]);

  return (
    <div className={styles.stage} aria-label={"Maison Amiral 3D mannequin wearing " + productName}>
      {fallback ? (
        <div className={styles.fallback}>
          {productImage ? <Image src={productImage} alt={productName} fill sizes="(max-width:720px) 100vw,70vw" style={{ objectFit: "contain" }} /> : (
            <p>MAISON AMIRAL <span>{productName}</span></p>
          )}
          <span className={styles.fallbackNotice}>Actual product photograph / 3D unavailable</span>
        </div>
      ) : <div ref={mountRef} className={styles.canvas} role="group" aria-label={"Rotate 3D mannequin wearing " + productName} />}
      <div className={styles.stageCaption} aria-hidden="true">MA / THE FITTING ROOM <span>001</span></div>
      {!fallback && mannequinStatus !== "ready" && (
        <div className={styles.loadStatus} role="status">
          {mannequinStatus === "loading" ? "Fitting the mannequin" : "Mannequin unavailable / garment preview"}
        </div>
      )}
      {!fallback && (
        <div className={styles.controls} role="group" aria-label="3D garment controls">
          <button type="button" aria-label="Rotate left" onClick={() => controlsRef.current?.rotate(-1)}>←</button>
          <button type="button" aria-label="Rotate right" onClick={() => controlsRef.current?.rotate(1)}>→</button>
          <span className={styles.separator} aria-hidden="true" />
          <button type="button" aria-label="Zoom out" onClick={() => controlsRef.current?.zoom(1)}>−</button>
          <button type="button" aria-label="Zoom in" onClick={() => controlsRef.current?.zoom(-1)}>+</button>
          <button type="button" className={styles.reset} onClick={() => controlsRef.current?.reset()}>Reset</button>
        </div>
      )}
    </div>
  );
}
