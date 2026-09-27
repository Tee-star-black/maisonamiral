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

const MANNEQUIN_URL = "/models/maison-human-mannequin.glb";
const DEFAULT_CAMERA_DISTANCE = 8.9;
const CAMERA_MIN_DISTANCE = 7.2;
const CAMERA_MAX_DISTANCE = 11.2;

function applyRelaxedHumanPose(model: THREE.Object3D) {
  const rotateInParentSpace = (
    boneName: string,
    axis: THREE.Vector3,
    angle: number,
  ) => {
    const bone = model.getObjectByName(boneName);
    if (!(bone instanceof THREE.Bone)) return;

    const delta = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    bone.quaternion.premultiply(delta);
  };

  // Lower both arms from the source T-pose.
  rotateInParentSpace(
    "upper_arm.L",
    new THREE.Vector3(0, 0, 1),
    -1.17,
  );
  rotateInParentSpace(
    "upper_arm.R",
    new THREE.Vector3(0, 0, 1),
    1.17,
  );

  // Keep the arms slightly behind the shirt plane so the garment reads
  // cleanly from the front and avoids the clipping seen in the first pass.
  rotateInParentSpace(
    "upper_arm.L",
    new THREE.Vector3(1, 0, 0),
    0.18,
  );
  rotateInParentSpace(
    "upper_arm.R",
    new THREE.Vector3(1, 0, 0),
    0.18,
  );
  rotateInParentSpace(
    "forearm.L",
    new THREE.Vector3(1, 0, 0),
    0.1,
  );
  rotateInParentSpace(
    "forearm.R",
    new THREE.Vector3(1, 0, 0),
    0.1,
  );

  const upperSpine = model.getObjectByName("spine.003");
  if (upperSpine instanceof THREE.Bone) {
    upperSpine.rotation.z += 0.009;
    upperSpine.rotation.x -= 0.012;
  }

  const neck = model.getObjectByName("spine.005");
  if (neck instanceof THREE.Bone) {
    neck.rotation.z -= 0.008;
    neck.rotation.y += 0.018;
  }

  model.updateMatrixWorld(true);
}

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
  texture.repeat.set(12, 12);
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

    context.font = "500 38px Arial";
    context.fillText("MAISON AMIRAL", canvas.width / 2, 92);

    context.font = "700 126px Georgia";
    context.fillText(artMark, canvas.width / 2, 252);

    context.font = "500 24px Arial";
    context.fillText("JOHANNESBURG / EDITION 001", canvas.width / 2, 406);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGarmentBodyGeometry() {
  const shape = new THREE.Shape();

  shape.moveTo(-0.18, 0.72);
  shape.lineTo(-0.34, 0.66);
  shape.lineTo(-0.41, 0.5);
  shape.lineTo(-0.39, -0.52);
  shape.lineTo(0.39, -0.52);
  shape.lineTo(0.41, 0.5);
  shape.lineTo(0.34, 0.66);
  shape.lineTo(0.18, 0.72);
  shape.closePath();

  const neck = new THREE.Path();
  neck.absellipse(0, 0.61, 0.16, 0.085, 0, Math.PI * 2, false, 0);
  shape.holes.push(neck);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 24,
    steps: 1,
  });

  geometry.translate(0, 0, -0.11);
  geometry.computeVertexNormals();
  return geometry;
}

function createSleeveGeometry() {
  const geometry = new THREE.CylinderGeometry(
    0.16,
    0.145,
    0.34,
    24,
    1,
    false,
  );
  geometry.scale(1, 1, 0.68);
  geometry.computeVertexNormals();
  return geometry;
}

function pointToSegmentDistance(
  point: THREE.Vector3,
  start: THREE.Vector3,
  end: THREE.Vector3,
) {
  const segment = end.clone().sub(start);
  const denominator = segment.lengthSq();
  if (denominator === 0) return point.distanceTo(start);

  const t = THREE.MathUtils.clamp(
    point.clone().sub(start).dot(segment) / denominator,
    0,
    1,
  );
  const closest = start.clone().add(segment.multiplyScalar(t));
  return point.distanceTo(closest);
}

