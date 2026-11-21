import * as THREE from 'three';
import { MeshBuilder } from '../../../core/builder';
import { mulberry32, type Rng } from '../../../core/math';
import type { ScenePalette } from '../../../core/palette';
import type { SignSpec } from '../../../islands/parts/signs';

/* Every ride is drawn in its own frame: centred on the origin, its front (where the
   queue and entrance arch go) facing +z, inside a disc of radius `r` (3.6 for the
   seven rides of the planned day, 2.8 or 2.2 for the rest; people are 0.36 tall).
   The strip |x| < 1.15, z > r - 1.15 stays clear at ground level: the exhibit puts
   the queue there. The scene then stamps the static parts into the island's merged
   meshes and turns the moving parts (trains, boats, spinning arms) into instances. */

export type V2 = [number, number];
export type V3 = [number, number, number];

/** A train of cars running round a track (or back and forth on an open one). */
export interface MoverDef {
  /** Car model (see cars.ts); faces +x, wheels or hull on y = 0. */
  car: string;
  /** Model of the first car of each train, if different (a locomotive). */
  head?: string;
  pts: V3[];
  closed: boolean;
  trains: number;
  cars: number;
  /** Distance between car centres. */
  gap: number;
  /** Units per second on the level. */
  speed: number;
  /** Extra speed per unit of downhill slope (coasters, flumes). */
  gravity?: number;
  /** Vertical bob for boats. */
  bob?: number;
  /** Tints for the cars (they are built white where they take paint). */
  colors?: string[];
  /** Keep cars level instead of pitching with the track. */
  level?: boolean;
}

/** A part that turns about a pivot (and may carry other turning parts). */
export interface SpinDef {
  lit: MeshBuilder;
  glow?: MeshBuilder;
  pivot: V3;
  axis: 'x' | 'y' | 'z';
  /** Radians per second. */
  speed: number;
  /** Starting angle. */
  phase?: number;
  /** Up and down: [amplitude, radians per second, phase]. */
  bob?: [number, number, number];
  /** Turn round for `cycle[0]` seconds of every `cycle[1]` (rides load between runs). */
  cycle?: [number, number];
  children?: SpinDef[];
}

export interface RideCtx {
  lit: MeshBuilder;
  glow: MeshBuilder;
  glass: MeshBuilder;
  signs: SignSpec[];
  movers: MoverDef[];
  spins: SpinDef[];
  p: ScenePalette;
  rng: Rng;
  r: number;
  night: boolean;
  /** HDR multiplier for glow parts built in separate builders (spinning parts). */
  glowScale: number;
}

export function newCtx(p: ScenePalette, seed: number, r: number): RideCtx {
  return {
    lit: new MeshBuilder(),
    glow: new MeshBuilder(p.glow),
    glass: new MeshBuilder(),
    signs: [],
    movers: [],
    spins: [],
    p,
    rng: mulberry32(seed),
    r,
    night: p.mode === 'dark',
    glowScale: p.glow,
  };
}

/** A fresh builder pair for a spinning part. */
export function spinPart(c: RideCtx) {
  return { lit: new MeshBuilder(), glow: new MeshBuilder(c.glowScale) };
}

/* ── Colours ────────────────────────────────────────────────────────── */

export const water = (c: RideCtx) => (c.night ? '#1d5f8f' : '#58a8e0');
export const waterDeep = (c: RideCtx) => (c.night ? '#174a73' : '#3f8fcb');
export const lagoon = (c: RideCtx) => (c.night ? '#14707a' : '#3fc1c9');
export const stone = (c: RideCtx) => (c.night ? '#8d8a80' : '#c9c2b3');
export const timber = '#8a6240';
export const darkTimber = '#5e4129';
export const steel = (c: RideCtx) => (c.night ? '#c9d1db' : '#eef1f5');
export const lampGlow = (c: RideCtx) => c.p.window;

/* ── Geometry helpers ───────────────────────────────────────────────── */

/** Smooth closed or open curve through 3D control points, sampled every `step`. */
export function curve3(ctrl: V3[], closed: boolean, step = 0.15): THREE.Vector3[] {
  const c = new THREE.CatmullRomCurve3(
    ctrl.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    closed,
    'catmullrom',
    0.5,
  );
  const n = Math.max(8, Math.round(c.getLength() / step));
  const pts = c.getSpacedPoints(n);
  if (closed) pts.pop();
  return pts;
}

