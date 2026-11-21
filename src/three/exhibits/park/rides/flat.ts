import * as THREE from 'three';
import { MeshBuilder } from '../../../core/builder';
import { bush, flowerBed, roundTree } from '../../../islands/parts/nature';
import { person, queueLine, randomLook } from '../../../islands/parts/people';
import { house } from '../../../islands/parts/structures';
import type { Kit } from '../../../islands/parts/types';
import { darkTimber, festoon, flag, lantern, spinPart, timber, type RideCtx, type SpinDef } from './kit';

/* Flat rides that turn (gondolas, rockets, a carousel, teacups) and the walk-through
   attractions (a playground, a giant treehouse, a cottage). */

const PASTEL = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'];

function fenceRing(c: RideCtx, r: number, color = '#e9ecef', y = 0, gap = 0) {
  const n = Math.round(r * 9);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    // Leave the gate facing the front (+z) open.
    const mid = (a0 + a1) / 2;
    if (gap && Math.abs(Math.atan2(Math.cos(mid), Math.sin(mid))) < gap) continue;
    c.lit.beam([Math.cos(a0) * r, y + 0.24, Math.sin(a0) * r], [Math.cos(a1) * r, y + 0.24, Math.sin(a1) * r], 0.02, 0.02, { color });
    c.lit.box(0.03, 0.26, 0.03, { position: [Math.cos(a0) * r, y + 0.13, Math.sin(a0) * r], color });
  }
}

/** A hub of arms carrying vehicles that rise and fall as it turns. */
function armRide(c: RideCtx, o: { armY: number; reach: number; n: number; vehicle: (b: ReturnType<typeof spinPart>, i: number) => void; armColor: string }) {
  const hub = spinPart(c);
  hub.lit.cylinder(0.28, 0.28, 0.16, 12, { color: o.armColor });
  const children: SpinDef[] = [];
  for (let i = 0; i < o.n; i++) {
    const a = (i / o.n) * Math.PI * 2;
    const ex = Math.cos(a) * o.reach;
    const ez = Math.sin(a) * o.reach;
    hub.lit.beam([0, 0, 0], [ex, -0.1, ez], 0.05, 0.05, { color: o.armColor });
    const v = spinPart(c);
    o.vehicle(v, i);
    // Each vehicle faces along the direction of travel.
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
    const lit = new MeshBuilder();
    lit.stamp(v.lit, { quaternion: q });
    const glow = new MeshBuilder(c.glowScale);
    glow.stamp(v.glow, { quaternion: q });
    children.push({ lit, glow, pivot: [ex, -0.12, ez], axis: 'y', speed: 0, bob: [0.22, 0.9, i * 0.8] });
  }
  c.spins.push({ lit: hub.lit, glow: hub.glow, pivot: [0, o.armY, 0], axis: 'y', speed: 0.9, cycle: [14, 19], children });
}

/* ── Flying gondolas ────────────────────────────────────────────────── */