function isCoveredByGarment(point: THREE.Vector3) {
  const neckOpening =
    Math.abs(point.x) < 0.17 &&
    point.y > 2.98 &&
    Math.abs(point.z) < 0.2;

  const torso =
    Math.abs(point.x) < 0.43 &&
    point.y > 1.95 &&
    point.y < 3.13 &&
    Math.abs(point.z) < 0.24 &&
    !neckOpening;

  const leftUpperArm =
    pointToSegmentDistance(
      point,
      new THREE.Vector3(-0.35, 3.02, 0),
      new THREE.Vector3(-0.58, 2.67, 0),
    ) < 0.17;

  const rightUpperArm =
    pointToSegmentDistance(
      point,
      new THREE.Vector3(0.35, 3.02, 0),
      new THREE.Vector3(0.58, 2.67, 0),
    ) < 0.17;

  return torso || leftUpperArm || rightUpperArm;
}

function trimBodyUnderGarment(mesh: THREE.SkinnedMesh) {
  const geometry = mesh.geometry.clone();
  const position = geometry.getAttribute("position");
  const sourceIndex = geometry.getIndex();

  if (!position) return;

  mesh.geometry = geometry;
  mesh.updateMatrixWorld(true);

  const triangleCount = sourceIndex
    ? sourceIndex.count / 3
    : position.count / 3;
  const kept: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  const readVertex = (index: number, target: THREE.Vector3) => {
    target.fromBufferAttribute(position, index);
    mesh.applyBoneTransform(index, target);
    target.applyMatrix4(mesh.matrixWorld);
  };

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const i0 = sourceIndex
      ? sourceIndex.getX(triangle * 3)
      : triangle * 3;
    const i1 = sourceIndex
      ? sourceIndex.getX(triangle * 3 + 1)
      : triangle * 3 + 1;
    const i2 = sourceIndex
      ? sourceIndex.getX(triangle * 3 + 2)
      : triangle * 3 + 2;

    readVertex(i0, a);
    readVertex(i1, b);
    readVertex(i2, d);

    centroid.copy(a).add(b).add(d).multiplyScalar(1 / 3);

    if (!isCoveredByGarment(centroid)) {
      kept.push(i0, i1, i2);
    }
  }

  geometry.setIndex(kept);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function disposeObject(object: THREE.Object3D) {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();

  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;

    if (!disposedGeometries.has(node.geometry)) {
      disposedGeometries.add(node.geometry);
      node.geometry.dispose();
    }

    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];

    materials.forEach((material) => {
      if (disposedMaterials.has(material)) return;
      disposedMaterials.add(material);
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
    scene.fog = new THREE.Fog("#e9e5dc", 9.2, 14.2);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 1.86, DEFAULT_CAMERA_DISTANCE);
    camera.lookAt(0, 1.95, 0);

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
    figure.rotation.y = 0;
    scene.add(figure);

    const mannequinRoot = new THREE.Group();
    figure.add(mannequinRoot);

    const mannequinMaterial = new THREE.MeshPhysicalMaterial({
      color: "#c8c0b5",
      roughness: 0.6,
      metalness: 0,
      clearcoat: 0.025,
      clearcoatRoughness: 0.92,
      sheen: 0.06,
      sheenColor: new THREE.Color("#e1dbd2"),
    });

    const fabricTexture = createFabricTexture();
    const shirtMaterial = new THREE.MeshPhysicalMaterial({
      color: shirtTone,
      roughness: 0.82,
      metalness: 0,
      sheen: 0.22,
      sheenColor: new THREE.Color(shirtTone),
      sheenRoughness: 0.88,
      clearcoat: 0.01,
      clearcoatRoughness: 1,
      bumpMap: fabricTexture,
      bumpScale: 0.012,
    });

    shirtMaterialRef.current = shirtMaterial;

    const garment = new THREE.Mesh(
      createGarmentBodyGeometry(),
      shirtMaterial,
    );
    garment.name = "MAISON_GARMENT_BODY";
    garment.position.set(0, 2.48, 0);
    garment.castShadow = true;
    garment.receiveShadow = true;
    figure.add(garment);

    const sleeveGeometry = createSleeveGeometry();

    const leftSleeve = new THREE.Mesh(sleeveGeometry, shirtMaterial);
    leftSleeve.name = "MAISON_GARMENT_SLEEVE_LEFT";
    leftSleeve.position.set(-0.47, 2.9, 0);
    leftSleeve.rotation.z = 0.68;
    leftSleeve.rotation.y = 0.08;
    leftSleeve.castShadow = true;
    leftSleeve.receiveShadow = true;
    figure.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeometry, shirtMaterial);
    rightSleeve.name = "MAISON_GARMENT_SLEEVE_RIGHT";
    rightSleeve.position.set(0.47, 2.9, 0);
    rightSleeve.rotation.z = -0.68;
    rightSleeve.rotation.y = -0.08;
    rightSleeve.castShadow = true;
    rightSleeve.receiveShadow = true;
    figure.add(rightSleeve);

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
      new THREE.PlaneGeometry(0.61, 0.3),
      printMaterial,
    );
    printPlane.name = "MAISON_PRINT";
    printPlane.position.set(0, 2.6, 0.126);
    printPlane.castShadow = false;
    figure.add(printPlane);

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
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshStandardMaterial({
        color: "#e9e5dc",
        roughness: 1,
      }),
    );
    backdrop.position.set(0, 3.1, -3.2);
    backdrop.receiveShadow = true;
    scene.add(backdrop);

    scene.add(new THREE.HemisphereLight("#fffdf8", "#827d75", 1.85));

    const key = new THREE.DirectionalLight("#fffaf1", 3.7);
    key.position.set(4.2, 6.5, 5.2);
    key.castShadow = true;
    key.shadow.mapSize.set(
      smallScreen ? 512 : 1024,
      smallScreen ? 512 : 1024,
    );
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 16;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -1;
    scene.add(key);

    const fill = new THREE.DirectionalLight("#d7dde8", 1.2);
    fill.position.set(-4, 3.8, 3.8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight("#ffffff", 1.6);
    rim.position.set(0.5, 4.3, -4.5);
    scene.add(rim);

    const loader = new GLTFLoader();
    loader.load(
      MANNEQUIN_URL,
      (gltf) => {
        if (disposed) return;

        const model = gltf.scene;
        model.name = "MAISON_HUMAN_MANNEQUIN";

        applyRelaxedHumanPose(model);

        model.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;

          node.castShadow = true;
          node.receiveShadow = true;

          const sourceMaterials = Array.isArray(node.material)
            ? node.material
            : [node.material];

          sourceMaterials.forEach((material) => material.dispose());

          if (node instanceof THREE.SkinnedMesh) {
            trimBodyUnderGarment(node);
          }

          node.material = mannequinMaterial;
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
    const garmentHitTargets = [
      garment,
      leftSleeve,
      rightSleeve,
      printPlane,
    ];

    let dragging = false;
    let moved = false;
    let pointerDownOnGarment = false;
    let previousX = 0;
    let previousY = 0;
    let previousPinchDistance = 0;
    let velocityY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let cameraDistance = DEFAULT_CAMERA_DISTANCE;
    let hover = false;
    let idleUntil = performance.now() + 1100;

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hitGarment = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      return (
        raycaster.intersectObjects(garmentHitTargets, false).length > 0
      );
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
            cameraDistance + (previousPinchDistance - distance) * 0.014,
            CAMERA_MIN_DISTANCE,
            CAMERA_MAX_DISTANCE,
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
        targetRotationX + dy * 0.002,
        -0.095,
        0.095,
      );
      velocityY = dx * 0.001;
    };

    const endPointer = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;

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
        cameraDistance + event.deltaY * 0.0045,
        CAMERA_MIN_DISTANCE,
        CAMERA_MAX_DISTANCE,
      );
    };

    const onDoubleClick = () => {
      targetRotationX = 0;
      targetRotationY = 0;
      cameraDistance = DEFAULT_CAMERA_DISTANCE;
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
        targetRotationY += delta * 0.105;
      }

      targetRotationY += velocityY;
      velocityY *= 0.92;

      figure.rotation.y +=
        (targetRotationY - figure.rotation.y) * 0.075;
      figure.rotation.x +=
        (targetRotationX - figure.rotation.x) * 0.075;

      const targetScale = hover ? 1.004 : 1;
      const nextScale = THREE.MathUtils.lerp(
        figure.scale.x,
        targetScale,
        0.09,
      );
      figure.scale.setScalar(nextScale);

      camera.position.z +=
        (cameraDistance - camera.position.z) * 0.09;
      camera.lookAt(0, 1.95, 0);

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

      mannequinMaterial.dispose();
      fabricTexture.dispose();
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
              ? "Human mannequin / fitted garment"
              : "Loading digital look"}
        </span>
        <span>Drag · pinch · wheel · double-click reset</span>
      </div>
    </div>
  );
}
