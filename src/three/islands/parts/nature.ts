import { between, type Rng } from '../../core/math';
import type { ScenePalette } from '../../core/palette';
import type { MeshBuilder } from '../../core/builder';

/* Trees, palms, cypresses, bushes and flower beds. Sizes are in the people's scale:
   a pine is ~1.6 tall, a palm ~1.9. */

type B = MeshBuilder;

const tone = (rng: Rng, p: ScenePalette) => (rng() < 0.5 ? p.foliage : p.foliageAlt);

export function pine(b: B, rng: Rng, p: ScenePalette, x: number, z: number, s = 1, y = 0) {
  const c = tone(rng, p);
  b.cylinder(0.06 * s, 0.09 * s, 0.5 * s, 5, { position: [x, y + 0.25 * s, z], color: p.trunk });
  const spin = rng() * 3;
  b.cone(0.55 * s, 0.75 * s, 7, { position: [x, y + 0.72 * s, z], rotation: [0, spin, 0], color: c });
  b.cone(0.43 * s, 0.65 * s, 7, { position: [x, y + 1.07 * s, z], rotation: [0, spin + 0.4, 0], color: c });
  b.cone(0.28 * s, 0.5 * s, 7, { position: [x, y + 1.38 * s, z], rotation: [0, spin + 0.8, 0], color: c });
}

export function roundTree(b: B, rng: Rng, p: ScenePalette, x: number, z: number, s = 1, y = 0) {
  const c = tone(rng, p);
  b.cylinder(0.06 * s, 0.085 * s, 0.7 * s, 5, { position: [x, y + 0.35 * s, z], color: p.trunk });
  b.ico(0.42 * s, 1, { position: [x, y + 0.95 * s, z], rotation: [rng(), rng(), 0], scale: [1, 0.9, 1], color: c });
  b.ico(0.3 * s, 0, { position: [x + 0.22 * s, y + 0.8 * s, z + 0.1 * s], rotation: [rng(), rng(), 0], color: c });
  b.ico(0.28 * s, 0, { position: [x - 0.18 * s, y + 0.85 * s, z - 0.15 * s], rotation: [rng(), rng(), 0], color: c });
}

/** Tall, narrow Mediterranean cypress. */
export function cypress(b: B, rng: Rng, p: ScenePalette, x: number, z: number, s = 1, y = 0) {
  b.cylinder(0.04 * s, 0.05 * s, 0.25 * s, 4, { position: [x, y + 0.12 * s, z], color: p.trunk });
  b.lathe(
    [
      [0.0, 0],
      [0.17, 0.12],
      [0.2, 0.55],
      [0.13, 1.1],
      [0.0, 1.45],
    ].map(([r, h]) => [r * s, h * s] as [number, number]),
    7,
    { position: [x, y + 0.18 * s, z], rotation: [0, rng() * 3, 0], color: p.mode === 'dark' ? '#24573f' : '#3f8a5c' },
  );
}

/** A palm with a curved trunk and drooping fronds. */
export function palm(b: B, rng: Rng, p: ScenePalette, x: number, z: number, s = 1, y = 0) {
  const lean = rng() * Math.PI * 2;
  const lx = Math.cos(lean);
  const lz = Math.sin(lean);
  let px = x;
  let pz = z;
  let py = y;
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const bend = 0.05 * s * (i + 1) * 0.6;
    const nx = x + lx * bend * (i + 1) * 0.5;
    const nz = z + lz * bend * (i + 1) * 0.5;
    const ny = y + ((i + 1) / segs) * 1.75 * s;
    b.rod([px, py, pz], [nx, ny, nz], (0.07 - i * 0.008) * s, 5, { color: '#8a6b4a' });
    px = nx;
    py = ny;
    pz = nz;
  }
  const green = p.mode === 'dark' ? '#2f7d4f' : '#4caf6e';
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + rng() * 0.4;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const mid: [number, number, number] = [px + c * 0.38 * s, py + 0.08 * s, pz + sn * 0.38 * s];
    const tip: [number, number, number] = [px + c * 0.78 * s, py - 0.22 * s, pz + sn * 0.78 * s];
    b.beam([px, py, pz], mid, 0.16 * s, 0.025 * s, { color: green });
    b.beam(mid, tip, 0.11 * s, 0.02 * s, { color: green });
  }
  b.ico(0.08 * s, 0, { position: [px, py - 0.04 * s, pz], color: '#6b4f2a' });
}

export function bush(b: B, rng: Rng, p: ScenePalette, x: number, z: number, s = 1, y = 0, color?: string) {
  b.ico(0.22 * s, 0, { position: [x, y + 0.13 * s, z], rotation: [rng(), rng(), 0], scale: [1.2, 0.75, 1], color: color ?? tone(rng, p) });
}

const FLOWERS = ['#ff5d8f', '#ffd166', '#f8f9fa', '#c77dff', '#ff7b54', '#ef476f'];

/** A raised bed of flowers, w x d. */
export function flowerBed(b: B, rng: Rng, p: ScenePalette, x: number, z: number, w: number, d: number, angle = 0, y = 0) {
  b.box(w, 0.08, d, { position: [x, y + 0.04, z], rotation: [0, angle, 0], color: p.dirt });
  const n = Math.round(w * d * 22);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let i = 0; i < n; i++) {
    const u = (rng() - 0.5) * (w - 0.08);
    const v = (rng() - 0.5) * (d - 0.08);
    b.box(0.07, 0.06, 0.07, {
      position: [x + u * c + v * s, y + 0.1, z - u * s + v * c],
      color: rng() < 0.3 ? p.foliage : FLOWERS[Math.floor(rng() * FLOWERS.length)],
    });
  }
}

/** Scatter trees in a ring band, skipping keep-out circles [x, z, r]. */
export function forest(
  b: B,
  rng: Rng,
  p: ScenePalette,
  count: number,
  rMin: number,
  rMax: number,
  keepOut: Array<[number, number, number]>,
  kind: 'pine' | 'round' | 'mix' | 'palm' | 'cypress' = 'mix',
  scale: [number, number] = [0.8, 1.2],
) {
  let placed = 0;
  for (let tries = 0; tries < count * 15 && placed < count; tries++) {
    const a = rng() * Math.PI * 2;
    const r = between(rng, rMin, rMax);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (keepOut.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue;
    const s = between(rng, scale[0], scale[1]);
    if (kind === 'palm') palm(b, rng, p, x, z, s);
    else if (kind === 'cypress') cypress(b, rng, p, x, z, s);
    else if (kind === 'round' || (kind === 'mix' && rng() < 0.45)) roundTree(b, rng, p, x, z, s);
    else pine(b, rng, p, x, z, s);
    placed++;
  }
}

/** Trees in a straight row (avenues, car-park edges). */
export function treeRow(
  b: B,
  rng: Rng,
  p: ScenePalette,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  n: number,
  kind: 'pine' | 'round' | 'palm' | 'cypress' = 'round',
  s = 0.85,
) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    const k = s * between(rng, 0.9, 1.1);
    if (kind === 'palm') palm(b, rng, p, x, z, k);
    else if (kind === 'cypress') cypress(b, rng, p, x, z, k);
    else if (kind === 'pine') pine(b, rng, p, x, z, k);
    else roundTree(b, rng, p, x, z, k);
  }
}