export function flyers(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  lit.cylinder(1.95, 2.0, 0.12, 32, { position: [0, 0.06, 0], color: c.night ? '#9aa3af' : '#e9ecef' });
  lit.cylinder(1.4, 1.4, 0.13, 32, { position: [0, 0.07, 0], color: c.night ? '#2f6f9f' : '#7cc6f2' });
  lit.cylinder(0.45, 0.5, 0.25, 16, { position: [0, 0.13, 0], color: '#ffd166' });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    glow.cone(0.04, 0.25, 5, { position: [Math.cos(a) * 0.9, 0.25, Math.sin(a) * 0.9], color: c.night ? '#9fd8ff' : '#d8f1ff' });
  }
  for (let i = 0; i < 10; i++) lit.box(0.08, 1.7, 0.08, { position: [0, 0.95, 0], rotation: [0, (i * Math.PI) / 10, 0], color: i % 2 ? '#ff8fab' : '#ffffff' });
  lit.cylinder(0.14, 0.14, 1.8, 10, { position: [0, 0.9, 0], color: '#ffffff' });
  lit.ico(0.32, 1, { position: [0, 2.1, 0], scale: [1, 1.2, 1], color: '#ff8fab' });
  lit.cylinder(0.12, 0.08, 0.15, 8, { position: [0, 1.7, 0], color: '#c9a227' });
  flag(c, 0, 2.45, 0, 0.3, '#ffd166');
  fenceRing(c, 1.98, '#ffffff', 0.12, 0.35);
  armRide(c, {
    armY: 1.3,
    reach: 1.45,
    n: 8,
    armColor: '#c9a227',
    vehicle: (v, i) => {
      const col = PASTEL[i % PASTEL.length];
      v.lit.lathe([[0.0, -0.12], [0.2, -0.1], [0.24, 0.05], [0.2, 0.06]], 10, { position: [0, -0.2, 0], color: col });
      v.lit.box(0.04, 0.2, 0.04, { position: [0, -0.04, 0], color: '#c9a227' });
      v.lit.ico(0.08, 0, { position: [0.18, -0.12, 0], scale: [1.2, 0.8, 0.8], color: col });
      person(v.lit, -0.05, -0.33, 0.05, Math.PI / 2, randomLook(rng), 'sit', 0.8);
      person(v.lit, -0.05, -0.33, -0.08, Math.PI / 2, randomLook(rng), 'sit', 0.8);
      v.glow.ico(0.025, 0, { position: [0, 0.07, 0], color: '#ffe7a3' });
    },
  });
  void p;
}

/* ── Rocket ride ────────────────────────────────────────────────────── */

export function rockets(c: RideCtx) {
  const { lit, glow, rng } = c;
  const metal = c.night ? '#aab3bf' : '#dde2e8';
  lit.cylinder(1.95, 2.0, 0.3, 32, { position: [0, 0.15, 0], color: c.night ? '#4b5568' : '#8d99ae' });
  glow.torus(1.96, 0.025, 4, 64, { position: [0, 0.31, 0], rotation: [Math.PI / 2, 0, 0], color: c.night ? '#5ec8ff' : '#3a86ff' });
  lit.cylinder(0.22, 0.32, 2.2, 10, { position: [0, 1.4, 0], color: metal });
  for (let k = 0; k < 4; k++) lit.box(0.05, 2.0, 0.42, { position: [0, 1.3, 0], rotation: [0, (k * Math.PI) / 4, 0], color: '#4361ee' });
  // Planets turning on top.
  {
    const s = spinPart(c);
    s.lit.ico(0.28, 1, { color: '#f77f00' });
    s.lit.torus(0.42, 0.02, 4, 28, { rotation: [Math.PI / 2 - 0.3, 0, 0], color: '#ffd166' });
    s.lit.ico(0.12, 1, { position: [0.62, 0.15, 0], color: '#4cc9f0' });
    s.lit.ico(0.09, 1, { position: [-0.55, -0.1, 0.2], color: '#e63946' });
    s.lit.beam([0, 0, 0], [0.62, 0.15, 0], 0.015, 0.015, { color: metal });
    s.lit.beam([0, 0, 0], [-0.55, -0.1, 0.2], 0.015, 0.015, { color: metal });
    c.spins.push({ lit: s.lit, glow: s.glow, pivot: [0, 2.85, 0], axis: 'y', speed: 0.5 });
  }
  fenceRing(c, 1.97, '#adb5bd', 0.3, 0.35);
  armRide(c, {
    armY: 1.55,
    reach: 1.5,
    n: 8,
    armColor: metal,
    vehicle: (v, i) => {
      v.lit.cylinder(0.1, 0.12, 0.5, 8, { position: [0, -0.2, 0], rotation: [0, 0, -Math.PI / 2], color: '#ffffff' });
      v.lit.cone(0.1, 0.22, 8, { position: [0.36, -0.2, 0], rotation: [0, 0, -Math.PI / 2], color: i % 2 ? '#e63946' : '#4361ee' });
      for (const s of [-1, 1]) v.lit.box(0.14, 0.03, 0.12, { position: [-0.2, -0.2, s * 0.13], color: i % 2 ? '#e63946' : '#4361ee' });
      v.lit.box(0.14, 0.12, 0.03, { position: [-0.2, -0.12, 0], color: i % 2 ? '#e63946' : '#4361ee' });
      person(v.lit, 0.02, -0.25, 0, Math.PI / 2, randomLook(rng), 'sit', 0.8);
      v.glow.cone(0.06, 0.16, 6, { position: [-0.32, -0.2, 0], rotation: [0, 0, Math.PI / 2], color: '#ff9b3d' });
    },
  });
}

