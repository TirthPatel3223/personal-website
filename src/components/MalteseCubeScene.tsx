'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// ─── DATA DEFINITIONS ───────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'top':    '#FFFFFF', // White
  'bottom': '#F1C40F', // Yellow (Standard Rubik's matching bottom to top is yellow)
  'front':  '#2ECC71', // Green
  'back':   '#3498DB', // Blue
  'right':  '#E74C3C', // Red
  'left':   '#E67E22', // Orange
};

type CubiePos = [number, number, number];

const ALL_CUBIES: CubiePos[] = [];
for (let y of [1, 0, -1]) {
  for (let x of [-1, 0, 1]) {
    for (let z of [1, 0, -1]) {
      if (x === 0 && y === 0 && z === 0) continue;
      ALL_CUBIES.push([x, y, z]);
    }
  }
}

const TOP_CUBIES = ALL_CUBIES.filter(([, y,]) => y === 1);
const EQ_CUBIES  = ALL_CUBIES.filter(([, y,]) => y === 0);
const BOT_CUBIES = ALL_CUBIES.filter(([, y,]) => y === -1);

// ─── MAIN CUBE COMPONENT ────────────────────────────────────────────────────

function RubiksCube({ scrollProgress }: { scrollProgress: number }) {
  const cubeGroupRef   = useRef<THREE.Group>(null!);
  const topLayerRef    = useRef<THREE.Group>(null!);
  const equatorialRef  = useRef<THREE.Group>(null!);
  const bottomLayerRef = useRef<THREE.Group>(null!);

  // Geometries
  const baseSize = 0.96;
  const stickerSize = 0.86;
  const stickerDepth = 0.04;
  
  const blockGeo = useMemo(() => new THREE.BoxGeometry(baseSize, baseSize, baseSize), [baseSize]);
  const stickerGeo = useMemo(() => new THREE.BoxGeometry(stickerSize, stickerDepth, stickerSize), [stickerSize, stickerDepth]);
  
  // Materials
  const blackMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.7, metalness: 0.1 }), []);
  
  const materials = useMemo(() => ({
    top:    new THREE.MeshPhysicalMaterial({ color: COLOR_MAP.top, roughness: 0.2, clearcoat: 1.0 }),
    bottom: new THREE.MeshPhysicalMaterial({ color: COLOR_MAP.bottom, roughness: 0.2, clearcoat: 1.0 }),
    front:  new THREE.MeshPhysicalMaterial({ color: COLOR_MAP.front, roughness: 0.2, clearcoat: 1.0 }),
    back:   new THREE.MeshPhysicalMaterial({ color: COLOR_MAP.back, roughness: 0.2, clearcoat: 1.0 }),
    right:  new THREE.MeshPhysicalMaterial({ color: COLOR_MAP.right, roughness: 0.2, clearcoat: 1.0 }),
    left:   new THREE.MeshPhysicalMaterial({ color: COLOR_MAP.left, roughness: 0.2, clearcoat: 1.0 }),
  }), []);

  useEffect(() => {
    return () => {
      blockGeo.dispose(); stickerGeo.dispose();
      blackMat.dispose();
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [blockGeo, stickerGeo, blackMat, materials]);

  useFrame(({ clock }) => {
    const cube = cubeGroupRef.current;
    const top  = topLayerRef.current;
    const eq   = equatorialRef.current;
    const bot  = bottomLayerRef.current;
    if (!cube || !top || !eq || !bot) return;

    const sp = scrollProgress;
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const segProgress = (progress: number, start: number, end: number) =>
      ease(Math.max(0, Math.min(1, (progress - start) / (end - start))));

    // Breathing idle animation
    cube.rotation.x = Math.sin(clock.getElapsedTime() * 0.4) * 0.1;
    cube.rotation.z = Math.cos(clock.getElapsedTime() * 0.3) * 0.05;

    // Idle auto-rotation
    if (sp < 0.01) {
      cube.rotation.y += 0.005;
    } else {
      // align base cube y rotation back to 0 so layers look clean
      cube.rotation.y = THREE.MathUtils.lerp(cube.rotation.y, Math.round(cube.rotation.y / (Math.PI/2)) * (Math.PI/2), 0.1);
    }

    // Move sequence — cumulative values per layer
    if (sp <= 0.20) {
      top.rotation.y = segProgress(sp, 0.00, 0.20) * (Math.PI / 2); bot.rotation.y = 0; eq.rotation.y = 0;
    } else if (sp <= 0.40) {
      top.rotation.y = Math.PI / 2; bot.rotation.y = segProgress(sp, 0.20, 0.40) * -(Math.PI / 2); eq.rotation.y = 0;
    } else if (sp <= 0.55) {
      top.rotation.y = Math.PI / 2; bot.rotation.y = -(Math.PI / 2); eq.rotation.y = segProgress(sp, 0.40, 0.55) * (Math.PI / 2);
    } else if (sp <= 0.70) {
      top.rotation.y = (Math.PI / 2) + segProgress(sp, 0.55, 0.70) * (Math.PI / 2); bot.rotation.y = -(Math.PI / 2); eq.rotation.y  = Math.PI / 2;
    } else if (sp <= 0.85) {
      top.rotation.y = Math.PI; bot.rotation.y = -(Math.PI / 2) + segProgress(sp, 0.70, 0.85) * (Math.PI / 2); eq.rotation.y  = Math.PI / 2;
    } else {
      top.rotation.y = Math.PI; bot.rotation.y = 0; eq.rotation.y = (Math.PI / 2) - segProgress(sp, 0.85, 1.00) * (Math.PI / 2);
    }
  });

  const renderCubie = (pos: CubiePos, idx: number) => {
    const [x, y, z] = pos;
    const sPos = baseSize / 2; // Offset for stickers placing them on the face

    return (
      <group key={`cubie-${idx}`} position={pos}>
        {/* Black Core Block */}
        <mesh geometry={blockGeo} material={blackMat} castShadow receiveShadow />
        
        {/* Conditional Outer Stickers */}
        {y === 1 && (
          <mesh geometry={stickerGeo} material={materials.top} position={[0, sPos, 0]} castShadow />
        )}
        {y === -1 && (
          <mesh geometry={stickerGeo} material={materials.bottom} position={[0, -sPos, 0]} castShadow />
        )}
        
        {x === 1 && (
          <mesh geometry={stickerGeo} material={materials.right} position={[sPos, 0, 0]} rotation={[0, 0, -Math.PI/2]} castShadow />
        )}
        {x === -1 && (
          <mesh geometry={stickerGeo} material={materials.left} position={[-sPos, 0, 0]} rotation={[0, 0, Math.PI/2]} castShadow />
        )}

        {z === 1 && (
          <mesh geometry={stickerGeo} material={materials.front} position={[0, 0, sPos]} rotation={[Math.PI/2, 0, 0]} castShadow />
        )}
        {z === -1 && (
          <mesh geometry={stickerGeo} material={materials.back} position={[0, 0, -sPos]} rotation={[-Math.PI/2, 0, 0]} castShadow />
        )}
      </group>
    );
  };

  return (
    <group ref={cubeGroupRef}>
      <group ref={topLayerRef}>
        {TOP_CUBIES.map((p, i) => renderCubie(p, i))}
      </group>
      <group ref={equatorialRef}>
        {EQ_CUBIES.map((p, i) => renderCubie(p, i))}
      </group>
      <group ref={bottomLayerRef}>
        {BOT_CUBIES.map((p, i) => renderCubie(p, i))}
      </group>
    </group>
  );
}

export default function MalteseCubeScene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <Canvas
      shadows
      camera={{ position: [4.0, 3.5, 5.0], fov: 42 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 8, 5]} intensity={1.5} castShadow />
      <pointLight position={[-4, -2, -4]} intensity={0.5} color="#FFFFFF" />
      <Environment preset="studio" />
      <RubiksCube scrollProgress={scrollProgress} />
    </Canvas>
  );
}
