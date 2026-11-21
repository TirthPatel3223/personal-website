import { palm, pine, roundTree, bush } from '../../../islands/parts/nature';
import { person, randomLook } from '../../../islands/parts/people';
import { dome as hemisphere, roofPrism } from '../../../islands/parts/structures';
import { shelter } from './hero';
import {
  band,
  banks,
  crag,
  curve2,
  darkTimber,
  flag,
  lagoon,
  lantern,
  offsetLoop,
  pool,
  rock,
  spinPart,
  timber,
  water,
  waterDeep,
  type RideCtx,
  type V2,
  type V3,
} from './kit';

/* Boat and river rides (footprint radius 2.8). Rivers are closed loops: a water band
   with banks, the boats riding its centre line. */

const flat = (pts: V2[], y: number): V3[] => pts.map(([x, z]) => [x, y, z]);

function river(c: RideCtx, ctrl: V2[], width: number, color?: string) {
  const line = curve2(ctrl, true, 0.2);
  const outer = offsetLoop(line, width / 2);
  const inner = offsetLoop(line, -width / 2);
  const bank = c.night ? '#5a4a38' : '#a58a68';
  band(c.lit, outer, 0.12, 0.04, 0.08, bank, true);
  band(c.lit, inner, 0.12, 0.04, 0.08, bank, true);
  band(c.lit, line, width, 0.03, 0.04, color ?? water(c), true);
  return line;
}

function dock(c: RideCtx, x: number, z: number, yaw: number, w = 0.9, d = 0.45) {
  c.lit.box(w, 0.06, d, { position: [x, 0.1, z], rotation: [0, yaw, 0], color: timber });
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  for (const u of [-w / 2, w / 2]) for (const v of [-d / 2, d / 2]) c.lit.cylinder(0.025, 0.025, 0.22, 5, { position: [x + u * cs + v * sn, 0.08, z - u * sn + v * cs], color: darkTimber });
}

/* ── Explorer canoes ────────────────────────────────────────────────── */

export function canoes(c: RideCtx) {
  const { lit, rng, p } = c;
  const line = river(c, [[-2.2, 0.9], [-2.3, -0.9], [-1.0, -2.3], [0.9, -2.2], [2.3, -1.0], [2.2, 0.8], [0.9, 1.15], [-0.9, 1.25]], 0.8);
  // Wooded island in the middle with a log cabin.
  pool(lit, curve2([[-1.4, 0.3], [-1.3, -1.2], [0.0, -1.55], [1.3, -1.1], [1.4, 0.2], [0, 0.5]], true), 0.05, p.grassDark, [], 0.05);
  for (const [x, z, s] of [[-0.9, -0.9, 0.85], [0.8, -1.0, 0.95], [1.0, 0.0, 0.7], [-0.4, -0.2, 0.7]] as const) pine(lit, rng, p, x, z, s);
  lit.box(0.6, 0.35, 0.42, { position: [0, 0.22, -0.65], rotation: [0, 0.3, 0], color: '#7a5532' });
  for (let i = 0; i < 4; i++) lit.cylinder(0.035, 0.035, 0.62, 5, { position: [0, 0.07 + i * 0.09, -0.65], rotation: [0, 0.3, Math.PI / 2], color: '#6b4a2c' });
  roofPrism(lit, 0, -0.65, 0.4, 0.5, 0.7, 0.3, 0.3 + Math.PI / 2, '#5e4129');
  dock(c, -1.75, 1.55, 0.3);
  for (let i = 0; i < 3; i++) lit.box(0.9, 0.06, 0.16, { position: [-2.35, 0.1 + i * 0.07, 1.95 + i * 0.03], rotation: [0, 0.3, 0], color: '#a0522d' });
  c.movers.push({ car: 'canoe', pts: flat(line, 0.05), closed: true, trains: 4, cars: 1, gap: 1, speed: 0.45, bob: 0.015 });
  for (const [x, z, s] of [[2.55, 1.55, 0.9], [-2.75, -1.6, 1.0], [2.5, -2.0, 0.9], [-0.2, -2.75, 0.8]] as const) pine(lit, rng, p, x, z, s);
  flag(c, 0.4, 0.05, -0.2, 0.9, '#c1121f');
}

