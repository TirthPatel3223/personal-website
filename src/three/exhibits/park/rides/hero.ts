import * as THREE from 'three';
import { palm, pine, roundTree } from '../../../islands/parts/nature';
import { person, randomLook } from '../../../islands/parts/people';
import { carGeometry } from './cars';
import {
  band,
  crag,
  curve2,
  curve3,
  darkTimber,
  festoon,
  flag,
  lantern,
  pool,
  posts,
  rails,
  rock,
  spinPart,
  steel,
  timber,
  toV3,
  torch,
  trough,
  water,
  windows,
  type RideCtx,
  type V2,
  type V3,
} from './kit';

/* The seven rides of the solver's example day, drawn bigger and in more detail than
   the rest (footprint radius 3.6). They are generic ride TYPES: a log flume, a
   mountain bobsled coaster, a pirate boat ride, a mine-train coaster, an indoor coaster
   under a dome, a big sci-fi dark ride and a jungle temple ride. */

/** A roofed loading shelter: posts and a pitched roof over a platform. */
export function shelter(c: RideCtx, x: number, z: number, yaw: number, w: number, d: number, h: number, roof: string, deck = '#9c8466') {
  const { lit } = c;
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  const at = (u: number, v: number): V2 => [x + u * cs + v * sn, z - u * sn + v * cs];
  lit.box(w, 0.12, d, { position: [x, 0.06, z], rotation: [0, yaw, 0], color: deck });
  for (const u of [-w / 2 + 0.06, w / 2 - 0.06]) {
    for (const v of [-d / 2 + 0.06, d / 2 - 0.06]) {
      const [px, pz] = at(u, v);
      lit.box(0.05, h, 0.05, { position: [px, h / 2 + 0.1, pz], color: darkTimber });
    }
  }
  lit.taperBox(w + 0.2, 0.28, d + 0.2, 0.55, 0.2, { position: [x, h + 0.24, z], rotation: [0, yaw, 0], color: roof });
}

/* ── Log flume ──────────────────────────────────────────────────────── */

export function flume(c: RideCtx) {
  const { lit, glow, glass, rng, p } = c;
  const hill = (x: number, z: number) => {
    const dx = x / 2.55;
    const dz = (z + 1.3) / 1.85;
    const q = 1 - dx * dx - dz * dz;
    return q > 0 ? 2.25 * Math.pow(q, 0.7) : 0;
  };
  const mud = c.night ? '#4f4232' : '#8a7356';
  crag(lit, rng, {
    x: 0,
    z: -1.3,
    rings: [[2.6, 0], [2.35, 0.65], [1.85, 1.35], [1.15, 1.95], [0.45, 2.25]],
    seg: 14,
    jitter: 0.07,
    squash: 0.72,
    apex: null,
    paint: (y, r) => (y > 1.7 ? (r() < 0.5 ? p.grass : p.grassDark) : r() < 0.35 ? mud : r() < 0.5 ? p.foliage : p.grassDark),
  });
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2;
    rock(lit, rng, Math.cos(a) * 2.3, 0.15, -1.3 + Math.sin(a) * 1.6, 0.18 + rng() * 0.15, c.night ? '#5d5a52' : '#9b9384');
  }

  const ctrl: V3[] = [
    [-2.0, 0.32, 1.75],
    [-2.9, 0.4, 0.55],
    [-2.85, 1.0, -0.95],
    [-2.05, 1.9, -2.35],
    [-0.6, 2.55, -3.05],
    [1.0, 2.62, -2.75],
    [2.15, 2.5, -1.6],
    [1.55, 2.6, -0.75],
    [0.95, 2.55, -0.25],
    [1.25, 1.25, 0.85],
    [1.6, 0.22, 1.85],
    [0.5, 0.2, 2.2],
    [-0.9, 0.22, 2.25],
  ];
  const pts = curve3(ctrl, true, 0.21);
  trough(lit, pts, true, { width: 0.5, wall: 0.2, color: '#7b5a3a', water: water(c) });
  posts(lit, pts, { every: 3, color: darkTimber, r: 0.035, ground: hill, brace: true, min: 0.3 });
  c.movers.push({ car: 'log', pts: toV3(pts.map((q) => q.clone().add(new THREE.Vector3(0, -0.02, 0)))), closed: true, trains: 5, cars: 1, gap: 1, speed: 1.0, gravity: 3.4, bob: 0.012 });

  // Splash pool at the foot of the drop, with spray.
  pool(lit, curve2([[0.9, 1.3], [2.4, 1.2], [2.6, 2.3], [1.6, 2.5], [0.8, 2.3]], true), 0.07, water(c));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    (c.night ? glow : lit).ico(0.07 + rng() * 0.05, 0, { position: [1.6 + Math.cos(a) * 0.45, 0.16, 1.85 + Math.sin(a) * 0.32], color: '#f1fbff' });
  }
  glass.cone(0.5, 0.7, 8, { position: [1.55, 0.45, 1.75], rotation: [Math.PI, 0, 0], color: '#e7f7ff' });

  // Station on the front run, with a moss-green roof.
  shelter(c, -1.75, 1.15, 2.45, 1.3, 0.7, 0.75, '#3a6b4f');
  for (let i = 0; i < 3; i++) person(lit, -1.95 + i * 0.25, 0.12, 0.85 + i * 0.2, 2.45 + Math.PI, randomLook(rng));

  // Cabin on the bluff, a jetty, lanterns and moss-hung trees.
  {
    const [x, z] = [-0.45, -1.25];
    const y = hill(x, z) - 0.05;
    lit.box(0.8, 0.45, 0.55, { position: [x, y + 0.22, z], rotation: [0, 0.3, 0], color: '#a68a64' });
    lit.taperBox(0.95, 0.25, 0.7, 0.2, 0.9, { position: [x, y + 0.57, z], rotation: [0, 0.3, 0], color: '#6c757d' });
    lit.box(0.1, 0.3, 0.1, { position: [x + 0.25, y + 0.75, z - 0.1], color: '#5c4a3a' });
    windows(c, x + 0.08, z + 0.28, 0.3, 0.5, y + 0.25, 1, 2, { h: 0.12, ww: 0.1 });
  }
  const moss = c.night ? '#7d8f7a' : '#a9b8a0';
  for (const [x, z, s] of [[2.95, 0.6, 1.0], [3.05, -0.85, 0.85], [-3.15, -1.55, 0.95], [2.55, 2.15, 0.8], [-2.9, 2.15, 0.75], [0.3, -1.6, 0.6]] as const) {
    const y = hill(x, z);
    lit.cylinder(0.07 * s, 0.12 * s, 0.9 * s, 6, { position: [x, y + 0.45 * s, z], color: '#5d4431' });
    lit.ico(0.55 * s, 1, { position: [x, y + 1.05 * s, z], scale: [1.2, 0.55, 1.2], color: c.night ? '#2d5b43' : '#4e8f62' });
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + rng();
      const rx = x + Math.cos(a) * 0.5 * s;
      const rz = z + Math.sin(a) * 0.5 * s;
      lit.beam([rx, y + 0.95 * s, rz], [rx, y + (0.5 + rng() * 0.2) * s, rz], 0.03, 0.03, { color: moss });
    }
  }
  for (const [x, z] of [[-1.35, 2.55], [1.35, 2.55], [-2.75, 1.35], [2.9, 1.7]] as const) lantern(c, x, z, 0.55);
  if (c.night) {
    for (let i = 0; i < 26; i++) {
      const a = rng() * Math.PI * 2;
      const d = 1 + rng() * 2.4;
      glow.ico(0.018, 0, { position: [Math.cos(a) * d, 0.3 + rng() * 1.2, -0.6 + Math.sin(a) * d], color: '#e6ff8a' });
    }
  }
}

