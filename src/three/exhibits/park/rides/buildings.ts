import { bush, flowerBed, palm, roundTree } from '../../../islands/parts/nature';
import { dome as hemisphere, roofPrism } from '../../../islands/parts/structures';
import { bulbs, flag, lantern, pick, spinPart, torch, windows, type RideCtx } from './kit';

/* Show buildings for the indoor rides and shows (footprint radius 2.2): a storybook
   hall, a sci-fi block, a cartoon house, a classical theatre and a tropical hut.
   Each faces +z with its doors towards the queue. */

const WALLS = ['#f4e1c1', '#e9d5ff', '#d7f0f5', '#ffe5d9', '#e2f0cb', '#fde2e4', '#fff1c1'];
const ROOFS = ['#3a5bd9', '#7a2e1f', '#2d6a4f', '#6d597a', '#c1121f', '#264653'];

function doorway(c: RideCtx, x: number, z: number, w: number, h: number, frame: string) {
  c.lit.box(w, h, 0.04, { position: [x, h / 2, z], color: '#1b1d24' });
  c.lit.cylinder(w / 2, w / 2, 0.04, 10, { position: [x, h, z], rotation: [Math.PI / 2, 0, 0], color: '#1b1d24' });
  c.lit.torus(w / 2 + 0.03, 0.03, 4, 12, { position: [x, h, z + 0.02], color: frame });
  if (c.night) c.glow.box(w * 0.7, h * 0.4, 0.01, { position: [x, h * 0.25, z + 0.025], color: '#a87b45' });
}

/* ── Storybook hall ─────────────────────────────────────────────────── */

export function storybook(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const wall = c.night ? '#d8ccb6' : pick(rng, WALLS);
  const roof = pick(rng, ROOFS);
  const beam = '#4a3424';
  const z0 = -0.85;
  lit.box(2.6, 1.1, 1.5, { position: [0, 0.55, z0], color: wall });
  roofPrism(lit, 0, z0, 1.1, 1.6, 2.8, 0.95, Math.PI / 2, roof);
  // Half-timbering on the front.
  const fz = z0 + 0.76;
  for (const x of [-1.25, -0.6, 0.6, 1.25]) lit.box(0.06, 1.1, 0.03, { position: [x, 0.55, fz], color: beam });
  lit.box(2.6, 0.06, 0.03, { position: [0, 0.6, fz], color: beam });
  for (const [x, s] of [[-0.92, 1], [0.92, -1]] as const) lit.beam([x - 0.3 * s, 0.62, fz], [x + 0.3 * s, 1.08, fz], 0.05, 0.03, { color: beam });
  // Front gable over the door.
  lit.box(1.1, 0.5, 0.4, { position: [0, 1.35, fz - 0.1], color: wall });
  roofPrism(lit, 0, fz - 0.05, 1.6, 1.2, 0.55, 0.65, 0, roof);
  doorway(c, 0, fz + 0.01, 0.5, 0.55, '#c9a227');
  windows(c, 0, fz + 0.01, 0, 2.2, 0.45, 1, 4, { h: 0.2, ww: 0.14, arch: true });
  windows(c, 0, fz - 0.08, 0, 0.5, 1.38, 1, 1, { h: 0.16, ww: 0.14, arch: true });
  // Turret with a pointed roof and a flag.
  lit.cylinder(0.3, 0.33, 1.9, 10, { position: [-1.15, 0.95, z0 + 0.55], color: wall });
  lit.cone(0.42, 0.85, 10, { position: [-1.15, 2.32, z0 + 0.55], color: roof });
  flag(c, -1.15, 2.7, z0 + 0.55, 0.35, '#ffd166');
  windows(c, -1.15, z0 + 0.88, 0, 0.1, 1.4, 1, 1, { h: 0.18, ww: 0.1, arch: true });
  lit.box(0.2, 0.55, 0.2, { position: [0.8, 1.95, z0 - 0.3], color: '#8a4343' });
  for (const s of [-1, 1]) {
    lit.box(0.05, 0.42, 0.02, { position: [s * 0.42, 0.85, fz + 0.03], color: pick(rng, ['#c1121f', '#3a5bd9', '#2d6a4f']) });
    lantern(c, s * 1.45, 0.75, 0.55);
  }
  flowerBed(lit, rng, p, -1.6, 0.35, 0.5, 0.35, 0.4);
  roundTree(lit, rng, p, 1.6, -0.2, 0.75);
  void glow;
}