/* ── Whimsical facade boat ride ─────────────────────────────────────── */

export function facade(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const white = c.night ? '#e6e9ef' : '#ffffff';
  const gold = '#e0b54a';
  const pastel = ['#ffafcc', '#a2d2ff', '#cdb4db', '#bde0fe', '#ffc8dd', '#caffbf'];
  // The facade block.
  lit.box(4.2, 1.2, 1.3, { position: [0, 0.6, -1.55], color: white });
  for (let i = 0; i < 11; i++) {
    const x = -2.0 + i * 0.4;
    const h = 0.25 + ((i * 7) % 5) * 0.12;
    const kind = i % 3;
    const col = pastel[i % pastel.length];
    if (kind === 0) lit.cone(0.16, h + 0.2, 4, { position: [x, 1.2 + (h + 0.2) / 2, -0.95], rotation: [0, Math.PI / 4, 0], color: col });
    else if (kind === 1) {
      lit.cylinder(0.12, 0.12, h, 8, { position: [x, 1.2 + h / 2, -0.95], color: col });
      lit.ico(0.11, 1, { position: [x, 1.2 + h + 0.08, -0.95], color: gold });
    } else lit.box(0.22, h, 0.22, { position: [x, 1.2 + h / 2, -0.95], color: col });
  }
  // Clock tower in the middle.
  lit.box(0.75, 2.1, 0.5, { position: [0, 1.05, -0.95], color: white });
  lit.cone(0.5, 0.8, 4, { position: [0, 2.5, -0.95], rotation: [0, Math.PI / 4, 0], color: gold });
  lit.ico(0.09, 1, { position: [0, 2.95, -0.95], color: gold });
  c.signs.push({
    text: '',
    position: [0, 1.6, -0.69],
    width: 0.5,
    height: 0.5,
    bg: 'transparent',
    fg: '#000',
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#fff8e1';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = w * 0.06;
      ctx.stroke();
      ctx.strokeStyle = '#3d2b1f';
      ctx.lineWidth = w * 0.04;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2, h * 0.18);
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w * 0.72, h * 0.6);
      ctx.stroke();
    },
  });
  for (const s of [-1, 1]) {
    lit.box(0.6, 0.6, 0.04, { position: [s * 1.05, 0.3, -0.89], color: '#1b1d24' });
    lit.cylinder(0.3, 0.3, 0.04, 12, { position: [s * 1.05, 0.6, -0.89], rotation: [Math.PI / 2, 0, 0], color: '#1b1d24' });
    lit.torus(0.32, 0.03, 4, 12, { position: [s * 1.05, 0.6, -0.87], color: gold });
  }
  for (let i = 0; i < 12; i++) (c.night ? glow : lit).box(0.06, 0.06, 0.02, { position: [-2.0 + i * 0.36, 0.95, -0.89], color: c.night ? '#ffe7a3' : gold });
  // Canal in front: boats come out of one arch and go back into the other.
  const line = curve2([[-1.05, -1.4], [-1.05, -0.5], [-1.9, 0.4], [-1.2, 1.15], [0, 1.25], [1.2, 1.15], [1.9, 0.4], [1.05, -0.5], [1.05, -1.4], [0, -1.8]], true, 0.2);
  pool(lit, curve2([[-2.4, -0.85], [-2.55, 0.6], [-1.4, 1.6], [0, 1.65], [1.4, 1.6], [2.55, 0.6], [2.4, -0.85]], true), 0.05, c.night ? '#2c6f9f' : '#7cc6f2');
  c.movers.push({ car: 'boat', pts: flat(line, 0.03), closed: true, trains: 5, cars: 1, gap: 1, speed: 0.4, bob: 0.015, colors: pastel });
  // Topiary.
  for (const [x, z] of [[-0.55, 0.35], [0.55, 0.35]] as const) {
    lit.cylinder(0.05, 0.05, 0.2, 5, { position: [x, 0.1, z], color: '#5d4431' });
    lit.ico(0.2, 1, { position: [x, 0.35, z], color: p.foliage });
    lit.ico(0.12, 1, { position: [x + 0.15, 0.55, z], color: p.foliageAlt });
  }
  bush(lit, rng, p, -2.55, 1.5, 1.1);
  bush(lit, rng, p, 2.55, 1.5, 1.1);
}

