'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { glassMaterial, glowMaterial, litMaterial } from '../core/materials';
import type { ScenePalette } from '../core/palette';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { footpath, road, smoothPath } from './parts/ground';
import { Fleet, Walkers, track, type FleetSpec, type WalkerGroup } from './parts/movers';
import { flowerBed, forest, roundTree } from './parts/nature';
import { crowd, person, queueLine, randomLook } from './parts/people';
import { awning, at, cafeTable, dome, fountain, hedge, parkingLot, postLamp, umbrella } from './parts/structures';

/* Theme Park: the Mapblazer island. Visitors come in through a gate with ticket
   booths, walk up a main street of shops to a hub with a fountain, and spread out to
   the rides: a looping coaster, a Ferris wheel, a carousel, a drop tower, a swing ride
   and spinning teacups, with a castle at the back. Each ride has a queue of people and
   a glowing tower for its forecast wait, and a lit route (the solver's kind of plan)
   threads the rides, with one visitor walking it. */

const R = 17;
const GATE_Z = 10.4;
const COASTER: [number, number] = [-6.6, -6.6];
const WHEEL: [number, number] = [6.9, -7.6];
const CAROUSEL: [number, number] = [7.8, 0.6];
const DROP: [number, number] = [-8.4, 1.2];
const SWINGS: [number, number] = [5.0, 6.4];
const CUPS: [number, number] = [-5.0, 6.4];
const CASTLE: [number, number] = [0, -6.4];

/** Ride entrances on the loop path, in route order from the gate. */
const ENTRANCES: Array<{ at: [number, number]; queue: Array<[number, number]>; wait: number; phase: number }> = [
  { at: [-3.6, 4.8], queue: [[-3.6, 4.8], [-4.4, 4.3], [-3.7, 3.9], [-4.5, 3.5]], wait: 1.4, phase: 0.4 },
  { at: [-5.9, 2.2], queue: [[-5.9, 2.2], [-6.6, 2.9], [-6.0, 3.4], [-6.8, 3.9]], wait: 2.6, phase: 1.3 },
  { at: [-4.6, -3.0], queue: [[-4.6, -3.0], [-4.0, -3.6], [-4.7, -4.0], [-4.0, -4.5]], wait: 4.2, phase: 2.2 },
  { at: [4.2, -4.0], queue: [[4.2, -4.0], [4.9, -4.5], [4.3, -5.0], [5.0, -5.4]], wait: 3.2, phase: 3.1 },
  { at: [5.6, -0.4], queue: [[5.6, -0.4], [6.0, 0.3], [5.4, 0.8]], wait: 1.8, phase: 4.0 },
  { at: [3.4, 4.6], queue: [[3.4, 4.6], [4.1, 4.2], [3.5, 3.8], [4.2, 3.4]], wait: 2.2, phase: 5.2 },
];

/* ── Coaster track ─────────────────────────────────────────────────── */

function coasterCurve() {
  const [cx, cz] = COASTER;
  const pts: Array<[number, number, number]> = [
    [-2.8, 0.55, 2.0],
    [-0.6, 0.55, 2.3],
    [1.2, 1.4, 2.3],
    [2.9, 3.9, 1.7],
    [3.5, 4.3, 0.4],
    [2.8, 2.2, -1.5],
    [1.4, 0.8, -2.2],
    [0.2, 0.8, -2.3],
    [-1.2, 1.05, -2.4],
    [-1.95, 2.05, -2.5],
    [-1.2, 3.05, -2.6],
    [-0.45, 2.05, -2.7],
    [-1.2, 1.0, -2.8],
    [-2.6, 0.9, -2.6],
    [-3.7, 1.7, -1.4],
    [-3.9, 2.3, 0.3],
    [-3.5, 1.1, 1.5],
  ];
  return new THREE.CatmullRomCurve3(
    pts.map(([x, y, z]) => new THREE.Vector3(cx + x, y, cz + z)),
    true,
    'catmullrom',
    0.5,
  );
}

const UP = new THREE.Vector3(0, 1, 0);
const FRAMES = 400;

/**
 * The coaster's curve and a side vector at FRAMES + 1 samples, carried along the track
 * (parallel transport) so the frame turns over smoothly through the loop, with the
 * small mismatch at the end of the circuit spread over the whole track.
 */
const TRACK = (() => {
  const curve = coasterCurve();
  const sides: THREE.Vector3[] = [];
  const t = new THREE.Vector3();
  const s = curve.getTangentAt(0).cross(UP).normalize();
  for (let i = 0; i <= FRAMES; i++) {
    curve.getTangentAt((i % FRAMES) / FRAMES, t);
    s.addScaledVector(t, -t.dot(s)).normalize();
    sides.push(s.clone());
  }
  const t0 = curve.getTangentAt(0);
  const end = sides[FRAMES];
  const twist = Math.atan2(t0.dot(new THREE.Vector3().crossVectors(end, sides[0])), end.dot(sides[0]));
  for (let i = 0; i <= FRAMES; i++) {
    curve.getTangentAt((i % FRAMES) / FRAMES, t);
    sides[i].applyAxisAngle(t, (twist * i) / FRAMES).normalize();
  }
  return { curve, sides };
})();

/** Side and up vectors across the track at u (the up vector points out of the rails). */
function frameAt(u: number, side: THREE.Vector3, up: THREE.Vector3, tangent: THREE.Vector3) {
  const f = (((u % 1) + 1) % 1) * FRAMES;
  const i = Math.floor(f);
  side.lerpVectors(TRACK.sides[i], TRACK.sides[Math.min(FRAMES, i + 1)], f - i).normalize();
  TRACK.curve.getTangentAt(((u % 1) + 1) % 1, tangent);
  up.crossVectors(side, tangent).normalize();
}