export const toV3 = (pts: THREE.Vector3[]): V3[] => pts.map((p) => [p.x, p.y, p.z]);

/** Horizontal side vectors along a track (right-hand side of travel). */
export function sides(pts: THREE.Vector3[], closed: boolean) {
  const out: THREE.Vector3[] = [];
  const t = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[closed ? (i - 1 + pts.length) % pts.length : Math.max(0, i - 1)];
    const b = pts[closed ? (i + 1) % pts.length : Math.min(pts.length - 1, i + 1)];
    t.subVectors(b, a);
    t.y = 0;
    if (t.lengthSq() < 1e-9) t.set(1, 0, 0);
    t.normalize();
    out.push(new THREE.Vector3(-t.z, 0, t.x));
  }
  return out;
}

/** Two rails (tubes) either side of a track, with ties every few samples. */
export function rails(
  b: MeshBuilder,
  pts: THREE.Vector3[],
  closed: boolean,
  o: { gauge: number; radius: number; color: string; tie?: string; tieEvery?: number; tieW?: number; spine?: string },
) {
  const side = sides(pts, closed);
  for (const s of [-1, 1]) {
    const rail = pts.map((p, i) => p.clone().addScaledVector(side[i], (s * o.gauge) / 2));
    if (closed) rail.push(rail[0].clone());
    b.tube(new THREE.CatmullRomCurve3(rail, false), rail.length, o.radius, 4, { color: o.color });
  }
  if (o.spine) {
    const sp = pts.map((p) => p.clone().add(new THREE.Vector3(0, -o.radius * 2.2, 0)));
    if (closed) sp.push(sp[0].clone());
    b.tube(new THREE.CatmullRomCurve3(sp, false), Math.ceil(sp.length / 2), o.radius * 1.6, 4, { color: o.spine });
  }
  if (o.tie) {
    const every = o.tieEvery ?? 2;
    for (let i = 0; i < pts.length; i += every) {
      const p = pts[i];
      const s = side[i];
      const half = o.gauge / 2 + o.radius * 2;
      b.beam(
        [p.x - s.x * half, p.y - o.radius * 1.5, p.z - s.z * half],
        [p.x + s.x * half, p.y - o.radius * 1.5, p.z + s.z * half],
        o.tieW ?? 0.05,
        0.03,
        { color: o.tie },
      );
    }
  }
}

/** Posts from the track down to the ground (or a surface), every `every` samples. */
export function posts(
  b: MeshBuilder,
  pts: THREE.Vector3[],
  o: { every: number; color: string; r?: number; min?: number; ground?: (x: number, z: number) => number; skip?: (p: THREE.Vector3) => boolean; brace?: boolean },
) {
  for (let i = 0; i < pts.length; i += o.every) {
    const p = pts[i];
    const g = o.ground ? o.ground(p.x, p.z) : 0;
    const h = p.y - 0.06 - g;
    if (h < (o.min ?? 0.25)) continue;
    if (o.skip?.(p)) continue;
    b.cylinder(o.r ?? 0.04, (o.r ?? 0.04) * 1.3, h, 5, { position: [p.x, g + h / 2, p.z], color: o.color });
    if (o.brace && h > 0.9) {
      b.beam([p.x - 0.2, g, p.z], [p.x, g + h * 0.6, p.z], 0.03, 0.03, { color: o.color });
      b.beam([p.x + 0.2, g, p.z], [p.x, g + h * 0.6, p.z], 0.03, 0.03, { color: o.color });
    }
  }
}

/** A flat band along ground points (rivers, roads, canals), rounded at the joints. */
export function band(b: MeshBuilder, pts: V2[], width: number, y: number, h: number, color: string, closed: boolean) {
  const n = closed ? pts.length : pts.length - 1;
  const heading: number[] = [];
  for (let i = 0; i < n; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(az - bz, bx - ax);
    heading.push(yaw);
    if (len < 1e-4) continue;
    // Segments overlap a little so gentle bends need no joint.
    b.box(len + width * 0.16, h, width, { position: [(ax + bx) / 2, y, (az + bz) / 2], rotation: [0, yaw, 0], color });
  }
  // Round joints only where the band turns sharply.
  pts.forEach(([x, z], i) => {
    if (!closed && (i === 0 || i === pts.length - 1)) return;
    const a = heading[(i - 1 + heading.length) % heading.length];
    const c = heading[i % heading.length];
    let turn = Math.abs(c - a);
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    if (turn > 0.3) b.cylinder(width / 2, width / 2, h, 8, { position: [x, y, z], color });
  });
}