/* ── Carousel ───────────────────────────────────────────────────────── */

export function carousel(c: RideCtx) {
  const { lit, glow } = c;
  lit.cylinder(2.0, 2.08, 0.18, 28, { position: [0, 0.09, 0], color: c.night ? '#7c8596' : '#d0d6de' });
  const top = spinPart(c);
  const red = '#c1121f';
  for (let i = 0; i < 16; i++) {
    const geo = new THREE.ConeGeometry(2.0, 0.95, 1, 1, true, (i / 16) * Math.PI * 2, Math.PI / 8);
    top.lit.add(geo, { position: [0, 2.35, 0], color: i % 2 ? red : '#fff6e5' });
    const a = ((i + 0.5) / 16) * Math.PI * 2;
    top.lit.cone(0.14, 0.2, 4, { position: [Math.sin(a) * 1.92, 1.78, Math.cos(a) * 1.92], rotation: [Math.PI, 0, 0], color: i % 2 ? red : '#ffd166' });
  }
  top.lit.cylinder(1.95, 1.95, 0.18, 24, { position: [0, 1.88, 0], color: '#ffd166' });
  top.glow.torus(1.97, 0.03, 4, 48, { position: [0, 1.82, 0], rotation: [Math.PI / 2, 0, 0], color: c.p.window });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    top.glow.ico(0.03, 0, { position: [Math.cos(a) * 1.96, 1.95, Math.sin(a) * 1.96], color: '#fff1c1' });
  }
  top.glow.ico(0.12, 0, { position: [0, 2.9, 0], color: c.p.accent.amber });
  top.lit.cylinder(1.85, 1.85, 0.1, 24, { position: [0, 0.12, 0], color: '#8a5a3b' });
  top.lit.cylinder(0.35, 0.35, 1.75, 12, { position: [0, 1.0, 0], color: '#fff6e5' });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    (c.night ? top.glow : top.lit).box(0.12, 0.3, 0.02, { position: [Math.cos(a) * 0.36, 1.1, Math.sin(a) * 0.36], rotation: [0, -a + Math.PI / 2, 0], color: c.night ? '#ffe7a3' : '#c9e4ff' });
  }
  const children: SpinDef[] = [];
  const N = 10;
  for (let ring = 0; ring < 2; ring++) {
    const rad = ring ? 1.0 : 1.45;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + ring * 0.3;
      top.lit.cylinder(0.022, 0.022, 1.65, 4, { position: [Math.cos(a) * rad, 1.0, Math.sin(a) * rad], color: '#ffd166' });
      const h = spinPart(c);
      const col = ['#fbfbf8', '#e9d5ff', '#3d2b1f', '#ffd6a5'][(i + ring) % 4];
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a - Math.PI / 2);
      const body = spinPart(c);
      body.lit.box(0.42, 0.15, 0.13, { color: col });
      body.lit.box(0.1, 0.22, 0.09, { position: [0.2, 0.13, 0], rotation: [0, 0, -0.4], color: col });
      body.lit.box(0.16, 0.08, 0.08, { position: [0.3, 0.23, 0], color: col });
      for (const [x, z] of [[0.15, 0.04], [0.15, -0.04], [-0.15, 0.04], [-0.15, -0.04]] as const) body.lit.box(0.035, 0.17, 0.035, { position: [x, -0.14, z], rotation: [0, 0, x > 0 ? 0.35 : -0.35], color: col });
      body.lit.box(0.12, 0.04, 0.15, { position: [0, 0.09, 0], color: red });
      if ((i + ring) % 3 === 0) person(body.lit, -0.02, 0.0, 0, Math.PI / 2, randomLook(c.rng), 'sit', 0.85);
      h.lit.stamp(body.lit, { quaternion: q });
      children.push({ lit: h.lit, pivot: [Math.cos(a) * rad, 0.85, Math.sin(a) * rad], axis: 'y', speed: 0, bob: [0.13, 2.2, i * 1.3 + ring] });
    }
  }
  c.spins.push({ lit: top.lit, glow: top.glow, pivot: [0, 0.06, 0], axis: 'y', speed: 0.45, cycle: [16, 20], children });
  void glow;
}