/* ── Static build ──────────────────────────────────────────────────── */

function build(k: Kit) {
  const { lit, glow, p, rng, signs } = k;
  base(k, 23, R, 10);
  rimGlow(k, R, p.accent.amber);
  const amber = p.accent.amber;
  const dark = p.mode === 'dark';

  // Hedge ring around the park, open at the gate.
  const ringPts: Array<[number, number]> = [];
  for (let i = 0; i <= 64; i++) {
    const a = Math.PI / 2 + 0.16 + (i / 64) * (Math.PI * 2 - 0.32);
    ringPts.push([Math.cos(a) * 11.6, -1 + Math.sin(a) * 11.6]);
  }
  for (let i = 0; i < ringPts.length - 1; i++) hedge(k, ringPts[i][0], ringPts[i][1], ringPts[i + 1][0], ringPts[i + 1][1], 0.3, 0.38);

  // Paths: main street, the hub, spokes and a loop past every ride.
  footpath(k, [[0, 14.6], [0, 2.4]], 1.9);
  lit.cylinder(2.7, 2.7, 0.04, 40, { position: [0, 0.02, 0], color: p.path });
  const loop = smoothPath(ENTRANCES.map((e) => e.at), true, 0.4);
  footpath(k, loop, 1.15, true);
  for (const e of ENTRANCES) footpath(k, [[0, 0], e.at], 1.0);
  footpath(k, [[0, 0], [CASTLE[0], CASTLE[1] + 1.8]], 1.3);
  fountain(k, 0, 0, 1.1);

  // The route the solver would plan: gate, the rides in order, back to the gate.
  const route = smoothPath([[0, 11.0], [0, 6.0], ...ENTRANCES.map((e) => e.at), [1.2, 3.0], [0.4, 8.0]], true, 0.3);
  for (let i = 0; i < route.length; i++) {
    const a = route[i];
    const b = route[(i + 1) % route.length];
    glow.beam([a[0], 0.09, a[1]], [b[0], 0.09, b[1]], 0.07, 0.02, { color: amber });
  }

  // Main street: shops with awnings and signs on both sides.
  const SHOPS = [
    { name: 'GIFTS', c: '#d62828' },
    { name: 'CANDY', c: '#ff5d8f' },
    { name: 'PHOTOS', c: '#3a86ff' },
    { name: 'SNACKS', c: '#f77f00' },
    { name: 'TOYS', c: '#8338ec' },
    { name: 'ICE CREAM', c: '#06d6a0' },
  ];
  SHOPS.forEach((s, i) => {
    const side = i % 2 ? 1 : -1;
    const z = 8.4 - Math.floor(i / 2) * 2.0;
    const x = side * 2.35;
    const yaw = -side * (Math.PI / 2);
    const wall = ['#f4e1c1', '#e9d5ff', '#d7f0f5', '#ffe5d9', '#e2f0cb', '#fde2e4'][i];
    lit.box(1.5, 1.25, 1.8, { position: [x, 0.625, z], rotation: [0, yaw, 0], color: wall });
    lit.taperBox(1.65, 0.45, 1.95, 0.55, 0.8, { position: [x, 1.475, z], rotation: [0, yaw, 0], color: s.c });
    const [fx, fz] = at(x, z, yaw, 0, 0.91);
    (dark ? glow : lit).box(1.0, 0.45, 0.02, { position: [fx, 0.38, fz], rotation: [0, yaw, 0], color: dark ? p.window : p.glass });
    awning(k, fx, 0.78, fz, 1.4, 0.4, yaw, [s.c, '#ffffff'], 6);
    const [sx, sz] = at(x, z, yaw, 0, 0.93);
    signs.push({ text: s.name, position: [sx, 1.05, sz], rotationY: yaw, width: 1.25, height: 0.3, bg: '#1b1d24', fg: '#fff3d6' });
  });
  for (let z = 3.4; z < 10; z += 1.6) {
    postLamp(k, -1.25, z, 0.85, amber);
    postLamp(k, 1.25, z, 0.85, amber);
  }

  // Gate: two towers, an arch with the park's sign, turnstiles, ticket booths outside.
  for (const s of [-1, 1]) {
    lit.box(1.1, 2.7, 1.1, { position: [s * 2.4, 1.35, GATE_Z], color: dark ? '#e7d8c3' : '#fbefdc' });
    lit.cone(0.85, 1.0, 4, { position: [s * 2.4, 3.2, GATE_Z], rotation: [0, Math.PI / 4, 0], color: '#c1121f' });
    glow.ico(0.1, 0, { position: [s * 2.4, 3.75, GATE_Z], color: amber });
    lit.box(0.6, 1.2, 0.04, { position: [s * 2.4, 1.0, GATE_Z + 0.57], color: '#7a2e1f' });
  }
  lit.box(4.0, 0.7, 0.5, { position: [0, 2.55, GATE_Z], color: dark ? '#e7d8c3' : '#fbefdc' });
  signs.push({ text: 'THEME PARK', position: [0, 2.55, GATE_Z + 0.26], width: 3.6, height: 0.56, bg: '#7a1f1f', fg: '#ffe9a8', font: 'Georgia, "Times New Roman", serif' });
  for (let i = 0; i < 5; i++) {
    const x = -1.4 + i * 0.7;
    lit.box(0.12, 0.32, 0.5, { position: [x, 0.16, GATE_Z], color: '#5b6270' });
  }
  lit.box(13, 0.04, 4.4, { position: [0, 0.02, GATE_Z + 2.4], color: p.path });
  for (const s of [-1, 1]) {
    const bx = s * 3.8;
    lit.box(1.4, 1.0, 0.9, { position: [bx, 0.5, GATE_Z + 1.8], color: dark ? '#f1e4d3' : '#fff6e5' });
    lit.taperBox(1.6, 0.35, 1.1, 0.6, 0.6, { position: [bx, 1.17, GATE_Z + 1.8], color: '#c1121f' });
    for (let w = 0; w < 2; w++) {
      (dark ? glow : lit).box(0.4, 0.3, 0.02, { position: [bx - 0.35 + w * 0.7, 0.6, GATE_Z + 2.26], color: dark ? p.window : p.glass });
    }
    signs.push({ text: 'TICKETS', position: [bx, 1.17, GATE_Z + 2.36], width: 1.0, height: 0.22, bg: '#fff3d6', fg: '#7a1f1f' });
    queueLine(lit, rng, [[bx - 0.35, GATE_Z + 2.45], [bx - 0.35, GATE_Z + 4.4]], 0.32, 0.04);
    queueLine(lit, rng, [[bx + 0.35, GATE_Z + 2.45], [bx + 0.35, GATE_Z + 4.0]], 0.32, 0.04);
  }
  crowd(lit, rng, 0, GATE_Z + 2.6, 1.6, 12, 0.04);

  // Car parks and the road in front.
  road(k, smoothPath([[-15.5, 7.2], [-9, 12.9], [0, 15.6], [9, 12.9], [15.5, 7.2]], false, 0.6), 1.2, {});
  parkingLot(k, -9.6, 9.1, 7, 2, -0.62, 0.85);
  parkingLot(k, 9.6, 9.1, 7, 2, 0.62, 0.8);

  // Castle at the back.
  {
    const [cx, cz] = CASTLE;
    const wall = dark ? '#d9d2e9' : '#f3effa';
    const roof = '#3a5bd9';
    lit.box(3.6, 1.8, 2.6, { position: [cx, 0.9, cz], color: wall });
    lit.box(1.8, 3.2, 1.6, { position: [cx, 1.6, cz - 0.2], color: wall });
    lit.cone(1.1, 1.8, 8, { position: [cx, 4.1, cz - 0.2], color: roof });
    lit.cylinder(0.02, 0.02, 0.6, 4, { position: [cx, 5.2, cz - 0.2], color: '#d9d9d9' });
    lit.box(0.3, 0.18, 0.02, { position: [cx + 0.15, 5.4, cz - 0.2], color: '#ff5d8f' });
    for (const [dx, dz, h] of [[-1.8, 1.3, 2.4], [1.8, 1.3, 2.4], [-1.8, -1.3, 2.8], [1.8, -1.3, 2.8], [-0.9, 0.7, 3.6], [0.9, 0.7, 3.4]] as const) {
      lit.cylinder(0.42, 0.45, h, 10, { position: [cx + dx, h / 2, cz + dz], color: wall });
      lit.cone(0.56, 1.1, 10, { position: [cx + dx, h + 0.55, cz + dz], color: dx < 0 ? roof : '#ff5d8f' });
      for (let f = 0; f < 2; f++) (dark ? glow : lit).box(0.12, 0.2, 0.02, { position: [cx + dx, h * (0.45 + f * 0.25), cz + dz + 0.43], color: dark ? p.window : p.glass });
    }
    for (let i = 0; i < 9; i++) lit.box(0.2, 0.2, 0.2, { position: [cx - 1.6 + i * 0.4, 1.9, cz + 1.25], color: wall });
    lit.box(1.0, 1.1, 0.05, { position: [cx, 0.55, cz + 1.31], color: '#4a2c1f' });
    dome(lit, cx, 1.1, cz + 1.31, 0.5, '#4a2c1f', 8);
    glow.box(0.9, 0.04, 0.04, { position: [cx, 1.82, cz + 1.32], color: amber });
  }

  // Station, supports and queue for the coaster.
  {
    const curve = TRACK.curve;
    const [cx, cz] = COASTER;
    lit.box(2.4, 0.5, 1.2, { position: [cx - 1.7, 0.25, cz + 2.2], color: dark ? '#e7d8c3' : '#fbefdc' });
    lit.box(2.6, 0.08, 1.4, { position: [cx - 1.7, 1.45, cz + 2.2], color: '#7a1f1f' });
    for (const [dx, dz] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]] as const) {
      lit.box(0.07, 0.95, 0.07, { position: [cx - 1.7 + dx, 0.97, cz + 2.2 + dz], color: '#5b6270' });
    }
    signs.push({ text: 'COASTER', position: [cx - 1.7, 1.62, cz + 2.92], width: 1.6, height: 0.3, bg: '#7a1f1f', fg: '#ffe9a8' });
    const N = 160;
    const side = new THREE.Vector3();
    const up = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const p0 = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const u = i / N;
      curve.getPointAt(u, p0);
      if (i % 3 === 0) {
        frameAt(u, side, up, tan);
        const c = p0.clone().addScaledVector(up, -0.05);
        lit.beam(
          [c.x - side.x * 0.16, c.y - side.y * 0.16, c.z - side.z * 0.16],
          [c.x + side.x * 0.16, c.y + side.y * 0.16, c.z + side.z * 0.16],
          0.05,
          0.03,
          { color: '#5b6270' },
        );
      }
      // Supports: skip the inside of the loop.
      const inLoop = p0.x > cx - 2.3 && p0.x < cx + 0.1 && p0.z < cz - 2.1;
      if (i % 4 === 0 && p0.y > 0.75 && !inLoop) {
        lit.cylinder(0.045, 0.06, p0.y - 0.08, 5, { position: [p0.x, (p0.y - 0.08) / 2, p0.z], color: dark ? '#9aa6b5' : '#c3cad4' });
      }
    }
    // Loop support: two legs to the loop's base.
    for (const dz of [-2.35, -2.95]) lit.cylinder(0.05, 0.07, 0.95, 5, { position: [cx - 1.2, 0.47, cz + dz], color: dark ? '#9aa6b5' : '#c3cad4' });
    for (const s of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= N; i++) {
        const u = (i % N) / N;
        curve.getPointAt(u, p0);
        frameAt(u, side, up, tan);
        pts.push(p0.clone().addScaledVector(side, s * 0.13));
      }
      lit.tube(new THREE.CatmullRomCurve3(pts, true), 320, 0.06, 6, { color: '#e5383b' });
    }
  }

  // Ferris wheel legs and platform (the wheel turns, see FerrisWheel).
  {
    const [wx, wz] = WHEEL;
    lit.box(3.2, 0.25, 2.2, { position: [wx, 0.12, wz + 0.4], color: p.concrete });
    for (const dz of [-0.55, 0.55]) {
      for (const dx of [-1.6, 1.6]) {
        lit.beam([wx + dx, 0.2, wz + dz], [wx, 4.3, wz + dz * 0.75], 0.12, 0.12, { color: dark ? '#cfd6df' : '#eef1f5' });
      }
    }
    lit.box(1.6, 0.6, 0.9, { position: [wx + 1.6, 0.3, wz + 1.6], color: dark ? '#e7d8c3' : '#fbefdc' });
  }

  // Drop tower: a lattice mast with a crown.
  {
    const [dx, dz] = DROP;
    const H = 9;
    lit.cylinder(1.4, 1.5, 0.25, 16, { position: [dx, 0.12, dz], color: p.concrete });
    for (const [ox, oz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as const) {
      lit.box(0.09, H, 0.09, { position: [dx + ox, H / 2, dz + oz], color: dark ? '#cfd6df' : '#eef1f5' });
    }
    for (let y = 0.8; y < H; y += 0.8) {
      for (const [a, b] of [[[-0.3, -0.3], [0.3, 0.3]], [[0.3, -0.3], [-0.3, 0.3]]] as const) {
        lit.beam([dx + a[0], y - 0.4, dz + a[1]], [dx + b[0], y + 0.4, dz + b[1]], 0.035, 0.035, { color: '#d62828' });
      }
    }
    lit.cylinder(0.6, 0.45, 0.5, 10, { position: [dx, H + 0.25, dz], color: '#d62828' });
    glow.torus(0.6, 0.04, 4, 24, { position: [dx, H + 0.5, dz], rotation: [Math.PI / 2, 0, 0], color: amber });
    lit.cylinder(0.02, 0.02, 0.8, 4, { position: [dx, H + 0.9, dz], color: '#d9d9d9' });
    glow.ico(0.06, 0, { position: [dx, H + 1.3, dz], color: '#ff3b3b' });
  }

  // Carousel base, swing ride tower base, teacup platform rim.
  lit.cylinder(2.05, 2.15, 0.25, 24, { position: [CAROUSEL[0], 0.12, CAROUSEL[1]], color: p.concrete });
  lit.cylinder(2.3, 2.4, 0.12, 24, { position: [SWINGS[0], 0.06, SWINGS[1]], color: p.concrete });
  lit.cylinder(1.95, 2.0, 0.14, 24, { position: [CUPS[0], 0.07, CUPS[1]], color: p.concrete });
  fenceRing(k, SWINGS, 2.25);
  fenceRing(k, CUPS, 1.9);

  // Queues at every ride, and the forecast towers' bases.
  ENTRANCES.forEach((e) => {
    queueLine(lit, rng, e.queue, 0.26, 0.04, 0.9);
    lit.cylinder(0.36, 0.4, 0.1, 12, { position: [e.at[0] + 0.75, 0.05, e.at[1] + 0.35], color: p.concrete });
  });

  // Food court by the hub, balloon seller, benches of flowers.
  for (const [x, z] of [[-2.6, -2.8], [-1.6, -3.6], [2.6, -2.8], [1.6, -3.6], [-3.3, -1.6], [3.3, -1.6]] as const) {
    cafeTable(k, x, z, 4, 2 + Math.floor(rng() * 2));
    umbrella(k, x, z, rng() < 0.5 ? '#d62828' : amber, 0.42, 0.7);
  }
  {
    const [bx, bz] = [1.6, 2.6];
    person(lit, bx, 0.04, bz, 0.4, randomLook(rng, { shirt: '#ffd166' }));
    const cols = ['#ff5d8f', '#ffd166', '#06d6a0', '#3a86ff', '#ef476f', '#c77dff'];
    for (let i = 0; i < 9; i++) {
      const tx = bx + (rng() - 0.5) * 0.5;
      const tz = bz + (rng() - 0.5) * 0.5;
      const ty = 0.95 + rng() * 0.35;
      lit.beam([bx + 0.08, 0.25, bz], [tx, ty, tz], 0.006, 0.006, { color: '#d9d9d9' });
      lit.ico(0.09, 1, { position: [tx, ty + 0.08, tz], scale: [1, 1.2, 1], color: cols[i % cols.length] });
    }
  }
  flowerBed(lit, rng, p, -1.7, 1.9, 1.0, 0.5, 0.6);
  flowerBed(lit, rng, p, 1.9, 1.7, 1.0, 0.5, -0.6);
  crowd(lit, rng, 0, 1.6, 1.2, 8, 0.04);
  crowd(lit, rng, 0, -2.0, 1.2, 6, 0.04);

  // Trees inside the park and a forest outside the hedge.
  forest(lit, rng, p, 26, 2.5, 10.8, [
    [0, 4, 2.2],
    [0, 0, 3.2],
    [COASTER[0], COASTER[1], 4.6],
    [WHEEL[0], WHEEL[1], 3.6],
    [CAROUSEL[0], CAROUSEL[1], 2.8],
    [DROP[0], DROP[1], 2.2],
    [SWINGS[0], SWINGS[1], 3.0],
    [CUPS[0], CUPS[1], 2.6],
    [CASTLE[0], CASTLE[1], 3.2],
    ...ENTRANCES.map((e): [number, number, number] => [e.at[0], e.at[1], 1.8]),
  ], 'round', [0.7, 1.0]);
  forest(lit, rng, p, 70, 12.3, 16.7, [
    [0, 13, 7.2],
    [-9.6, 9.1, 4.4],
    [9.6, 9.1, 4.4],
  ]);
  for (const x of [-4.5, 4.5]) roundTree(lit, rng, p, x, GATE_Z + 0.4, 0.9);
}