/* ── Jungle river cruise ────────────────────────────────────────────── */

export function jungle(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const line = river(c, [[-2.1, 1.0], [-2.4, -0.6], [-1.4, -2.2], [0.4, -2.3], [2.1, -1.4], [2.35, 0.3], [1.3, 1.25], [-0.6, 1.0]], 1.0, c.night ? '#24707a' : '#4fb0a5');
  c.movers.push({ car: 'jungleboat', pts: flat(line, 0.05), closed: true, trains: 3, cars: 1, gap: 1, speed: 0.45, bob: 0.02 });
  // Jungle island in the middle: palms, broad leaves, a waterfall over rocks.
  pool(lit, curve2([[-1.3, 0.2], [-1.4, -1.0], [-0.2, -1.5], [1.2, -1.0], [1.3, 0.0], [0.0, 0.3]], true), 0.05, c.night ? '#2b5a3c' : '#4f9a63', [], 0.05);
  crag(lit, rng, { x: 0.3, z: -0.7, rings: [[0.6, 0], [0.5, 0.5], [0.3, 0.95]], seg: 6, jitter: 0.25, apex: null, paint: () => (c.night ? '#5b5d5a' : '#8b8f88') });
  (c.night ? glow : lit).beam([0.35, 0.92, -0.25], [0.45, 0.06, 0.15], 0.25, 0.03, { color: c.night ? '#9fe3ff' : '#e3f7ff' });
  for (const [x, z, s] of [[-0.8, -0.6, 0.9], [0.9, -0.25, 0.75], [-0.3, -1.15, 0.8], [2.6, 1.5, 0.9], [-2.7, 1.6, 0.85], [2.6, -2.0, 0.95], [-2.7, -1.5, 0.9], [0.0, -2.75, 0.8]] as const) palm(lit, rng, p, x, z, s);
  for (let i = 0; i < 14; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * 1.1;
    const x = Math.cos(a) * d;
    const z = -0.6 + Math.sin(a) * d * 0.7;
    for (let k = 0; k < 4; k++) {
      const b = (k / 4) * Math.PI * 2 + rng();
      lit.beam([x, 0.05, z], [x + Math.cos(b) * 0.25, 0.25 + rng() * 0.1, z + Math.sin(b) * 0.25], 0.12, 0.02, { color: rng() < 0.5 ? p.foliage : p.foliageAlt });
    }
  }
  // Boathouse with a thatched roof at the front-left.
  shelter(c, -1.95, 1.75, 0.5, 1.0, 0.55, 0.55, c.night ? '#9b8455' : '#d8bf7a');
  c.signs.push({ text: 'RIVER CRUISE', position: [-1.95 + 0.33 * Math.sin(0.5), 0.88, 1.75 + 0.33 * Math.cos(0.5)], rotationY: 0.5, width: 0.9, height: 0.16, bg: '#2d6a4f', fg: '#fff3d6' });
  // A hippo and a crocodile peeking out of the water.
  lit.ico(0.14, 0, { position: [1.75, 0.07, 0.55], scale: [1.4, 0.6, 1], color: '#6d6875' });
  lit.box(0.4, 0.05, 0.1, { position: [-1.85, 0.06, -1.3], rotation: [0, 0.8, 0], color: '#3d5a3a' });
}

/* ── Sailing ship ───────────────────────────────────────────────────── */

