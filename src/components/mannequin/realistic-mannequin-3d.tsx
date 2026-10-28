"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { products, type GarmentPrint } from "@/data/products";

type Props = {
  shirtTone: string;
  productName: string;
  productSlug: string;
  view: { angle: number; revision: number };
  zoom: number;
  rotating: boolean;
  onUnavailable: (unavailable: boolean) => void;
  onInteract: () => void;
};

// One continuous front and back surface includes the shoulders and sleeves.
// The sleeve/underarm transitions are part of the garment, not separate cylinders.
function silhouette(x: number) {
  const a = Math.abs(x);
  const top =
    a < 0.09
      ? 1.51 - 0.065 * Math.sqrt(1 - (a / 0.09) ** 2)
      : a < 0.27
        ? 1.51 - (a - 0.09) * 0.16
        : 1.4812 - (a - 0.27) * 0.8;
  const bottom =
    a <= 0.245
      ? 0.88 + 0.012 * Math.cos(x * 10)
      : a < 0.28
        ? THREE.MathUtils.lerp(0.89, 1.245, (a - 0.245) / 0.035)
        : 1.245 - (a - 0.28) * 0.47;
  return { top, bottom };
}
function clothDepth(x: number, y: number) {
  const a = Math.abs(x);
  const torso = Math.sqrt(Math.max(0.08, 1 - (a / 0.31) ** 2));
  const { top, bottom } = silhouette(x);
  const t = THREE.MathUtils.clamp((y - bottom) / (top - bottom), 0, 1);
  const sleeve = 0.035 + 0.05 * Math.sin(t * Math.PI);
  const drape = 0.003 * Math.sin(34 * x + 6 * y) * Math.pow(1 - t, 1.5);
  const sideFold = 0.0045 * Math.sin(19 * y + 28 * a) * THREE.MathUtils.smoothstep(a, 0.17, 0.31);
  const body =
    0.12 * torso + 0.007 * Math.sin(y * 24 + x * 35) * (Math.abs(x) / 0.3) ** 2 + drape + sideFold;
  return THREE.MathUtils.lerp(
    body,
    sleeve,
    THREE.MathUtils.smoothstep(a, 0.245, 0.31),
  );
}
function garmentGeometry() {
  const nx = 120,
    ny = 60;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (const side of [1, -1]) {
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const x = (i / nx - 0.5) * 0.88;
        const { top, bottom } = silhouette(x);
        const y = THREE.MathUtils.lerp(bottom, top, j / ny);
        positions.push(x, y, side * clothDepth(x, y));
        uvs.push(i / nx, j / ny);
      }
  }
  const panel = (nx + 1) * (ny + 1);
  for (let side = 0; side < 2; side++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const a = side * panel + j * (nx + 1) + i,
          b = a + nx + 1;
        if (side === 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
  // Join the front/back at the shoulder; leave the neck, cuffs and hem open.
  for (let i = 0; i < nx; i++) {
    const x = (i / nx - 0.5) * 0.88;
    if (Math.abs(x) < 0.095) continue;
    const a = ny * (nx + 1) + i;
    indices.push(a, a + panel, a + 1, a + 1, a + panel, a + panel + 1);
  }
  // Close the side seams and underarms, retaining open sleeve cuffs and hem.
  for (let i = 0; i < nx; i++) {
    const x = ((i + 0.5) / nx - 0.5) * 0.88;
    if (Math.abs(x) < 0.245) continue;
    indices.push(i, i + 1, i + panel, i + 1, i + panel + 1, i + panel);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function RealisticMannequin3D(props: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  useEffect(() => {
    current.current = props;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      current.current.onUnavailable(true);
      return;
    }
    const canvas = renderer.domElement;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0xf4f3ef, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.style.cssText =
      "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "3D mannequin. Left and right arrow keys rotate the garment. Home resets the view.",
    );
    mount.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 1.37, 5);
    camera.lookAt(0, 1.03, 0);
    const root = new THREE.Group();
    scene.add(root);
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    function material<T extends THREE.Material>(value: T): T {
      materials.add(value);
      return value;
    }
    const ceramic = material(
      new THREE.MeshPhysicalMaterial({
        color: "#b9b5aa",
        roughness: 0.48,
        metalness: 0.03,
      }),
    );
    const metal = material(
      new THREE.MeshStandardMaterial({
        color: "#66635c",
        roughness: 0.4,
        metalness: 0.75,
      }),
    );
    // Repeatable neutral weave adds scale-dependent tactile detail without external assets.
    // A seeded pattern avoids flicker and the smooth plastic appearance of flat materials.
    const weaveSize = 128;
    const weave = new Uint8Array(weaveSize * weaveSize * 4);
    for (let y = 0; y < weaveSize; y++) {
      for (let x = 0; x < weaveSize; x++) {
        const index = (y * weaveSize + x) * 4;
        const warp = Math.cos(x * Math.PI / 2);
        const weft = Math.cos(y * Math.PI / 2);
        const grain = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const value = Math.round(126 + 21 * warp * weft + 6 * grain);
        weave[index] = value;
        weave[index + 1] = value;
        weave[index + 2] = value;
        weave[index + 3] = 255;
      }
    }
    const fabricBump = new THREE.DataTexture(weave, weaveSize, weaveSize, THREE.RGBAFormat);
    fabricBump.wrapS = fabricBump.wrapT = THREE.RepeatWrapping;
    fabricBump.repeat.set(10, 15);
    fabricBump.magFilter = THREE.LinearFilter;
    fabricBump.minFilter = THREE.LinearMipmapLinearFilter;
    fabricBump.generateMipmaps = true;
    fabricBump.needsUpdate = true;
    textures.add(fabricBump);
    const cloth = material(
      new THREE.MeshPhysicalMaterial({
        color: current.current.shirtTone,
        roughness: 0.98,
        sheen: 0.32,
        sheenRoughness: 0.88,
        bumpMap: fabricBump,
        bumpScale: 0.008,
        side: THREE.DoubleSide,
      }),
    );
    function mesh(
      geometry: THREE.BufferGeometry,
      mat: THREE.Material,
      parent: THREE.Object3D = root,
    ) {
      const object = new THREE.Mesh(geometry, mat);
      object.castShadow = true;
      object.receiveShadow = true;
      parent.add(object);
      return object;
    }
    // A sculpted display bust has one silhouette and one finish throughout.
    const profile = [
      [0.16, 0.79],
      [0.2, 0.81],
      [0.23, 0.88],
      [0.235, 1.02],
      [0.24, 1.23],
      [0.25, 1.38],
      [0.23, 1.45],
      [0.12, 1.49],
      [0.073, 1.52],
      [0.068, 1.6],
      [0.065, 1.61],
    ];
    // A desaturated textile studio is deliberately kept subordinate to the shirt.
    const form = mesh(
      new THREE.LatheGeometry(
        profile.map(([r, y]) => new THREE.Vector2(r, y)),
        64,
      ),
      ceramic,
    );
    form.scale.z = 0.38;
    const neckCap = mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.006, 48),
      ceramic,
    );
    neckCap.position.y = 1.61;
    neckCap.scale.z = 0.38;
    const stand = mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.36, 24),
      metal,
    );
    stand.position.y = 0.62;
    const foot = mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.025, 64), metal);
    foot.position.y = 0.45;
    const garment = mesh(garmentGeometry(), cloth);
    garment.receiveShadow = true;
    // The hem and neckline are stitched into the same curved surface.
    const seamMat = material(
      new THREE.MeshStandardMaterial({
        color: current.current.shirtTone,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    function seam(points: THREE.Vector3[], radius: number) {
      return mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          100,
          radius,
          6,
          false,
        ),
        seamMat,
      );
    }
    for (const side of [1, -1]) {
      const hem: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const x = -0.244 + (i / 64) * 0.488;
        const y = silhouette(x).bottom + 0.008;
        hem.push(new THREE.Vector3(x, y, side * (clothDepth(x, y) + 0.001)));
      }
      seam(hem, 0.002);
      const collar: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const x = -0.09 + (i / 64) * 0.18;
        const y = silhouette(x).top;
        collar.push(new THREE.Vector3(x, y, side * clothDepth(x, y)));
      }
      seam(collar, 0.007);
    }
    // Sleeve openings have visible fabric thickness, without end caps.
    for (const side of [-1, 1]) {
      const x = side * 0.44,
        { top, bottom } = silhouette(x);
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        const y = (top + bottom) / 2 + (Math.cos(t) * (top - bottom)) / 2;
        points.push(new THREE.Vector3(x, y, Math.sin(t) * clothDepth(x, y)));
      }
      seam(points, 0.003);
    }
    // Each decal is cut from the matching user-supplied shirt photograph.
    // The alpha channel removes the black fabric, leaving only the original ink.
    const artworkGroups = new Map<string, THREE.Group>();
    let disposed = false;
    const loader = new THREE.TextureLoader();

    function print(spec: GarmentPrint, side: 1 | -1, group: THREE.Group) {
      const decalRef: { current?: THREE.Mesh } = {};
      const texture = loader.load(
        spec.src,
        () => { if (disposed) texture.dispose(); },
        undefined,
        // A missing photo must not disable the entire 3D experience.
        () => { if (decalRef.current) decalRef.current.visible = false; },
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.add(texture);

      const geometry = new THREE.PlaneGeometry(spec.width, spec.height, 40, 40);
      const position = geometry.getAttribute("position");
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i) + spec.centerY;
        position.setXYZ(i, side * x, y, side * (clothDepth(x, y) + 0.0028));
      }
      geometry.computeVertexNormals();
      const printMat = material(new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.018,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }));
      decalRef.current = mesh(geometry, printMat, group);
      decalRef.current.castShadow = false;
      decalRef.current.receiveShadow = false;
    }

    for (const item of products) {
      const group = new THREE.Group();
      root.add(group);
      artworkGroups.set(item.slug, group);
      if (item.artwork?.front) print(item.artwork.front, 1, group);
      if (item.artwork?.back) print(item.artwork.back, -1, group);
    }
    const floor = mesh(
      new THREE.PlaneGeometry(200, 200),
      material(new THREE.ShadowMaterial({ opacity: 0.12 })),
      scene,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.435;
    floor.castShadow = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa6a39b, 2.4));
    const key = new THREE.DirectionalLight(0xfff8ed, 3.1);
    key.position.set(-3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -2;
    key.shadow.camera.right = 2;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -2;
    key.shadow.normalBias = 0.015;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8ebe6, 1.1);
    fill.position.set(3, 2, 1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xf8f5ec, 1.3);
    rim.position.set(0, 3, -3);
    scene.add(rim);
    let targetAngle = 0,
      lastRevision = -1,
      lastTone = "",
      visible = true;
    let pointerId: number | null = null,
      startX = 0,
      startY = 0,
      startAngle = 0;
    let span = 1;
    const resize = () => {
      const w = Math.max(1, mount.clientWidth),
        h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      span = Math.max(0.77, 0.52 / aspect);
      camera.left = -span * aspect;
      camera.right = span * aspect;
      camera.top = span;
      camera.bottom = -span;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    intersection.observe(mount);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startAngle = targetAngle;
      current.current.onInteract();
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (
        Math.abs(event.clientY - startY) > Math.abs(event.clientX - startX) &&
        event.pointerType === "touch"
      )
        return;
      targetAngle = startAngle + (event.clientX - startX) * 0.009;
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = "grab";
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
      event.preventDefault();
      current.current.onInteract();
      targetAngle =
        event.key === "Home"
          ? 0
          : targetAngle + (event.key === "ArrowLeft" ? -0.18 : 0.18);
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      current.current.onUnavailable(true);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("lostpointercapture", end);
    canvas.addEventListener("keydown", keyboard);
    canvas.addEventListener("webglcontextlost", contextLost);
    let frame = 0,
      previous = 0;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!visible || document.hidden) return;
      const state = current.current;
      if (state.view.revision !== lastRevision) {
        targetAngle = state.view.angle;
        lastRevision = state.view.revision;
      }
      if (state.shirtTone !== lastTone) {
        cloth.color.set(state.shirtTone);
        seamMat.color.set(state.shirtTone);
        lastTone = state.shirtTone;
      }
      artworkGroups.forEach((group, slug) => {
        group.visible = slug === state.productSlug;
      });
      if (state.rotating && !reduced.matches && pointerId === null)
        targetAngle += dt * 0.28;
      const blend = reduced.matches ? 1 : 1 - Math.exp(-dt * 10);
      root.rotation.y += (targetAngle - root.rotation.y) * blend;
      camera.zoom += (state.zoom - camera.zoom) * blend;
      const focusY = 1.03 + ((camera.zoom - 1) / 0.75) * 0.21;
      camera.position.y = focusY + 0.34;
      camera.lookAt(0, focusY, 0);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
      canvas.removeEventListener("lostpointercapture", end);
      canvas.removeEventListener("keydown", keyboard);
      canvas.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%" }}
      aria-label={`${props.productName} on a studio mannequin`}
    />
  );
}
