'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowMaterial, litMaterial } from '../../core/materials';
import { mulberry32, type Rng } from '../../core/math';
import type { ScenePalette } from '../../core/palette';
import { randomLook, walkerGeometries, type Look } from './people';
import type { V2, V3 } from './types';
import { CAR_COLORS, vehicleGeometry, type VehicleKind } from './vehicles';

/* Things that move along tracks: walking people and vehicles. Each kind is one
   InstancedMesh (two for people: clothes and heads, so both can be tinted), so a
   whole island's traffic costs a handful of draw calls. Open tracks are driven back
   and forth; closed ones loop. */

export interface Track {
  pts: THREE.Vector3[];
  cum: number[];
  total: number;
  closed: boolean;
}

export function track(points: Array<V2 | V3>, closed = false, y = 0): Track {
  const pts = points.map((p) => (p.length === 3 ? new THREE.Vector3(p[0], p[1], p[2]) : new THREE.Vector3(p[0], y, p[1])));
  const cum = [0];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) cum.push(cum[i] + pts[i].distanceTo(pts[(i + 1) % pts.length]));
  return { pts, cum, total: cum[cum.length - 1], closed };
}

const SC = new THREE.Vector3();

/** Position and unit direction at distance d. Returns -1 when travelling backwards on an open track. */
export function sample(t: Track, d: number, pos: THREE.Vector3, dir: THREE.Vector3): 1 | -1 {
  let sign: 1 | -1 = 1;
  let s = d;
  if (t.closed) s = ((d % t.total) + t.total) % t.total;
  else {
    const m = ((d % (2 * t.total)) + 2 * t.total) % (2 * t.total);
    if (m > t.total) {
      s = 2 * t.total - m;
      sign = -1;
    } else s = m;
  }
  let lo = 0;
  let hi = t.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t.cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const a = t.pts[lo];
  const b = t.pts[(lo + 1) % t.pts.length];
  const seg = t.cum[lo + 1] - t.cum[lo] || 1;
  pos.lerpVectors(a, b, (s - t.cum[lo]) / seg);
  dir.subVectors(b, a).normalize();
  if (sign < 0) dir.negate();
  return sign;
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler(0, 0, 0, 'YZX');
const P = new THREE.Vector3();
const DIR = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);
const COL = new THREE.Color();

/* ── People ─────────────────────────────────────────────────────────────── */

export interface WalkerGroup {
  track: Track;
  count: number;
  speed?: [number, number];
  /** Sideways spread across the path. */
  spread?: number;
  look?: (rng: Rng) => Look;
}

interface Walker {
  track: Track;
  d0: number;
  v: number;
  lat: number;
  phase: number;
}

export function Walkers({ groups, animate, seed = 1 }: { groups: WalkerGroup[]; animate: boolean; seed?: number }) {
  const geo = useMemo(() => walkerGeometries(), []);
  useEffect(
    () => () => {
      geo.body.dispose();
      geo.head.dispose();
    },
    [geo],
  );
  const { walkers, looks } = useMemo(() => {
    const rng = mulberry32(seed);
    const list: Walker[] = [];
    const lk: Look[] = [];
    for (const g of groups) {
      const [v0, v1] = g.speed ?? [0.32, 0.5];
      for (let i = 0; i < g.count; i++) {
        list.push({
          track: g.track,
          d0: rng() * g.track.total * (g.track.closed ? 1 : 2),
          v: (v0 + (v1 - v0) * rng()) * (rng() < 0.5 && g.track.closed ? -1 : 1),
          lat: (rng() - 0.5) * 2 * (g.spread ?? 0.18),
          phase: rng() * 10,
        });
        lk.push((g.look ?? randomLook)(rng));
      }
    }
    return { walkers: list, looks: lk };
  }, [groups, seed]);
  const body = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const placed = useRef(false);

  useEffect(() => {
    const b = body.current;
    const h = head.current;
    if (!b || !h) return;
    looks.forEach((l, i) => {
      b.setColorAt(i, COL.set(l.shirt));
      h.setColorAt(i, COL.set(l.skin));
    });
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    if (h.instanceColor) h.instanceColor.needsUpdate = true;
    placed.current = false;
  }, [looks]);

  useFrame((_, dt) => {
    const b = body.current;
    const h = head.current;
    if (!b || !h) return;
    if (!animate && placed.current) return;
    if (animate) time.current += Math.min(dt, 0.1);
    const t = time.current;
    walkers.forEach((w, i) => {
      sample(w.track, w.d0 + t * w.v, P, DIR);
      if (w.v < 0) DIR.negate();
      P.x += -DIR.z * w.lat;
      P.z += DIR.x * w.lat;
      P.y += Math.abs(Math.sin((t + w.phase) * 9)) * 0.012;
      Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(DIR.x, DIR.z));
      M.compose(P, Q, ONE);
      b.setMatrixAt(i, M);
      h.setMatrixAt(i, M);
    });
    b.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    placed.current = true;
  });

  if (!walkers.length) return null;
  return (
    <>
      <instancedMesh ref={body} args={[geo.body, litMaterial(), walkers.length]} frustumCulled={false} />
      <instancedMesh ref={head} args={[geo.head, litMaterial(), walkers.length]} frustumCulled={false} />
    </>
  );
}