export function ship(c: RideCtx) {
  const { lit, rng, p } = c;
  const line = curve2(Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [Math.cos(a) * 1.85, -0.35 + Math.sin(a) * 1.55] as V2;
  }), true, 0.2);
  const { outer, inner } = banks(line, 0.6);
  pool(lit, outer, 0.05, waterDeep(c), [inner]);
  band(lit, outer, 0.12, 0.04, 0.08, c.night ? '#5a4a38' : '#a58a68', true);
  band(lit, inner, 0.12, 0.04, 0.08, c.night ? '#5a4a38' : '#a58a68', true);
  for (const [x, z, s] of [[0, -0.4, 0.95], [-0.5, 0.0, 0.7], [0.5, -0.8, 0.75]] as const) pine(lit, rng, p, x, z, s);
  rock(lit, rng, 0.45, 0.1, 0.0, 0.2, c.night ? '#6b6b6b' : '#9c9c9c');
  c.movers.push({ car: 'ship', pts: flat(line, 0.05), closed: true, trains: 1, cars: 1, gap: 1, speed: 0.3, bob: 0.025 });
  dock(c, 1.95, 1.45, -0.6, 1.0, 0.4);
  lit.beam([1.6, 0.16, 1.15], [1.3, 0.3, 0.85], 0.12, 0.02, { color: timber });
  for (const [x, z] of [[2.45, 1.0], [-2.3, 1.3]] as const) lantern(c, x, z, 0.6);
  for (const [x, z, s] of [[-2.55, -1.5, 1.0], [2.5, -1.6, 0.9], [-2.4, 0.4, 0.8]] as const) roundTree(lit, rng, p, x, z, s);
}

/* ── Canal boats past miniature villages ────────────────────────────── */

export function canal(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const line = curve2([[-2.1, 1.0], [-2.3, -0.5], [-1.5, -1.9], [0, -2.3], [1.6, -1.9], [2.35, -0.4], [2.0, 1.0], [0.8, 1.2], [0.2, 0.2], [-0.6, 1.2]], true, 0.18);
  const outer = offsetLoop(line, 0.32);
  const inner = offsetLoop(line, -0.32);
  band(lit, outer, 0.08, 0.05, 0.1, c.night ? '#7d7a72' : '#cfc6b4', true);
  band(lit, inner, 0.08, 0.05, 0.1, c.night ? '#7d7a72' : '#cfc6b4', true);
  band(lit, line, 0.62, 0.03, 0.04, water(c), true);
  c.movers.push({ car: 'canoe', pts: flat(line, 0.04), closed: true, trains: 4, cars: 1, gap: 1, speed: 0.3, bob: 0.01 });
  // Hill with a tiny castle, little villages, a windmill and bridges.
  crag(lit, rng, { x: 0, z: -0.9, rings: [[1.25, 0], [1.0, 0.35], [0.6, 0.7], [0.3, 0.85]], seg: 10, jitter: 0.1, apex: null, paint: (y, r) => (r() < 0.5 ? p.grass : p.grassDark) });
  {
    const y = 0.82;
    const wall = c.night ? '#d9d2e9' : '#f3effa';
    lit.box(0.5, 0.25, 0.32, { position: [0, y + 0.12, -0.9], color: wall });
    for (const [dx, dz] of [[-0.25, -0.16], [0.25, -0.16], [-0.25, 0.16], [0.25, 0.16]] as const) {
      lit.cylinder(0.06, 0.06, 0.4, 6, { position: [dx, y + 0.2, -0.9 + dz], color: wall });
      lit.cone(0.08, 0.16, 6, { position: [dx, y + 0.48, -0.9 + dz], color: dx < 0 ? '#3a5bd9' : '#ff5d8f' });
    }
    lit.cylinder(0.08, 0.08, 0.55, 6, { position: [0, y + 0.28, -0.95], color: wall });
    lit.cone(0.11, 0.25, 6, { position: [0, y + 0.68, -0.95], color: '#3a5bd9' });
  }
  const cols = ['#ffb4a2', '#f4e1c1', '#d7f0f5', '#e2f0cb', '#fde2e4'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rng() * 0.3;
    const d = 1.45 + rng() * 0.25;
    const x = Math.cos(a) * d;
    const z = -0.6 + Math.sin(a) * d * 0.75;
    if (z > 0.6) continue;
    lit.box(0.16, 0.13, 0.13, { position: [x, 0.065, z], rotation: [0, a, 0], color: cols[i % cols.length] });
    roofPrism(lit, x, z, 0.13, 0.17, 0.15, 0.1, a, i % 2 ? '#c2524f' : '#6c7b91');
    if (c.night) glow.box(0.04, 0.04, 0.01, { position: [x + Math.cos(a) * 0.0, 0.07, z + 0.066], color: p.window });
  }
  {
    const [x, z] = [-1.15, -0.5];
    lit.cylinder(0.08, 0.11, 0.42, 6, { position: [x, 0.21, z], color: '#f4e1c1' });
    lit.cone(0.12, 0.14, 6, { position: [x, 0.49, z], color: '#8a4343' });
    const s = spinPart(c);
    for (let k = 0; k < 4; k++) s.lit.box(0.03, 0.34, 0.01, { position: [Math.cos((k * Math.PI) / 2) * 0.17, Math.sin((k * Math.PI) / 2) * 0.17, 0], rotation: [0, 0, (k * Math.PI) / 2], color: '#fbf6e9' });
    c.spins.push({ lit: s.lit, pivot: [x, 0.38, z + 0.13], axis: 'z', speed: 1.1 });
  }
  for (const [x, z, a] of [[-2.25, 0.25, 0.1], [2.25, 0.3, -0.1]] as const) {
    lit.beam([x - 0.35 * Math.cos(a), 0.12, z], [x, 0.22, z], 0.3, 0.04, { color: c.night ? '#a68a64' : '#d4b483' });
    lit.beam([x, 0.22, z], [x + 0.35 * Math.cos(a), 0.12, z], 0.3, 0.04, { color: c.night ? '#a68a64' : '#d4b483' });
  }
  for (const [x, z] of [[-2.5, 1.6], [2.5, 1.6]] as const) lantern(c, x, z, 0.55);
}

