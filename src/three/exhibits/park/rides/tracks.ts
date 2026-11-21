import { roundTree, bush, flowerBed } from '../../../islands/parts/nature';
import { person, randomLook } from '../../../islands/parts/people';
import { awning } from '../../../islands/parts/structures';
import type { Kit } from '../../../islands/parts/types';
import { shelter } from './hero';
import {
  band,
  crag,
  curve2,
  curve3,
  flag,
  lantern,
  posts,
  rails,
  toV3,
  windows,
  type RideCtx,
  type V2,
  type V3,
} from './kit';

/* Rides on rails or roads: a family coaster, a mini-car road, a monorail, a circus
   train and a street trolley. */

/* ── Family wooden coaster ──────────────────────────────────────────── */

export function woodie(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const ctrl: V3[] = [
    [-1.85, 0.36, 1.2],
    [-2.5, 0.5, 0.0],
    [-2.2, 1.55, -1.35],
    [-0.8, 1.75, -2.25],
    [0.55, 0.6, -2.15],
    [1.75, 1.25, -1.5],
    [2.4, 0.5, -0.3],
    [2.0, 1.05, 0.85],
    [0.9, 1.3, 1.35],
    [-0.35, 0.65, 1.42],
    [-1.15, 0.42, 1.45],
  ];
  const pts = curve3(ctrl, true, 0.13);
  const wood = c.night ? '#cdbb9a' : '#f1e3c8';
  rails(lit, pts, true, { gauge: 0.24, radius: 0.022, color: '#6b4f3a', tie: wood, tieEvery: 2, tieW: 0.05 });
  for (let i = 0; i < pts.length; i += 3) {
    const q = pts[i];
    if (q.y < 0.4) continue;
    for (const s of [-1, 1]) lit.box(0.035, q.y, 0.035, { position: [q.x + s * 0.09, q.y / 2, q.z + s * 0.09], color: wood });
    for (let y = 0.35; y < q.y - 0.1; y += 0.45) lit.beam([q.x - 0.09, y, q.z - 0.09], [q.x + 0.09, y + 0.3, q.z + 0.09], 0.025, 0.025, { color: wood });
  }
  c.movers.push({ car: 'coaster', pts: toV3(pts), closed: true, trains: 1, cars: 4, gap: 0.52, speed: 1.3, gravity: 2.0, colors: ['#ffd166', '#06d6a0', '#ef476f', '#118ab2'] });
  shelter(c, -1.95, 1.2, 2.43, 1.1, 0.7, 0.75, '#ef476f');
  // Giant gears and a bright toy-box hut.
  for (const [x, z, r, col] of [[0.1, -0.5, 0.45, '#ffd166'], [0.75, -0.2, 0.3, '#118ab2']] as const) {
    lit.torus(r, 0.06, 4, 16, { position: [x, r + 0.05, z], color: col });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      lit.box(0.08, 0.09, 0.07, { position: [x + Math.cos(a) * (r + 0.07), r + 0.05 + Math.sin(a) * (r + 0.07), z], rotation: [0, 0, a], color: col });
    }
  }
  lit.box(0.6, 0.45, 0.5, { position: [-0.6, 0.22, -0.6], rotation: [0, 0.4, 0], color: '#06d6a0' });
  lit.taperBox(0.7, 0.25, 0.6, 0.3, 0.3, { position: [-0.6, 0.57, -0.6], rotation: [0, 0.4, 0], color: '#ef476f' });
  glow.ico(0.04, 0, { position: [-0.6, 0.72, -0.6], color: '#ffd166' });
  c.signs.push({ text: 'COASTER', position: [-1.95 - 0.36 * Math.sin(2.43 - Math.PI), 1.02, 1.2 - 0.36 * Math.cos(2.43 - Math.PI)], rotationY: 2.43 - Math.PI, width: 0.8, height: 0.18, bg: '#118ab2', fg: '#ffffff' });
  void rng;
  void p;
}

/* ── Mini-car road ──────────────────────────────────────────────────── */

