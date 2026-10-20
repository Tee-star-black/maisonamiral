import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const SOURCE = "/models/maison-human-mannequin.glb";

function poseMannequin(model: THREE.Object3D) {
  // The CC0 rig faces along +X and has arms that benefit from a relaxed showroom pose.
  model.updateMatrixWorld(true);
  const rotateArm = (name: string, angle: number) => {
    const bone = model.getObjectByName(name);
    if (!(bone instanceof THREE.Bone)) return;
    const parentQuaternion = new THREE.Quaternion();
    bone.parent?.getWorldQuaternion(parentQuaternion);
    const localAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(parentQuaternion.invert());
    bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(localAxis, angle));
    bone.updateMatrixWorld(true);
  };
  rotateArm("upper_armL", -0.35);
  rotateArm("upper_armR", 0.35);
  model.updateMatrixWorld(true);
}

function releaseModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    nodeMaterials.forEach((item) => materials.add(item));
  });
  geometries.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
}

/**
 * Uses an existing CC0 anatomical mesh as a matte sculpture.
 * The torso underneath the tailored T-shirt is masked, preventing skin
 * from poking through the garment as the user rotates the scene.
 */
export function loadShowroomMannequin(
  parent: THREE.Group,
  figure: THREE.Group,
  onReady?: () => void,
  onError?: () => void,
): { updateMask: () => void; dispose: () => void } {
  const worldToFigure = { value: new THREE.Matrix4() };
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: "#d2cdc4",
    roughness: 0.77,
    metalness: 0,
    clearcoat: 0.02,
    clearcoatRoughness: 1,
  });

  bodyMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.maisonWorldToFigure = worldToFigure;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>",
        "#include <common>\nuniform mat4 maisonWorldToFigure;\nvarying vec3 vMaisonLocal;")
      .replace("#include <project_vertex>",
        "vMaisonLocal = (maisonWorldToFigure * modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>",
        "#include <common>\nvarying vec3 vMaisonLocal;")
      .replace("#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\n" +
        "vec2 neck = vec2(vMaisonLocal.x / 0.205, (vMaisonLocal.y - 3.00) / 0.18);\n" +
        "bool openNeck = dot(neck, neck) < 1.0;\n" +
        "if (!openNeck && abs(vMaisonLocal.x) < 0.48 && vMaisonLocal.y > 1.89 && vMaisonLocal.y < 3.035 && abs(vMaisonLocal.z) < 0.39) discard;");
  };
  bodyMaterial.customProgramCacheKey = () => "maison-clothed-mannequin-v3";

  let disposed = false;
  let model: THREE.Object3D | null = null;
  const loader = new GLTFLoader();
  loader.load(SOURCE, (gltf) => {
    const object = gltf.scene;
    if (disposed) {
      releaseModel(object);
      return;
    }
    object.name = "MAISON_SHOWROOM_MANNEQUIN";
    poseMannequin(object);
    object.rotation.y = -Math.PI / 2;
    object.updateMatrixWorld(true);

    const originals = new Set<THREE.Material>();
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((material) => originals.add(material));
      node.material = bodyMaterial;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    originals.forEach((material) => material.dispose());

    const boundsBefore = new THREE.Box3().setFromObject(object);
    const height = boundsBefore.getSize(new THREE.Vector3()).y;
    object.scale.setScalar(height > 0 ? 3.62 / height : 1);
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const center = bounds.getCenter(new THREE.Vector3());
    object.position.x -= center.x;
    object.position.z -= center.z;
    object.position.y -= bounds.min.y;
    object.updateMatrixWorld(true);
    parent.add(object);
    model = object;
    onReady?.();
  }, undefined, () => {
    if (!disposed) onError?.();
  });

  return {
    updateMask() {
      figure.updateMatrixWorld(true);
      worldToFigure.value.copy(figure.matrixWorld).invert();
    },
    dispose() {
      disposed = true;
      if (model) {
        parent.remove(model);
        releaseModel(model);
        model = null;
      }
      bodyMaterial.dispose();
    },
  };
}
