import * as THREE from "three";

/** A tailored, hollow garment mesh. No mannequin primitives or flat print planes. */
export type AtelierGarment = {
  group: THREE.Group;
  hitTargets: THREE.Object3D[];
  update: (tone: string, ink: string, mark: string) => void;
  dispose: () => void;
};

const PANEL_COLUMNS = 48;
const PANEL_ROWS = 48;
const SLEEVE_SEGMENTS = 32;
const SLEEVE_ROWS = 16;

function smoothstep(from: number, to: number, value: number) {
  const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
}

function neckTop(x: number, front: boolean) {
  const a = Math.abs(x);
  if (a < 0.365) {
    const arc = Math.sqrt(Math.max(0, 1 - (a / 0.365) ** 2));
    return 1.49 - (front ? 0.37 : 0.095) * arc;
  }
  return 1.49 - 0.13 * ((a - 0.365) / (1 - 0.365));
}

function surface(u: number, v: number, front: boolean, offset = 0) {
  const t = u * 2 - 1;
  const hem = -1.48;
  const y = THREE.MathUtils.lerp(hem, neckTop(t, front), v);
  const shoulder = smoothstep(0.65, 1, v);
  const width = 0.87 - 0.075 * Math.sin(v * Math.PI) + 0.075 * shoulder;
  const edgeDrape = (1 - Math.abs(t) ** 1.75) * 0.012 * Math.sin(11 * v + t * 2.1);
  const x = t * width + edgeDrape;
  const roundness = Math.sqrt(Math.max(0, 1 - t * t));
  const folds =
    0.022 * Math.sin(t * 16 + v * 12.6) * (1 - smoothstep(0.25, 0.87, v)) +
    0.028 * Math.exp(-(((t + 0.61) / 0.19) ** 2)) * Math.sin(11 * v + 2.2) +
    0.023 * Math.exp(-(((t - 0.52) / 0.2) ** 2)) * Math.sin(13 * v - 1.5) +
    0.010 * Math.sin(26 * v + t * 12) * Math.exp(-(((v - 0.12) / 0.16) ** 2));
  const baseDepth = (0.015 + 0.24 * roundness) * (0.89 + 0.11 * shoulder);
  const z = (front ? 1 : -1) * (baseDepth + folds * roundness + offset);
  return new THREE.Vector3(x, y, z);
}

function makePanel(front: boolean, material: THREE.Material, offset = 0) {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= PANEL_ROWS; row++) {
    const v = row / PANEL_ROWS;
    for (let col = 0; col <= PANEL_COLUMNS; col++) {
      const u = col / PANEL_COLUMNS;
      const p = surface(u, v, front, offset);
      vertices.push(p.x, p.y, p.z);
      uvs.push(u, v);
    }
  }
  const stride = PANEL_COLUMNS + 1;
  for (let row = 0; row < PANEL_ROWS; row++) {
    for (let col = 0; col < PANEL_COLUMNS; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      if (front) indices.push(a, b, d, a, d, c);
      else indices.push(a, d, b, a, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = offset === 0;
  mesh.receiveShadow = offset === 0;
  return mesh;
}

function makeSleeve(side: -1 | 1, material: THREE.Material) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const point = (t: number, angle: number, extra = 0) => {
    const centerX = side * (0.805 + t * 0.655);
    const centerY = 1.255 - 0.50 * t + 0.022 * Math.sin(t * Math.PI);
    const tangent = new THREE.Vector2(side * 0.74, -0.67);
    const perpendicular = new THREE.Vector2(-tangent.y, tangent.x);
    const radius = 0.29 - t * 0.035 + extra;
    const waviness = 0.009 * Math.sin(angle * 4.0 + t * 5.1) * Math.sin(t * Math.PI);
    const width = (radius + waviness) * Math.cos(angle);
    const depth = (0.22 - t * 0.015 + extra) * Math.sin(angle);
    return new THREE.Vector3(
      centerX + perpendicular.x * width,
      centerY + perpendicular.y * width,
      depth,
    );
  };
  for (let row = 0; row <= SLEEVE_ROWS; row++) {
    const t = row / SLEEVE_ROWS;
    for (let col = 0; col <= SLEEVE_SEGMENTS; col++) {
      const a = (col / SLEEVE_SEGMENTS) * Math.PI * 2;
      const p = point(t, a);
      vertices.push(p.x, p.y, p.z);
      uvs.push(col / SLEEVE_SEGMENTS, t);
    }
  }
  const stride = SLEEVE_SEGMENTS + 1;
  for (let row = 0; row < SLEEVE_ROWS; row++) {
    for (let col = 0; col < SLEEVE_SEGMENTS; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      // Double-sided fabric also reveals the inside of the open cuff.
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, point };
}

function makeLine(points: THREE.Vector3[], material: THREE.Material, radius = 0.007) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 3), radius, 5, false), material);
  mesh.castShadow = false;
  return mesh;
}

function createWeaveTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#808080";
    context.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 3) {
      context.fillStyle = i % 2 ? "#929292" : "#747474";
      context.fillRect(i, 0, 1, 128);
      context.fillStyle = "#868686";
      context.fillRect(0, i, 128, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 9);
  texture.anisotropy = 4;
  return texture;
}

function createPrint(mark: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, 1024, 1024);
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "500 23px Arial, sans-serif";
    context.fillText("M A I S O N   A M I R A L", 512, 590);
    context.font = (mark.length > 5 ? "400 69px Georgia, serif" : "400 88px Georgia, serif");
    context.fillText(mark, 512, 532, 570);
    context.fillRect(418, 640, 188, 2);
    context.font = "400 16px Arial, sans-serif";
    context.fillText("EDITION 001", 512, 678);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createAtelierGarment(tone: string, ink: string, mark: string): AtelierGarment {
  const group = new THREE.Group();
  const fabricBump = createWeaveTexture();
  const fabric = new THREE.MeshPhysicalMaterial({
    color: tone,
    roughness: 0.92,
    metalness: 0,
    sheen: 0.27,
    sheenColor: new THREE.Color(tone),
    sheenRoughness: 0.88,
    side: THREE.DoubleSide,
    bumpMap: fabricBump,
    bumpScale: 0.006,
  });
  const stitching = new THREE.MeshStandardMaterial({
    color: tone,
    roughness: 1,
  });
  const print = new THREE.MeshBasicMaterial({
    map: createPrint(mark, ink),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    side: THREE.FrontSide,
  });
  const front = makePanel(true, fabric);
  const back = makePanel(false, fabric);
  const artwork = makePanel(true, print, 0.006);
  group.add(front, back, artwork);

  const cuffHits: THREE.Object3D[] = [front, back];
  for (const side of [-1, 1] as const) {
    const sleeve = makeSleeve(side, fabric);
    group.add(sleeve.mesh);
    cuffHits.push(sleeve.mesh);
    for (const t of [0.96, 1]) {
      const ring = Array.from({ length: 45 }, (_, i) => sleeve.point(t, (i / 44) * 2 * Math.PI, 0.004));
      group.add(makeLine(ring, stitching, t === 1 ? 0.009 : 0.0045));
    }
    // Shoulder seams run from the neck to the outer sleeve.
    for (const facing of [true, false]) {
      const points = Array.from({ length: 15 }, (_, i) => {
        const x = side * (0.365 + (i / 14) * 0.60);
        const p = surface((x / 0.955 + 1) * 0.5, 1, facing, 0.006);
        return p;
      });
      group.add(makeLine(points, stitching, 0.004));
    }
  }

  // Layered rib seam around the dipped front and shallow rear neckline.
  for (const facing of [true, false]) {
    for (const inset of [0, 0.034]) {
      const neckline = Array.from({ length: 33 }, (_, i) => {
        const x = -0.365 + (i / 32) * 0.73;
        const top = surface((x + 1) * 0.5, 1, facing, 0.008);
        top.y -= inset;
        return top;
      });
      group.add(makeLine(neckline, stitching, inset === 0 ? 0.016 : 0.008));
    }
    for (const v of [0.013, 0.032]) {
      const hem = Array.from({ length: 49 }, (_, i) => surface(i / 48, v, facing, 0.007));
      group.add(makeLine(hem, stitching, v < 0.02 ? 0.007 : 0.004));
    }
  }

  function update(nextTone: string, nextInk: string, nextMark: string) {
    fabric.color.set(nextTone);
    fabric.sheenColor.set(nextTone);
    const thread = new THREE.Color(nextTone);
    thread.offsetHSL(0, 0, nextTone.toLowerCase() === "#111111" || nextTone.toLowerCase() === "#1b1b1b" ? 0.065 : -0.075);
    stitching.color.copy(thread);
    print.map?.dispose();
    print.map = createPrint(nextMark, nextInk);
    print.needsUpdate = true;
  }
  update(tone, ink, mark);

  function dispose() {
    const geometrySet = new Set<THREE.BufferGeometry>();
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) geometrySet.add(object.geometry);
    });
    geometrySet.forEach((geometry) => geometry.dispose());
    fabric.dispose();
    stitching.dispose();
    print.map?.dispose();
    print.dispose();
    fabricBump.dispose();
  }

  return { group, hitTargets: cuffHits, update, dispose };
}