export function autopia(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const line = curve2([[-2.0, 1.05], [-2.4, -0.3], [-1.6, -1.9], [0, -2.3], [1.7, -1.8], [2.4, -0.4], [1.9, 0.95], [0.8, 0.55], [-0.05, 1.15], [-0.95, 1.35]], true, 0.18);
  band(lit, line, 0.62, 0.035, 0.05, p.asphalt, true);
  band(lit, line, 0.05, 0.07, 0.04, '#f8f9fa', true);
  c.movers.push({ car: 'minicar', pts: line.map(([x, z]) => [x + 0, 0.06, z] as V3), closed: true, trains: 7, cars: 1, gap: 1, speed: 0.75, colors: ['#e63946', '#ffd166', '#118ab2', '#06d6a0', '#f77f00', '#8338ec', '#ffffff'] });
  // Infield: lawn, a little filling station, road signs, flower beds.
  lit.box(0.7, 0.4, 0.45, { position: [0.1, 0.2, -0.9], color: '#f1faee' });
  lit.box(1.0, 0.05, 0.75, { position: [0.1, 0.5, -0.75], color: '#e63946' });
  for (const x of [-0.3, 0.5]) lit.box(0.04, 0.45, 0.04, { position: [x, 0.25, -0.45], color: '#adb5bd' });
  for (const x of [-0.15, 0.35]) {
    lit.box(0.1, 0.22, 0.08, { position: [x, 0.11, -0.4], color: '#e63946' });
    glow.box(0.06, 0.05, 0.01, { position: [x, 0.17, -0.355], color: '#9bf6ff' });
  }
  windows(c, 0.1, -0.67, 0, 0.5, 0.22, 1, 2, { h: 0.14, ww: 0.14 });
  for (const [x, z, col] of [[-1.3, -0.6, '#ffd166'], [1.3, -0.9, '#ffffff'], [-0.6, 0.3, '#e63946']] as const) {
    lit.cylinder(0.012, 0.012, 0.4, 4, { position: [x, 0.2, z], color: '#adb5bd' });
    lit.cylinder(0.08, 0.08, 0.015, 8, { position: [x, 0.42, z], rotation: [Math.PI / 2, 0, 0], color: col });
  }
  flowerBed(lit, rng, p, -0.9, -1.1, 0.6, 0.35, 0.3);
  roundTree(lit, rng, p, 1.0, -1.35, 0.7);
  // Checkered start line and the garage at the front-left.
  for (let i = 0; i < 8; i++) lit.box(0.075, 0.012, 0.075, { position: [-2.28 + (i % 4) * 0.075 + 0.04, 0.066, 0.1 + Math.floor(i / 4) * 0.075], color: (i + Math.floor(i / 4)) % 2 ? '#111111' : '#ffffff' });
  lit.box(0.9, 0.5, 0.55, { position: [-2.15, 0.25, -1.45], rotation: [0, 0.8, 0], color: '#dee2e6' });
  lit.box(0.95, 0.06, 0.6, { position: [-2.15, 0.53, -1.45], rotation: [0, 0.8, 0], color: '#118ab2' });
  c.signs.push({ text: 'MINI CARS', position: [-2.15 + 0.29 * Math.sin(0.8), 0.38, -1.45 + 0.29 * Math.cos(0.8)], rotationY: 0.8, width: 0.7, height: 0.14, bg: '#118ab2', fg: '#ffffff' });
  for (const [x, z] of [[2.55, 1.2], [-2.5, 1.65]] as const) lantern(c, x, z, 0.55);
}

/* ── Monorail ───────────────────────────────────────────────────────── */