function fenceRing(k: Kit, c: [number, number], r: number) {
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2;
    const a1 = ((i + 1) / 24) * Math.PI * 2;
    k.lit.beam([c[0] + Math.cos(a0) * r, 0.28, c[1] + Math.sin(a0) * r], [c[0] + Math.cos(a1) * r, 0.28, c[1] + Math.sin(a1) * r], 0.025, 0.025, { color: '#e9ecef' });
    k.lit.box(0.03, 0.28, 0.03, { position: [c[0] + Math.cos(a0) * r, 0.14, c[1] + Math.sin(a0) * r], color: '#e9ecef' });
  }
}

/* ── Rides ─────────────────────────────────────────────────────────── */

function useBuilt(fn: (b: MeshBuilder, g: MeshBuilder) => void, palette: ScenePalette) {
  const geoms = useMemo(() => {
    const b = new MeshBuilder();
    const g = new MeshBuilder(palette.glow);
    fn(b, g);
    return { lit: b.build(), glow: g.empty ? null : g.build() };
  }, [fn, palette]);
  useEffect(
    () => () => {
      geoms.lit.dispose();
      geoms.glow?.dispose();
    },
    [geoms],
  );
  return geoms;
}

function Meshes({ g }: { g: { lit: THREE.BufferGeometry; glow: THREE.BufferGeometry | null } }) {
  return (
    <>
      <mesh geometry={g.lit} material={litMaterial()} />
      {g.glow && <mesh geometry={g.glow} material={glowMaterial()} />}
    </>
  );
}