/* ── Sci-fi block ───────────────────────────────────────────────────── */

export function scifi(c: RideCtx) {
  const { lit, glow, rng } = c;
  const hull = c.night ? '#aeb7c4' : '#e3e8ee';
  const accent = pick(rng, ['#4361ee', '#7209b7', '#f72585', '#06d6a0']);
  const neon = c.night ? '#5ec8ff' : '#3a86ff';
  const z0 = -0.8;
  lit.box(2.0, 1.0, 1.5, { position: [0, 0.5, z0], color: hull });
  for (const s of [-1, 1]) lit.cylinder(0.75, 0.75, 1.0, 16, { position: [s * 1.0, 0.5, z0], color: hull });
  lit.box(3.4, 0.08, 1.6, { position: [0, 1.04, z0], color: accent });
  hemisphere(lit, 0.3, 1.05, z0, 0.62, c.night ? '#7f8fa6' : '#c9d6e3', 16);
  glow.torus(0.62, 0.025, 4, 32, { position: [0.3, 1.1, z0], rotation: [Math.PI / 2, 0, 0], color: neon });
  // Neon bands, a glowing portal door, an antenna mast.
  for (const y of [0.3, 0.75]) glow.box(2.0, 0.03, 0.02, { position: [0, y, z0 + 0.76], color: neon });
  lit.box(0.7, 0.75, 0.06, { position: [0, 0.38, z0 + 0.76], color: '#1b1d24' });
  glow.box(0.04, 0.75, 0.07, { position: [-0.37, 0.38, z0 + 0.76], color: neon });
  glow.box(0.04, 0.75, 0.07, { position: [0.37, 0.38, z0 + 0.76], color: neon });
  glow.box(0.78, 0.04, 0.07, { position: [0, 0.77, z0 + 0.76], color: neon });
  c.signs.push({ text: pick(rng, ['GALAXY', 'ORBIT', 'NEBULA', 'STARPORT']), position: [0, 0.9, z0 + 0.81], width: 0.9, height: 0.16, bg: '#0b1020', fg: '#9bdcff' });
  lit.cylinder(0.025, 0.04, 1.2, 5, { position: [-1.1, 1.6, z0 - 0.2], color: '#8d99ae' });
  glow.ico(0.05, 0, { position: [-1.1, 2.22, z0 - 0.2], color: '#ff4d4d' });
  // A rocket on a plinth (it slowly turns).
  {
    const [x, z] = [1.55, 0.55];
    lit.cylinder(0.3, 0.34, 0.18, 10, { position: [x, 0.09, z], color: '#5b6270' });
    const r = spinPart(c);
    r.lit.cylinder(0.12, 0.14, 0.75, 10, { position: [0, 0.38, 0], color: '#ffffff' });
    r.lit.cone(0.12, 0.3, 10, { position: [0, 0.9, 0], color: accent });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      r.lit.box(0.03, 0.25, 0.18, { position: [Math.cos(a) * 0.14, 0.13, Math.sin(a) * 0.14], rotation: [0, -a, 0], color: accent });
    }
    r.glow.box(0.08, 0.08, 0.02, { position: [0, 0.5, 0.13], color: '#9bdcff' });
    c.spins.push({ lit: r.lit, glow: r.glow, pivot: [x, 0.18, z], axis: 'y', speed: 0.3 });
  }
  for (const s of [-1, 1]) {
    lit.cylinder(0.03, 0.03, 0.6, 6, { position: [s * 1.45, 0.3, 0.9], color: '#5b6270' });
    glow.box(0.08, 0.08, 0.08, { position: [s * 1.45, 0.64, 0.9], color: neon });
  }
}

/* ── Cartoon house ──────────────────────────────────────────────────── */

