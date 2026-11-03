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

// Continuous anatomical torso surface, with actual rounded volume and a neck opening.
// The previous front/back sheet stretched and flattened during rotation.
function shirtRadius(y: number) {
  const sections = [
    { y: 0.88, x: 0.242, z: 0.130 },
    { y: 0.97, x: 0.242, z: 0.130 },
    { y: 1.10, x: 0.235, z: 0.138 },
    { y: 1.25, x: 0.248, z: 0.153 },
    { y: 1.37, x: 0.245, z: 0.145 },
    { y: 1.435, x: 0.192, z: 0.107 },
    { y: 1.48, x: 0.088, z: 0.073 },
  ];
  for (let i = 1; i < sections.length; i++) {
    if (y <= sections[i].y) {
      const p = sections[i - 1], n = sections[i];
      const t = THREE.MathUtils.smoothstep(y, p.y, n.y);
      return { x: THREE.MathUtils.lerp(p.x, n.x, t),
        z: THREE.MathUtils.lerp(p.z, n.z, t) };
    }
  }
  return { x: 0.088, z: 0.073 };
}
function clothDepth(x: number, y: number) {
  const shape = shirtRadius(THREE.MathUtils.clamp(y, 0.88, 1.48));
  const ratio = THREE.MathUtils.clamp(x / shape.x, -0.99, 0.99);
  return shape.z * Math.sqrt(1 - ratio * ratio) +
    0.0015 * Math.sin(x * 35 + y * 27) * THREE.MathUtils.smoothstep(y, 0.88, 1.05);
}
function garmentGeometry() {
  const segments = 96, rings = 72;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let j = 0; j <= rings; j++) {
    const y = THREE.MathUtils.lerp(0.88, 1.48, j / rings);
    const radius = shirtRadius(y);
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.sin(theta) * radius.x;
      const z = Math.cos(theta) * radius.z;
      const drape = 0.002 * Math.sin(y * 24 + theta * 5) * (1 - j / rings);
      positions.push(x + drape, y, z);
      uvs.push(i / segments, j / rings);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i;
      const b = a + segments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function sleeveGeometry(side: number) {
  // A true tapered tube runs from shoulder into the sleeve opening,
  // avoiding the disconnected flat-sleeve silhouette of the old model.
  const start = new THREE.Vector3(side * 0.207, 1.425, 0);
  const end = new THREE.Vector3(side * 0.410, 1.265, 0);
  const axis = end.clone().sub(start);
  const g = new THREE.CylinderGeometry(0.093, 0.078, axis.length(), 48, 10, true);
  // Cylinder top is the smaller shoulder end; local y+ points toward shoulder.
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), start.clone().sub(end).normalize());
  g.applyQuaternion(q);
  g.translate((start.x + end.x) / 2, (start.y + end.y) / 2, 0);
  return g;
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
    camera.position.set(0, 1.53, 5);
    camera.lookAt(0, 1.18, 0);
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
        color: "#c4c4c1",
        roughness: 0.72,
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
        sheen: 0.18,
        sheenRoughness: 0.88,
        bumpMap: fabricBump,
        bumpScale: 0.0018,
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
    // Keep the torso inside the garment while giving the exposed neck an oval profile.
    const formPositions = form.geometry.getAttribute("position");
    for (let i = 0; i < formPositions.count; i++) {
      const neck = THREE.MathUtils.smoothstep(formPositions.getY(i), 1.48, 1.54);
      formPositions.setZ(i, formPositions.getZ(i) * THREE.MathUtils.lerp(0.38, 0.78, neck));
    }
    form.geometry.computeVertexNormals();
    // Anatomical shop mannequin: head, neck and relaxed arms are real 3D volumes.
    // The exposed parts remain matte ceramic; the T-shirt hides the shoulder joints.
    const head = mesh(new THREE.SphereGeometry(1, 48, 36), ceramic);
    head.position.set(0, 1.785, 0.002);
    head.scale.set(0.105, 0.143, 0.092);
    const jaw = mesh(new THREE.SphereGeometry(1, 36, 24), ceramic);
    jaw.position.set(0, 1.716, 0.026);
    jaw.scale.set(0.078, 0.072, 0.080);
    // Deliberately blank face, as on a professional retail display form.
    const neck = mesh(new THREE.CylinderGeometry(0.066, 0.078, 0.19, 40), ceramic);
    neck.position.set(0, 1.613, 0.0);
    neck.scale.z = 0.82;
    for (const side of [-1, 1]) {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.375, 1.275, 0.0);
      armGroup.rotation.z = side * 0.08;
      root.add(armGroup);
      const upperArm = mesh(new THREE.CylinderGeometry(0.063, 0.053, 0.255, 32), ceramic, armGroup);
      upperArm.position.y = -0.13;
      upperArm.scale.z = 0.82;
      const elbow = mesh(new THREE.SphereGeometry(0.054, 24, 16), ceramic, armGroup);
      elbow.position.y = -0.257;
      elbow.scale.z = 0.84;
      const forearm = mesh(new THREE.CylinderGeometry(0.052, 0.032, 0.24, 32), ceramic, armGroup);
      forearm.position.set(side * 0.006, -0.375, 0.009);
      forearm.scale.z = 0.86;
      const hand = mesh(new THREE.SphereGeometry(1, 24, 20), ceramic, armGroup);
      hand.position.set(side * 0.012, -0.545, 0.014);
      hand.scale.set(0.035, 0.094, 0.030);
    }
    const neckCap = mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.006, 48),
      ceramic,
    );
    neckCap.position.y = 1.61;
    neckCap.scale.z = 0.78;
    const stand = mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.36, 24),
      metal,
    );
    stand.position.y = 0.62;
    const foot = mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.025, 64), metal);
    foot.position.y = 0.45;
    const garment = mesh(garmentGeometry(), cloth);
    garment.receiveShadow = true;
    const seamMat = material(new THREE.MeshStandardMaterial({
      color: current.current.shirtTone,
      roughness: 0.92,
      side: THREE.DoubleSide,
    }));
    for (const side of [-1, 1]) mesh(sleeveGeometry(side), cloth);
    // Open hems and crew collar with real circumference, not flattened strips.
    const hem = mesh(new THREE.TorusGeometry(1, 0.004, 8, 96), seamMat);
    hem.rotation.x = Math.PI / 2;
    hem.scale.set(0.242, 0.13, 1);
    hem.position.y = 0.883;
    const neckline = mesh(new THREE.TorusGeometry(1, 0.009, 10, 96), seamMat);
    neckline.rotation.x = Math.PI / 2;
    neckline.scale.set(0.089, 0.074, 1);
    neckline.position.y = 1.485;
    // Ribbed neckline highlights the collar rather than hiding the mannequin neck.
    for (const side of [-1, 1]) {
      const sleeveEdge = mesh(new THREE.TorusGeometry(0.080, 0.003, 6, 48), seamMat);
      const start = new THREE.Vector3(side * 0.207, 1.425, 0);
      const end = new THREE.Vector3(side * 0.410, 1.265, 0);
      sleeveEdge.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), end.clone().sub(start).normalize());
      sleeveEdge.position.copy(end);
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
    scene.add(new THREE.HemisphereLight(0xffffff, 0x92949a, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(-3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -2;
    key.shadow.camera.right = 2;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -2;
    key.shadow.normalBias = 0.003;
    key.shadow.bias = -0.0001;
    key.shadow.radius = 3;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xeef2ff, 1.2);
    fill.position.set(3, 2, 1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.8);
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
      span = Math.max(0.96, 0.63 / aspect);
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
      targetAngle = startAngle + ((event.clientX - startX) / Math.max(320, mount.clientWidth)) * Math.PI * 2;
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
        // A preset should never unwind several turns accumulated during dragging.
        const delta = Math.atan2(
          Math.sin(state.view.angle - root.rotation.y),
          Math.cos(state.view.angle - root.rotation.y),
        );
        targetAngle = root.rotation.y + delta;
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
      camera.zoom += (THREE.MathUtils.clamp(state.zoom, 1, 1.75) - camera.zoom) * blend;
      const focusY = 1.18 + ((camera.zoom - 1) / 0.75) * 0.11;
      camera.position.y = focusY + 0.35;
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