const CAR_COLORS = ['#ffd60a', '#3a86ff', '#ff5d8f', '#06d6a0'];

function CoasterTrain({ animate }: IslandProps) {
  const curve = TRACK.curve;
  const cars = useMemo(
    () =>
      CAR_COLORS.map((c, i) => {
        const b = new MeshBuilder();
        b.box(0.44, 0.16, 0.34, { position: [0, 0.12, 0], color: c });
        b.box(0.08, 0.14, 0.32, { position: [i === 0 ? 0.2 : -0.18, 0.24, 0], color: c });
        for (const z of [-0.08, 0.08]) {
          b.box(0.1, 0.1, 0.1, { position: [0.02, 0.24, z], color: '#2b2d42' });
          b.ico(0.045, 0, { position: [0.02, 0.33, z], color: '#f1c27d' });
        }
        return b.build();
      }),
    [],
  );
  useEffect(() => () => cars.forEach((g) => g.dispose()), [cars]);
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const st = useRef({ u: 0.02 });
  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), s: new THREE.Vector3(), up: new THREE.Vector3(), m: new THREE.Matrix4() }),
    [],
  );
  const total = useMemo(() => curve.getLength(), [curve]);
  useFrame((_, dt) => {
    if (animate) {
      curve.getTangentAt(st.current.u, tmp.t);
      // Climbs slowly, races down.
      const speed = 2.0 - tmp.t.y * 1.6;
      st.current.u = (st.current.u + (Math.min(dt, 0.1) * Math.max(0.5, speed)) / total) % 1;
    }
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (st.current.u - (i * 0.5) / total + 1) % 1;
      curve.getPointAt(u, tmp.p);
      frameAt(u, tmp.s, tmp.up, tmp.t);
      tmp.m.makeBasis(tmp.t, tmp.up, tmp.s);
      m.quaternion.setFromRotationMatrix(tmp.m);
      m.position.copy(tmp.p).addScaledVector(tmp.up, 0.02);
    });
  });
  return (
    <group>
      {cars.map((g, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={g}
          material={litMaterial()}
        />
      ))}
    </group>
  );
}