/* ── Alpine bobsled coaster ─────────────────────────────────────────── */

const PEAK_RINGS: Array<[number, number]> = [[2.45, 0], [2.15, 1.0], [1.7, 2.2], [1.15, 3.4], [0.62, 4.6], [0.26, 5.6]];

function peakRadius(y: number) {
  for (let i = 1; i < PEAK_RINGS.length; i++) {
    const [r0, y0] = PEAK_RINGS[i - 1];
    const [r1, y1] = PEAK_RINGS[i];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return 0.1;
}

function peakHeight(d: number) {
  if (d >= PEAK_RINGS[0][0]) return 0;
  for (let i = 1; i < PEAK_RINGS.length; i++) {
    const [r0, y0] = PEAK_RINGS[i - 1];
    const [r1, y1] = PEAK_RINGS[i];
    if (d >= r1) return y0 + ((r0 - d) / (r0 - r1)) * (y1 - y0);
  }
  return 5.6;
}

export function alpine(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const cz = -0.55;
  const rockA = c.night ? '#6b7280' : '#8f96a3';
  const rockB = c.night ? '#565c68' : '#7a808c';
  const snow = c.night ? '#e9eef5' : '#ffffff';
  const paint = (snowLine: number) => (y: number, r: () => number) =>
    y > snowLine + 0.6 ? snow : y > snowLine ? (r() < 0.6 ? snow : rockA) : y < 0.6 ? (r() < 0.5 ? p.grassDark : rockB) : r() < 0.5 ? rockA : rockB;
  crag(lit, rng, { x: 0, z: cz, rings: PEAK_RINGS, seg: 11, jitter: 0.14, apex: [0.12, 6.5, cz - 0.1], paint: paint(3.6) });
  crag(lit, rng, { x: -1.35, z: cz - 0.75, rings: [[1.25, 0], [1.0, 1.3], [0.62, 2.6], [0.25, 3.5]], seg: 8, jitter: 0.18, apex: [-1.4, 4.2, cz - 0.8], paint: paint(2.7) });
  crag(lit, rng, { x: 1.4, z: cz - 0.95, rings: [[1.1, 0], [0.85, 1.1], [0.5, 2.2], [0.2, 2.9]], seg: 8, jitter: 0.18, apex: [1.45, 3.5, cz - 1.0], paint: paint(2.3) });

  // Twin tracks spiralling down the mountain, back up inside it through a tunnel.
  const turns = 2;
  for (const [k, off] of [[0, 0.62], [1, 1.02]] as const) {
    const ctrl: V3[] = [];
    const N = 20;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const a = -Math.PI / 2 - f * turns * Math.PI * 2;
      const y = 3.75 - f * 3.2;
      const rad = Math.min(3.05 - (k ? 0 : 0.4), peakRadius(y) + off) + Math.sin(a * 3 + k) * 0.12;
      ctrl.push([Math.cos(a) * rad, y + Math.sin(a * 2.5) * 0.18, cz + Math.sin(a) * rad]);
    }
    // Tunnel: into the rock at the bottom, up the core, out near the top.
    ctrl.push([0.3, 0.9, cz - 1.0], [0.1, 2.0, cz - 0.4], [-0.15, 3.3, cz - 0.6]);
    const pts = curve3(ctrl, true, 0.14);
    rails(lit, pts, true, { gauge: 0.26, radius: 0.025, color: steel(c), tie: '#5b6270', tieEvery: 3, spine: k ? '#c1121f' : '#3a5bd9' });
    posts(lit, pts, {
      every: 7,
      color: c.night ? '#9aa6b5' : '#c3cad4',
      r: 0.03,
      ground: (x, z) => peakHeight(Math.hypot(x, z - cz)),
      min: 0.35,
    });
    c.movers.push({ car: 'bobsled', pts: toV3(pts), closed: true, trains: 3, cars: 2, gap: 0.78, speed: 1.5, gravity: 2.2, colors: k ? ['#c1121f', '#ffffff'] : ['#3a5bd9', '#ffd166'] });
  }
  // Cave mouths where the tracks enter and leave the rock.
  for (const [x, y, z] of [[0.75, 0.75, cz - 2.0], [-0.55, 3.65, cz - 1.25]] as const) lit.ico(0.42, 0, { position: [x, y, z], scale: [1, 0.75, 0.6], color: '#1b1e24' });

  // Waterfall into a pond, chalet, pines.
  const fall = c.night ? glow : lit;
  fall.beam([1.15, 2.3, cz + 1.25], [1.55, 0.15, cz + 2.1], 0.32, 0.04, { color: c.night ? '#8fd3ff' : '#d8f1ff' });
  pool(lit, curve2([[1.0, 1.5], [2.3, 1.2], [2.6, 2.1], [1.6, 2.5], [0.9, 2.2]], true), 0.07, water(c));
  for (let i = 0; i < 6; i++) lit.ico(0.06, 0, { position: [1.55 + (rng() - 0.5) * 0.5, 0.12, 1.6 + (rng() - 0.5) * 0.3], color: '#ffffff' });
  {
    const [x, z, yaw] = [-2.3, 1.85, 0.6];
    lit.box(1.1, 0.6, 0.8, { position: [x, 0.3, z], rotation: [0, yaw, 0], color: c.night ? '#d9d0c1' : '#f4ecdf' });
    lit.box(1.12, 0.14, 0.82, { position: [x, 0.07, z], rotation: [0, yaw, 0], color: '#6b4f3a' });
    lit.taperBox(1.35, 0.55, 1.05, 0.08, 1, { position: [x, 0.87, z], rotation: [0, yaw, 0], color: '#7a2e1f' });
    for (const u of [-0.3, 0.3]) {
      const wx = x + u * Math.cos(yaw) + 0.41 * Math.sin(yaw);
      const wz = z - u * Math.sin(yaw) + 0.41 * Math.cos(yaw);
      (c.night ? glow : lit).box(0.16, 0.18, 0.02, { position: [wx, 0.36, wz], rotation: [0, yaw, 0], color: c.night ? p.window : p.glass });
    }
    c.signs.push({ text: 'BOBSLEDS', position: [x + 0.43 * Math.sin(yaw), 0.68, z + 0.43 * Math.cos(yaw)], rotationY: yaw, width: 0.9, height: 0.18, bg: '#7a2e1f', fg: '#fff3d6' });
  }
  for (const [x, z, s] of [[-3.0, 0.4, 1.0], [-2.8, -1.6, 1.15], [2.95, 0.15, 1.0], [2.7, -2.0, 1.1], [-1.7, 2.95, 0.8], [3.15, 1.25, 0.85], [0.2, -3.35, 0.9], [-2.0, -2.8, 0.95]] as const) {
    pine(lit, rng, p, x, z, s);
    lit.cone(0.3 * s, 0.22 * s, 7, { position: [x, 1.38 * s, z], color: snow });
  }
  glow.ico(0.06, 0, { position: [0.12, 6.6, cz - 0.1], color: '#ff4d4d' });
  flag(c, 0.12, 6.45, cz - 0.1, 0.5, '#ffffff');
}