/* ── Teacups ────────────────────────────────────────────────────────── */

export function teacups(c: RideCtx) {
  const { lit, glow, rng } = c;
  lit.cylinder(2.0, 2.05, 0.1, 28, { position: [0, 0.05, 0], color: c.night ? '#8d7fa6' : '#e9d5ff' });
  const plate = spinPart(c);
  plate.lit.cylinder(1.8, 1.8, 0.06, 28, { position: [0, 0.03, 0], color: c.night ? '#b8a8d6' : '#f3e8ff' });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    plate.lit.box(1.75, 0.005, 0.05, { position: [0, 0.065, 0], rotation: [0, a, 0], color: k % 2 ? '#ffc6ff' : '#bdb2ff' });
  }
  const children: SpinDef[] = [];
  const cols = ['#ff5d8f', '#3a86ff', '#ffd166', '#06d6a0', '#c77dff', '#f77f00'];
  cols.forEach((col, i) => {
    const a = (i / cols.length) * Math.PI * 2;
    const cup = spinPart(c);
    cup.lit.lathe([[0.0, 0], [0.24, 0.02], [0.36, 0.2], [0.4, 0.38], [0.36, 0.38], [0.3, 0.22], [0.0, 0.18]], 14, { color: col });
    cup.lit.torus(0.1, 0.025, 4, 8, { position: [0.42, 0.22, 0], color: col });
    cup.lit.cylinder(0.08, 0.08, 0.2, 8, { position: [0, 0.28, 0], color: '#ffffff' });
    cup.lit.cylinder(0.12, 0.08, 0.03, 8, { position: [0, 0.39, 0], color: '#ffffff' });
    for (let k = 0; k < 3; k++) {
      const b = (k / 3) * Math.PI * 2;
      person(cup.lit, Math.cos(b) * 0.22, 0.08, Math.sin(b) * 0.22, Math.atan2(-Math.cos(b), -Math.sin(b)), randomLook(rng), 'sit', 0.8);
    }
    children.push({ lit: cup.lit, pivot: [Math.cos(a) * 1.15, 0.06, Math.sin(a) * 1.15], axis: 'y', speed: -1.6 - i * 0.25 });
  });
  c.spins.push({ lit: plate.lit, pivot: [0, 0.1, 0], axis: 'y', speed: 0.45, cycle: [14, 18], children });
  // Teapot in the middle, lanterns strung overhead.
  lit.lathe([[0, 0], [0.32, 0.05], [0.4, 0.3], [0.32, 0.55], [0.12, 0.62], [0, 0.62]], 14, { position: [0, 0.16, 0], color: '#ff8fab' });
  lit.beam([0.38, 0.4, 0], [0.62, 0.62, 0], 0.07, 0.07, { color: '#ff8fab' });
  lit.torus(0.14, 0.04, 4, 10, { position: [-0.42, 0.45, 0], rotation: [0, 0, 0], color: '#ff8fab' });
  lit.ico(0.08, 1, { position: [0, 0.83, 0], color: '#ffd166' });
  lit.cylinder(0.04, 0.05, 2.0, 6, { position: [0, 1.0, 0], color: '#5b6270' });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.26;
    const x = Math.cos(a) * 2.1;
    const z = Math.sin(a) * 2.1;
    if (z > 1.2 && Math.abs(x) < 1.2) continue;
    lit.cylinder(0.025, 0.03, 1.5, 5, { position: [x, 0.75, z], color: '#5b6270' });
    festoon(c, [0, 1.95, 0], [x, 1.45, z], 9, 0.18);
  }
  void glow;
}