/** Sample a smooth ground curve (Catmull-Rom) through control points. */
export function curve2(ctrl: V2[], closed: boolean, step = 0.25): V2[] {
  return curve3(
    ctrl.map(([x, z]) => [x, 0, z] as V3),
    closed,
    step,
  ).map((p) => [p.x, p.z] as V2);
}

/** Offset a closed ground loop sideways (positive = right of travel). */
export function offsetLoop(pts: V2[], d: number): V2[] {
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    let tx = b[0] - a[0];
    let tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    return [p[0] - tz * d, p[1] + tx * d];
  });
}

function loopArea(pts: V2[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[(i + 1) % pts.length];
    a += x0 * z1 - x1 * z0;
  }
  return Math.abs(a / 2);
}

/** The two banks of a closed channel of width 2d: { outer, inner } by enclosed area. */
export function banks(line: V2[], d: number) {
  const a = offsetLoop(line, d);
  const b = offsetLoop(line, -d);
  return loopArea(a) > loopArea(b) ? { outer: a, inner: b } : { outer: b, inner: a };
}

/** A water surface (or any flat area) bounded by a closed outline, with optional holes. */
export function pool(b: MeshBuilder, outline: V2[], y: number, color: string, holes: V2[][] = [], depth = 0.04) {
  b.slab(outline, y - depth, y, { color }, holes);
}

/** An irregular rock. */
export function rock(b: MeshBuilder, rng: Rng, x: number, y: number, z: number, s: number, color: string) {
  b.ico(s, 0, {
    position: [x, y, z],
    rotation: [rng() * 3, rng() * 3, rng() * 3],
    scale: [1 + rng() * 0.4, 0.6 + rng() * 0.4, 1 + rng() * 0.3],
    color,
  });
}

/**
 * A jagged peak or butte: rings of (radius, height) with jittered vertices, closed
 * by a point or flat top. `paint` picks each triangle's colour from its height.
 */
export function crag(
  b: MeshBuilder,
  rng: Rng,
  o: {
    x: number;
    z: number;
    rings: Array<[number, number]>;
    seg?: number;
    jitter?: number;
    apex?: V3 | null;
    paint: (y: number, rng: Rng) => string;
    squash?: number;
    twist?: number;
  },
) {
  const seg = o.seg ?? 9;
  const jit = o.jitter ?? 0.18;
  const sq = o.squash ?? 1;
  const ringPts = o.rings.map(([r, y], k) =>
    Array.from({ length: seg }, (_, i) => {
      const a = (i / seg) * Math.PI * 2 + (o.twist ?? 0) * k + (rng() - 0.5) * 0.25;
      const rr = r * (1 + (rng() - 0.5) * 2 * jit);
      return new THREE.Vector3(o.x + Math.cos(a) * rr, y + (k > 0 ? (rng() - 0.5) * jit * 0.6 : 0), o.z + Math.sin(a) * rr * sq);
    }),
  );
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  const tri = (a: THREE.Vector3, bb: THREE.Vector3, d: THREE.Vector3) => {
    pos.push(a.x, a.y, a.z, bb.x, bb.y, bb.z, d.x, d.y, d.z);
    c.set(o.paint((a.y + bb.y + d.y) / 3, rng));
    for (let i = 0; i < 3; i++) col.push(c.r, c.g, c.b);
  };
  for (let k = 0; k < ringPts.length - 1; k++) {
    const lo = ringPts[k];
    const hi = ringPts[k + 1];
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      tri(lo[i], hi[j], lo[j]);
      tri(lo[i], hi[i], hi[j]);
    }
  }
  const top = ringPts[ringPts.length - 1];
  const cy = top.reduce((s, p) => s + p.y, 0) / seg;
  const apex = o.apex === null ? new THREE.Vector3(o.x, cy, o.z) : o.apex ? new THREE.Vector3(...o.apex) : new THREE.Vector3(o.x, cy + 0.6, o.z);
  for (let i = 0; i < seg; i++) tri(top[i], apex, top[(i + 1) % seg]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  b.add(g);
}