/* ── Pirate boat ride ───────────────────────────────────────────────── */

export function boathouse(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const wall = c.night ? '#c9a496' : '#efcdbf';
  const wall2 = c.night ? '#b8a37a' : '#e9d6a6';
  const trim = c.night ? '#e9e2d0' : '#fffaf0';
  const roof = c.night ? '#3d4450' : '#58606d';

  // Show building at the back: a two-storey waterfront facade, balcony and mansard roof.
  lit.box(4.0, 1.9, 2.4, { position: [0, 0.95, -1.75], color: wall });
  lit.taperBox(4.1, 0.6, 2.5, 0.86, 0.7, { position: [0, 2.2, -1.75], color: roof });
  for (const s of [-1, 1]) {
    lit.box(1.0, 1.25, 1.1, { position: [s * 2.45, 0.625, -1.05], color: wall2 });
    lit.taperBox(1.1, 0.4, 1.2, 0.6, 0.6, { position: [s * 2.45, 1.45, -1.05], color: '#8a4343' });
    windows(c, s * 2.45, -0.49, 0, 0.6, 0.75, 1, 2, { h: 0.22, ww: 0.13, arch: true });
  }
  for (let i = 0; i < 4; i++) {
    const x = -1.5 + i;
    lit.box(0.32, 0.26, 0.3, { position: [x, 2.42, -0.95], color: roof });
    lit.taperBox(0.38, 0.16, 0.36, 0.1, 1, { position: [x, 2.63, -0.95], color: '#2b2f36' });
    (c.night ? glow : lit).box(0.14, 0.14, 0.02, { position: [x, 2.42, -0.79], color: c.night ? p.window : p.glass });
  }
  for (const x of [-1.6, 1.6]) lit.box(0.22, 0.6, 0.22, { position: [x, 2.6, -2.4], color: '#8a4343' });
  // Facade: ground-floor arches (two are the boat tunnels), upper windows, balcony.
  const fz = -0.54;
  lit.box(4.02, 0.08, 0.06, { position: [0, 0.98, fz], color: trim });
  for (const x of [-1.2, 1.2]) {
    lit.box(0.85, 0.75, 0.04, { position: [x, 0.38, fz], color: '#14161c' });
    lit.cylinder(0.425, 0.425, 0.04, 12, { position: [x, 0.75, fz], rotation: [Math.PI / 2, 0, 0], color: '#14161c' });
    lit.torus(0.45, 0.04, 4, 12, { position: [x, 0.75, fz + 0.02], color: trim });
  }
  windows(c, 0, fz - 0.01, 0, 1.2, 0.5, 1, 2, { h: 0.34, ww: 0.2, arch: true });
  windows(c, 0, fz - 0.01, 0, 3.6, 1.45, 1, 6, { h: 0.36, ww: 0.2, arch: true });
  lit.box(4.1, 0.05, 0.36, { position: [0, 1.05, fz + 0.18], color: '#4a3b30' });
  for (let i = 0; i <= 20; i++) lit.box(0.015, 0.26, 0.015, { position: [-2.0 + i * 0.2, 1.2, fz + 0.34], color: '#1f2228' });
  lit.box(4.1, 0.02, 0.02, { position: [0, 1.33, fz + 0.34], color: '#1f2228' });
  for (const x of [-1.9, -0.65, 0.65, 1.9]) lit.box(0.04, 0.3, 0.04, { position: [x, 0.9, fz + 0.34], color: '#1f2228' });
  c.signs.push({ text: 'PIRATE COVE', position: [0, 1.75, fz + 0.04], width: 1.8, height: 0.3, bg: '#2b1d14', fg: '#ffd166', font: 'Georgia, "Times New Roman", serif' });

  // Lagoon in front, with a stone edge.
  const edge = curve2([[-2.95, -0.5], [-3.15, 0.8], [-2.3, 2.05], [0, 2.35], [2.3, 2.05], [3.15, 0.8], [2.95, -0.5]], true, 0.3);
  pool(lit, edge, 0.06, water(c));
  band(lit, edge, 0.14, 0.05, 0.1, c.night ? '#7d7a72' : '#b9b1a0', true);

  // Boats loop out of one arch and back into the other.
  const loop = curve3(
    [[-1.2, 0.04, -2.2], [-1.2, 0.04, -0.6], [-1.9, 0.04, 0.5], [-1.4, 0.04, 1.65], [0, 0.04, 1.95], [1.4, 0.04, 1.65], [1.9, 0.04, 0.5], [1.2, 0.04, -0.6], [1.2, 0.04, -2.2], [0, 0.04, -2.6]],
    true,
    0.18,
  );
  c.movers.push({ car: 'boat', pts: toV3(loop), closed: true, trains: 6, cars: 1, gap: 1, speed: 0.5, bob: 0.02, colors: ['#8d0801', '#264653', '#7a5c2e'] });

  // A galleon moored by the lagoon, a dock with barrels, palms and lanterns.
  {
    const ship = carGeometry('ship', 1).lit.clone();
    lit.add(ship, { position: [2.62, 0.04, 1.15], rotation: [0, Math.PI / 2 + 0.15, 0], scale: 0.62 });
    glow.ico(0.04, 0, { position: [2.6, 0.5, 1.75], color: p.window });
  }
  lit.box(0.9, 0.08, 0.5, { position: [-2.45, 0.1, 1.5], rotation: [0, 0.5, 0], color: timber });
  for (let i = 0; i < 4; i++) {
    lit.cylinder(0.08, 0.08, 0.16, 8, { position: [-2.6 + i * 0.12, 0.22, 1.32 + (i % 2) * 0.12], color: '#7a5532' });
  }
  lit.box(0.2, 0.2, 0.2, { position: [-2.2, 0.24, 1.75], rotation: [0, 0.3, 0], color: '#9c7a4d' });
  for (const [x, z, s] of [[-3.15, -0.95, 1.0], [3.2, -0.6, 0.9], [-2.85, 2.35, 0.8]] as const) palm(lit, rng, p, x, z, s);
  for (const [x, z] of [[-1.5, 2.6], [1.5, 2.6], [-3.05, 0.2], [3.15, 0.2]] as const) lantern(c, x, z, 0.62);
  festoon(c, [-2.0, 1.32, fz + 0.34], [2.0, 1.32, fz + 0.34], 12, 0.12);
}

