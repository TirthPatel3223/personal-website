'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../../core/builder';
import { glowMaterial, litMaterial } from '../../core/materials';
import type { ScenePalette } from '../../core/palette';
import type { CubeMotion } from './MalteseCube';

/* A six-axis industrial robot arm (turret, shoulder, elbow, wrist pitch, wrist roll,
   two-finger gripper) solved with two-link inverse kinematics every frame. When the
   cube works on one of this arm's faces, the gripper closes on that face's centre and
   its wrist rolls with the turn. */

const L1 = 2.3;
const L2 = 2.1;
/** Wrist joint to fingertip. */
const L3 = 0.62;

type Face = NonNullable<CubeMotion['face']>;

const FACE_NORMAL: Record<Face, [number, number, number]> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
};

function useParts(palette: ScenePalette, accent: string) {
  return useMemo(() => {
    const shell = palette.mode === 'dark' ? '#dfe5ec' : '#f2f4f7';
    const joint = '#2c313a';
    const make = (fn: (b: MeshBuilder, g: MeshBuilder) => void) => {
      const b = new MeshBuilder();
      const g = new MeshBuilder(palette.glow);
      fn(b, g);
      return { lit: b.build(), glow: g.empty ? null : g.build() };
    };
    return {
      turret: make((b, g) => {
        b.cylinder(0.46, 0.5, 0.36, 16, { position: [0, -0.5, 0], color: shell });
        b.box(0.5, 0.42, 0.62, { position: [0, -0.18, 0], color: shell });
        g.torus(0.47, 0.025, 4, 32, { position: [0, -0.33, 0], rotation: [Math.PI / 2, 0, 0], color: accent });
      }),
      upper: make((b, g) => {
        b.cylinder(0.3, 0.3, 0.56, 16, { rotation: [Math.PI / 2, 0, 0], color: joint });
        b.cylinder(0.31, 0.31, 0.08, 16, { position: [0, 0, 0.3], rotation: [Math.PI / 2, 0, 0], color: shell });
        b.taperBox(0.4, L1, 0.34, 0.75, 0.85, { position: [0, L1 / 2, 0], color: shell });
        g.box(0.03, L1 * 0.6, 0.02, { position: [0.12, L1 * 0.5, 0.155], color: accent });
      }),
      fore: make((b, g) => {
        b.cylinder(0.24, 0.24, 0.46, 16, { rotation: [Math.PI / 2, 0, 0], color: joint });
        b.taperBox(0.3, L2, 0.27, 0.7, 0.8, { position: [0, L2 / 2, 0], color: shell });
        g.box(0.025, L2 * 0.5, 0.02, { position: [0.08, L2 * 0.45, 0.125], color: accent });
      }),
      wrist: make((b) => {
        b.cylinder(0.15, 0.15, 0.32, 12, { rotation: [Math.PI / 2, 0, 0], color: joint });
        b.cylinder(0.13, 0.14, 0.2, 12, { position: [0, 0.12, 0], color: shell });
      }),
      hand: make((b, g) => {
        b.cylinder(0.15, 0.15, 0.05, 12, { position: [0, 0.02, 0], color: joint });
        b.box(0.36, 0.09, 0.2, { position: [0, 0.09, 0], color: shell });
        g.box(0.02, 0.02, 0.21, { position: [0, 0.12, 0], color: accent });
      }),
      finger: make((b) => {
        b.box(0.06, 0.3, 0.16, { position: [0, 0.15, 0], color: joint });
        b.box(0.07, 0.06, 0.17, { position: [0, 0.28, 0], color: '#4a505c' });
      }),
    };
  }, [palette, accent]);
}

export interface ArmProps {
  palette: ScenePalette;
  accent: string;
  /** Shoulder joint position (top of the pedestal), in the same frame as `cube`. */
  base: [number, number, number];
  /** Cube centre, scale (face plane distance) and yaw. */
  cube: { center: [number, number, number]; size: number; yaw: number };
  faces: Face[];
  motion: CubeMotion;
  animate: boolean;
  phase?: number;
}

const v = {
  B: new THREE.Vector3(),
  C: new THREE.Vector3(),
  n: new THREE.Vector3(),
  T: new THREE.Vector3(),
  A: new THREE.Vector3(),
  W: new THREE.Vector3(),
  r: new THREE.Vector3(),
  restT: new THREE.Vector3(),
  restA: new THREE.Vector3(),
};

