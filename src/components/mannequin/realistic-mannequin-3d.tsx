"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type RealisticMannequin3DProps = {
  shirtTone: string;
  shirtInk: string;
  artMark: string;
  productName: string;
  onProductOpen: () => void;
};

const MANNEQUIN_URL =
  "https://cdn.3dassets.dev/assets/35473/v1/model.glb";

function createFabricTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;

  const context = canvas.getContext("2d");
  if (context) {
    const image = context.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const i = (y * canvas.width + x) * 4;
        const weave =
          118 +
          Math.sin(x * 1.34) * 8 +
          Math.cos(y * 1.58) * 8 +
          Math.sin((x + y) * 0.55) * 3;

        image.data[i] = weave;
        image.data[i + 1] = weave;
        image.data[i + 2] = weave;
        image.data[i + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createPrintTexture(artMark: string, ink: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;

  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = ink;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.font = "500 42px Arial";
    context.letterSpacing = "12px";
    context.fillText("MAISON AMIRAL", canvas.width / 2, 94);

    context.font = "700 138px Georgia";
    context.letterSpacing = "4px";
    context.fillText(artMark, canvas.width / 2, 255);

    context.font = "500 28px Arial";
    context.letterSpacing = "9px";
    context.fillText("JOHANNESBURG / EDITION 001", canvas.width / 2, 410);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGarmentGeometry() {
  const shape = new THREE.Shape();

  shape.moveTo(-0.2, 0.72);
  shape.lineTo(-0.36, 0.7);
  shape.lineTo(-0.59, 0.55);
  shape.lineTo(-0.77, 0.22);
  shape.lineTo(-0.59, 0.11);
  shape.lineTo(-0.49, 0.26);
  shape.lineTo(-0.43, -0.7);
  shape.lineTo(0.43, -0.7);
  shape.lineTo(0.49, 0.26);
  shape.lineTo(0.59, 0.11);
  shape.lineTo(0.77, 0.22);
  shape.lineTo(0.59, 0.55);
  shape.lineTo(0.36, 0.7);
  shape.lineTo(0.2, 0.72);
  shape.closePath();

  const neck = new THREE.Path();
  neck.absellipse(0, 0.69, 0.2, 0.13, 0, Math.PI * 2, false, 0);
  shape.holes.push(neck);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.62,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    curveSegments: 32,
    steps: 1,
  });

  geometry.translate(0, 0, -0.31);
  geometry.computeVertexNormals();
  return geometry;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;

    node.geometry.dispose();

    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];

    materials.forEach((material) => {
      material.dispose();
    });
  });
}