export function toon(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const cols = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#8338ec', '#ff9f1c'];
  const a = pick(rng, cols);
  const b = pick(rng, cols.filter((x) => x !== a));
  const z0 = -0.85;
  // Bulgy main block with a wavy roof.
  lit.box(2.4, 1.0, 1.4, { position: [0, 0.5, z0], color: a });
  for (let i = 0; i < 5; i++) lit.ico(0.42, 1, { position: [-1.0 + i * 0.5, 1.05, z0], scale: [1.1, 0.55, 1.75], color: i % 2 ? b : '#ffffff' });
  // A crooked tower with a hat.
  lit.cylinder(0.32, 0.4, 1.3, 10, { position: [0.95, 1.4, z0 - 0.1], rotation: [0, 0, 0.12], color: b });
  lit.cone(0.45, 0.7, 10, { position: [1.05, 2.35, z0 - 0.1], rotation: [0, 0, -0.3], color: a });
  lit.ico(0.1, 1, { position: [1.25, 2.68, z0 - 0.1], color: '#ffd166' });
  // Round windows, a big door with an awning, polka dots.
  for (const x of [-0.75, 0.75]) {
    lit.cylinder(0.2, 0.2, 0.04, 14, { position: [x, 0.62, z0 + 0.71], rotation: [Math.PI / 2, 0, 0], color: '#ffffff' });
    (c.night ? glow : lit).cylinder(0.15, 0.15, 0.05, 14, { position: [x, 0.62, z0 + 0.72], rotation: [Math.PI / 2, 0, 0], color: c.night ? p.window : p.glass });
  }
  lit.box(0.55, 0.65, 0.04, { position: [0, 0.33, z0 + 0.71], color: '#3d2b1f' });
  for (let i = 0; i < 6; i++) lit.beam([-0.4 + i * 0.16, 0.85, z0 + 0.72], [-0.4 + i * 0.16, 0.72, z0 + 1.02], 0.16, 0.02, { color: i % 2 ? '#ffffff' : b });
  for (let i = 0; i < 10; i++) lit.cylinder(0.05, 0.05, 0.02, 8, { position: [-1.1 + rng() * 2.2, 0.15 + rng() * 0.75, z0 + 0.705], rotation: [Math.PI / 2, 0, 0], color: '#ffffff' });
  c.signs.push({ text: pick(rng, ['TOON TOWN', 'ZOOM!', 'WACKY RIDE']), position: [0, 1.32, z0 + 0.72], width: 1.0, height: 0.22, bg: '#1b1d24', fg: '#ffd166', font: 'Comic Sans MS, Chalkboard, cursive' });
  // A cartoon car on the lawn and striped poles.
  {
    const [x, z] = [-1.5, 0.35];
    lit.box(0.6, 0.18, 0.32, { position: [x, 0.17, z], rotation: [0, 0.5, 0], color: b });
    lit.ico(0.17, 1, { position: [x - 0.05, 0.33, z], scale: [1.1, 0.7, 0.9], color: b });
    for (const [dx, dz] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]] as const) {
      lit.cylinder(0.08, 0.08, 0.05, 10, { position: [x + dx * Math.cos(0.5) + dz * Math.sin(0.5), 0.08, z - dx * Math.sin(0.5) + dz * Math.cos(0.5)], rotation: [Math.PI / 2, 0.5, 0], color: '#1b1d24' });
    }
  }
  for (const s of [-1, 1]) {
    lit.cylinder(0.04, 0.04, 0.9, 6, { position: [s * 1.45, 0.45, 0.85], color: '#ffffff' });
    lit.ico(0.1, 1, { position: [s * 1.45, 0.95, 0.85], color: a });
    glow.ico(0.04, 0, { position: [s * 1.45, 1.08, 0.85], color: '#ffe7a3' });
  }
  bush(lit, rng, p, 1.6, 0.3, 0.9, 0, '#ff8fab');
}

/* ── Classical theatre ──────────────────────────────────────────────── */