export default function RobotArm({ palette, accent, base, cube, faces, motion, animate, phase = 0 }: ArmProps) {
  const parts = useParts(palette, accent);
  useEffect(
    () => () => {
      for (const p of Object.values(parts)) {
        p.lit.dispose();
        p.glow?.dispose();
      }
    },
    [parts],
  );
  const yawG = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const roll = useRef<THREE.Group>(null);
  const fingerA = useRef<THREE.Group>(null);
  const fingerB = useRef<THREE.Group>(null);
  const time = useRef(0);
  const smoothEngage = useRef(0);
  const lastFace = useRef<Face>(faces[0]);

  useFrame((_, dt) => {
    if (animate) time.current += Math.min(dt, 0.1);
    const t = time.current + phase;
    v.B.set(...base);
    v.C.set(...cube.center);
    const mine = motion.face && faces.includes(motion.face) ? motion.face : null;
    if (mine) lastFace.current = mine;
    const engage = mine ? motion.engage : 0;
    smoothEngage.current += (engage - smoothEngage.current) * Math.min(1, dt * 14);
    const e = animate ? smoothEngage.current : 0;

    // Engaged target: the centre of the face, approached along its inward normal.
    const [nx, ny, nz] = FACE_NORMAL[lastFace.current];
    v.n.set(nx, ny, nz).applyAxisAngle(THREE.Object3D.DEFAULT_UP, cube.yaw);
    v.T.copy(v.C).addScaledVector(v.n, cube.size * 1.04);
    v.A.copy(v.n).negate();
    // Rest: hovering between the pedestal and the cube, gripper tipped down.
    v.r.set(v.C.x - v.B.x, 0, v.C.z - v.B.z).normalize();
    v.restT.copy(v.B).addScaledVector(v.r, 1.75).add(new THREE.Vector3(0, 1.15 + Math.sin(t * 0.9) * 0.08, 0));
    v.restT.addScaledVector(new THREE.Vector3(-v.r.z, 0, v.r.x), Math.sin(t * 0.6) * 0.18);
    v.restA.copy(v.r).multiplyScalar(0.45).add(new THREE.Vector3(0, -0.9, 0)).normalize();
    v.T.lerp(v.restT, 1 - e);
    v.A.lerp(v.restA, 1 - e).normalize();

    // Wrist point, arm plane and two-link IK (elbow up).
    v.W.copy(v.T).addScaledVector(v.A, -L3);
    v.r.set(v.W.x - v.B.x, 0, v.W.z - v.B.z);
    const wr = Math.max(0.05, v.r.length());
    v.r.divideScalar(wr);
    const wy = v.W.y - v.B.y;
    const D = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, Math.hypot(wr, wy)));
    const phi = Math.atan2(wy, wr);
    const beta = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))));
    const a1 = phi + beta;
    const ex = L1 * Math.cos(a1);
    const ey = L1 * Math.sin(a1);
    const a2 = Math.atan2(wy - ey, wr - ex);
    const a3 = Math.atan2(v.A.y, v.A.x * v.r.x + v.A.z * v.r.z);

    if (yawG.current) yawG.current.rotation.y = Math.atan2(-v.r.z, v.r.x);
    if (shoulder.current) shoulder.current.rotation.z = a1 - Math.PI / 2;
    if (elbow.current) elbow.current.rotation.z = a2 - a1;
    if (wrist.current) wrist.current.rotation.z = a3 - a2;
    // Roll with the face: the tool points along -n, so a turn of +angle about n is -angle about the tool.
    if (roll.current) roll.current.rotation.y = mine ? -motion.angle * e : 0;
    const gap = 0.16 - 0.06 * e;
    if (fingerA.current) fingerA.current.position.x = gap;
    if (fingerB.current) fingerB.current.position.x = -gap;
  });

  const mesh = (p: { lit: THREE.BufferGeometry; glow: THREE.BufferGeometry | null }) => (
    <>
      <mesh geometry={p.lit} material={litMaterial()} />
      {p.glow && <mesh geometry={p.glow} material={glowMaterial()} />}
    </>
  );

  return (
    <group position={base}>
      <group ref={yawG}>
        {mesh(parts.turret)}
        <group ref={shoulder}>
          {mesh(parts.upper)}
          <group ref={elbow} position={[0, L1, 0]}>
            {mesh(parts.fore)}
            <group ref={wrist} position={[0, L2, 0]}>
              {mesh(parts.wrist)}
              <group ref={roll} position={[0, 0.22, 0]}>
                {mesh(parts.hand)}
                <group ref={fingerA} position={[0.16, 0.1, 0]}>
                  {mesh(parts.finger)}
                </group>
                <group ref={fingerB} position={[-0.16, 0.1, 0]}>
                  {mesh(parts.finger)}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
