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
const GARMENT_URL =
  "https://cdn.3dassets.dev/assets/35447/v1/model.glb";

const DEFAULT_CAMERA_DISTANCE = 8.55;
const CAMERA_MIN_DISTANCE = 6.9;
const CAMERA_MAX_DISTANCE = 11.1;

function applyRelaxedHumanPose(model: THREE.Object3D) {
  const rotateBone = (
    boneName: string,
    axis: THREE.Vector3,
    angle: number,
  ) => {
    const bone = model.getObjectByName(boneName);
    if (!(bone instanceof THREE.Bone)) return;

    const delta = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    bone.quaternion.premultiply(delta);
  };

  // Source mannequin is a T-pose. Bring the arms almost vertically down so
  // the silhouette reads as a fashion mannequin, not a rigging reference.
  rotateBone("upper_arm.L", new THREE.Vector3(0, 0, 1), -1.47);
  rotateBone("upper_arm.R", new THREE.Vector3(0, 0, 1), 1.47);

  // Let the wrists fall slightly behind the front garment plane.
  rotateBone("upper_arm.L", new THREE.Vector3(1, 0, 0), 0.06);
  rotateBone("upper_arm.R", new THREE.Vector3(1, 0, 0), 0.06);
  rotateBone("forearm.L", new THREE.Vector3(1, 0, 0), 0.04);
  rotateBone("forearm.R", new THREE.Vector3(1, 0, 0), 0.04);

  const upperSpine = model.getObjectByName("spine.003");
  if (upperSpine instanceof THREE.Bone) {
    upperSpine.rotation.z += 0.008;
    upperSpine.rotation.x -= 0.01;
  }

  const neck = model.getObjectByName("spine.005");
  if (neck instanceof THREE.Bone) {
    neck.rotation.z -= 0.006;
    neck.rotation.y += 0.014;
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
  texture.repeat.set(13, 13);
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

    context.font = "500 34px Arial";
    context.fillText("MAISON AMIRAL", canvas.width / 2, 96);

    context.font = "700 116px Georgia";
    context.fillText(artMark, canvas.width / 2, 252);

    context.font = "500 22px Arial";
    context.fillText(
      "JOHANNESBURG / EDITION 001",
      canvas.width / 2,
      404,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function installGarmentCoverageMask(
  material: THREE.MeshPhysicalMaterial,
  figure: THREE.Object3D,
) {
  const worldToFigure = { value: new THREE.Matrix4() };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.maisonWorldToFigure = worldToFigure;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform mat4 maisonWorldToFigure;
varying vec3 vMaisonFigurePosition;`,
      )
      .replace(
        "#include <project_vertex>",
        `vMaisonFigurePosition = (
  maisonWorldToFigure *
  modelMatrix *
  vec4(transformed, 1.0)
).xyz;
#include <project_vertex>`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vMaisonFigurePosition;`,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>

vec3 maisonP = vMaisonFigurePosition;

vec2 maisonNeck = vec2(
  maisonP.x / 0.19,
  (maisonP.y - 3.08) / 0.12
);

bool maisonNeckOpening =
  dot(maisonNeck, maisonNeck) < 1.0;

// The mannequin is a single skinned mesh. The real garment must own the
// torso silhouette, so hide every body fragment inside the clothing volume
// regardless of depth. This also removes arms that cross in front of the tee.
bool maisonInsideTee =
  abs(maisonP.x) < 0.72 &&
  maisonP.y > 2.08 &&
  maisonP.y < 3.17 &&
  !maisonNeckOpening;

bool maisonInsideSleeves =
  abs(maisonP.x) < 0.86 &&
  maisonP.y > 2.55 &&
  maisonP.y < 3.11 &&
  !maisonNeckOpening;

if (maisonInsideTee || maisonInsideSleeves) {
  discard;
}`,
      );
  };

  material.customProgramCacheKey = () =>
    "maison-real-garment-coverage-v1";
  material.needsUpdate = true;

  return () => {
    figure.updateWorldMatrix(true, false);
    worldToFigure.value.copy(figure.matrixWorld).invert();
  };
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

function findPrimaryGarmentMesh(root: THREE.Object3D) {
  let primary: THREE.Mesh | null = null;
  let primaryScore = -1;

  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;

    const position = node.geometry.getAttribute("position");
    const score = position?.count ?? 0;

    if (score > primaryScore) {
      primaryScore = score;
      primary = node;
    }
  });

  return primary;
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
  const shirtMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(
    null,
  );
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
    let mannequinLoaded = false;
    let garmentLoaded = false;

    const smallScreen = window.matchMedia(
      "(max-width: 700px)",
    ).matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const markReady = () => {
      if (!disposed && mannequinLoaded && garmentLoaded) {
        setIsReady(true);
      }
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e9e5dc");
    scene.fog = new THREE.Fog("#e9e5dc", 9.2, 14.4);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 1.86, DEFAULT_CAMERA_DISTANCE);
    camera.lookAt(0, 1.92, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !smallScreen,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, smallScreen ? 1.15 : 1.5),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const figure = new THREE.Group();
    scene.add(figure);

    const mannequinRoot = new THREE.Group();
    const garmentRoot = new THREE.Group();
    figure.add(mannequinRoot, garmentRoot);

    const mannequinMaterial = new THREE.MeshPhysicalMaterial({
      color: "#c9c2b8",
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.02,
      clearcoatRoughness: 0.95,
      sheen: 0.04,
      sheenColor: new THREE.Color("#e4ded6"),
    });

    const updateCoverageMask = installGarmentCoverageMask(
      mannequinMaterial,
      figure,
    );

    const fabricTexture = createFabricTexture();

    const shirtMaterial = new THREE.MeshPhysicalMaterial({
      color: shirtTone,
      roughness: 0.82,
      metalness: 0,
      sheen: 0.28,
      sheenColor: new THREE.Color(shirtTone),
      sheenRoughness: 0.88,
      clearcoat: 0.008,
      clearcoatRoughness: 1,
      bumpMap: fabricTexture,
      bumpScale: 0.01,
      side: THREE.DoubleSide,
    });

    shirtMaterialRef.current = shirtMaterial;

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
      new THREE.PlaneGeometry(0.56, 0.27),
      printMaterial,
    );
    printPlane.name = "MAISON_PRINT";
    printPlane.position.set(0, 2.57, 0.225);
    garmentRoot.add(printPlane);

    // Invisible interaction volume so the product remains clickable even
    // though the actual garment is loaded asynchronously.
    const hitProxy = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.25, 0.62),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    hitProxy.position.set(0, 2.55, 0);
    garmentRoot.add(hitProxy);

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

    scene.add(
      new THREE.HemisphereLight("#fffdf8", "#827d75", 1.8),
    );

    const key = new THREE.DirectionalLight("#fffaf1", 3.6);
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

    const fill = new THREE.DirectionalLight("#d8dde6", 1.15);
    fill.position.set(-4, 3.8, 3.8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight("#ffffff", 1.55);
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
          node.material = mannequinMaterial;
        });

        const firstBounds = new THREE.Box3().setFromObject(model);
        const firstSize = firstBounds.getSize(new THREE.Vector3());
        const scale = firstSize.y > 0 ? 3.62 / firstSize.y : 1;

        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());

        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= bounds.min.y;
        model.updateMatrixWorld(true);

        mannequinRoot.add(model);

        mannequinLoaded = true;
        markReady();
      },
      undefined,
      () => {
        if (disposed) return;
        setHasError(true);
      },
    );

    loader.load(
      GARMENT_URL,
      (gltf) => {
        if (disposed) return;

        const garmentModel = gltf.scene;
        garmentModel.name = "MAISON_REAL_TEE";

        const primary = findPrimaryGarmentMesh(garmentModel);

        if (!primary) {
          setHasError(true);
          return;
        }

        // This source asset also contains its retail hanger. The largest
        // geometry is the actual shirt, so keep that and remove every helper
        // mesh instead of shipping a hanger through the mannequin's neck.
        garmentModel.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;

          node.visible = node === primary;

          if (node === primary) {
            const originalMaterials = Array.isArray(node.material)
              ? node.material
              : [node.material];

            originalMaterials.forEach((material) =>
              material.dispose(),
            );

            node.material = shirtMaterial;
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        garmentModel.updateMatrixWorld(true);

        const sourceBounds = new THREE.Box3().setFromObject(primary);
        const sourceSize = sourceBounds.getSize(new THREE.Vector3());
        const targetHeight = 1.08;
        const uniformScale =
          sourceSize.y > 0 ? targetHeight / sourceSize.y : 1;

        // Hanging garments are naturally flatter than a worn tee. Expand
        // depth only, keeping the original shoulder and sleeve silhouette.
        garmentModel.scale.set(
          uniformScale,
          uniformScale,
          uniformScale * 2.05,
        );
        garmentModel.updateMatrixWorld(true);

        const fittedBounds = new THREE.Box3().setFromObject(primary);
        const fittedCenter = fittedBounds.getCenter(
          new THREE.Vector3(),
        );

        garmentModel.position.set(
          -fittedCenter.x,
          2.54 - fittedCenter.y,
          -fittedCenter.z,
        );
        garmentModel.updateMatrixWorld(true);

        garmentRoot.add(garmentModel);

        garmentLoaded = true;
        markReady();
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
    const hitTargets: THREE.Object3D[] = [hitProxy];

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
    let idleUntil = performance.now() + 1200;

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();

      pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hitGarment = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);

      return raycaster.intersectObjects(hitTargets, false).length > 0;
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
          renderer.domElement.style.cursor = hover
            ? "pointer"
            : "grab";
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
            cameraDistance +
              (previousPinchDistance - distance) * 0.014,
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
        -0.09,
        0.09,
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

      renderer.domElement.style.cursor = hover
        ? "pointer"
        : "grab";

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
    renderer.domElement.addEventListener(
      "pointerdown",
      onPointerDown,
    );
    renderer.domElement.addEventListener(
      "pointermove",
      onPointerMove,
    );
    renderer.domElement.addEventListener("pointerup", endPointer);
    renderer.domElement.addEventListener(
      "pointercancel",
      endPointer,
    );
    renderer.domElement.addEventListener("wheel", onWheel, {
      passive: false,
    });
    renderer.domElement.addEventListener(
      "dblclick",
      onDoubleClick,
    );
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
        targetRotationY += delta * 0.095;
      }

      targetRotationY += velocityY;
      velocityY *= 0.92;

      figure.rotation.y +=
        (targetRotationY - figure.rotation.y) * 0.075;
      figure.rotation.x +=
        (targetRotationX - figure.rotation.x) * 0.075;

      const targetScale = hover ? 1.003 : 1;
      const nextScale = THREE.MathUtils.lerp(
        figure.scale.x,
        targetScale,
        0.09,
      );
      figure.scale.setScalar(nextScale);

      camera.position.z +=
        (cameraDistance - camera.position.z) * 0.09;
      camera.lookAt(0, 1.92, 0);

      updateCoverageMask();
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
              ? "Human mannequin / real garment mesh"
              : "Loading digital look"}
        </span>
        <span>Drag · pinch · wheel · double-click reset</span>
      </div>
    </div>
  );
}
