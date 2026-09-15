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
    scene.background = new THREE.Color("#ece9e2");

    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 1.35, 8.4);
    camera.lookAt(0, 0.55, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.position.y = -1.92;
    scene.add(root);

    const mannequinMaterial = new THREE.MeshPhysicalMaterial({
      color: "#c8c1b6",
      roughness: 0.6,
      metalness: 0,
      clearcoat: 0.03,
    });

    const trouserMaterial = new THREE.MeshStandardMaterial({
      color: "#2a2927",
      roughness: 0.82,
    });

    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: "#171717",
      roughness: 0.72,
    });

    const shirtMaterial = new THREE.MeshPhysicalMaterial({
      color: shirtTone,
      roughness: 0.82,
      metalness: 0,
      sheen: 0.24,
      sheenColor: new THREE.Color(shirtTone).offsetHSL(0, 0, 0.1),
      clearcoat: 0.015,
    });

    const inkMaterial = new THREE.MeshStandardMaterial({
      color: shirtInk,
      roughness: 0.78,
    });

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

    // Head and neck
    addMesh(new THREE.SphereGeometry(0.37, 36, 36), mannequinMaterial, [0, 4.52, 0], [0.94, 1.1, 0.92]);
    addMesh(new THREE.CylinderGeometry(0.16, 0.2, 0.42, 28), mannequinMaterial, [0, 4.02, 0]);

    // Upper body and hips, kept mostly underneath the garment.
    addMesh(new THREE.SphereGeometry(0.78, 36, 36), mannequinMaterial, [0, 2.95, 0], [1.02, 1.28, 0.62]);
    addMesh(new THREE.SphereGeometry(0.58, 30, 30), mannequinMaterial, [0, 1.82, 0], [1.05, 0.72, 0.62]);

    // Arms, slightly relaxed and away from the shirt.
    const upperArm = new THREE.CapsuleGeometry(0.12, 0.72, 8, 18);
    const foreArm = new THREE.CapsuleGeometry(0.105, 0.7, 8, 18);
    addMesh(upperArm, mannequinMaterial, [-0.93, 2.9, 0.02], [1, 1, 1], [0, 0, 0.12]);
    addMesh(upperArm, mannequinMaterial, [0.93, 2.9, 0.02], [1, 1, 1], [0, 0, -0.12]);
    addMesh(foreArm, mannequinMaterial, [-1.02, 1.85, 0.03], [1, 1, 1], [0, 0, 0.04]);
    addMesh(foreArm, mannequinMaterial, [1.02, 1.85, 0.03], [1, 1, 1], [0, 0, -0.04]);

    // Hands.
    addMesh(new THREE.SphereGeometry(0.13, 22, 22), mannequinMaterial, [-1.05, 1.1, 0.05], [0.72, 1.35, 0.62]);
    addMesh(new THREE.SphereGeometry(0.13, 22, 22), mannequinMaterial, [1.05, 1.1, 0.05], [0.72, 1.35, 0.62]);

    // Legs and trousers.
    const thigh = new THREE.CapsuleGeometry(0.19, 1.15, 8, 20);
    const calf = new THREE.CapsuleGeometry(0.16, 1.12, 8, 20);
    addMesh(thigh, trouserMaterial, [-0.31, 0.15, 0]);
    addMesh(thigh, trouserMaterial, [0.31, 0.15, 0]);
    addMesh(calf, trouserMaterial, [-0.31, -1.38, 0.01]);
    addMesh(calf, trouserMaterial, [0.31, -1.38, 0.01]);

    // Shoes.
    addMesh(new THREE.BoxGeometry(0.52, 0.25, 0.9), shoeMaterial, [-0.31, -2.24, 0.18], [1, 1, 1], [0, 0, 0]);
    addMesh(new THREE.BoxGeometry(0.52, 0.25, 0.9), shoeMaterial, [0.31, -2.24, 0.18], [1, 1, 1], [0, 0, 0]);

    // Garment group. Cylinder geometry gives a soft, fitted torso instead of a cardboard box.
    const shirt = new THREE.Group();
    root.add(shirt);

    const shirtBody = addMesh(
      new THREE.CylinderGeometry(0.78, 0.67, 1.75, 36, 4, false),
      shirtMaterial,
      [0, 2.85, 0],
      [1.08, 1, 0.62],
      [0, 0, 0],
      shirt,
    );

    const sleeveGeometry = new THREE.CylinderGeometry(0.31, 0.25, 0.88, 28, 2, false);
    const leftSleeve = addMesh(
      sleeveGeometry,
      shirtMaterial,
      [-0.83, 3.23, 0],
      [1, 1, 0.78],
      [0, 0, -0.9],
      shirt,
    );
    const rightSleeve = addMesh(
      sleeveGeometry,
      shirtMaterial,
      [0.83, 3.23, 0],
      [1, 1, 0.78],
      [0, 0, 0.9],
      shirt,
    );

    addMesh(
      new THREE.TorusGeometry(0.23, 0.035, 16, 42),
      inkMaterial,
      [0, 3.69, 0.34],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
      shirt,
    );

    // Simple, local print texture so no remote font or asset is required.
    const printCanvas = document.createElement("canvas");
    printCanvas.width = 768;
    printCanvas.height = 320;
    const ctx = printCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, printCanvas.width, printCanvas.height);
      ctx.fillStyle = shirtInk;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 96px Arial";
      ctx.fillText(artMark, printCanvas.width / 2, printCanvas.height / 2);
    }
    const printTexture = new THREE.CanvasTexture(printCanvas);
    printTexture.colorSpace = THREE.SRGBColorSpace;
    printTexture.needsUpdate = true;
    const printMaterial = new THREE.MeshBasicMaterial({ map: printTexture, transparent: true, side: THREE.DoubleSide });
    const printPlane = addMesh(
      new THREE.PlaneGeometry(1.15, 0.48),
      printMaterial,
      [0, 2.95, 0.505],
      [1, 1, 1],
      [0, 0, 0],
      shirt,
    );
    printPlane.castShadow = false;

    // Studio floor.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: "#e6e2da", roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Lighting.
    scene.add(new THREE.HemisphereLight("#fffdf7", "#8f8a82", 2.1));

    const key = new THREE.DirectionalLight("#fffaf1", 3.2);
    key.position.set(4.5, 7.5, 6.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight("#d8e2f2", 1.35);
    fill.position.set(-4.2, 4.2, 4.5);
    scene.add(fill);

    const rim = new THREE.PointLight("#ffffff", 12, 16, 2);
    rim.position.set(0, 4.5, -4.2);
    scene.add(rim);

    // Interaction.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const shirtTargets = [shirtBody, leftSleeve, rightSleeve, printPlane];
    let dragging = false;
    let moved = false;
    let pointerId: number | null = null;
    let previousX = 0;
    let previousY = 0;
    let velocity = 0;
    let targetRotationX = 0;
    let targetRotationY = -0.14;
    let cameraDistance = 8.4;
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
      targetRotationY += dx * 0.0075;
      targetRotationX = THREE.MathUtils.clamp(targetRotationX + dy * 0.0025, -0.12, 0.12);
      velocity = dx * 0.0012;
    };

    const endPointer = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const shouldOpen = !moved && hitShirt(event);
      dragging = false;
      pointerId = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.style.cursor = hover ? "pointer" : "grab";
      if (shouldOpen) openProductRef.current();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.0045, 7.1, 9.8);
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
      velocity *= 0.93;
      root.rotation.y += (targetRotationY - root.rotation.y) * 0.075;
      root.rotation.x += (targetRotationX - root.rotation.x) * 0.075;
      root.position.y = -1.92 + Math.sin(elapsed * 0.7) * 0.008;
      const targetScale = hover ? 1.012 : 1;
      const nextScale = THREE.MathUtils.lerp(root.scale.x, targetScale, 0.1);
      root.scale.setScalar(nextScale);
      camera.position.z += (cameraDistance - camera.position.z) * 0.1;
      camera.lookAt(0, 0.55, 0);
      renderer.render(scene, camera);
    };
    animate();

    const label = document.createElement("div");
    label.textContent = `${productName} · drag to rotate · click garment to explore`;
    label.style.position = "absolute";
    label.style.left = "50%";
    label.style.bottom = "16px";
    label.style.transform = "translateX(-50%)";
    label.style.color = "rgba(20,20,20,.55)";
    label.style.fontSize = "8px";
    label.style.letterSpacing = ".11em";
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
      trouserMaterial.dispose();
      shoeMaterial.dispose();
      shirtMaterial.dispose();
      inkMaterial.dispose();
      printMaterial.dispose();
      printTexture.dispose();
      renderer.dispose();
    };
  }, [shirtTone, shirtInk, artMark, productName]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", minHeight: 620 }}
      aria-label={`Interactive 3D view of ${productName}`}
    />
  );
}