/* ── Mine-train coaster ─────────────────────────────────────────────── */

export function minetrain(c: RideCtx) {
  const { lit, glow, rng } = c;
  const bands = c.night ? ['#7a3218', '#b0582f', '#d08a5c', '#93421f', '#e0a875'] : ['#9c3f1f', '#c9622f', '#ef9f68', '#b04a25', '#f6c08c'];
  const strata = (y: number, r: () => number) => (r() < 0.06 ? bands[Math.floor(r() * 5)] : bands[Math.floor(y * 3.2) % 5]);
  crag(lit, rng, { x: -1.75, z: -1.5, rings: [[1.2, 0], [1.1, 0.4], [1.05, 0.8], [1.12, 1.2], [1.15, 1.55], [1.0, 1.95], [0.92, 2.3], [0.98, 2.6], [0.95, 2.9]], seg: 8, jitter: 0.1, apex: null, paint: strata });
  crag(lit, rng, { x: 1.55, z: -1.75, rings: [[1.0, 0], [0.93, 0.35], [0.9, 0.7], [0.95, 1.05], [0.95, 1.4], [0.8, 1.7], [0.7, 2.0]], seg: 7, jitter: 0.11, apex: null, paint: strata });
  crag(lit, rng, { x: 2.35, z: 1.55, rings: [[0.5, 0], [0.4, 0.7], [0.32, 1.3], [0.16, 1.8]], seg: 6, jitter: 0.2, paint: strata });
  crag(lit, rng, { x: -0.2, z: -3.0, rings: [[0.45, 0], [0.38, 0.8], [0.3, 1.5], [0.12, 2.1]], seg: 6, jitter: 0.2, paint: strata });
  for (let i = 0; i < 12; i++) rock(lit, rng, (rng() - 0.5) * 6, 0.1, (rng() - 0.5) * 5, 0.12 + rng() * 0.12, bands[i % 5]);
  // Sand-coloured ground.
  lit.cylinder(3.45, 3.5, 0.03, 28, { position: [0, 0.015, -0.1], color: c.night ? '#7a5a40' : '#d9b48a' });

  const ctrl: V3[] = [
    [-2.25, 0.32, 1.75],
    [-3.0, 0.42, 0.45],
    [-3.05, 1.1, -1.15],
    [-2.3, 2.0, -2.6],
    [-0.9, 2.35, -3.25],
    [0.9, 1.95, -3.15],
    [2.75, 1.2, -2.15],
    [3.15, 0.55, -0.4],
    [2.55, 0.85, 0.75],
    [1.25, 1.35, 0.55],
    [0.25, 1.6, -0.55],
    [-0.35, 1.05, -0.05],
    [-1.25, 0.55, 0.95],
  ];
  const pts = curve3(ctrl, true, 0.14);
  rails(lit, pts, true, { gauge: 0.28, radius: 0.022, color: '#3d3a36', tie: '#7a5532', tieEvery: 2, tieW: 0.06 });
  posts(lit, pts, { every: 3, color: c.night ? '#6e5136' : '#8a6845', r: 0.035, brace: true, min: 0.3 });
  c.movers.push({ car: 'mine', head: 'loco', pts: toV3(pts), closed: true, trains: 2, cars: 5, gap: 0.62, speed: 1.4, gravity: 1.8 });

  // Station, mine shack with a water wheel, ore carts, cacti, a pond.
  shelter(c, -1.75, 1.0, 2.6, 1.4, 0.7, 0.72, '#7a3520');
  {
    const [x, z] = [-0.55, -2.15];
    lit.box(0.9, 0.7, 0.6, { position: [x, 0.35, z], rotation: [0, 0.2, 0], color: '#8a6845' });
    lit.taperBox(1.0, 0.28, 0.7, 0.2, 1, { position: [x, 0.84, z], rotation: [0, 0.2, 0], color: '#6c757d' });
    windows(c, x + 0.06, z + 0.31, 0.2, 0.5, 0.42, 1, 2, { h: 0.14, ww: 0.12 });
    const wheel = spinPart(c);
    wheel.lit.torus(0.38, 0.04, 4, 16, { color: '#5e4129' });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      wheel.lit.beam([0, 0, 0], [Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0], 0.03, 0.03, { color: '#5e4129' });
      wheel.lit.box(0.12, 0.05, 0.14, { position: [Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0], rotation: [0, 0, a], color: '#7a5532' });
    }
    c.spins.push({ lit: wheel.lit, pivot: [x + 0.55, 0.42, z + 0.2], axis: 'z', speed: -0.9 });
    pool(lit, curve2([[x + 0.3, z + 0.45], [x + 1.2, z + 0.3], [x + 1.1, z + 0.95], [x + 0.4, z + 0.9]], true), 0.06, water(c));
  }
  for (const [x, z, a] of [[0.9, 2.3, 0.4], [1.3, 2.05, 0.4]] as const) {
    lit.taperBox(0.36, 0.18, 0.24, 1.1, 1.1, { position: [x, 0.14, z], rotation: [0, a, 0], color: '#5e4129' });
    lit.ico(0.12, 0, { position: [x, 0.26, z], scale: [1.2, 0.6, 0.9], color: '#c9a227' });
  }
  const cactus = c.night ? '#3d7a52' : '#4f9a63';
  for (const [x, z, s] of [[2.9, -0.95, 1], [-3.15, -0.6, 0.85], [1.75, 2.8, 0.75], [-2.75, 2.25, 0.8], [3.2, 0.9, 0.7]] as const) {
    lit.cylinder(0.07 * s, 0.08 * s, 0.75 * s, 7, { position: [x, 0.37 * s, z], color: cactus });
    lit.cylinder(0.045 * s, 0.045 * s, 0.25 * s, 6, { position: [x + 0.12 * s, 0.45 * s, z], color: cactus });
    lit.cylinder(0.045 * s, 0.045 * s, 0.2 * s, 6, { position: [x - 0.11 * s, 0.38 * s, z], color: cactus });
  }
  c.signs.push({ text: 'MINE TRAIN', position: [-1.75 + 0.4 * Math.sin(2.6), 1.12, 1.0 + 0.4 * Math.cos(2.6)], rotationY: 2.6 + Math.PI, width: 1.0, height: 0.2, bg: '#5e3b22', fg: '#ffe9a8', font: 'Georgia, serif' });
  for (const [x, z] of [[-1.4, 2.6], [1.4, 2.6]] as const) torch(c, x, z, 0.5);
  glow.ico(0.03, 0, { position: [-1.75, 2.95, -1.5], color: '#ff4d4d' });
}

