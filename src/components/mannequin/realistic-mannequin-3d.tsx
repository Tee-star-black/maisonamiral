"use client";

import { ContactShadows, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type RealisticMannequin3DProps = {
  shirtTone: string;
  shirtInk: string;
  artMark: string;
  productName: string;
  onProductOpen: () => void;
};

const targetScale = new THREE.Vector3(1, 1, 1);

function Limb({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <capsuleGeometry args={[0.16, 0.92, 10, 24]} />
      <meshPhysicalMaterial color="#b8b1a7" roughness={0.48} metalness={0.05} clearcoat={0.12} />
    </mesh>
  );
}

function MannequinModel({ shirtTone, shirtInk, artMark, productName, onProductOpen }: RealisticMannequin3DProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const shirtMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(shirtTone),
        roughness: 0.66,
        metalness: 0,
        sheen: 0.42,
        sheenColor: new THREE.Color(shirtTone).offsetHSL(0, 0, 0.18),
        clearcoat: 0.04,
      }),
    [shirtTone],
  );

  useEffect(() => () => shirtMaterial.dispose(), [shirtMaterial]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const scale = hovered ? 1.025 : 1;
    targetScale.set(scale, scale, scale);
    group.current.scale.lerp(targetScale, 1 - Math.exp(-8 * delta));
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.012;
  });

  return (
    <group ref={group} position={[0, -2.15, 0]}>
      <mesh position={[0, 4.62, 0]} castShadow>
        <sphereGeometry args={[0.43, 48, 48]} />
        <meshPhysicalMaterial color="#c8c0b5" roughness={0.52} clearcoat={0.08} />
      </mesh>

      <mesh position={[0, 4.05, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.42, 32]} />
        <meshPhysicalMaterial color="#beb6ab" roughness={0.52} />
      </mesh>

      <mesh position={[0, 2.93, 0]} scale={[1.2, 1.65, 0.72]} castShadow receiveShadow>
        <sphereGeometry args={[0.92, 48, 48]} />
        <meshPhysicalMaterial color="#bdb5aa" roughness={0.5} clearcoat={0.08} />
      </mesh>

      <Limb position={[-1.02, 2.88, 0]} rotation={[0, 0, -0.08]} scale={[0.9, 1.06, 0.9]} />
      <Limb position={[1.02, 2.88, 0]} rotation={[0, 0, 0.08]} scale={[0.9, 1.06, 0.9]} />
      <Limb position={[-1.12, 1.62, 0.01]} rotation={[0, 0, 0.03]} scale={[0.78, 1.04, 0.78]} />
      <Limb position={[1.12, 1.62, 0.01]} rotation={[0, 0, -0.03]} scale={[0.78, 1.04, 0.78]} />
      <Limb position={[-0.47, 0.45, 0]} scale={[1.08, 1.66, 1.08]} />
      <Limb position={[0.47, 0.45, 0]} scale={[1.08, 1.66, 1.08]} />
      <Limb position={[-0.47, -1.5, 0]} scale={[0.92, 1.5, 0.92]} />
      <Limb position={[0.47, -1.5, 0]} scale={[0.92, 1.5, 0.92]} />

      <group
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(event) => {
          event.stopPropagation();
          onProductOpen();
        }}
      >
        <RoundedBox
          args={[2.22, 2.1, 0.62]}
          radius={0.18}
          smoothness={8}
          position={[0, 3.02, 0.04]}
          castShadow
          material={shirtMaterial}
        />

        <mesh position={[-1.38, 3.2, 0.02]} rotation={[0, 0, -0.49]} castShadow material={shirtMaterial}>
          <boxGeometry args={[0.82, 1.25, 0.54]} />
        </mesh>
        <mesh position={[1.38, 3.2, 0.02]} rotation={[0, 0, 0.49]} castShadow material={shirtMaterial}>
          <boxGeometry args={[0.82, 1.25, 0.54]} />
        </mesh>

        <mesh position={[0, 3.92, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.055, 20, 48]} />
          <meshStandardMaterial color={shirtInk} roughness={0.75} />
        </mesh>

        <Text
          position={[0, 3.03, 0.365]}
          fontSize={0.24}
          letterSpacing={0.1}
          color={shirtInk}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
        >
          {artMark}
        </Text>
      </group>

      <mesh position={[-0.47, -2.58, 0.18]} scale={[0.48, 0.24, 0.92]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color="#171717" roughness={0.72} />
      </mesh>
      <mesh position={[0.47, -2.58, 0.18]} scale={[0.48, 0.24, 0.92]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color="#171717" roughness={0.72} />
      </mesh>

      <Text position={[0, -3.22, 0]} fontSize={0.14} letterSpacing={0.13} color="#a8a096" anchorX="center">
        {productName.toUpperCase()}
      </Text>
    </group>
  );
}

export function RealisticMannequin3D(props: RealisticMannequin3DProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [0, 2.2, 9.6], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0b0b0b"]} />
      <fog attach="fog" args={["#0b0b0b", 9.5, 15]} />
      <hemisphereLight args={["#fff8ec", "#20242c", 1.35]} />
      <spotLight position={[4.8, 8.2, 6]} intensity={85} angle={0.32} penumbra={0.7} castShadow color="#fff5e8" />
      <spotLight position={[-4.5, 5.4, 3]} intensity={42} angle={0.42} penumbra={0.85} color="#d8e2ff" />
      <pointLight position={[0, 0.5, -4]} intensity={20} color="#ffffff" />

      <MannequinModel {...props} />
      <ContactShadows position={[0, -4.85, 0]} opacity={0.58} scale={8} blur={2.8} far={5} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={7.8}
        maxDistance={11.5}
        minPolarAngle={Math.PI * 0.34}
        maxPolarAngle={Math.PI * 0.62}
        rotateSpeed={0.58}
        zoomSpeed={0.65}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  );
}