export function monorail(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const H = 1.3;
  const line = curve2(Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [Math.cos(a) * 2.2, -0.45 + Math.sin(a) * 1.7] as V2;
  }), true, 0.16);
  const concrete = c.night ? '#9aa3af' : '#d6dbe1';
  for (let i = 0; i < line.length; i++) {
    const a = line[i];
    const b = line[(i + 1) % line.length];
    lit.beam([a[0], H - 0.09, a[1]], [b[0], H - 0.09, b[1]], 0.16, 0.18, { color: concrete });
  }
  for (let i = 0; i < line.length; i += 6) {
    const [x, z] = line[i];
    lit.cylinder(0.07, 0.09, H - 0.18, 6, { position: [x, (H - 0.18) / 2, z], color: concrete });
    lit.box(0.22, 0.08, 0.22, { position: [x, H - 0.2, z], color: concrete });
  }
  c.movers.push({ car: 'monocar', head: 'monohead', pts: line.map(([x, z]) => [x, H, z] as V3), closed: true, trains: 1, cars: 4, gap: 0.7, speed: 1.1, level: true });
  // Elevated station on the left with stairs and a canopy.
  {
    const x = -2.5;
    const z = -0.45;
    lit.box(0.42, 0.06, 1.5, { position: [x, H - 0.12, z], color: concrete });
    for (const dz of [-0.65, 0.65]) lit.box(0.06, H - 0.12, 0.06, { position: [x, (H - 0.12) / 2, z + dz], color: concrete });
    lit.box(0.5, 0.04, 1.6, { position: [x - 0.04, H + 0.45, z], color: '#e9ecef' });
    for (const dz of [-0.7, 0.7]) lit.box(0.03, 0.5, 0.03, { position: [x - 0.2, H + 0.2, z + dz], color: '#adb5bd' });
    for (let i = 0; i < 8; i++) lit.box(0.25, 0.04, 0.12, { position: [x + 0.05, 0.08 + i * 0.15, z + 1.25 - i * 0.07], color: concrete });
    glow.box(0.02, 0.03, 1.5, { position: [x + 0.2, H - 0.1, z], color: '#5ec8ff' });
    c.signs.push({ text: 'MONORAIL', position: [x + 0.22, H + 0.3, z], rotationY: Math.PI / 2, width: 0.9, height: 0.16, bg: '#0b1020', fg: '#9bdcff' });
    for (let i = 0; i < 3; i++) person(lit, x - 0.08, H - 0.09, z - 0.4 + i * 0.35, Math.PI / 2, randomLook(rng));
  }
  // A garden inside the loop.
  lit.cylinder(0.55, 0.6, 0.12, 16, { position: [0.2, 0.06, -0.45], color: p.concrete });
  lit.cylinder(0.5, 0.5, 0.04, 16, { position: [0.2, 0.12, -0.45], color: c.night ? '#2f6f9f' : '#6cc3ec' });
  glow.cone(0.14, 0.4, 8, { position: [0.2, 0.32, -0.45], color: c.night ? '#9fd8ff' : '#d8f1ff' });
  flowerBed(lit, rng, p, 0.2, 0.55, 1.1, 0.3, 0);
  flowerBed(lit, rng, p, 0.2, -1.45, 1.1, 0.3, 0);
  for (const x of [-1.2, 1.5]) bush(lit, rng, p, x, -0.45, 1.3);
}

/* ── Circus train ───────────────────────────────────────────────────── */

export function circus(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const cz = -0.45;
  const ctrl: V3[] = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.cos(a) * 1.72, 0.1 + Math.max(0, Math.sin(a * 2 + 1)) * 0.3, cz + Math.sin(a) * 1.3] as V3;
  });
  const pts = curve3(ctrl, true, 0.12);
  rails(lit, pts, true, { gauge: 0.2, radius: 0.016, color: '#495057', tie: '#7a5532', tieEvery: 2, tieW: 0.05 });
  posts(lit, pts, { every: 3, color: '#c1121f', r: 0.025, min: 0.12 });
  c.movers.push({ car: 'circuscar', head: 'circusloco', pts: toV3(pts), closed: true, trains: 1, cars: 4, gap: 0.47, speed: 0.6, gravity: 0.6, colors: ['#ffffff', '#ffd166', '#9bf6ff', '#ffadad'] });
  // Big-top tent in the middle.
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    lit.box(0.29, 0.5, 0.03, { position: [Math.cos(a) * 0.72, 0.25, cz + Math.sin(a) * 0.72], rotation: [0, -a + Math.PI / 2, 0], color: i % 2 ? '#d62828' : '#fdf0d5' });
  }
  lit.cone(0.85, 0.6, 16, { position: [0, 0.8, cz], color: '#d62828' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    lit.beam([0, 1.08, cz], [Math.cos(a) * 0.82, 0.52, cz + Math.sin(a) * 0.82], 0.07, 0.01, { color: '#fdf0d5' });
  }
  flag(c, 0, 1.05, cz, 0.35, '#ffd166');
  glow.ico(0.03, 0, { position: [0, 1.42, cz], color: '#ffd166' });
  // Tunnel through a little hill on the right.
  crag(lit, rng, { x: 1.55, z: cz - 0.7, rings: [[0.55, 0], [0.45, 0.35], [0.2, 0.6]], seg: 8, jitter: 0.1, apex: null, paint: (y, r) => (r() < 0.5 ? p.grass : p.grassDark) });
  for (const [x, z] of [[-1.85, 0.75], [1.85, 0.6]] as const) lantern(c, x, z, 0.5);
}