export function RealisticMannequin3D({
  shirtTone,
  shirtInk,
  artMark,
  productName,
  onProductOpen,
}: RealisticMannequin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const openProductRef = useRef(onProductOpen);
  const shirtMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const printMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const printTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    openProductRef.current = onProductOpen;
  }, [onProductOpen]);

  useEffect(() => {
    const material = shirtMaterialRef.current;
    if (material) {
      material.color.set(shirtTone);
      material.sheenColor.set(shirtTone);
      material.needsUpdate = true;
    }

    const printMaterial = printMaterialRef.current;
    if (printMaterial) {
      const nextTexture = createPrintTexture(artMark, shirtInk);
      const previousTexture = printTextureRef.current;
      printTextureRef.current = nextTexture;
      printMaterial.map = nextTexture;
      printMaterial.needsUpdate = true;
      previousTexture?.dispose();
    }
  }, [artMark, shirtInk, shirtTone]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    const smallScreen = window.matchMedia("(max-width: 700px)").matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e9e5dc");
    scene.fog = new THREE.Fog("#e9e5dc", 7.2, 12);

    const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 40);
    camera.position.set(0, 1.82, 6.7);
    camera.lookAt(0, 1.72, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !smallScreen,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, smallScreen ? 1.2 : 1.55),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const figure = new THREE.Group();
    figure.rotation.y = -0.13;
    scene.add(figure);

    const mannequinRoot = new THREE.Group();
    figure.add(mannequinRoot);

    const fabricTexture = createFabricTexture();
    const shirtMaterial = new THREE.MeshPhysicalMaterial({
      color: shirtTone,
      roughness: 0.78,
      metalness: 0,
      sheen: 0.32,
      sheenColor: new THREE.Color(shirtTone),
      sheenRoughness: 0.8,
      clearcoat: 0.025,
      clearcoatRoughness: 0.9,
      bumpMap: fabricTexture,
      bumpScale: 0.018,
    });

    shirtMaterialRef.current = shirtMaterial;

    const garment = new THREE.Mesh(
      createGarmentGeometry(),
      shirtMaterial,
    );
    garment.name = "MAISON_GARMENT";
    garment.position.set(0, 2.43, 0.015);
    garment.scale.set(0.94, 1, 0.98);
    garment.castShadow = true;
    garment.receiveShadow = true;
    figure.add(garment);

    const initialPrintTexture = createPrintTexture(artMark, shirtInk);
    printTextureRef.current = initialPrintTexture;

    const printMaterial = new THREE.MeshBasicMaterial({
      map: initialPrintTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    printMaterialRef.current = printMaterial;

    const printPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.83, 0.42),
      printMaterial,
    );
    printPlane.name = "MAISON_PRINT";
    printPlane.position.set(0, 2.5, 0.357);
    printPlane.castShadow = false;
    figure.add(printPlane);

    const trouserMaterial = new THREE.MeshStandardMaterial({
      color: "#20201f",
      roughness: 0.9,
      metalness: 0,
    });

    const waist = new THREE.Mesh(
      new THREE.CylinderGeometry(0.47, 0.44, 0.38, 36),
      trouserMaterial,
    );
    waist.scale.z = 0.7;
    waist.position.set(0, 1.58, 0);
    waist.castShadow = true;
    figure.add(waist);

    const trouserLegGeometry = new THREE.CylinderGeometry(
      0.265,
      0.225,
      1.48,
      32,
    );

    [-0.245, 0.245].forEach((x) => {
      const leg = new THREE.Mesh(trouserLegGeometry, trouserMaterial);
      leg.scale.z = 0.72;
      leg.position.set(x, 0.79, 0);
      leg.castShadow = true;
      leg.receiveShadow = true;
      figure.add(leg);
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({
        color: "#ddd8cf",
        roughness: 0.96,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    floor.receiveShadow = true;
    scene.add(floor);

    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 8),
      new THREE.MeshStandardMaterial({
        color: "#e9e5dc",
        roughness: 1,
      }),
    );
    backdrop.position.set(0, 3.1, -2.75);
    backdrop.receiveShadow = true;
    scene.add(backdrop);

    scene.add(new THREE.HemisphereLight("#fffdf8", "#827d75", 1.95));

    const key = new THREE.DirectionalLight("#fffaf1", 4);
    key.position.set(4.2, 6.5, 5.2);
    key.castShadow = true;
    key.shadow.mapSize.set(
      smallScreen ? 512 : 1024,
      smallScreen ? 512 : 1024,
    );
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 15;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -1;
    scene.add(key);

    const fill = new THREE.DirectionalLight("#d7dde8", 1.35);
    fill.position.set(-4, 3.8, 3.8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight("#ffffff", 1.9);
    rim.position.set(0.5, 4.3, -4.5);
    scene.add(rim);

    const loader = new GLTFLoader();
    loader.load(
      MANNEQUIN_URL,
      (gltf) => {
        if (disposed) return;

        const model = gltf.scene;
        model.name = "MAISON_MANNEQUIN_BASE";

        model.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;

          node.castShadow = true;
          node.receiveShadow = true;

          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];

          materials.forEach((material) => {
            if (
              material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.MeshPhysicalMaterial
            ) {
              material.roughness = Math.max(material.roughness, 0.72);
              material.metalness = Math.min(material.metalness, 0.05);
              material.needsUpdate = true;
            }
          });
        });

        const initialBounds = new THREE.Box3().setFromObject(model);
        const initialSize = initialBounds.getSize(new THREE.Vector3());
        const scale = initialSize.y > 0 ? 3.62 / initialSize.y : 1;

        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());

        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= bounds.min.y;
        model.updateMatrixWorld(true);

        mannequinRoot.add(model);
        setIsReady(true);
      },
      undefined,
      () => {
        if (disposed) return;
        setHasError(true);
      },
    );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointers = new Map<number, { x: number; y: number }>();

    let dragging = false;
    let moved = false;
    let pointerDownOnGarment = false;
    let previousX = 0;
    let previousY = 0;
    let previousPinchDistance = 0;
    let velocityY = 0;
    let targetRotationX = 0;
    let targetRotationY = -0.13;
    let cameraDistance = 6.7;
    let hover = false;
    let idleUntil = performance.now() + 900;

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hitGarment = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects([garment, printPlane], false).length > 0;
    };

    const pointerDistance = () => {
      const values = Array.from(pointers.values());
      if (values.length < 2) return 0;
      return Math.hypot(
        values[0].x - values[1].x,
        values[0].y - values[1].y,
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      renderer.domElement.setPointerCapture(event.pointerId);
      idleUntil = performance.now() + 2600;

      if (pointers.size === 1) {
        dragging = true;
        moved = false;
        pointerDownOnGarment = hitGarment(event);
        previousX = event.clientX;
        previousY = event.clientY;
      } else {
        dragging = false;
        moved = true;
        previousPinchDistance = pointerDistance();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) {
        const nextHover = hitGarment(event);

        if (nextHover !== hover) {
          hover = nextHover;
          renderer.domElement.style.cursor = hover ? "pointer" : "grab";
        }
        return;
      }

      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (pointers.size >= 2) {
        const distance = pointerDistance();

        if (previousPinchDistance > 0) {
          cameraDistance = THREE.MathUtils.clamp(
            cameraDistance + (previousPinchDistance - distance) * 0.012,
            5.25,
            8.4,
          );
        }

        previousPinchDistance = distance;
        return;
      }

      if (!dragging) return;

      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;

      if (Math.abs(dx) + Math.abs(dy) > 3) {
        moved = true;
      }

      previousX = event.clientX;
      previousY = event.clientY;

      targetRotationY += dx * 0.007;
      targetRotationX = THREE.MathUtils.clamp(
        targetRotationX + dy * 0.0022,
        -0.11,
        0.11,
      );
      velocityY = dx * 0.001;
    };

    const endPointer = (event: PointerEvent) => {
      const wasTracked = pointers.has(event.pointerId);
      if (!wasTracked) return;

      const shouldOpen =
        pointers.size === 1 &&
        pointerDownOnGarment &&
        !moved &&
        hitGarment(event);

      pointers.delete(event.pointerId);
      dragging = false;
      previousPinchDistance = pointerDistance();

      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }

      renderer.domElement.style.cursor = hover ? "pointer" : "grab";

      if (shouldOpen) {
        openProductRef.current();
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      idleUntil = performance.now() + 2200;
      cameraDistance = THREE.MathUtils.clamp(
        cameraDistance + event.deltaY * 0.004,
        5.25,
        8.4,
      );
    };

    const onDoubleClick = () => {
      targetRotationX = 0;
      targetRotationY = -0.13;
      cameraDistance = 6.7;
      idleUntil = performance.now() + 1800;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) setHasError(true);
    };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", endPointer);
    renderer.domElement.addEventListener("pointercancel", endPointer);
    renderer.domElement.addEventListener("wheel", onWheel, {
      passive: false,
    });
    renderer.domElement.addEventListener("dblclick", onDoubleClick);
    renderer.domElement.addEventListener(
      "webglcontextlost",
      onContextLost,
      false,
    );

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let inViewport = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
      },
      { rootMargin: "180px" },
    );
    visibilityObserver.observe(mount);

    const clock = new THREE.Clock();
    let frame = 0;

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (!inViewport) return;

      if (
        !reduceMotion &&
        !dragging &&
        pointers.size === 0 &&
        performance.now() > idleUntil
      ) {
        targetRotationY += delta * 0.13;
      }

      targetRotationY += velocityY;
      velocityY *= 0.92;

      figure.rotation.y +=
        (targetRotationY - figure.rotation.y) * 0.075;
      figure.rotation.x +=
        (targetRotationX - figure.rotation.x) * 0.075;

      const targetScale = hover ? 1.008 : 1;
      const nextScale = THREE.MathUtils.lerp(
        figure.scale.x,
        targetScale,
        0.09,
      );
      figure.scale.setScalar(nextScale);

      camera.position.z +=
        (cameraDistance - camera.position.z) * 0.09;
      camera.lookAt(0, 1.72, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();

      renderer.domElement.removeEventListener(
        "pointerdown",
        onPointerDown,
      );
      renderer.domElement.removeEventListener(
        "pointermove",
        onPointerMove,
      );
      renderer.domElement.removeEventListener(
        "pointerup",
        endPointer,
      );
      renderer.domElement.removeEventListener(
        "pointercancel",
        endPointer,
      );
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener(
        "dblclick",
        onDoubleClick,
      );
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      printTextureRef.current?.dispose();
      printTextureRef.current = null;
      shirtMaterialRef.current = null;
      printMaterialRef.current = null;

      fabricTexture.dispose();
      trouserLegGeometry.dispose();
      trouserMaterial.dispose();
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 520,
        position: "relative",
        overflow: "hidden",
        background: "#e9e5dc",
      }}
    >
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%" }}
        aria-label={`Interactive 3D view of ${productName}`}
      />

      <div
        aria-live="polite"
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          pointerEvents: "none",
          color: "rgba(24,24,22,.55)",
          fontSize: 8,
          letterSpacing: ".11em",
          textTransform: "uppercase",
        }}
      >
        <span>
          {hasError
            ? "3D preview unavailable"
            : isReady
              ? "GLB figure / live material"
              : "Loading digital look"}
        </span>
        <span>Drag · pinch · wheel · double-click reset</span>
      </div>
    </div>
  );
}