/* ── Playground ─────────────────────────────────────────────────────── */

export function playground(c: RideCtx) {
  const { lit, rng, p } = c;
  lit.cylinder(2.0, 2.0, 0.03, 28, { position: [0, 0.015, 0], color: c.night ? '#9a5b3c' : '#f4a261' });
  lit.cylinder(0.9, 0.9, 0.035, 20, { position: [-0.7, 0.02, -0.5], color: c.night ? '#2f7d78' : '#2a9d8f' });
  // Climbing tower with a slide.
  const [tx, tz] = [-0.6, -0.6];
  for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as const) lit.box(0.06, 1.2, 0.06, { position: [tx + dx, 0.6, tz + dz], color: '#e63946' });
  lit.box(0.68, 0.06, 0.68, { position: [tx, 0.7, tz], color: '#ffd166' });
  lit.taperBox(0.8, 0.35, 0.8, 0.05, 0.05, { position: [tx, 1.38, tz], color: '#118ab2' });
  for (let i = 0; i < 5; i++) lit.box(0.4, 0.03, 0.1, { position: [tx - 0.2, 0.12 + i * 0.13, tz + 0.45 + i * 0.07], color: '#06d6a0' });
  const slide = new THREE.CatmullRomCurve3([new THREE.Vector3(tx + 0.3, 0.72, tz), new THREE.Vector3(tx + 0.8, 0.5, tz - 0.2), new THREE.Vector3(tx + 1.1, 0.25, tz + 0.3), new THREE.Vector3(tx + 1.5, 0.08, tz + 0.5)]);
  lit.tube(slide, 24, 0.09, 8, { color: '#8338ec' });
  // Swings.
  for (const x of [0.75, 1.55]) {
    lit.beam([x, 0, -1.2], [x, 0.85, -1.0], 0.05, 0.05, { color: '#118ab2' });
    lit.beam([x, 0, -0.8], [x, 0.85, -1.0], 0.05, 0.05, { color: '#118ab2' });
  }
  lit.beam([0.75, 0.85, -1.0], [1.55, 0.85, -1.0], 0.05, 0.05, { color: '#118ab2' });
  for (const x of [0.95, 1.35]) {
    lit.beam([x, 0.85, -1.0], [x, 0.3, -1.0 + (x > 1 ? 0.15 : 0)], 0.01, 0.01, { color: '#d9d9d9' });
    lit.box(0.12, 0.02, 0.08, { position: [x, 0.29, -1.0 + (x > 1 ? 0.15 : 0)], color: '#e63946' });
    person(lit, x, 0.15, -0.98 + (x > 1 ? 0.15 : 0), 0, randomLook(rng), 'sit', 0.7);
  }
  // Seesaw, sandbox, kids, parents on benches.
  lit.box(0.1, 0.12, 0.1, { position: [0.9, 0.06, 0.4], color: '#5b6270' });
  lit.box(0.9, 0.03, 0.1, { position: [0.9, 0.16, 0.4], rotation: [0, 0, 0.18], color: '#ffd166' });
  lit.box(0.7, 0.08, 0.7, { position: [-1.3, 0.04, 0.6], color: '#ead9b5' });
  for (let i = 0; i < 12; i++) {
    const a = rng() * Math.PI * 2;
    const d = 0.3 + rng() * 1.4;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (z > 0.95 && Math.abs(x) < 1.2) continue;
    person(lit, x, 0.03, z, rng() * 6, randomLook(rng), 'stand', 0.7);
  }
  for (const [x, z, a] of [[1.6, 0.9, -0.9], [-1.7, -0.2, 1.6]] as const) {
    lit.box(0.55, 0.03, 0.14, { position: [x, 0.13, z], rotation: [0, a, 0], color: timber });
    person(lit, x, -0.005, z, a, randomLook(rng), 'sit');
  }
  roundTree(lit, rng, p, 1.5, -1.5, 0.75);
}