/* ── Street trolley ─────────────────────────────────────────────────── */

export function trolley(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const z0 = -0.3;
  lit.box(3.9, 0.04, 0.95, { position: [0, 0.02, z0], color: c.night ? '#6b6157' : '#b3a99a' });
  for (let i = 0; i < 30; i++) lit.box(0.1, 0.005, 0.95, { position: [-1.9 + i * 0.13, 0.042, z0], color: i % 2 ? '#a39a8b' : '#8f8678' });
  for (const s of [-1, 1]) lit.box(3.8, 0.02, 0.025, { position: [0, 0.055, z0 + s * 0.12], color: '#5b6270' });
  c.movers.push({ car: 'trolley', pts: [[-1.7, 0.06, z0], [1.7, 0.06, z0]], closed: false, trains: 1, cars: 1, gap: 1, speed: 0.45, level: true });
  // Shopfronts behind the street.
  const fronts = [
    { w: 0.95, h: 0.95, wall: '#f4e1c1', aw: '#d62828', name: 'BAKERY' },
    { w: 0.8, h: 1.15, wall: '#d7f0f5', aw: '#2a9d8f', name: 'BARBER' },
    { w: 1.0, h: 0.9, wall: '#fde2e4', aw: '#8338ec', name: 'CANDY' },
  ];
  let x = -1.4;
  for (const f of fronts) {
    const cx = x + f.w / 2;
    lit.box(f.w, f.h, 0.55, { position: [cx, f.h / 2, -1.25], color: f.wall });
    lit.box(f.w + 0.04, 0.08, 0.6, { position: [cx, f.h + 0.04, -1.25], color: f.aw });
    lit.taperBox(f.w, 0.3, 0.55, 1, 0.2, { position: [cx, f.h + 0.23, -1.25], color: c.night ? '#4b5568' : '#6c7b91' });
    windows(c, cx, -1.53, Math.PI, f.w * 0.6, f.h * 0.6, 1, 2, { h: 0.16, ww: 0.14 });
    windows(c, cx, -0.965, 0, f.w * 0.7, f.h * 0.72, 1, 2, { h: 0.18, ww: 0.16 });
    (c.night ? glow : lit).box(f.w * 0.7, 0.24, 0.02, { position: [cx, 0.2, -0.965], color: c.night ? p.window : p.glass });
    awning({ lit, glow, glass: lit, signs: c.signs, p, rng } as Kit, cx, f.h * 0.5, -0.975, f.w * 0.9, 0.22, 0, [f.aw, '#ffffff'], 6);
    c.signs.push({ text: f.name, position: [cx, f.h * 0.85, -0.96], width: f.w * 0.8, height: 0.14, bg: '#1b1d24', fg: '#fff3d6', font: 'Georgia, serif' });
    x += f.w + 0.05;
  }
  // Barn at one end, lamps along the front.
  lit.box(0.6, 0.6, 0.7, { position: [-1.9, 0.3, z0 - 0.05], color: '#8d0801' });
  lit.taperBox(0.7, 0.3, 0.8, 0.15, 1, { position: [-1.9, 0.75, z0 - 0.05], color: '#5c4a3a' });
  lit.box(0.02, 0.4, 0.5, { position: [-1.59, 0.2, z0], color: '#3d2b1f' });
  for (const lx of [-1.2, 0, 1.2]) {
    lit.cylinder(0.02, 0.03, 0.75, 5, { position: [lx, 0.37, 0.3], color: '#1f2228' });
    glow.ico(0.05, 0, { position: [lx, 0.8, 0.3], color: p.window });
  }
}
