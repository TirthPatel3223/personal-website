'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MeshBuilder } from './builder';
import { litMaterial } from './materials';
import { mulberry32, between } from './math';
import type { ScenePalette } from './palette';

/* Sky, sea, lights and weather shared by the homepage and the exhibits. Night gets
   stars and a moon-blue key light; day gets a warm sun and a few drifting clouds. */

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float h = smoothstep(-0.08, 0.6, vDir.y);
    gl_FragColor = vec4(mix(uBottom, uTop, h), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function SkyDome({ top, bottom }: { top: string; bottom: string }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTop: { value: new THREE.Color(top) },
          uBottom: { value: new THREE.Color(bottom) },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [top, bottom],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1500, 32, 16]} />
    </mesh>
  );
}

function Clouds({ palette, spread }: { palette: ScenePalette; spread: number }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const rng = mulberry32(77);
    const b = new MeshBuilder();
    for (let i = 0; i < 9; i++) {
      // Outside the island ring and well above it, so clouds frame the scene
      // without drifting behind text.
      const a = (i / 9) * Math.PI * 2 + between(rng, -0.2, 0.2);
      const r = spread * between(rng, 1.25, 1.75);
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      const cy = between(rng, 34, 52);
      for (let k = 0; k < 5; k++) {
        b.ico(between(rng, 4.5, 8), 1, {
          position: [cx + between(rng, -10, 10), cy + between(rng, -1.5, 3), cz + between(rng, -4, 4)],
          scale: [1.4, 0.75, 1],
          color: palette.cloud,
        });
      }
    }
    return b.build();
  }, [palette, spread]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004;
  });
  return (
    <group ref={group}>
      <mesh geometry={geometry} material={litMaterial()} />
    </group>
  );
}

export function SceneEnvironment({
  palette,
  seaLevel = -36,
  cloudSpread = 90,
}: {
  palette: ScenePalette;
  seaLevel?: number;
  cloudSpread?: number;
}) {
  const [kx, ky, kz] = palette.keyPosition;
  return (
    <>
      <color attach="background" args={[palette.skyBottom]} />
      <fog attach="fog" args={[palette.fog, palette.fogNear, palette.fogFar]} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]} />
      <directionalLight position={[kx, ky, kz]} intensity={palette.keyIntensity} color={palette.key} />
      <directionalLight position={[-kx, 40, -kz]} intensity={palette.fillIntensity} color={palette.fill} />
      <SkyDome top={palette.skyTop} bottom={palette.skyBottom} />
      <mesh rotation-x={-Math.PI / 2} position-y={seaLevel}>
        <circleGeometry args={[1400, 64]} />
        <meshStandardMaterial color={palette.sea} roughness={0.85} metalness={0.15} />
      </mesh>
      {palette.stars ? (
        <Stars radius={680} depth={160} count={2600} factor={9} saturation={0} fade speed={0.4} />
      ) : (
        <Clouds palette={palette} spread={cloudSpread} />
      )}
    </>
  );
}