function FerrisWheel({ palette, animate }: IslandProps) {
  const wheel = useRef<THREE.Group>(null);
  const cabins = useRef<Array<THREE.Mesh | null>>([]);
  const N = 12;
  const RAD = 3.4;
  const buildWheel = useMemo(
    () => (b: MeshBuilder, g: MeshBuilder) => {
      const steel = palette.mode === 'dark' ? '#e7ecf2' : '#ffffff';
      for (const z of [-0.36, 0.36]) {
        b.torus(RAD, 0.06, 5, 64, { position: [0, 0, z], color: steel });
        b.torus(RAD * 0.55, 0.04, 4, 48, { position: [0, 0, z], color: steel });
        for (let i = 0; i < N * 2; i++) {
          const a = (i / (N * 2)) * Math.PI * 2;
          b.beam([0, 0, z * 0.4], [Math.cos(a) * RAD, Math.sin(a) * RAD, z], 0.025, 0.025, { color: steel });
        }
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          g.ico(0.045, 0, { position: [Math.cos(a) * (RAD + 0.08), Math.sin(a) * (RAD + 0.08), z], color: i % 2 ? '#a8681c' : '#9a9a9a' });
        }
      }
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        b.beam([Math.cos(a) * RAD, Math.sin(a) * RAD, -0.4], [Math.cos(a) * RAD, Math.sin(a) * RAD, 0.4], 0.04, 0.04, { color: steel });
      }
      b.cylinder(0.22, 0.22, 1.1, 12, { rotation: [Math.PI / 2, 0, 0], color: '#5b6270' });
      g.cylinder(0.12, 0.12, 1.12, 12, { rotation: [Math.PI / 2, 0, 0], color: '#a8681c' });
    },
    [palette],
  );
  const parts = useBuilt(buildWheel, palette);
  const cabin = useMemo(() => {
    const cols = ['#d62828', '#f77f00', '#ffd60a', '#06d6a0', '#3a86ff', '#8338ec'];
    return cols.map((c) => {
      const b = new MeshBuilder();
      b.box(0.04, 0.3, 0.04, { position: [0, -0.15, 0], color: '#5b6270' });
      b.cylinder(0.26, 0.22, 0.38, 8, { position: [0, -0.48, 0], color: c });
      b.cylinder(0.27, 0.27, 0.2, 8, { position: [0, -0.36, 0], color: '#1f2a38' });
      b.cone(0.3, 0.14, 8, { position: [0, -0.22, 0], color: '#ffffff' });
      return b.build();
    });
  }, []);
  useEffect(() => () => cabin.forEach((g) => g.dispose()), [cabin]);
  const angle = useRef(0);
  useFrame((_, dt) => {
    if (animate) angle.current += Math.min(dt, 0.1) * 0.12;
    if (wheel.current) wheel.current.rotation.z = angle.current;
    cabins.current.forEach((m, i) => {
      if (!m) return;
      const a = angle.current + (i / N) * Math.PI * 2;
      m.position.set(Math.cos(a) * RAD, Math.sin(a) * RAD, 0);
    });
  });
  return (
    <group position={[WHEEL[0], 4.3, WHEEL[1]]} rotation={[0, -0.25, 0]}>
      <group ref={wheel}>
        <Meshes g={parts} />
      </group>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            cabins.current[i] = m;
          }}
          geometry={cabin[i % cabin.length]}
          material={litMaterial()}
        />
      ))}
    </group>
  );
}

