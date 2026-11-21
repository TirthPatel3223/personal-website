'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowMaterial, litMaterial } from '../../../core/materials';
import { sample, track, type Track } from '../../../islands/parts/movers';
import { carGeometry } from './cars';

/* The moving parts of every ride. Vehicles are instanced by model (a whole park of
   boats, logs and coaster cars is a couple of dozen draw calls); turning parts are
   small groups that spin about their pivot. Everything here is in world space: the
   scene has already placed each ride. */

export interface WorldMover {
  car: string;
  head?: string;
  track: Track;
  trains: number;
  cars: number;
  gap: number;
  speed: number;
  gravity: number;
  bob: number;
  colors?: string[];
  level: boolean;
  scale: number;
}

export interface BuiltSpin {
  lit: THREE.BufferGeometry;
  glow: THREE.BufferGeometry | null;
  pivot: [number, number, number];
  axis: 'x' | 'y' | 'z';
  speed: number;
  phase: number;
  bob?: [number, number, number];
  cycle?: [number, number];
  children: BuiltSpin[];
}

export interface PlacedSpin {
  spin: BuiltSpin;
  position: [number, number, number];
  yaw: number;
  scale: number;
}

const P = new THREE.Vector3();
const DIR = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler(0, 0, 0, 'YZX');
const M = new THREE.Matrix4();
const S = new THREE.Vector3();
const C = new THREE.Color();

interface Slot {
  mover: number;
  train: number;
  car: number;
}

export function RideMovers({ movers, glow, animate }: { movers: WorldMover[]; glow: number; animate: boolean }) {
  const groups = useMemo(() => {
    const byKey = new Map<string, Slot[]>();
    movers.forEach((m, mi) => {
      for (let t = 0; t < m.trains; t++) {
        for (let k = 0; k < m.cars; k++) {
          const key = k === 0 && m.head ? m.head : m.car;
          if (!byKey.has(key)) byKey.set(key, []);
          byKey.get(key)!.push({ mover: mi, train: t, car: k });
        }
      }
    });
    return Array.from(byKey.entries()).map(([key, slots]) => ({ key, slots, geo: carGeometry(key, glow) }));
  }, [movers, glow]);

  // Distance travelled by every train.
  const dist = useRef<number[][]>([]);
  useEffect(() => {
    dist.current = movers.map((m) => {
      const span = m.track.closed ? m.track.total : m.track.total * 2;
      return Array.from({ length: m.trains }, (_, t) => (span * t) / m.trains + span * 0.13);
    });
  }, [movers]);

  const lit = useRef<Array<THREE.InstancedMesh | null>>([]);
  const lights = useRef<Array<THREE.InstancedMesh | null>>([]);
  const time = useRef(0);
  const placed = useRef(false);

  useEffect(() => {
    groups.forEach((g, gi) => {
      const mesh = lit.current[gi];
      if (!mesh) return;
      g.slots.forEach((s, i) => {
        const m = movers[s.mover];
        const cols = m.colors;
        mesh.setColorAt(i, C.set(cols ? cols[(s.train * m.cars + s.car) % cols.length] : '#ffffff'));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    placed.current = false;
  }, [groups, movers]);

  useFrame((_, delta) => {
    if (!animate && placed.current) return;
    const dt = animate ? Math.min(delta, 0.1) : 0;
    time.current += dt;
    // Advance each train: coasters and flumes speed up downhill and crawl up lifts.
    movers.forEach((m, mi) => {
      const d = dist.current[mi];
      if (!d) return;
      for (let t = 0; t < m.trains; t++) {
        let v = m.speed * m.scale;
        if (m.gravity) {
          sample(m.track, d[t], P, DIR);
          v = Math.max(m.speed * 0.35, Math.min(m.speed * 4, m.speed - m.gravity * DIR.y)) * m.scale;
        }
        d[t] += v * dt;
      }
    });
    groups.forEach((g, gi) => {
      const mesh = lit.current[gi];
      if (!mesh) return;
      const light = lights.current[gi];
      g.slots.forEach((s, i) => {
        const m = movers[s.mover];
        const d = dist.current[s.mover]?.[s.train] ?? 0;
        sample(m.track, d - s.car * m.gap * m.scale, P, DIR);
        const flat = Math.hypot(DIR.x, DIR.z) || 1e-6;
        E.set(0, Math.atan2(-DIR.z, DIR.x), m.level ? 0 : Math.atan2(DIR.y, flat));
        Q.setFromEuler(E);
        if (m.bob) P.y += Math.sin(time.current * 1.7 + s.train * 2.1 + s.mover) * m.bob * m.scale;
        M.compose(P, Q, S.setScalar(m.scale));
        mesh.setMatrixAt(i, M);
        light?.setMatrixAt(i, M);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (light) light.instanceMatrix.needsUpdate = true;
    });
    placed.current = true;
  });

  return (
    <>
      {groups.map((g, gi) => (
        <group key={`${g.key}-${g.slots.length}`}>
          <instancedMesh
            ref={(m) => {
              lit.current[gi] = m;
            }}
            args={[g.geo.lit, litMaterial(), g.slots.length]}
            frustumCulled={false}
          />
          {g.geo.glow && (
            <instancedMesh
              ref={(m) => {
                lights.current[gi] = m;
              }}
              args={[g.geo.glow, glowMaterial(), g.slots.length]}
              frustumCulled={false}
            />
          )}
        </group>
      ))}
    </>
  );
}

/** How fast a ride on a load-run-unload cycle is turning at time t (0 to 1). */
function cycleFactor(t: number, cycle?: [number, number]) {
  if (!cycle) return 1;
  const [run, period] = cycle;
  const u = t % period;
  const ramp = Math.min(3, run / 3);
  if (u < ramp) return u / ramp;
  if (u < run - ramp) return 1;
  if (u < run) return (run - u) / ramp;
  return 0;
}

function SpinNode({ spin, animate, run }: { spin: BuiltSpin; animate: boolean; run: RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const angle = useRef(spin.phase);
  const time = useRef(spin.phase * 3);
  const own = useRef(1);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = animate ? Math.min(delta, 0.1) : 0;
    time.current += dt;
    const f = spin.cycle ? cycleFactor(time.current, spin.cycle) : (run.current ?? 1);
    own.current = f;
    angle.current += spin.speed * f * dt;
    g.rotation[spin.axis] = angle.current;
    if (spin.bob) {
      const [amp, freq, ph] = spin.bob;
      g.position.y = spin.pivot[1] + Math.sin(time.current * freq + ph) * amp * (0.35 + 0.65 * f);
    }
  });
  return (
    <group ref={ref} position={spin.pivot}>
      <mesh geometry={spin.lit} material={litMaterial()} />
      {spin.glow && <mesh geometry={spin.glow} material={glowMaterial()} />}
      {spin.children.map((ch, i) => (
        <SpinNode key={i} spin={ch} animate={animate} run={own} />
      ))}
    </group>
  );
}

export function RideSpins({ spins, animate }: { spins: PlacedSpin[]; animate: boolean }) {
  const one = useRef(1);
  return (
    <>
      {spins.map((s, i) => (
        <group key={i} position={s.position} rotation={[0, s.yaw, 0]} scale={s.scale}>
          <SpinNode spin={s.spin} animate={animate} run={one} />
        </group>
      ))}
    </>
  );
}

export { track };
