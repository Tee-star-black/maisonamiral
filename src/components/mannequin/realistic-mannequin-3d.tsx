"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type RealisticMannequin3DProps = {
  shirtTone: string;
  shirtInk: string;
  artMark: string;
  productName: string;
  onProductOpen: () => void;
};

export function RealisticMannequin3D({
  shirtTone,
  shirtInk,
  artMark,
  productName,
  onProductOpen,
}: RealisticMannequin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const openProductRef = useRef(onProductOpen);

  useEffect(() => {
    openProductRef.current = onProductOpen;
  }, [onProductOpen]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0b0b");
    scene.fog = new THREE.Fog("#0b0b0b", 9.5, 15);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 2.2, 9.6);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.position.y = -2.15;
    scene.add(root);

    const mannequinMaterial = new THREE.MeshPhysicalMaterial({
      color: "#bdb5aa",
      roughness: 0.5,
      metalness: 0.03,
      clearcoat: 0.08,
    });

    const shirtMaterial = new THREE.MeshPhysicalMaterial({
      color: shirtTone,
      roughness: 0.66,
      metalness: 0,
      sheen: 0.42,
      sheenColor: new THREE.Color(shirtTone).offsetHSL(0, 0, 0.16),
      clearcoat: 0.04,
    });

    const darkMaterial = new THREE.MeshPhysicalMaterial({ color: "#171717", roughness: 0.72 });
    const inkMaterial = new THREE.MeshStandardMaterial({ color: shirtInk, roughness: 0.76 });

    const addMesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: [number, number, number],
      scale: [number, number, number] = [1, 1, 1],
      rotation: [number, number, number] = [0, 0, 0],
      parent: THREE.Object3D = root,
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    addMesh(new THREE.SphereGeometry(0.43, 40, 40), mannequinMaterial, [0, 4.62, 0]);
    addMesh(new THREE.CylinderGeometry(0.22, 0.26, 0.42, 28), mannequinMaterial, [0, 4.05, 0]);
    addMesh(new THREE.SphereGeometry(0.92, 42, 42), mannequinMaterial, [0, 2.93, 0], [1.2, 1.65, 0.72]);

    const limbGeometry = new THREE.CapsuleGeometry(0.16, 0.92, 10, 20);
    const limb = (position: [number, number, number], scale: [number, number, number], zRotation = 0) =>
      addMesh(limbGeometry, mannequinMaterial, position, scale, [0, 0, zRotation]);

    limb([-1.02, 2.88, 0], [0.9, 1.06, 0.9], -0.08);
    limb([1.02, 2.88, 0], [0.9, 1.06, 0.9], 0.08);
    limb([-1.12, 1.62, 0.01], [0.78, 1.04, 0.78], 0.03);
    limb([1.12, 1.62, 0.01], [0.78, 1.04, 0.78], -0.03);
    limb([-0.47, 0.45, 0], [1.08, 1.66, 1.08]);
    limb([0.47, 0.45, 0], [1.08, 1.66, 1.08]);
    limb([-0.47, -1.5, 0], [0.92, 1.5, 0.92]);
    limb([0.47, -1.5, 0], [0.92, 1.5, 0.92]);

    const shirt = new THREE.Group();
    root.add(shirt);
    const shirtBody = addMesh(new THREE.BoxGeometry(2.22, 2.1, 0.62, 4, 4, 2), shirtMaterial, [0, 3.02, 0.04], [1, 1, 1], [0, 0, 0], shirt);
    const leftSleeve = addMesh(new THREE.BoxGeometry(0.82, 1.25, 0.54), shirtMaterial, [-1.38, 3.2, 0.02], [1, 1, 1], [0, 0, -0.49], shirt);
    const rightSleeve = addMesh(new THREE.BoxGeometry(0.82, 1.25, 0.54), shirtMaterial, [1.38, 3.2, 0.02], [1, 1, 1], [0, 0, 0.49], shirt);
    addMesh(new THREE.TorusGeometry(0.32, 0.055, 20, 48), inkMaterial, [0, 3.92, 0.22], [1, 1, 1], [Math.PI / 2, 0, 0], shirt);

    addMesh(new THREE.BoxGeometry(1, 1, 1), darkMaterial, [-0.47, -2.58, 0.18], [0.48, 0.24, 0.92]);
    addMesh(new THREE.BoxGeometry(1, 1, 1), darkMaterial, [0.47, -2.58, 0.18], [0.48, 0.24, 0.92]);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.ShadowMaterial({ color: "#000000", opacity: 0.38 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.84;
    floor.receiveShadow = true;
    scene.add(floor);

    const hemisphere = new THREE.HemisphereLight("#fff8ec", "#20242c", 1.35);
    scene.add(hemisphere);

    const key = new THREE.SpotLight("#fff5e8", 85, 30, 0.32, 0.7, 1.5);
    key.position.set(4.8, 8.2, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.SpotLight("#d8e2ff", 42, 28, 0.42, 0.85, 1.5);
    fill.position.set(-4.5, 5.4, 3);
    scene.add(fill);

    const rim = new THREE.PointLight("#ffffff", 20, 20, 2);
    rim.position.set(0, 0.5, -4);
    scene.add(rim);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const shirtTargets = [shirtBody, leftSleeve, rightSleeve];
    let dragging = false;
    let moved = false;
    let pointerId: number | null = null;
    let previousX = 0;
    let previousY = 0;
    let velocity = 0;
    let targetRotationX = 0;
    let targetRotationY = -0.08;
    let cameraDistance = 9.6;
    let hover = false;

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hitShirt = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(shirtTargets, false).length > 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        const nextHover = hitShirt(event);
        if (nextHover !== hover) {
          hover = nextHover;
          renderer.domElement.style.cursor = hover ? "pointer" : "grab";
        }
        return;
      }

      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      previousX = event.clientX;
      previousY = event.clientY;
      targetRotationY += dx * 0.008;
      targetRotationX = THREE.MathUtils.clamp(targetRotationX + dy * 0.0035, -0.18, 0.18);
      velocity = dx * 0.0014;
    };

    const endPointer = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const shouldOpen = !moved && hitShirt(event);
      dragging = false;
      pointerId = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.style.cursor = hover ? "pointer" : "grab";
      if (shouldOpen) openProductRef.current();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.006, 7.8, 11.5);
    };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", endPointer);
    renderer.domElement.addEventListener("pointercancel", endPointer);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      targetRotationY += velocity;
      velocity *= 0.94;
      root.rotation.y += (targetRotationY - root.rotation.y) * 0.08;
      root.rotation.x += (targetRotationX - root.rotation.x) * 0.08;
      root.position.y = -2.15 + Math.sin(elapsed * 0.9) * 0.012;
      const desiredScale = hover ? 1.022 : 1;
      const nextScale = THREE.MathUtils.lerp(root.scale.x, desiredScale, 0.12);
      root.scale.setScalar(nextScale);
      camera.position.z += (cameraDistance - camera.position.z) * 0.12;
      camera.lookAt(0, 0.8, 0);
      renderer.render(scene, camera);
    };
    animate();

    const label = document.createElement("div");
    label.textContent = `${artMark} · ${productName}`;
    label.style.position = "absolute";
    label.style.left = "50%";
    label.style.bottom = "18px";
    label.style.transform = "translateX(-50%)";
    label.style.color = "rgba(244,240,232,.62)";
    label.style.fontSize = "9px";
    label.style.letterSpacing = ".13em";
    label.style.textTransform = "uppercase";
    label.style.pointerEvents = "none";
    label.style.whiteSpace = "nowrap";
    mount.style.position = "relative";
    mount.appendChild(label);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", endPointer);
      renderer.domElement.removeEventListener("pointercancel", endPointer);
      renderer.domElement.removeEventListener("wheel", onWheel);
      if (label.parentNode === mount) mount.removeChild(label);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      mannequinMaterial.dispose();
      shirtMaterial.dispose();
      darkMaterial.dispose();
      inkMaterial.dispose();
      renderer.dispose();
    };
  }, [shirtTone, shirtInk, artMark, productName]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", minHeight: 620 }} aria-label={`Interactive 3D view of ${productName}`} />;
}