export function theater(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const stone = c.night ? '#d5cfc2' : '#f5efe3';
  const trim = pick(rng, ['#7a1f1f', '#264653', '#3a5bd9', '#6d597a']);
  const z0 = -0.95;
  lit.box(2.5, 1.15, 1.4, { position: [0, 0.575, z0], color: stone });
  lit.box(2.6, 0.12, 1.5, { position: [0, 1.2, z0], color: trim });
  hemisphere(lit, 0, 1.26, z0, 0.6, c.night ? '#6c8a9e' : '#7fb3c9', 16);
  lit.cylinder(0.04, 0.04, 0.3, 6, { position: [0, 1.95, z0], color: '#c9a227' });
  lit.ico(0.06, 1, { position: [0, 2.12, z0], color: '#c9a227' });
  // Portico: steps, six columns, a pediment.
  for (let i = 0; i < 3; i++) lit.box(2.0 - i * 0.1, 0.06, 0.35 - i * 0.08, { position: [0, 0.03 + i * 0.06, z0 + 0.95 - i * 0.04], color: stone });
  for (let i = 0; i < 6; i++) lit.cylinder(0.065, 0.075, 0.95, 8, { position: [-0.85 + i * 0.34, 0.6, z0 + 0.88], color: stone });
  lit.box(2.0, 0.1, 0.4, { position: [0, 1.12, z0 + 0.85], color: stone });
  roofPrism(lit, 0, z0 + 0.85, 1.17, 2.1, 0.45, 0.4, Math.PI / 2, stone);
  doorway(c, 0, z0 + 0.71, 0.45, 0.5, '#c9a227');
  windows(c, 0, z0 + 0.71, 0, 1.6, 0.5, 1, 2, { h: 0.3, ww: 0.16, arch: true });
  // Marquee with bulbs.
  c.signs.push({ text: pick(rng, ['TONIGHT', 'NOW SHOWING', 'THE SHOW']), position: [0, 1.48, z0 + 0.95], width: 1.0, height: 0.2, bg: trim, fg: '#fff3d6', font: 'Georgia, "Times New Roman", serif' });
  bulbs(c, [-0.55, 1.36, z0 + 0.97], [0.55, 1.36, z0 + 0.97], 10);
  bulbs(c, [-0.55, 1.6, z0 + 0.97], [0.55, 1.6, z0 + 0.97], 10);
  for (const s of [-1, 1]) {
    flag(c, s * 1.2, 1.26, z0 + 0.6, 0.5, trim);
    lit.box(0.35, 0.5, 0.05, { position: [s * 1.25, 0.4, 0.3], rotation: [0, -s * 0.3, 0], color: trim });
    lit.box(0.03, 0.15, 0.03, { position: [s * 1.25, 0.08, 0.3], color: '#5b6270' });
  }
  bush(lit, rng, p, -1.65, -0.1, 0.9);
  bush(lit, rng, p, 1.65, -0.1, 0.9);
  void glow;
}

/* ── Tropical hut ───────────────────────────────────────────────────── */

export function tiki(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const bamboo = c.night ? '#9c7f4f' : '#c9a66b';
  const thatch = c.night ? '#8f7a4a' : '#d4b36a';
  const z0 = -0.8;
  lit.cylinder(1.05, 1.1, 0.9, 12, { position: [0, 0.45, z0], color: bamboo });
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    lit.box(0.04, 0.9, 0.04, { position: [Math.cos(a) * 1.08, 0.45, z0 + Math.sin(a) * 1.08], color: '#7a5c32' });
  }
  lit.cone(1.75, 1.35, 12, { position: [0, 1.55, z0], color: thatch });
  lit.cone(1.0, 0.5, 12, { position: [0, 2.35, z0], color: thatch });
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    lit.box(0.12, 0.25, 0.02, { position: [Math.cos(a) * 1.7, 0.85, z0 + Math.sin(a) * 1.7], rotation: [0, -a + Math.PI / 2, 0], color: thatch });
  }
  lit.box(0.5, 0.65, 0.05, { position: [0, 0.32, z0 + 1.08], color: '#3d2b1f' });
  // Carved poles, torches, a fountain, palms.
  const poleCols = ['#7a5532', '#a0522d', '#5e4129'];
  for (const s of [-1, 1]) {
    const x = s * 0.75;
    for (let i = 0; i < 4; i++) {
      lit.box(0.22, 0.24, 0.22, { position: [x, 0.12 + i * 0.25, 0.55], rotation: [0, i * 0.2, 0], color: poleCols[i % 3] });
      lit.box(0.16, 0.04, 0.02, { position: [x, 0.17 + i * 0.25, 0.67], color: '#2b2d42' });
    }
    torch(c, s * 1.5, 0.75, 0.6);
  }
  lit.cylinder(0.4, 0.45, 0.15, 12, { position: [-1.4, 0.07, -0.2], color: '#8d8a80' });
  lit.cylinder(0.35, 0.35, 0.03, 12, { position: [-1.4, 0.15, -0.2], color: c.night ? '#2f6f9f' : '#6cc3ec' });
  glow.cone(0.08, 0.3, 6, { position: [-1.4, 0.3, -0.2], color: c.night ? '#9fd8ff' : '#d8f1ff' });
  for (const [x, z, s] of [[1.6, -0.4, 0.9], [-1.0, -1.85, 0.85], [1.25, -1.75, 0.8]] as const) palm(lit, rng, p, x, z, s);
  c.signs.push({ text: 'TIKI HUT', position: [0, 0.8, z0 + 1.12], width: 0.7, height: 0.16, bg: '#3d2b1f', fg: '#ffd166', font: 'Georgia, serif' });
}