/* ── Giant treehouse ────────────────────────────────────────────────── */

export function treehouse(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const bark = '#6b4a2c';
  const leaf = [c.night ? '#2c6b48' : '#3f9a63', c.night ? '#24583b' : '#2f8352', c.night ? '#33784f' : '#4fae72'];
  // Trunk, roots, branches.
  lit.cylinder(0.32, 0.55, 3.2, 10, { position: [0, 1.6, -0.5], color: bark });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rng() * 0.4;
    lit.beam([0, 0.45, -0.5], [Math.cos(a) * 1.0, 0.02, -0.5 + Math.sin(a) * 0.9], 0.16, 0.14, { color: bark });
  }
  const branches: Array<[number, number, number, number]> = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + rng();
    const y = 1.8 + rng() * 1.3;
    const d = 1.1 + rng() * 0.8;
    const ex = Math.cos(a) * d;
    const ez = -0.5 + Math.sin(a) * d * 0.85;
    lit.beam([0, y - 0.3, -0.5], [ex, y + 0.3, ez], 0.12, 0.12, { color: bark });
    branches.push([ex, y + 0.3, ez, a]);
  }
  for (const [x, y, z] of branches) {
    for (let k = 0; k < 3; k++) lit.ico(0.55 + rng() * 0.25, 1, { position: [x + (rng() - 0.5) * 0.6, y + 0.3 + rng() * 0.3, z + (rng() - 0.5) * 0.6], rotation: [rng(), rng(), 0], scale: [1, 0.7, 1], color: leaf[k % 3] });
  }
  lit.ico(1.1, 1, { position: [0, 3.6, -0.5], scale: [1.2, 0.7, 1.1], color: leaf[0] });
  // Platforms with rooms, a stair round the trunk, rope bridges.
  const decks: Array<[number, number, number, number]> = [[0.7, 1.05, 0.2, 0.3], [-0.8, 1.6, -0.9, -0.4], [0.5, 2.25, -1.3, 0.8]];
  for (const [x, y, z, yaw] of decks) {
    lit.box(0.95, 0.06, 0.75, { position: [x, y, z], rotation: [0, yaw, 0], color: timber });
    lit.box(0.6, 0.42, 0.45, { position: [x, y + 0.24, z], rotation: [0, yaw, 0], color: '#a68a64' });
    lit.taperBox(0.75, 0.25, 0.6, 0.15, 1, { position: [x, y + 0.57, z], rotation: [0, yaw, 0], color: c.night ? '#8f7a52' : '#cdb27a' });
    (c.night ? glow : lit).box(0.14, 0.12, 0.02, { position: [x + Math.sin(yaw) * 0.23, y + 0.27, z + Math.cos(yaw) * 0.23], rotation: [0, yaw, 0], color: c.night ? p.window : p.glass });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      lit.box(0.025, 0.18, 0.025, { position: [x + Math.cos(a) * 0.44, y + 0.12, z + Math.sin(a) * 0.34], color: darkTimber });
    }
    lit.beam([x, y, z], [x * 0.25, y - 0.35, -0.5 + (z + 0.5) * 0.25], 0.06, 0.06, { color: darkTimber });
    person(lit, x + 0.3, y + 0.03, z + 0.15, rng() * 6, randomLook(rng));
  }
  for (let i = 0; i < 22; i++) {
    const a = i * 0.42;
    const y = 0.12 + i * 0.1;
    lit.box(0.32, 0.03, 0.12, { position: [Math.cos(a) * 0.7, y, -0.5 + Math.sin(a) * 0.7], rotation: [0, -a, 0], color: timber });
  }
  for (let i = 0; i < decks.length - 1; i++) {
    const [ax, ay, az] = decks[i];
    const [bx, by, bz] = decks[i + 1];
    const n = 8;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      lit.box(0.2, 0.02, 0.06, { position: [ax + (bx - ax) * t, ay + (by - ay) * t - Math.sin(Math.PI * t) * 0.15, az + (bz - az) * t], rotation: [0, Math.atan2(bz - az, bx - ax) * -1 + Math.PI / 2, 0], color: timber });
    }
  }
  // Water wheel and bamboo pipes at the foot.
  const wheel = spinPart(c);
  wheel.lit.torus(0.32, 0.035, 4, 14, { color: darkTimber });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    wheel.lit.box(0.1, 0.04, 0.12, { position: [Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0], rotation: [0, 0, a], color: timber });
    wheel.lit.beam([0, 0, 0], [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0], 0.02, 0.02, { color: darkTimber });
  }
  c.spins.push({ lit: wheel.lit, pivot: [1.6, 0.36, -1.2], axis: 'x', speed: 0.8, phase: 0 });
  lit.box(0.5, 0.06, 0.4, { position: [1.6, 0.03, -1.2], color: c.night ? '#2f6f9f' : '#6cc3ec' });
  lit.beam([1.6, 0.75, -1.2], [0.4, 1.0, -0.6], 0.04, 0.04, { color: '#b5a35a' });
  for (const [x, z] of [[-1.8, 1.0], [1.8, 1.0]] as const) lantern(c, x, z, 0.55);
}