function Carousel({ palette, animate }: IslandProps) {
  const top = useRef<THREE.Group>(null);
  const horses = useRef<Array<THREE.Group | null>>([]);
  const N = 10;
  const buildTop = useMemo(
    () => (b: MeshBuilder, g: MeshBuilder) => {
      const red = '#c1121f';
      for (let i = 0; i < 16; i++) {
        const geo = new THREE.ConeGeometry(2.1, 1.0, 1, 1, true, (i / 16) * Math.PI * 2, Math.PI / 8);
        b.add(geo, { position: [0, 2.6, 0], color: i % 2 ? red : '#fff6e5' });
        const a = ((i + 0.5) / 16) * Math.PI * 2;
        b.cone(0.16, 0.22, 4, { position: [Math.sin(a) * 2.0, 1.98, Math.cos(a) * 2.0], rotation: [Math.PI, 0, 0], color: i % 2 ? red : '#ffd166' });
      }
      b.cylinder(2.05, 2.05, 0.18, 24, { position: [0, 2.1, 0], color: '#ffd166' });
      g.torus(2.07, 0.03, 4, 48, { position: [0, 2.05, 0], rotation: [Math.PI / 2, 0, 0], color: palette.window });
      g.ico(0.12, 0, { position: [0, 3.2, 0], color: palette.accent.amber });
      b.cylinder(1.95, 1.95, 0.12, 24, { position: [0, 0.3, 0], color: '#8a5a3b' });
      b.cylinder(0.35, 0.35, 1.9, 12, { position: [0, 1.25, 0], color: '#fff6e5' });
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        b.cylinder(0.025, 0.025, 1.8, 4, { position: [Math.cos(a) * 1.4, 1.2, Math.sin(a) * 1.4], color: '#ffd166' });
      }
    },
    [palette],
  );
  const parts = useBuilt(buildTop, palette);
  const horse = useMemo(() => {
    const b = new MeshBuilder();
    const c = '#fbfbf8';
    b.box(0.42, 0.16, 0.14, { color: c });
    b.box(0.1, 0.22, 0.1, { position: [0.2, 0.14, 0], rotation: [0, 0, -0.4], color: c });
    b.box(0.16, 0.08, 0.08, { position: [0.3, 0.24, 0], color: c });
    for (const [x, z] of [[0.15, 0.05], [0.15, -0.05], [-0.15, 0.05], [-0.15, -0.05]] as const) {
      b.box(0.04, 0.18, 0.04, { position: [x, -0.15, z], color: c });
    }
    b.box(0.12, 0.04, 0.16, { position: [0, 0.1, 0], color: '#c1121f' });
    return b.build();
  }, []);
  useEffect(() => () => horse.dispose(), [horse]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    if (top.current) top.current.rotation.y = t.current * 0.5;
    horses.current.forEach((h, i) => {
      if (h) h.position.y = 0.85 + Math.sin(t.current * 2.2 + i * 1.3) * 0.15;
    });
  });
  return (
    <group position={[CAROUSEL[0], 0.12, CAROUSEL[1]]}>
      <group ref={top}>
        <Meshes g={parts} />
        {Array.from({ length: N }, (_, i) => {
          const a = (i / N) * Math.PI * 2;
          return (
            <group
              key={i}
              ref={(g) => {
                horses.current[i] = g;
              }}
              position={[Math.cos(a) * 1.4, 0.85, Math.sin(a) * 1.4]}
              rotation={[0, -a - Math.PI / 2, 0]}
            >
              <mesh geometry={horse} material={litMaterial()} />
            </group>
          );
        })}
      </group>
    </group>
  );
}