/* ── Submarine lagoon ───────────────────────────────────────────────── */

export function subs(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const outline = curve2([[-2.4, 1.0], [-2.6, -0.6], [-1.6, -2.2], [0.4, -2.55], [2.1, -1.7], [2.55, 0.0], [2.0, 1.25], [0.9, 1.55], [-0.9, 1.5]], true, 0.25);
  pool(lit, outline, 0.06, lagoon(c));
  band(lit, outline, 0.16, 0.05, 0.12, c.night ? '#8d8574' : '#e6d5b0', true);
  const line = curve2([[-1.7, 0.6], [-1.9, -0.6], [-1.0, -1.7], [0.6, -1.85], [1.7, -1.0], [1.8, 0.3], [0.6, 0.9], [-0.6, 0.95]], true, 0.2);
  c.movers.push({ car: 'sub', pts: flat(line, 0.02), closed: true, trains: 3, cars: 1, gap: 1, speed: 0.4, bob: 0.02 });
  // Reef in the middle, coral, a lava-rock waterfall at the back.
  const coral = ['#ff7b54', '#ff5d8f', '#ffd166', '#c77dff'];
  for (let i = 0; i < 14; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * 0.55;
    lit.ico(0.08 + rng() * 0.08, 0, { position: [Math.cos(a) * d, 0.08, -0.45 + Math.sin(a) * d * 0.7], rotation: [rng(), rng(), 0], color: coral[i % 4] });
  }
  rock(lit, rng, 0, 0.12, -0.45, 0.3, c.night ? '#4b4f58' : '#7d838c');
  crag(lit, rng, { x: 0.6, z: -2.2, rings: [[0.7, 0], [0.55, 0.6], [0.35, 1.1]], seg: 7, jitter: 0.25, apex: null, paint: () => (c.night ? '#3d4048' : '#6c717a') });
  (c.night ? glow : lit).beam([0.55, 1.05, -1.75], [0.5, 0.07, -1.3], 0.3, 0.03, { color: c.night ? '#9fe3ff' : '#e3f7ff' });
  // A small lighthouse and a dock.
  lit.cylinder(0.14, 0.2, 0.9, 10, { position: [-2.3, 0.45, -1.55], color: '#ffffff' });
  for (const y of [0.25, 0.6]) lit.cylinder(0.18, 0.18, 0.08, 10, { position: [-2.3, y, -1.55], color: '#d62828' });
  glow.cylinder(0.1, 0.1, 0.14, 8, { position: [-2.3, 0.98, -1.55], color: '#fff1c1' });
  lit.cone(0.16, 0.18, 8, { position: [-2.3, 1.14, -1.55], color: '#d62828' });
  dock(c, 1.85, 1.6, -0.5, 0.9, 0.4);
  for (const [x, z] of [[2.55, 0.9], [-2.4, 1.6]] as const) palm(lit, rng, p, x, z, 0.85);
}