/* ── Cottage meet-and-greet ─────────────────────────────────────────── */

export function cottage(c: RideCtx) {
  const { lit, glow, rng, p } = c;
  const k: Kit = { lit, glow, glass: c.glass, signs: c.signs, p, rng };
  lit.cylinder(2.0, 2.0, 0.03, 24, { position: [0, 0.015, 0], color: p.grass });
  house(k, 0, -0.6, 1.5, 1.1, 0.95, 0, c.night ? '#e9d8a6' : '#fff1c1', '#e63946');
  lit.box(0.3, 0.45, 0.04, { position: [0.3, 0.23, -0.04], color: '#3a86ff' });
  lit.ico(0.09, 1, { position: [-0.45, 1.25, -0.6], color: '#ffd166' });
  // Picket fence, a garden, a mailbox, a queue for photos.
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * 0.62 + (i / n) * Math.PI * 1.76;
    const x = Math.cos(a) * 1.75;
    const z = -0.3 + Math.sin(a) * 1.45;
    lit.box(0.04, 0.24, 0.025, { position: [x, 0.12, z], color: '#ffffff' });
    lit.cone(0.03, 0.05, 4, { position: [x, 0.26, z], color: '#ffffff' });
  }
  flowerBed(lit, rng, p, -1.1, 0.35, 0.6, 0.3, 0.2);
  flowerBed(lit, rng, p, 1.1, 0.35, 0.6, 0.3, -0.2);
  lit.box(0.03, 0.3, 0.03, { position: [0.85, 0.15, 0.8], color: '#6b4f3a' });
  lit.box(0.12, 0.1, 0.18, { position: [0.85, 0.34, 0.8], color: '#e63946' });
  queueLine(lit, rng, [[0.3, 0.1], [0.3, 0.95]], 0.24, 0.02);
  person(lit, 0.3, 0.02, -0.02, 0, { shirt: '#e63946', pants: '#111111', skin: '#111111', hair: '#111111' }, 'stand', 1.25);
  for (const [x, z] of [[-1.6, -1.4], [1.6, -1.4]] as const) roundTree(lit, rng, p, x, z, 0.85);
  bush(lit, rng, p, -0.95, -0.05, 0.9);
  bush(lit, rng, p, 1.0, -0.05, 0.9);
}