function DropRide({ palette, animate }: IslandProps) {
  const ref = useRef<THREE.Group>(null);
  const build = useMemo(
    () => (b: MeshBuilder, g: MeshBuilder) => {
      b.cylinder(0.75, 0.75, 0.3, 16, { color: '#ffd60a' });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        b.box(0.14, 0.24, 0.14, { position: [Math.cos(a) * 0.82, -0.05, Math.sin(a) * 0.82], rotation: [0, -a, 0], color: '#2b2d42' });
        b.ico(0.05, 0, { position: [Math.cos(a) * 0.86, 0.12, Math.sin(a) * 0.86], color: '#f1c27d' });
      }
      g.torus(0.76, 0.03, 4, 28, { position: [0, -0.15, 0], rotation: [Math.PI / 2, 0, 0], color: palette.window });
    },
    [palette],
  );
  const parts = useBuilt(build, palette);
  const t = useRef(0.3);
  useFrame((_, dt) => {
    if (animate) t.current = (t.current + Math.min(dt, 0.1) / 9) % 1;
    const u = t.current;
    const y = u < 0.6 ? 0.6 + (u / 0.6) * 7.6 : u < 0.72 ? 8.2 : 8.2 - Math.pow(Math.min(1, (u - 0.72) / 0.12), 1.8) * 7.6;
    if (ref.current) ref.current.position.y = Math.max(0.6, y);
  });
  return (
    <group ref={ref} position={[DROP[0], 0.6, DROP[1]]}>
      <Meshes g={parts} />
    </group>
  );
}

function SwingRide({ palette, animate }: IslandProps) {
  const spin = useRef<THREE.Group>(null);
  const chains = useRef<Array<THREE.Group | null>>([]);
  const N = 14;
  const buildMast = useMemo(
    () => (b: MeshBuilder, g: MeshBuilder) => {
      b.cylinder(0.22, 0.3, 3.0, 12, { position: [0, 1.5, 0], color: '#3a86ff' });
      b.cylinder(1.5, 1.5, 0.12, 24, { position: [0, 3.05, 0], color: '#ffd166' });
      for (let i = 0; i < 12; i++) {
        const geo = new THREE.ConeGeometry(1.55, 0.6, 1, 1, true, (i / 12) * Math.PI * 2, Math.PI / 6);
        b.add(geo, { position: [0, 3.4, 0], color: i % 2 ? '#3a86ff' : '#ffffff' });
      }
      g.torus(1.52, 0.03, 4, 40, { position: [0, 3.0, 0], rotation: [Math.PI / 2, 0, 0], color: palette.window });
    },
    [palette],
  );
  const parts = useBuilt(buildMast, palette);
  const seat = useMemo(() => {
    const b = new MeshBuilder();
    b.beam([0, 0, 0], [0, -1.3, 0], 0.012, 0.012, { color: '#d9d9d9' });
    b.box(0.16, 0.04, 0.14, { position: [0, -1.32, 0], color: '#2b2d42' });
    b.box(0.08, 0.12, 0.06, { position: [0, -1.24, 0], color: '#ef476f' });
    b.ico(0.04, 0, { position: [0, -1.14, 0], color: '#f1c27d' });
    return b.build();
  }, []);
  useEffect(() => () => seat.dispose(), [seat]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    // Spins up, runs, slows down, rests.
    const cycle = t.current % 16;
    const speed = cycle < 3 ? cycle / 3 : cycle < 11 ? 1 : cycle < 14 ? (14 - cycle) / 3 : 0;
    if (spin.current) spin.current.rotation.y += Math.min(dt, 0.1) * speed * 1.6 * (animate ? 1 : 0);
    const tilt = speed * 0.75;
    chains.current.forEach((c) => {
      if (c) c.rotation.z = tilt;
    });
  });
  return (
    <group position={[SWINGS[0], 0.12, SWINGS[1]]}>
      <Meshes g={parts} />
      <group ref={spin}>
        {Array.from({ length: N }, (_, i) => {
          const a = (i / N) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, -a, 0]}>
              <group
                ref={(g) => {
                  chains.current[i] = g;
                }}
                position={[1.45, 2.95, 0]}
              >
                <mesh geometry={seat} material={litMaterial()} />
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Teacups({ animate }: IslandProps) {
  const plate = useRef<THREE.Group>(null);
  const cups = useRef<Array<THREE.Group | null>>([]);
  const geo = useMemo(() => {
    const cols = ['#ff5d8f', '#3a86ff', '#ffd166', '#06d6a0', '#c77dff'];
    return cols.map((c) => {
      const b = new MeshBuilder();
      b.lathe([[0.0, 0], [0.24, 0.02], [0.36, 0.2], [0.4, 0.38], [0.36, 0.38], [0.3, 0.22], [0.0, 0.18]], 12, { color: c });
      b.torus(0.1, 0.025, 4, 8, { position: [0.42, 0.22, 0], color: c });
      b.box(0.08, 0.12, 0.06, { position: [0.12, 0.3, 0.05], color: '#2b2d42' });
      b.ico(0.045, 0, { position: [0.12, 0.42, 0.05], color: '#f1c27d' });
      b.box(0.08, 0.12, 0.06, { position: [-0.12, 0.3, -0.05], color: '#e63946' });
      b.ico(0.045, 0, { position: [-0.12, 0.42, -0.05], color: '#8d5524' });
      return b.build();
    });
  }, []);
  const base = useMemo(() => {
    const b = new MeshBuilder();
    b.cylinder(1.75, 1.75, 0.08, 24, { color: '#e9d5ff' });
    b.cylinder(0.35, 0.35, 0.5, 12, { position: [0, 0.25, 0], color: '#ffd166' });
    b.ico(0.18, 1, { position: [0, 0.6, 0], color: '#ff5d8f' });
    return b.build();
  }, []);
  useEffect(
    () => () => {
      geo.forEach((g) => g.dispose());
      base.dispose();
    },
    [geo, base],
  );
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    if (plate.current) plate.current.rotation.y = t.current * 0.35;
    cups.current.forEach((c, i) => {
      if (c) c.rotation.y = -t.current * (1.2 + i * 0.2);
    });
  });
  return (
    <group ref={plate} position={[CUPS[0], 0.18, CUPS[1]]}>
      <mesh geometry={base} material={litMaterial()} />
      {geo.map((g, i) => {
        const a = (i / geo.length) * Math.PI * 2;
        return (
          <group
            key={i}
            ref={(c) => {
              cups.current[i] = c;
            }}
            position={[Math.cos(a) * 1.1, 0.04, Math.sin(a) * 1.1]}
          >
            <mesh geometry={g} material={litMaterial()} />
          </group>
        );
      })}
    </group>
  );
}