/** A U-shaped trough along a track (flume channel), with water in it. */
export function trough(b: MeshBuilder, pts: THREE.Vector3[], closed: boolean, o: { width: number; wall: number; color: string; water: string }) {
  const side = sides(pts, closed);
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const c = pts[(i + 1) % pts.length];
    const sa = side[i];
    for (const s of [-1, 1]) {
      const off = (s * o.width) / 2;
      b.beam([a.x + sa.x * off, a.y + o.wall / 2 - 0.04, a.z + sa.z * off], [c.x + sa.x * off, c.y + o.wall / 2 - 0.04, c.z + sa.z * off], 0.05, o.wall, { color: o.color });
    }
    b.beam([a.x, a.y - 0.07, a.z], [c.x, c.y - 0.07, c.z], o.width + 0.05, 0.05, { color: o.color });
    b.beam([a.x, a.y - 0.035, a.z], [c.x, c.y - 0.035, c.z], o.width - 0.02, 0.02, { color: o.water });
  }
}

/** Lantern on a post: a dark post with a glowing box. */
export function lantern(c: RideCtx, x: number, z: number, h = 0.7, color?: string) {
  c.lit.cylinder(0.02, 0.025, h, 5, { position: [x, h / 2, z], color: '#2f2a26' });
  c.lit.box(0.1, 0.03, 0.1, { position: [x, h + 0.08, z], color: '#2f2a26' });
  c.glow.box(0.07, 0.1, 0.07, { position: [x, h + 0.02, z], color: color ?? lampGlow(c) });
}

/** A flaming torch (stone or wood post with a glowing flame). */
export function torch(c: RideCtx, x: number, z: number, h = 0.6) {
  c.lit.cylinder(0.035, 0.05, h, 5, { position: [x, h / 2, z], color: '#4a3b2c' });
  c.lit.cylinder(0.07, 0.05, 0.06, 6, { position: [x, h + 0.02, z], color: '#3b302a' });
  c.glow.cone(0.06, 0.18, 5, { position: [x, h + 0.13, z], color: '#ff9b3d' });
}

/** A string of festoon bulbs between two points. */
export function festoon(c: RideCtx, a: V3, bb: V3, n = 8, sag = 0.15) {
  const colors = ['#ffd166', '#ff8fab', '#9bf6ff', '#caffbf'];
  let prev = a;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const p: V3 = [a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (bb[2] - a[2]) * t];
    c.lit.beam(prev, p, 0.008, 0.008, { color: '#2b2d42' });
    if (i < n) c.glow.ico(0.03, 0, { position: [p[0], p[1] - 0.03, p[2]], color: colors[i % colors.length] });
    prev = p;
  }
}

/** A flagpole with a pennant. */
export function flag(c: RideCtx, x: number, y: number, z: number, h: number, color: string) {
  c.lit.cylinder(0.012, 0.012, h, 4, { position: [x, y + h / 2, z], color: '#d9d9d9' });
  c.lit.box(0.22, 0.12, 0.01, { position: [x + 0.11, y + h - 0.08, z], color });
}

/** Rings of glowing bulbs (marquee lights) along a ground-space segment at height y. */
export function bulbs(c: RideCtx, a: V3, bb: V3, n: number, color?: string) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    c.glow.ico(0.025, 0, { position: [a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t], color: color ?? '#ffe7a3' });
  }
}

/** Windows on a wall: glowing at night, glass by day. (x, z) is the wall's centre, facing `yaw`. */
export function windows(c: RideCtx, x: number, z: number, yaw: number, w: number, y0: number, rows: number, cols: number, o: { h?: number; ww?: number; dy?: number; arch?: boolean; color?: string } = {}) {
  const h = o.h ?? 0.22;
  const ww = o.ww ?? 0.14;
  const dy = o.dy ?? 0.45;
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const u = cols === 1 ? 0 : -w / 2 + (w * (k + 0.5)) / cols;
      const px = x + u * cs;
      const pz = z - u * sn;
      const py = y0 + r * dy;
      const on = c.night && c.rng() < 0.8;
      (on ? c.glow : c.lit).box(ww, h, 0.03, { position: [px, py, pz], rotation: [0, yaw, 0], color: on ? (o.color ?? c.p.window) : c.p.glass });
      if (o.arch) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, yaw, 0, 'YXZ'));
        (on ? c.glow : c.lit).cylinder(ww / 2, ww / 2, 0.03, 8, { position: [px, py + h / 2, pz], quaternion: q, color: on ? (o.color ?? c.p.window) : c.p.glass });
      }
    }
  }
}

/** Seeded pick from a list. */
export const pick = <T,>(rng: Rng, a: readonly T[]) => a[Math.floor(rng() * a.length)];
