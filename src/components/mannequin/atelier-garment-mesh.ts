import * as THREE from "three";

/** A tailored, hollow garment mesh. No mannequin primitives or flat print planes. */
export type AtelierGarment = {
  group: THREE.Group;
  hitTargets: THREE.Object3D[];
  updateTone: (tone: string) => void;
  setPrints: (front?: THREE.Texture | null, back?: THREE.Texture | null) => void;
  dispose: () => void;
};

// All measurements share the mannequin's world units. The front and back
// share a T-shaped perimeter; their shoulder/side edges are sewn together.
const HEM = -0.58;
const NECK = 0.64;
const HALF_WIDTH = 0.47;

function neckline(x: number, front: boolean) {
  return NECK - (front ? 0.13 : 0.035) * Math.sqrt(Math.max(0, 1 - (x / 0.16) ** 2));
}

function outline(front: boolean) {
  const points = [
    [-0.16, NECK], [-0.42, 0.59], [-0.68, 0.17],
    [-0.50, 0.05], [-0.39, 0.25], [-0.45, -0.30],
    [-HALF_WIDTH, HEM], [HALF_WIDTH, HEM], [0.45, -0.30],
    [0.39, 0.25], [0.50, 0.05], [0.68, 0.17], [0.42, 0.59], [0.16, NECK],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  for (let i = 1; i < 24; i++) {
    const x = 0.16 - (i / 24) * 0.32;
    points.push(new THREE.Vector2(x, neckline(x, front)));
  }
  return points;
}

function clothPoint(x: number, y: number, front: boolean, offset = 0) {
  const bodyRound = Math.max(0, 1 - (x / 0.49) ** 2);
  const collarBlend = THREE.MathUtils.smoothstep(y, 0.36, 0.64);
  const bodyDepth = (front ? 0.125 : 0.23) + (front ? 0.12 : 0.055) * bodyRound;
  const collarDepth = (front ? 0.13 : 0.20) + 0.035 * bodyRound;
  const depth = THREE.MathUtils.lerp(bodyDepth, collarDepth, collarBlend);
  const hemFold = (1 - THREE.MathUtils.smoothstep(y, -0.54, 0.24)) *
    (0.006 * Math.sin(x * 49 + y * 12) + 0.004 * Math.sin(x * 28 - y * 17));
  return new THREE.Vector3(x, y, (front ? 1 : -1) * (depth + hemFold + offset));
}

function makePanel(front: boolean, material: THREE.Material, offset = 0) {
  const points = outline(front);
  let triangles = THREE.ShapeUtils.triangulateShape(points, []);
  // Subdivide the actual sewn silhouette, keeping every perimeter edge fixed.
  for (let level = 0; level < 4; level++) {
    const midpoints = new Map<string, number>();
    const midpoint = (a: number, b: number) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      let index = midpoints.get(key);
      if (index === undefined) {
        index = points.length;
        points.push(points[a].clone().lerp(points[b], 0.5));
        midpoints.set(key, index);
      }
      return index;
    };
    const refined: number[][] = [];
    for (const [a, b, c] of triangles) {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      refined.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
    }
    triangles = refined;
  }
  const positions: number[] = [], uvs: number[] = [];
  for (const { x, y } of points) {
    const p = clothPoint(x, y, front, offset);
    positions.push(p.x, p.y, p.z);
    const u = (x / HALF_WIDTH + 1) * 0.5;
    // Preserve the catalogue print placement on the torso, excluding sleeves.
    const top = neckline(THREE.MathUtils.clamp(x, -0.16, 0.16), front);
    uvs.push(front ? u : 1 - u, (y - HEM) / (top - HEM));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(triangles.flatMap(([a, b, c]) => front ? [a, b, c] : [a, c, b]));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = offset === 0;
  mesh.receiveShadow = offset === 0;
  return mesh;
}

function makeLine(points: THREE.Vector3[], material: THREE.Material, radius = 0.002) {
  return new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points), Math.max(24, points.length * 3), radius, 5, false,
  ), material);
}