/* ── Dome coaster ───────────────────────────────────────────────────── */

export function dome(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const cz = -0.65;
  const white = c.night ? '#dfe4ec' : '#f8f9fa';
  const prof: Array<[number, number]> = [[2.9, 0], [2.86, 0.3], [2.55, 1.2], [2.0, 2.3], [1.32, 3.3], [0.62, 4.1], [0.14, 4.6], [0, 4.62]];
  lit.lathe(prof, 28, { position: [0, 0, cz], color: white });
  // Ribs running up the dome.
  const ribs = 16;
  for (let k = 0; k < ribs; k++) {
    const a = (k / ribs) * Math.PI * 2;
    for (let i = 0; i < prof.length - 2; i++) {
      const [r0, y0] = prof[i];
      const [r1, y1] = prof[i + 1];
      lit.beam(
        [Math.cos(a) * (r0 + 0.07), y0, cz + Math.sin(a) * (r0 + 0.07)],
        [Math.cos(a) * (r1 + 0.07), y1, cz + Math.sin(a) * (r1 + 0.07)],
        0.08,
        0.06,
        { color: c.night ? '#aeb6c2' : '#dee2e6' },
      );
    }
  }
  lit.cylinder(2.92, 2.95, 0.3, 32, { position: [0, 0.15, cz], color: c.night ? '#4b5568' : '#8d99ae' });
  glow.torus(2.93, 0.03, 4, 64, { position: [0, 0.32, cz], rotation: [Math.PI / 2, 0, 0], color: c.night ? '#5ec8ff' : '#3a86ff' });
  lit.cylinder(0.03, 0.05, 1.2, 6, { position: [0, 5.2, cz], color: '#c3cad4' });
  glow.ico(0.08, 1, { position: [0, 5.85, cz], color: '#ff4d6d' });
  if (c.night) {
    for (let i = 0; i < 30; i++) {
      const a = rng() * Math.PI * 2;
      const y = 0.6 + rng() * 3.4;
      let r = 0;
      for (let k = 1; k < prof.length; k++) if (y <= prof[k][1]) { r = prof[k - 1][0] + ((y - prof[k - 1][1]) / (prof[k][1] - prof[k - 1][1])) * (prof[k][0] - prof[k - 1][0]); break; }
      glow.ico(0.03, 0, { position: [Math.cos(a) * (r + 0.02), y, cz + Math.sin(a) * (r + 0.02)], color: '#cfe8ff' });
    }
  }

  // A run of track bursts out of the dome on the back-right and dives back in.
  const ctrl: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = -0.15 - (i / 10) * 2.3;
    const y = 1.1 + Math.sin((i / 10) * Math.PI) * 1.1;
    const rad = 3.15 + Math.sin((i / 10) * Math.PI) * 0.15;
    ctrl.push([Math.cos(a) * rad, y, cz + Math.sin(a) * rad]);
  }
  ctrl.push([-1.0, 2.2, cz - 0.6], [-0.4, 2.9, cz + 0.6], [0.8, 2.0, cz + 0.8], [1.6, 1.3, cz + 0.6]);
  const pts = curve3(ctrl, true, 0.14);
  const outside = pts.filter((q) => Math.hypot(q.x, q.z - cz) > 2.45);
  rails(lit, pts, true, { gauge: 0.22, radius: 0.022, color: steel(c), tie: '#5b6270', tieEvery: 3, spine: '#4361ee' });
  posts(lit, outside, { every: 3, color: '#c3cad4', r: 0.03, min: 0.3 });
  c.movers.push({ car: 'spacecar', pts: toV3(pts), closed: true, trains: 2, cars: 3, gap: 0.58, speed: 2.0, gravity: 1.2 });

  // Entrance pylons and canopy over the queue, a ring sculpture, lights.
  for (const s of [-1, 1]) {
    lit.box(0.3, 2.6, 0.3, { position: [s * 1.45, 1.3, 2.35], color: white });
    lit.cone(0.2, 0.5, 4, { position: [s * 1.45, 2.85, 2.35], rotation: [0, Math.PI / 4, 0], color: white });
    glow.box(0.05, 2.2, 0.31, { position: [s * 1.45 + s * 0.16, 1.2, 2.35], color: c.night ? '#5ec8ff' : '#3a86ff' });
    glow.box(0.31, 2.2, 0.05, { position: [s * 1.45, 1.2, 2.51], color: c.night ? '#5ec8ff' : '#3a86ff' });
  }
  lit.box(3.2, 0.06, 1.4, { position: [0, 1.55, 1.8], color: white });
  glow.box(3.2, 0.03, 0.04, { position: [0, 1.52, 2.5], color: c.night ? '#5ec8ff' : '#3a86ff' });
  c.signs.push({ text: 'SPACE COASTER', position: [0, 1.75, 2.52], width: 2.0, height: 0.32, bg: '#0b1020', fg: '#9bdcff' });
  {
    const [x, z] = [-2.55, 1.55];
    lit.cylinder(0.05, 0.07, 1.4, 6, { position: [x, 0.7, z], color: '#8d99ae' });
    const s = spinPart(c);
    s.lit.torus(0.4, 0.03, 4, 24, { color: '#ffd166' });
    s.lit.torus(0.3, 0.03, 4, 24, { rotation: [Math.PI / 2, 0, 0], color: '#4cc9f0' });
    s.glow.ico(0.12, 1, { color: '#ff6b6b' });
    c.spins.push({ lit: s.lit, glow: s.glow, pivot: [x, 1.6, z], axis: 'y', speed: 0.8 });
  }
  for (const [x, z] of [[2.6, 1.55], [-1.4, 2.95], [1.4, 2.95]] as const) {
    lit.cylinder(0.025, 0.03, 0.75, 5, { position: [x, 0.37, z], color: '#5b6270' });
    glow.ico(0.06, 0, { position: [x, 0.8, z], color: c.night ? '#9bdcff' : '#ffffff' });
  }
  void p;
}