/** Queue towers: translucent columns whose height is the (illustrative) forecast wait. */
function QueueTowers({ palette, animate }: IslandProps) {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const column = useMemo(() => {
    const b = new MeshBuilder();
    b.cylinder(0.28, 0.28, 1, 14, { position: [0, 0.5, 0], color: palette.accent.amber });
    return b.build();
  }, [palette]);
  const cap = useMemo(() => {
    const g = new MeshBuilder(palette.glow);
    g.cylinder(0.31, 0.31, 0.06, 14, { color: palette.accent.amber });
    g.torus(0.36, 0.02, 4, 20, { position: [0, -0.03, 0], rotation: [Math.PI / 2, 0, 0], color: palette.accent.amber });
    return g.build();
  }, [palette]);
  useEffect(
    () => () => {
      column.dispose();
      cap.dispose();
    },
    [column, cap],
  );
  const time = useRef(0);
  useFrame((_, dt) => {
    if (animate) time.current += Math.min(dt, 0.1);
    ENTRANCES.forEach((q, i) => {
      const g = refs.current[i];
      if (!g) return;
      const h = q.wait * (0.55 + 0.45 * Math.sin(time.current * 0.4 + q.phase));
      g.children[0].scale.y = h;
      g.children[1].position.y = h;
    });
  });
  return (
    <group>
      {ENTRANCES.map((q, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[q.at[0] + 0.75, 0.1, q.at[1] + 0.35]}
        >
          <mesh geometry={column} material={glassMaterial()} />
          <mesh geometry={cap} material={glowMaterial()} />
        </group>
      ))}
    </group>
  );
}

/** The visitor following the planned route. */
function Visitor({ palette, animate }: IslandProps) {
  const curve = useMemo(() => {
    const pts = smoothPath([[0, 11.0], [0, 6.0], ...ENTRANCES.map((e) => e.at), [1.2, 3.0], [0.4, 8.0]], true, 0.3);
    return new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0.1, z)), true);
  }, []);
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 1.3);
    g.ico(0.2, 1, { position: [0, 0.7, 0], color: palette.window });
    g.torus(0.35, 0.03, 4, 24, { position: [0, 0.05, 0], rotation: [Math.PI / 2, 0, 0], color: palette.accent.amber });
    return g.build();
  }, [palette]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const t = useRef(0);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    if (animate) t.current = (t.current + Math.min(dt, 0.1) * 0.012) % 1;
    curve.getPointAt(t.current, p);
    ref.current?.position.set(p.x, 0.04, p.z);
  });
  return (
    <group ref={ref}>
      <mesh geometry={geometry} material={glowMaterial()} />
    </group>
  );
}

const ROAD = track(smoothPath([[-15.5, 7.2], [-9, 12.9], [0, 15.6], [9, 12.9], [15.5, 7.2]], false, 0.6), false, 0.06);
const FLEET: FleetSpec[] = [
  { kind: 'car', track: ROAD, count: 4, speed: 1.0, lane: 0.3 },
  { kind: 'tram', track: ROAD, speed: 0.7, lane: 0.3, offset: 6, colors: ['#ffd166'], scale: 0.8 },
];

const ringLoop = smoothPath(ENTRANCES.map((e) => e.at), true, 0.4);
const WALKS: WalkerGroup[] = [
  { track: track([[0, 14.2], [0, 2.6]], false, 0.04), count: 18, spread: 0.7 },
  { track: track(Array.from({ length: 20 }, (_, i) => [Math.cos((i / 20) * Math.PI * 2) * 2.2, Math.sin((i / 20) * Math.PI * 2) * 2.2] as [number, number]), true, 0.04), count: 8, spread: 0.3 },
  { track: track(ringLoop, true, 0.04), count: 22, spread: 0.4 },
  ...ENTRANCES.map((e) => ({ track: track([[0, 0], e.at], false, 0.04), count: 2, spread: 0.3 })),
  { track: track([[-6, 12.6], [6, 12.6]], false, 0.04), count: 6, spread: 0.6 },
];

export default function ParkIsland(props: IslandProps) {
  return (
    <group>
      <Baked build={build} palette={props.palette} seed={202} />
      <CoasterTrain {...props} />
      <FerrisWheel {...props} />
      <Carousel {...props} />
      <DropRide {...props} />
      <SwingRide {...props} />
      <Teacups {...props} />
      <QueueTowers {...props} />
      <Visitor {...props} />
      <Fleet specs={FLEET} palette={props.palette} animate={props.animate} seed={21} />
      <Walkers groups={WALKS} animate={props.animate} seed={22} />
    </group>
  );
}