/* ── Island fort ────────────────────────────────────────────────────── */

export function fort(c: RideCtx) {
  const { lit, rng, p } = c;
  const outline = curve2([[-2.5, 0.9], [-2.6, -0.9], [-1.3, -2.3], [0.9, -2.4], [2.4, -1.2], [2.5, 0.6], [1.4, 1.5], [-1.2, 1.55]], true, 0.25);
  const island = curve2([[-1.45, 0.2], [-1.45, -1.1], [-0.3, -1.65], [1.2, -1.4], [1.55, -0.3], [0.9, 0.5], [-0.4, 0.55]], true, 0.25);
  pool(lit, outline, 0.05, water(c), [island]);
  band(lit, outline, 0.14, 0.05, 0.1, c.night ? '#5a4a38' : '#a58a68', true);
  pool(lit, island, 0.06, p.grassDark, [], 0.06);
  // Log stockade with two blockhouses.
  const fx = 0.05;
  const fz = -0.55;
  const w = 1.5;
  const d = 1.0;
  const log = '#7a5532';
  for (const [ax, az, bx, bz] of [[-w / 2, -d / 2, w / 2, -d / 2], [w / 2, -d / 2, w / 2, d / 2], [w / 2, d / 2, -w / 2, d / 2], [-w / 2, d / 2, -w / 2, -d / 2]] as const) {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.round(len / 0.07);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const h = 0.42 + (i % 2) * 0.04;
      lit.cylinder(0.035, 0.035, h, 5, { position: [fx + ax + (bx - ax) * t, h / 2, fz + az + (bz - az) * t], color: i % 3 ? log : '#6b4a2c' });
      lit.cone(0.035, 0.06, 5, { position: [fx + ax + (bx - ax) * t, h + 0.03, fz + az + (bz - az) * t], color: '#6b4a2c' });
    }
  }
  for (const [dx, dz] of [[-w / 2, -d / 2], [w / 2, d / 2]] as const) {
    lit.box(0.45, 0.5, 0.45, { position: [fx + dx, 0.55, fz + dz], color: '#8a6240' });
    lit.box(0.3, 0.32, 0.3, { position: [fx + dx, 0.16, fz + dz], color: log });
    lit.taperBox(0.6, 0.25, 0.6, 0.15, 0.15, { position: [fx + dx, 0.92, fz + dz], color: '#5e4129' });
  }
  flag(c, fx, 0.45, fz, 0.9, '#c1121f');
  for (let i = 0; i < 3; i++) person(lit, fx - 0.4 + i * 0.35, 0.06, fz + 0.1, rng() * 6, randomLook(rng));
  // Barrel bridge, a raft, trees.
  for (let i = 0; i < 6; i++) lit.cylinder(0.08, 0.08, 0.36, 8, { position: [1.55 + i * 0.16, 0.06, 0.45 + i * 0.12], rotation: [Math.PI / 2, 0, 0.6], color: i % 2 ? '#8a6240' : '#6b4a2c' });
  const ring = curve2([[-2.0, 0.6], [-2.05, -0.8], [-0.9, -1.95], [0.9, -1.95], [2.0, -0.8], [1.85, 0.75], [0.3, 1.05], [-1.0, 1.1]], true, 0.2);
  c.movers.push({ car: 'raft', pts: flat(ring, 0.05), closed: true, trains: 2, cars: 1, gap: 1, speed: 0.3, bob: 0.015 });
  for (const [x, z, s] of [[-1.0, -1.1, 0.8], [1.05, -1.05, 0.85], [-1.1, 0.2, 0.65]] as const) pine(lit, rng, p, x, z, s);
  for (const [x, z, s] of [[-2.65, 1.6, 0.85], [2.6, 1.4, 0.8]] as const) roundTree(lit, rng, p, x, z, s);
  hemisphere(lit, 1.25, 0.05, -1.2, 0.25, c.night ? '#6b6b6b' : '#9c9c9c', 8);
}