/* ── Sci-fi hangar dark ride ────────────────────────────────────────── */

export function hangar(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const hull = c.night ? '#7a8594' : '#aeb7c2';
  const dark = c.night ? '#3a4150' : '#5c6675';
  const cyan = c.night ? '#5ec8ff' : '#2b8fd6';
  const sand = c.night ? '#7d6650' : '#d8bf9a';
  lit.cylinder(3.45, 3.5, 0.03, 28, { position: [0, 0.015, -0.1], color: sand });

  // Main hangar: a long block with a vaulted roof.
  lit.box(4.4, 1.6, 2.5, { position: [0, 0.8, -1.55], color: hull });
  {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, Math.PI / 2, 0, 'YXZ'));
    lit.add(new THREE.CylinderGeometry(1.25, 1.25, 4.4, 16, 1, false, -Math.PI / 2, Math.PI), { position: [0, 1.6, -1.55], quaternion: q, color: dark });
  }
  for (let i = 0; i < 9; i++) {
    const x = -2.0 + i * 0.5;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, Math.PI / 2, 0, 'YXZ'));
    lit.add(new THREE.CylinderGeometry(1.28, 1.28, 0.06, 16, 1, false, -Math.PI / 2, Math.PI), { position: [x, 1.6, -1.55], quaternion: q, color: hull });
  }
  // Panel seams and the hangar door.
  for (let i = 0; i < 6; i++) lit.box(0.03, 1.6, 0.02, { position: [-2.0 + i * 0.8, 0.8, -0.29], color: dark });
  lit.box(2.0, 1.25, 0.05, { position: [0, 0.63, -0.27], color: '#20252e' });
  lit.box(2.0, 0.55, 0.06, { position: [0, 0.98, -0.25], color: dark });
  for (let i = 0; i < 4; i++) lit.box(0.48, 0.5, 0.07, { position: [-0.75 + i * 0.5, 0.98, -0.24], color: i % 2 ? hull : dark });
  glow.box(2.1, 0.05, 0.06, { position: [0, 1.3, -0.24], color: cyan });
  for (const s of [-1, 1]) glow.box(0.05, 1.25, 0.06, { position: [s * 1.03, 0.63, -0.24], color: cyan });
  glow.box(1.9, 0.3, 0.02, { position: [0, 0.18, -0.25], color: c.night ? '#2a4d6b' : '#8cb4d6' });
  // Side annex, tanks and stacked cargo.
  lit.box(0.9, 0.9, 1.3, { position: [2.55, 0.45, -0.9], color: dark });
  windows(c, 2.55, -0.24, 0, 0.6, 0.55, 1, 2, { h: 0.14, ww: 0.16, color: '#9bdcff' });
  for (const [x, z] of [[-2.6, 0.2], [-2.6, 0.65]] as const) {
    lit.cylinder(0.2, 0.2, 0.9, 10, { position: [x, 0.25, z], rotation: [0, 0, Math.PI / 2], color: '#d0d4da' });
    lit.box(0.06, 0.32, 0.06, { position: [x - 0.3, 0.12, z], color: dark });
    lit.box(0.06, 0.32, 0.06, { position: [x + 0.3, 0.12, z], color: dark });
  }
  for (let i = 0; i < 7; i++) {
    const x = -2.4 + (i % 3) * 0.32 + (rng() - 0.5) * 0.05;
    const z = 1.3 + Math.floor(i / 3) * 0.3;
    lit.box(0.28, 0.24, 0.26, { position: [x, 0.12 + (i > 5 ? 0.24 : 0), z], rotation: [0, rng() * 0.3, 0], color: i % 2 ? '#c9a227' : '#6c757d' });
  }

  // Desert rock spires around the back.
  const spire = c.night ? ['#9a6a45', '#7d5434', '#b07a50'] : ['#c69062', '#a8714a', '#dcab7c'];
  const paint = (y: number, r: () => number) => spire[(Math.floor(y * 1.7) + (r() < 0.2 ? 1 : 0)) % 3];
  crag(lit, rng, { x: -2.85, z: -1.55, rings: [[0.6, 0], [0.48, 1.3], [0.52, 2.4], [0.3, 3.6], [0.12, 4.3]], seg: 7, jitter: 0.2, paint });
  crag(lit, rng, { x: -1.4, z: -3.1, rings: [[0.5, 0], [0.42, 1.4], [0.45, 2.7], [0.24, 3.9], [0.08, 4.8]], seg: 7, jitter: 0.2, paint });
  crag(lit, rng, { x: 2.75, z: -2.05, rings: [[0.5, 0], [0.4, 1.2], [0.36, 2.3], [0.15, 3.1]], seg: 6, jitter: 0.2, paint });
  crag(lit, rng, { x: 1.0, z: -3.25, rings: [[0.35, 0], [0.3, 1.0], [0.2, 2.0], [0.08, 2.6]], seg: 6, jitter: 0.2, paint });

  // Radar dish on the roof (turns), masts with beacons.
  {
    const s = spinPart(c);
    s.lit.cylinder(0.04, 0.06, 0.5, 6, { position: [0, 0.25, 0], color: dark });
    s.lit.lathe([[0.02, 0], [0.25, 0.04], [0.45, 0.14], [0.55, 0.24]], 14, { position: [0, 0.55, 0.05], rotation: [-0.9, 0, 0], color: '#e9ecef' });
    s.lit.rod([0, 0.6, 0.1], [0, 0.95, 0.45], 0.012, 4, { color: dark });
    s.glow.ico(0.03, 0, { position: [0, 0.96, 0.46], color: '#ff4d4d' });
    c.spins.push({ lit: s.lit, glow: s.glow, pivot: [1.3, 2.75, -1.9], axis: 'y', speed: 0.45 });
  }
  for (const [x, h] of [[-1.5, 1.2], [-1.1, 0.8]] as const) {
    lit.cylinder(0.02, 0.025, h, 4, { position: [x, 2.7 + h / 2, -1.7], color: '#c3cad4' });
    glow.ico(0.035, 0, { position: [x, 2.7 + h, -1.7], color: '#ff4d4d' });
  }

  // Landing pad with a parked shuttle.
  {
    const [x, z] = [2.25, 1.35];
    lit.cylinder(0.9, 0.9, 0.06, 6, { position: [x, 0.03, z], color: '#4b5361' });
    glow.torus(0.82, 0.02, 4, 24, { position: [x, 0.07, z], rotation: [Math.PI / 2, 0, 0], color: '#ffb703' });
    lit.taperBox(0.95, 0.3, 0.5, 0.6, 0.7, { position: [x, 0.33, z], rotation: [0, 0.6, 0], color: '#e9ecef' });
    lit.box(0.35, 0.03, 1.2, { position: [x - 0.05, 0.28, z - 0.05], rotation: [0, 0.6, 0], color: '#adb5bd' });
    lit.box(0.06, 0.32, 0.06, { position: [x - 0.25, 0.6, z + 0.2], rotation: [0, 0.6, 0], color: '#adb5bd' });
    glow.box(0.1, 0.06, 0.32, { position: [x - 0.36, 0.33, z - 0.25], rotation: [0, 0.6, 0], color: '#ff8c42' });
    for (const [dx, dz] of [[-0.25, 0.25], [0.25, -0.25], [0.3, 0.3]] as const) lit.box(0.03, 0.18, 0.03, { position: [x + dx, 0.12, z + dz], color: '#495057' });
  }
  c.signs.push({ text: 'STARPORT', position: [0, 1.48, -0.24], width: 1.4, height: 0.22, bg: '#0b1020', fg: '#9bdcff' });
  for (const [x, z] of [[-1.4, 2.6], [1.4, 2.6], [-1.3, 0.3], [1.3, 0.3]] as const) {
    lit.box(0.08, 0.5, 0.08, { position: [x, 0.25, z], color: dark });
    glow.box(0.09, 0.08, 0.09, { position: [x, 0.52, z], color: cyan });
  }
  void p;
}