/* ── Vehicles ───────────────────────────────────────────────────────────── */

export interface FleetSpec {
  kind: VehicleKind;
  track: Track;
  count?: number;
  /** Units per second. */
  speed: number;
  colors?: string[];
  /** Offset to the right of the direction of travel (keep-right lanes). */
  lane?: number;
  /** Start distance of the first vehicle (others are spread evenly). */
  offset?: number;
  /** Towed trailers that follow (baggage carts). */
  trailers?: { kind: VehicleKind; count: number; spacing: number; colors?: string[] };
  /** Scale of the model. */
  scale?: number;
}

interface Unit {
  kind: VehicleKind;
  track: Track;
  d0: number;
  v: number;
  lane: number;
  color: string;
  scale: number;
}

export function Fleet({ specs, palette, animate, seed = 3 }: { specs: FleetSpec[]; palette: ScenePalette; animate: boolean; seed?: number }) {
  const units = useMemo(() => {
    const rng = mulberry32(seed);
    const out: Unit[] = [];
    for (const s of specs) {
      const n = s.count ?? 1;
      const span = s.track.closed ? s.track.total : s.track.total * 2;
      for (let i = 0; i < n; i++) {
        const d0 = (s.offset ?? rng() * span) + (i * span) / n;
        const colors = s.colors ?? CAR_COLORS;
        const scale = s.scale ?? 1;
        out.push({ kind: s.kind, track: s.track, d0, v: s.speed, lane: s.lane ?? 0, color: colors[Math.floor(rng() * colors.length)], scale });
        if (s.trailers) {
          for (let j = 1; j <= s.trailers.count; j++) {
            const tc = s.trailers.colors ?? ['#495057'];
            out.push({
              kind: s.trailers.kind,
              track: s.track,
              d0: d0 - j * s.trailers.spacing * Math.sign(s.speed || 1),
              v: s.speed,
              lane: s.lane ?? 0,
              color: tc[Math.floor(rng() * tc.length)],
              scale,
            });
          }
        }
      }
    }
    return out;
  }, [specs, seed]);

  const kinds = useMemo(() => Array.from(new Set(units.map((u) => u.kind))), [units]);
  const geoms = useMemo(() => {
    const m = new Map<VehicleKind, ReturnType<typeof vehicleGeometry>>();
    for (const k of kinds) m.set(k, vehicleGeometry(k, palette.glow));
    return m;
  }, [kinds, palette.glow]);
  useEffect(
    () => () => {
      for (const g of geoms.values()) {
        g.body.dispose();
        g.lights?.dispose();
      }
    },
    [geoms],
  );
  const byKind = useMemo(() => kinds.map((k) => units.map((u, i) => (u.kind === k ? i : -1)).filter((i) => i >= 0)), [kinds, units]);
  const bodies = useRef<Array<THREE.InstancedMesh | null>>([]);
  const lights = useRef<Array<THREE.InstancedMesh | null>>([]);
  const time = useRef(0);
  const placed = useRef(false);

  useEffect(() => {
    byKind.forEach((idx, k) => {
      const mesh = bodies.current[k];
      if (!mesh) return;
      idx.forEach((u, j) => mesh.setColorAt(j, COL.set(units[u].color)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    placed.current = false;
  }, [byKind, units]);

  useFrame((_, dt) => {
    if (!animate && placed.current) return;
    if (animate) time.current += Math.min(dt, 0.1);
    const t = time.current;
    byKind.forEach((idx, k) => {
      const mesh = bodies.current[k];
      if (!mesh) return;
      const light = lights.current[k];
      idx.forEach((u, j) => {
        const unit = units[u];
        sample(unit.track, unit.d0 + t * unit.v, P, DIR);
        if (unit.v < 0) DIR.negate();
        const flat = Math.hypot(DIR.x, DIR.z) || 1;
        P.x += (-DIR.z / flat) * unit.lane;
        P.z += (DIR.x / flat) * unit.lane;
        E.set(0, Math.atan2(-DIR.z, DIR.x), Math.atan2(DIR.y, flat));
        Q.setFromEuler(E);
        M.compose(P, Q, SC.set(unit.scale, unit.scale, unit.scale));
        mesh.setMatrixAt(j, M);
        light?.setMatrixAt(j, M);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (light) light.instanceMatrix.needsUpdate = true;
    });
    placed.current = true;
  });

  return (
    <>
      {kinds.map((kind, k) => {
        const g = geoms.get(kind)!;
        const n = byKind[k].length;
        return (
          <group key={kind}>
            <instancedMesh
              ref={(m) => {
                bodies.current[k] = m;
              }}
              args={[g.body, litMaterial(), n]}
              frustumCulled={false}
            />
            {g.lights && (
              <instancedMesh
                ref={(m) => {
                  lights.current[k] = m;
                }}
                args={[g.lights, glowMaterial(), n]}
                frustumCulled={false}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