function sewPerimeter(material: THREE.Material) {
  const front = outline(true), back = outline(false);
  const positions: number[] = [], indices: number[] = [];
  // Cuffs (2, 10), hem (6), and neckline (13 onward) stay open.
  for (const edge of [0, 1, 3, 4, 5, 7, 8, 9, 11, 12]) {
    for (let step = 0; step < 24; step++) {
      const a = front[edge].clone().lerp(front[edge + 1], step / 24);
      const b = front[edge].clone().lerp(front[edge + 1], (step + 1) / 24);
      const c = back[edge].clone().lerp(back[edge + 1], step / 24);
      const d = back[edge].clone().lerp(back[edge + 1], (step + 1) / 24);
      const base = positions.length / 3;
      for (const p of [clothPoint(a.x, a.y, true), clothPoint(b.x, b.y, true),
        clothPoint(c.x, c.y, false), clothPoint(d.x, d.y, false)]) positions.push(p.x, p.y, p.z);
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = mesh.receiveShadow = true;
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

export function createAtelierGarment(tone: string): AtelierGarment {
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
    bumpScale: 0.001,
  });
  const stitching = new THREE.MeshStandardMaterial({
    color: tone,
    roughness: 1,
  });
  const photoSurface = (side: THREE.Side) => new THREE.MeshStandardMaterial({
    transparent: true,
    depthWrite: false,
    alphaTest: 0.015,
    roughness: 0.97,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    side,
  });
  const frontPrintMaterial = photoSurface(THREE.FrontSide);
  const backPrintMaterial = photoSurface(THREE.FrontSide);
  const front = makePanel(true, fabric);
  const back = makePanel(false, fabric);
  const frontArtwork = makePanel(true, frontPrintMaterial, 0.0015);
  const backArtwork = makePanel(false, backPrintMaterial, 0.0015);
  frontArtwork.visible = false;
  backArtwork.visible = false;
  group.add(front, back, frontArtwork, backArtwork);

  const joinedEdges = sewPerimeter(fabric);
  group.add(joinedEdges);
  const cuffHits: THREE.Object3D[] = [front, back, joinedEdges];

  for (const facing of [true, false]) {
    const neck = Array.from({ length: 49 }, (_, i) => {
      const x = -0.16 + (i / 48) * 0.32;
      return clothPoint(x, neckline(x, facing), facing, 0.001);
    });
    group.add(makeLine(neck, stitching, 0.006));
    const hem = Array.from({ length: 49 }, (_, i) =>
      clothPoint(-HALF_WIDTH + (i / 48) * 2 * HALF_WIDTH, HEM + 0.012, facing, 0.001));
    group.add(makeLine(hem, stitching, 0.0012));
  }

  function updateTone(nextTone: string) {
    fabric.color.set(nextTone);
    fabric.sheenColor.set(nextTone);
    const thread = new THREE.Color(nextTone);
    thread.offsetHSL(0, 0, nextTone.toLowerCase() === "#111111" || nextTone.toLowerCase() === "#1b1b1b" || nextTone.toLowerCase() === "#161616" ? 0.065 : -0.075);
    stitching.color.copy(thread);
  }

  function setPrints(frontTexture: THREE.Texture | null = null, backTexture: THREE.Texture | null = null) {
    frontPrintMaterial.map = frontTexture;
    backPrintMaterial.map = backTexture;
    frontArtwork.visible = Boolean(frontTexture);
    backArtwork.visible = Boolean(backTexture);
    frontPrintMaterial.needsUpdate = true;
    backPrintMaterial.needsUpdate = true;
  }
  updateTone(tone);

  function dispose() {
    const geometrySet = new Set<THREE.BufferGeometry>();
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) geometrySet.add(object.geometry);
    });
    geometrySet.forEach((geometry) => geometry.dispose());
    fabric.dispose();
    stitching.dispose();
    frontPrintMaterial.dispose();
    backPrintMaterial.dispose();
    fabricBump.dispose();
  }

  return { group, hitTargets: cuffHits, updateTone, setPrints, dispose };
}