/* ── Jungle temple ──────────────────────────────────────────────────── */

export function temple(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const st = c.night ? ['#7d7a68', '#8c8873', '#6e6b5a'] : ['#a8a389', '#b8b398', '#96917a'];
  const moss = c.night ? '#3f6b45' : '#5c9b62';
  const cz = -1.5;
  lit.cylinder(3.45, 3.5, 0.03, 28, { position: [0, 0.015, -0.1], color: c.night ? '#3d5a3a' : '#6aa86f' });

  // Stepped temple with a shrine on top and a central stair.
  const tiers: Array<[number, number, number]> = [[3.9, 2.3, 0], [3.25, 1.85, 0.5], [2.6, 1.4, 1.0], [1.95, 0.95, 1.5]];
  tiers.forEach(([w, d, y], i) => {
    lit.box(w, 0.5, d, { position: [0, y + 0.25, cz], color: st[i % 3] });
    lit.box(w + 0.06, 0.06, d + 0.06, { position: [0, y + 0.5, cz], color: st[(i + 1) % 3] });
    for (let k = 0; k < 6; k++) {
      const u = (rng() - 0.5) * w;
      lit.box(0.3 + rng() * 0.3, 0.06, 0.08, { position: [u, y + 0.52, cz + d / 2], color: moss });
    }
  });
  for (let i = 0; i < 8; i++) lit.box(0.7, 0.25, 0.2, { position: [0, 0.125 + i * 0.25, cz + 1.25 - i * 0.12], color: st[i % 3] });
  lit.box(1.3, 0.75, 0.7, { position: [0, 2.37, cz], color: st[1] });
  for (const x of [-0.5, -0.17, 0.17, 0.5]) lit.cylinder(0.06, 0.07, 0.75, 6, { position: [x, 2.37, cz + 0.4], color: st[0] });
  lit.taperBox(1.6, 0.35, 1.0, 0.5, 0.5, { position: [0, 2.92, cz], color: st[2] });
  lit.box(0.4, 0.5, 0.05, { position: [0, 2.3, cz + 0.36], color: '#1b1a16' });
  glow.box(0.22, 0.22, 0.02, { position: [0, 2.35, cz + 0.39], color: '#ffb347' });
  // Glyph band.
  for (let k = 0; k < 9; k++) lit.box(0.16, 0.16, 0.03, { position: [-1.2 + k * 0.3, 1.25, cz + 0.72], color: k % 2 ? '#5f5b4c' : '#77725f' });

  // Vines down the tiers.
  for (let i = 0; i < 14; i++) {
    const x = (rng() - 0.5) * 3.4;
    const top = 0.5 + rng() * 1.4;
    const d = tiers.find(([w, , y]) => y <= top && Math.abs(x) < w / 2)?.[1] ?? 2.3;
    lit.beam([x, top, cz + d / 2 + 0.02], [x + (rng() - 0.5) * 0.1, top - 0.5 - rng() * 0.4, cz + d / 2 + 0.03], 0.04, 0.02, { color: moss });
  }

  // Stone gateway with torches.
  for (const s of [-1, 1]) {
    lit.box(0.4, 1.4, 0.4, { position: [s * 1.05, 0.7, 0.55], color: st[0] });
    lit.box(0.5, 0.12, 0.5, { position: [s * 1.05, 1.46, 0.55], color: st[2] });
    torch(c, s * 1.45, 0.85, 0.65);
  }
  lit.box(2.7, 0.35, 0.45, { position: [0, 1.65, 0.55], color: st[1] });
  for (let k = 0; k < 5; k++) lit.box(0.3, 0.2, 0.04, { position: [-1.0 + k * 0.5, 1.65, 0.79], color: '#5f5b4c' });
  lit.ico(0.22, 0, { position: [0, 1.95, 0.6], scale: [1.2, 1, 0.8], color: st[2] });
  glow.box(0.05, 0.05, 0.02, { position: [-0.08, 1.98, 0.78], color: '#ff6b35' });
  glow.box(0.05, 0.05, 0.02, { position: [0.08, 1.98, 0.78], color: '#ff6b35' });

  // Jungle-track ride vehicles circle the temple on a dirt road.
  const road = curve2(
    Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return [Math.cos(a) * 3.15, -1.0 + Math.sin(a) * 2.35] as V2;
    }),
    true,
    0.25,
  );
  band(lit, road, 0.5, 0.03, 0.04, c.night ? '#6b5139' : '#a57e57', true);
  c.movers.push({ car: 'jeep', pts: road.map(([x, z]) => [x, 0.05, z] as V3), closed: true, trains: 2, cars: 1, gap: 1, speed: 0.9, level: true });

  // Jungle: palms, broad leaves, broken columns.
  for (const [x, z, s] of [[-3.2, 0.95, 1.05], [3.05, 1.35, 0.95], [-2.55, 2.1, 0.8], [3.25, -0.25, 0.9], [-3.3, -0.4, 0.85], [2.1, -3.15, 0.8]] as const) palm(lit, rng, p, x, z, s);
  for (let i = 0; i < 16; i++) {
    const a = rng() * Math.PI * 2;
    const d = 2.6 + rng() * 0.8;
    const x = Math.cos(a) * d;
    const z = -0.6 + Math.sin(a) * d * 0.8;
    if (z > 2.3 && Math.abs(x) < 1.3) continue;
    for (let k = 0; k < 4; k++) {
      const b = (k / 4) * Math.PI * 2 + rng();
      lit.beam([x, 0.05, z], [x + Math.cos(b) * 0.28, 0.28 + rng() * 0.12, z + Math.sin(b) * 0.28], 0.14, 0.02, { color: rng() < 0.5 ? p.foliage : moss });
    }
  }
  for (const [x, z, h] of [[-1.9, 0.9, 0.6], [1.9, 0.75, 0.35], [-0.6, -3.1, 0.5]] as const) {
    lit.cylinder(0.14, 0.15, h, 8, { position: [x, h / 2, z], color: st[0] });
  }
  lit.cylinder(0.14, 0.14, 0.7, 8, { position: [2.0, 0.14, 0.2], rotation: [0, 0.5, Math.PI / 2], color: st[1] });
  roundTree(lit, rng, p, -2.4, -2.6, 0.9);
  roundTree(lit, rng, p, 2.6, -2.2, 0.85);
}
