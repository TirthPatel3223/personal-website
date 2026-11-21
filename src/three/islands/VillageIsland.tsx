'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { glowMaterial, litMaterial } from '../core/materials';
import { mulberry32, smoothstep } from '../core/math';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { drawStar } from './parts/signs';
import { road, road3, smoothPath } from './parts/ground';
import { Fleet, Walkers, track, type FleetSpec, type WalkerGroup } from './parts/movers';
import { bush, cypress, palm, roundTree, treeRow } from './parts/nature';
import { person, randomLook } from './parts/people';
import { at, awning, cafeTable, dome, lamp, umbrella } from './parts/structures';
import type { V2, V3 } from './parts/types';
import { vehicle } from './parts/vehicles';

/* Airbnb Village: the Superhost regression-discontinuity study, as a holiday town.
   A terraced hill of whitewashed cliff houses and villas with pools rises behind a
   beach and a lagoon; a switchback road climbs to a church and a windmill. Pins
   float over a few listings with their ratings either side of 4.8, the cutoff the
   study tested (at or above it, a host can hold the Superhost badge). */

const R = 16.5;
const HILL = { cx: 0, cz: -7.4, rx: 13, rz: 7.8, h: 4.9 };
const LAGOON: V2[] = [[-6.8, 7.2], [-3.5, 5.6], [1.5, 5.4], [6.2, 6.4], [8.0, 9.0], [6.0, 12.0], [1.0, 13.0], [-4.5, 12.4], [-7.6, 10.2]];
const BEACH: V2[] = [[-9.4, 6.4], [-4.0, 4.0], [2.0, 3.9], [8.0, 4.6], [10.6, 8.6], [8.4, 13.4], [1.0, 15.0], [-6.0, 14.4], [-10.2, 10.6]];

/* ── The hill: a terraced heightfield, cut by the road ───────────── */

function rawHeight(x: number, z: number) {
  const dx = (x - HILL.cx) / HILL.rx;
  const dz = (z - HILL.cz) / HILL.rz;
  // A little wobble so the hill's outline is not an ellipse.
  const wob = 0.06 * Math.sin(x * 0.7) + 0.05 * Math.cos(z * 0.9 + x * 0.3);
  const d = Math.sqrt(dx * dx + dz * dz) + wob;
  if (d >= 1) return 0;
  const h = HILL.h * Math.pow(1 - smoothstep(0.08, 1, d), 1.2);
  const step = 0.7;
  const f = h / step;
  const terraced = step * (Math.floor(f) + smoothstep(0.5, 1, f - Math.floor(f)));
  return terraced * 0.55 + h * 0.45;
}

/** The switchback road from the promenade to the church, with smoothed heights. */
const ROAD_2D = smoothPath(
  [[-11.2, 3.4], [-8.6, 0.6], [-10.2, -2.6], [-6.4, -4.0], [-2.0, -2.6], [3.0, -3.6], [6.6, -5.6], [3.6, -8.2], [-0.4, -9.4]],
  false,
  0.35,
);
const ROAD_3D: V3[] = (() => {
  const ys = ROAD_2D.map(([x, z]) => rawHeight(x, z));
  const sm = ys.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - 4); j <= Math.min(ys.length - 1, i + 4); j++) {
      s += ys[j];
      n++;
    }
    return s / n;
  });
  // Never descend on the way up.
  for (let i = 1; i < sm.length; i++) sm[i] = Math.max(sm[i], sm[i - 1]);
  return ROAD_2D.map(([x, z], i) => [x, sm[i], z]);
})();

function roadDist(x: number, z: number) {
  let best = Infinity;
  let y = 0;
  for (const [rx, ry, rz] of ROAD_3D) {
    const d = (x - rx) * (x - rx) + (z - rz) * (z - rz);
    if (d < best) {
      best = d;
      y = ry;
    }
  }
  return { d: Math.sqrt(best), y };
}

/** Ground height: the terraced hill, blended to the road's level within ~1.4 of it. */
export function groundHeight(x: number, z: number) {
  const h = rawHeight(x, z);
  if (h <= 0) return 0;
  const r = roadDist(x, z);
  const w = 1 - smoothstep(0.7, 1.5, r.d);
  return h * (1 - w) + r.y * w;
}

/** Steps from the promenade up the front cliff, following the ground. */
const STAIRS: V3[] = smoothPath(
  [[2.6, 2.0], [4.2, 0.6], [2.4, -0.6], [4.4, -1.8], [2.8, -3.0], [4.0, -4.2]],
  false,
  0.3,
).map(([x, z]) => [x, groundHeight(x, z), z] as V3);

function hillGeometry(k: Kit) {
  const dark = k.p.mode === 'dark';
  const rock = new THREE.Color(dark ? '#6a5c4c' : '#c4ae8e');
  const rockDark = new THREE.Color(dark ? '#4e4438' : '#a8916f');
  const scrub = new THREE.Color(dark ? '#3f5a3a' : '#a7b86c');
  const scrubDark = new THREE.Color(dark ? '#344b31' : '#8fa35a');
  const step = 0.32;
  const x0 = HILL.cx - HILL.rx - 0.4;
  const z0 = HILL.cz - HILL.rz - 0.4;
  const nx = Math.ceil((HILL.rx * 2 + 0.8) / step);
  const nz = Math.ceil((HILL.rz * 2 + 0.8) / step);
  const H: number[][] = [];
  for (let i = 0; i <= nx; i++) {
    H.push([]);
    for (let j = 0; j <= nz; j++) H[i].push(groundHeight(x0 + i * step, z0 + j * step));
  }
  const pos: number[] = [];
  const col: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const tmp = new THREE.Color();
  const rng = mulberry32(9);
  const tri = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3) => {
    if (p.y < 0.01 && q.y < 0.01 && r.y < 0.01) return;
    for (const v of [p, q, r]) if (Math.hypot(v.x, v.z) > R - 0.4) return;
    n.subVectors(q, p).cross(new THREE.Vector3().subVectors(r, p)).normalize();
    const slope = 1 - Math.abs(n.y);
    const t = rng();
    if (slope > 0.45) tmp.copy(rock).lerp(rockDark, t * 0.6);
    else tmp.copy(scrub).lerp(scrubDark, t * 0.7);
    pos.push(p.x, Math.max(p.y, 0.005), p.z, q.x, Math.max(q.y, 0.005), q.z, r.x, Math.max(r.y, 0.005), r.z);
    for (let k = 0; k < 3; k++) col.push(tmp.r, tmp.g, tmp.b);
  };
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const X = x0 + i * step;
      const Z = z0 + j * step;
      a.set(X, H[i][j], Z);
      b.set(X, H[i][j + 1], Z + step);
      c.set(X + step, H[i + 1][j], Z);
      tri(a, b, c);
      a.set(X + step, H[i + 1][j + 1], Z + step);
      tri(c.clone(), b.clone(), a.clone());
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/* ── Houses ───────────────────────────────────────────────────────── */

const PASTEL = ['#f6d6a8', '#f4b8a4', '#e9c7c1', '#f3e3b5'];

function footprintRange(x: number, z: number, w: number, d: number, yaw: number) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const [u, v] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, 0]] as const) {
    const [px, pz] = at(x, z, yaw, u, v);
    const y = groundHeight(px, pz);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  return { lo, hi };
}

type Style = 'white' | 'dome' | 'tile' | 'villa';

interface Site {
  x: number;
  z: number;
  yaw: number;
  style: Style;
  w: number;
  d: number;
  h: number;
  /** Ground under the footprint. */
  lo: number;
  hi: number;
}

/**
 * House sites, sampled once with their own seed (so both themes get the same town):
 * on the hill, away from the road, the church, the windmill and each other.
 */
const SITES: Site[] = (() => {
  const rng = mulberry32(77);
  const pts: Array<[number, number]> = [];
  for (let tries = 0; tries < 12000 && pts.length < 76; tries++) {
    const x = HILL.cx + (rng() * 2 - 1) * HILL.rx * 0.9;
    const z = HILL.cz + (rng() * 2 - 1) * HILL.rz * 0.9;
    if (rawHeight(x, z) < 0.5 || Math.hypot(x, z) > R - 2) continue;
    if (roadDist(x, z).d < 1.3) continue;
    if (STAIRS.some(([sx, , sz]) => Math.hypot(sx - x, sz - z) < 1.0)) continue;
    if (pts.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 1.3)) continue;
    if (Math.hypot(x - 0.6, z + 10.8) < 2.4 || Math.hypot(x - 8.8, z + 8.4) < 1.8) continue;
    // Houses step down the slope; skip only the steepest risers.
    const { lo, hi } = footprintRange(x, z, 1.3, 1.1, 0);
    if (hi - lo > 1.1) continue;
    pts.push([x, z]);
  }
  // Lower slopes first: villas there, tiled roofs to the sides, domes higher up.
  pts.sort((a, b) => b[1] - a[1]);
  return pts.map(([x, z], i) => {
    const yaw = (rng() - 0.5) * 0.35 + x * -0.02;
    const style: Style =
      i % 6 === 2 && rawHeight(x, z) < 3 ? 'villa' : Math.abs(x) > 8 && rng() < 0.5 ? 'tile' : rng() < 0.3 ? 'dome' : 'white';
    const villa = style === 'villa';
    const w = villa ? 2.0 : 1.0 + rng() * 0.6;
    const d = villa ? 1.4 : 0.85 + rng() * 0.35;
    const h = villa ? 0.7 : 0.5 + rng() * 0.35;
    const { lo, hi } = footprintRange(x, z, w, d, yaw);
    return { x, z, yaw, style, w, d, h, lo, hi };
  });
})();

const roofTop = (s: Site) => s.hi + s.h + (s.style === 'tile' ? 0.32 : s.style === 'dome' ? 0.4 : 0.06);

function cliffHouse(k: Kit, s: Site) {
  const { lit, glow, p, rng } = k;
  const dark = p.mode === 'dark';
  const white = dark ? '#f2f1ee' : '#ffffff';
  const { x, z, yaw, style, w, d, h, lo, hi } = s;
  const villa = style === 'villa';
  const y0 = lo - 0.1;
  const top = hi + h;
  const wall = style === 'tile' ? PASTEL[Math.floor(rng() * PASTEL.length)] : white;
  lit.box(w, top - y0, d, { position: [x, (y0 + top) / 2, z], rotation: [0, yaw, 0], color: wall });
  if (style === 'tile') {
    lit.taperBox(w + 0.12, 0.32, d + 0.12, 0.25, 0.05, { position: [x, top + 0.16, z], rotation: [0, yaw, 0], color: '#c8643b' });
  } else {
    lit.box(w + 0.04, 0.06, d + 0.04, { position: [x, top + 0.03, z], rotation: [0, yaw, 0], color: white });
    if (style === 'dome') {
      const [px, pz] = at(x, z, yaw, w * 0.18, -d * 0.1);
      dome(lit, px, top + 0.06, pz, Math.min(w, d) * 0.32, '#1f5fbf');
    }
  }
  // Blue door, shuttered windows facing the sea.
  const [dx, dz] = at(x, z, yaw, -w * 0.25, d / 2 + 0.012);
  lit.box(0.14, 0.26, 0.02, { position: [dx, hi + 0.13, dz], rotation: [0, yaw, 0], color: '#1f5fbf' });
  // Windows on every storey of the sea-facing front, down to where the hill buries it.
  for (let fy = top - 0.38; fy > lo + 0.12; fy -= 0.42) {
    for (const u of villa ? [0.1, 0.45, 0.8] : w > 1.3 ? [0.05, 0.55] : [0.25]) {
      const [wx, wz] = at(x, z, yaw, w * (u - 0.2), d / 2 + 0.012);
      const roll = rng();
      const on = dark && roll < 0.6;
      (on ? glow : lit).box(0.17, 0.19, 0.02, { position: [wx, fy, wz], rotation: [0, yaw, 0], color: on ? p.window : '#2f5f8f' });
    }
  }
  if (villa) {
    // Pool terrace in front, with loungers and a guest.
    const [px, pz] = at(x, z, yaw, 0, d / 2 + 0.75);
    const py = groundHeight(px, pz);
    const deckY = Math.max(lo, py) + 0.02;
    lit.box(w + 0.2, deckY - y0 + 0.06, 1.3, { position: [px, (y0 + deckY) / 2 + 0.03, pz], rotation: [0, yaw, 0], color: white });
    lit.box(w * 0.7, 0.03, 0.75, { position: [px, deckY + 0.07, pz], rotation: [0, yaw, 0], color: dark ? '#2aa3b8' : '#5fd4e6' });
    for (const u of [-0.75, 0.75]) {
      const [lx, lz] = at(px, pz, yaw, u * (w / 2), 0.45);
      lit.box(0.14, 0.04, 0.34, { position: [lx, deckY + 0.08, lz], rotation: [0, yaw, 0], color: '#ffffff' });
    }
    const [gx, gz] = at(px, pz, yaw, w * 0.36, 0.35);
    person(lit, gx, deckY + 0.08, gz, yaw, randomLook(rng), 'lie');
    const [ux, uz] = at(px, pz, yaw, -w * 0.45, 0.2);
    umbrella(k, ux, uz, '#ff5a5f', 0.3, 0.5, deckY + 0.06);
  }
  // Bougainvillea against the wall.
  if (rng() < 0.45) {
    const [bx, bz] = at(x, z, yaw, w / 2, d / 2);
    bush(lit, rng, p, bx, bz, 0.8, hi - 0.05, '#c2185b');
  }
}

/* ── Static build ──────────────────────────────────────────────────── */

const LISTED = [3, 9, 15, 22, 28, 34];
const RATINGS = [4.92, 4.71, 4.85, 4.79, 4.97, 4.66];

function build(k: Kit) {
  const { lit, glow, p, rng, signs } = k;
  base(k, 59, R, 9);
  rimGlow(k, R, p.accent.rausch);
  const dark = p.mode === 'dark';
  const sand = dark ? '#8f7f62' : '#f1dfb4';
  const water = dark ? '#1e6f86' : '#46c3d8';
  const deep = dark ? '#16566f' : '#1f9fbf';

  // Beach, lagoon (shallow rim, deeper middle) and a promenade road.
  lit.slab(smoothPath(BEACH, true, 0.5), 0, 0.05, { color: sand });
  lit.slab(smoothPath(LAGOON, true, 0.4), 0, 0.07, { color: water });
  lit.slab(
    smoothPath(LAGOON.map(([x, z]) => [x * 0.72 + 0.4, 9.2 + (z - 9.2) * 0.65] as V2), true, 0.4),
    0,
    0.075,
    { color: deep },
  );
  road(k, smoothPath([[-15.4, 4.4], [-8, 3.0], [0, 2.6], [8, 3.0], [15.2, 4.6]], false, 0.6), 1.1, { sidewalk: 0.35 });

  // The hill and its road.
  lit.add(hillGeometry(k));
  road3(k, ROAD_3D, 0.9, p.asphalt, dark ? '#bdb5a6' : '#fbfaf6');

  for (const site of SITES) cliffHouse(k, site);

  // Church with a blue dome and a bell tower at the top.
  {
    const [cx, cz] = [0.6, -10.8];
    const y = groundHeight(cx, cz);
    const white = dark ? '#ebe8e1' : '#ffffff';
    lit.box(2.0, 1.1 + 0.3, 1.4, { position: [cx, y + 0.4, cz], color: white });
    lit.cylinder(0.55, 0.55, 0.35, 16, { position: [cx, y + 1.25, cz], color: white });
    dome(lit, cx, y + 1.42, cz, 0.55, '#1f5fbf', 16);
    lit.cylinder(0.03, 0.03, 0.3, 4, { position: [cx, y + 2.1, cz], color: '#d9d9d9' });
    lit.box(0.18, 0.04, 0.04, { position: [cx, y + 2.18, cz], color: '#d9d9d9' });
    lit.box(0.6, 1.7, 0.6, { position: [cx + 1.25, y + 0.85, cz + 0.2], color: white });
    for (const s of [-1, 1]) lit.box(0.2, 0.32, 0.02, { position: [cx + 1.25 + s * 0.15, y + 1.45, cz + 0.51], color: '#2a3647' });
    dome(lit, cx + 1.25, y + 1.7, cz + 0.2, 0.3, '#1f5fbf', 12);
    glow.box(0.5, 0.06, 0.02, { position: [cx, y + 0.9, cz + 0.71], color: p.window });
  }
  // Whitewashed steps zig-zagging up the cliff from the promenade to the village.
  road3(k, STAIRS, 0.42, dark ? '#d8d4cc' : '#f4f1ea');

  // Windmill pedestal (the sails turn, see Windmill).
  {
    const [mx, mz] = [8.8, -8.4];
    const y = groundHeight(mx, mz);
    lit.cylinder(0.5, 0.62, 1.7, 14, { position: [mx, y + 0.85, mz], color: dark ? '#ebe8e1' : '#ffffff' });
    lit.cone(0.62, 0.55, 14, { position: [mx, y + 1.97, mz], color: '#6b4f3a' });
  }

  // Harbour pier with moored boats, a beach bar and beach life.
  {
    const [px, pz] = [-5.4, 6.0];
    for (let i = 0; i < 9; i++) lit.box(0.6, 0.06, 0.32, { position: [px + 0.2, 0.14, pz + 0.3 + i * 0.34], color: p.wood });
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) lit.cylinder(0.04, 0.04, 0.3, 5, { position: [px + 0.2 + s * 0.28, 0.06, pz + 0.3 + i * 0.75], color: p.wood });
    // Moored boats either side of the pier.
    for (const [bx, bz, a, c] of [[px - 0.55, pz + 1.4, Math.PI / 2, '#ff5a5f'], [px + 0.95, pz + 2.2, Math.PI / 2, '#1f5fbf']] as const) {
      const b = new MeshBuilder();
      const g = new MeshBuilder();
      vehicle(b, g, 'boat', c);
      k.lit.stamp(b, { position: [bx, 0.1, bz], rotation: [0, a, 0] });
      k.glow.stamp(g, { position: [bx, 0.1, bz], rotation: [0, a, 0] });
    }
  }
  {
    const [bx, bz] = [5.4, 3.2];
    lit.box(2.2, 0.8, 1.2, { position: [bx, 0.4, bz], color: dark ? '#e6e3dc' : '#fbfaf6' });
    lit.box(2.6, 0.08, 1.7, { position: [bx, 0.85, bz + 0.2], color: p.wood });
    awning(k, bx, 0.75, bz + 0.6, 2.0, 0.5, 0, ['#ff5a5f', '#ffffff'], 8);
    signs.push({ text: 'BEACH BAR', position: [bx, 1.08, bz + 0.62], width: 1.8, height: 0.34, bg: '#ff5a5f', fg: '#ffffff' });
    for (const [tx, tz] of [[bx - 1.2, bz + 1.4], [bx, bz + 1.6], [bx + 1.2, bz + 1.4]] as const) cafeTable(k, tx, tz, 3, 2, '#ffffff', 0.05);
  }
  const umbrellaColors = ['#ff5a5f', '#ffd166', '#06d6a0', '#3a86ff', '#ffffff'];
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const ang = Math.PI * (0.18 + t * 0.64);
    const x = Math.cos(ang) * -9.5;
    const z = 9.6 + Math.sin(ang) * 4.6;
    if (Math.hypot(x, z) > R - 1.4) continue;
    umbrella(k, x, z, umbrellaColors[i % umbrellaColors.length], 0.34, 0.55, 0.05);
    for (const s of [-1, 1]) {
      const [lx, lz] = [x + s * 0.24, z + 0.1];
      lit.box(0.14, 0.04, 0.38, { position: [lx, 0.09, lz], rotation: [0, 0.2, 0], color: '#ffffff' });
      if (rng() < 0.7) person(lit, lx, 0.1, lz + 0.03, 0.2, randomLook(rng), 'lie');
    }
  }
  // Swimmers in the lagoon (only heads and shoulders above the water).
  for (const [sx, sz] of [[-2.0, 7.0], [-1.2, 7.6], [2.6, 7.2], [3.8, 8.6], [-3.6, 8.4], [0.4, 6.6]] as const) {
    person(lit, sx, -0.24, sz, rng() * 6, randomLook(rng));
  }

  // Palms along the promenade, cypresses and olives on the hill.
  treeRow(lit, rng, p, -13.5, 4.9, -6.8, 4.1, 5, 'palm', 0.9);
  treeRow(lit, rng, p, 7.6, 4.1, 13.6, 5.2, 4, 'palm', 0.9);
  for (const [x, z] of [[9.6, 9.0], [10.4, 11.4], [-10.6, 8.0], [-11.0, 11.0], [8.0, 13.6], [-8.4, 13.2]] as const) palm(lit, rng, p, x, z, 0.95);
  for (let i = 0; i < 26; i++) {
    const x = HILL.cx + (rng() * 2 - 1) * HILL.rx * 0.95;
    const z = HILL.cz + (rng() * 2 - 1) * HILL.rz * 0.95;
    const y = groundHeight(x, z);
    if (y < 0.2 || roadDist(x, z).d < 1.0 || Math.hypot(x, z) > R - 1.2) continue;
    if (rng() < 0.55) cypress(lit, rng, p, x, z, 0.8, y);
    else roundTree(lit, rng, p, x, z, 0.65, y);
  }
  for (let i = 0; i < ROAD_3D.length; i += 9) {
    const [x, y, z] = ROAD_3D[i];
    lamp(k, x + 0.7, z, 0.9, Math.PI, undefined, y);
  }

  // Listing pins: a few homes show their rating; at or above 4.8 a Superhost badge.
  LISTED.forEach((idx, i) => {
    const site = SITES[idx % SITES.length];
    const rating = RATINGS[i];
    const superhost = rating >= 4.8;
    signs.push({
      text: '',
      position: [site.x, roofTop(site) + 1.65, site.z + 0.05],
      width: 1.3,
      height: 0.42,
      bg: '#ffffff',
      fg: '#222222',
      draw: (ctx, w, h) => {
        drawStar(ctx, h * 0.42, h * 0.5, h * 0.26, '#ff385c');
        ctx.fillStyle = '#222222';
        ctx.font = `800 ${h * 0.5}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(rating.toFixed(2), h * 0.78, h * 0.53);
        if (superhost) {
          ctx.fillStyle = '#ff385c';
          ctx.beginPath();
          ctx.arc(w - h * 0.42, h * 0.5, h * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${h * 0.3}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('S', w - h * 0.42, h * 0.52);
        }
      },
    });
  });
}

const PIN_SITES = LISTED.map((idx, i) => {
  const site = SITES[idx % SITES.length];
  return { x: site.x, z: site.z, y: roofTop(site) + 0.45, superhost: RATINGS[i] >= 4.8 };
});

/** Map pins over the listed homes, bobbing; Superhost pins carry a halo. */
function Pins({ palette, animate }: IslandProps) {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const geo = useMemo(() => {
    const g = new MeshBuilder(palette.glow);
    g.cone(0.2, 0.45, 12, { position: [0, 0.22, 0], rotation: [Math.PI, 0, 0], color: palette.accent.rausch });
    g.ico(0.22, 1, { position: [0, 0.52, 0], color: palette.accent.rausch });
    g.cylinder(0.09, 0.09, 0.05, 12, { position: [0, 0.54, 0.2], rotation: [Math.PI / 2, 0, 0], color: '#ffffff' });
    return g.build();
  }, [palette]);
  const halo = useMemo(() => {
    const g = new MeshBuilder(palette.glow);
    g.torus(0.38, 0.03, 4, 28, { position: [0, 0.52, 0], color: '#ffd166' });
    return g.build();
  }, [palette]);
  useEffect(
    () => () => {
      geo.dispose();
      halo.dispose();
    },
    [geo, halo],
  );
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = PIN_SITES[i].y + Math.sin(t.current * 1.6 + i) * 0.1;
      g.rotation.y = Math.sin(t.current * 0.8 + i) * 0.4;
    });
  });
  return (
    <>
      {PIN_SITES.map((s, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[s.x, s.y, s.z]}
        >
          <mesh geometry={geo} material={glowMaterial()} />
          {s.superhost && <mesh geometry={halo} material={glowMaterial()} />}
        </group>
      ))}
    </>
  );
}

function Windmill({ palette, animate }: IslandProps) {
  const ref = useRef<THREE.Group>(null);
  const sails = useMemo(() => {
    const b = new MeshBuilder();
    b.cylinder(0.08, 0.08, 0.2, 8, { rotation: [Math.PI / 2, 0, 0], color: '#6b4f3a' });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      b.beam([0, 0, 0.1], [Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0.1], 0.03, 0.03, { color: '#6b4f3a' });
      const m = new THREE.Vector3(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0.1);
      b.box(0.9, 0.3, 0.01, { position: [m.x, m.y, m.z], rotation: [0, 0, a], color: palette.mode === 'dark' ? '#d9d2c3' : '#fbf6ea' });
    }
    return b.build();
  }, [palette]);
  useEffect(() => () => sails.dispose(), [sails]);
  const pos = useMemo(() => {
    const [mx, mz] = [8.8, -8.4];
    return [mx, groundHeight(mx, mz) + 1.85, mz + 0.62] as [number, number, number];
  }, []);
  useFrame((_, dt) => {
    if (animate && ref.current) ref.current.rotation.z += Math.min(dt, 0.1) * 0.6;
  });
  return (
    <group ref={ref} position={pos}>
      <mesh geometry={sails} material={litMaterial()} />
    </group>
  );
}

const PROMENADE = track(smoothPath([[-15.4, 4.4], [-8, 3.0], [0, 2.6], [8, 3.0], [15.2, 4.6]], false, 0.6), false, 0.06);
const HILL_ROAD = track(ROAD_3D.map(([x, y, z]) => [x, y + 0.06, z] as V3), false);
const LAGOON_LOOP = track(smoothPath(LAGOON.map(([x, z]) => [x * 0.6 + 0.3, 9.2 + (z - 9.2) * 0.55] as V2), true, 0.5), true, 0.08);

const FLEET: FleetSpec[] = [
  { kind: 'car', track: PROMENADE, count: 4, speed: 0.9, lane: 0.25 },
  { kind: 'van', track: PROMENADE, speed: 0.8, lane: 0.25, offset: 12, colors: ['#ffffff'] },
  { kind: 'car', track: HILL_ROAD, count: 3, speed: 0.55, lane: 0.22, scale: 0.85 },
  { kind: 'bus', track: HILL_ROAD, speed: 0.45, lane: 0.22, offset: 9, colors: ['#1f5fbf'], scale: 0.62 },
  { kind: 'boat', track: LAGOON_LOOP, count: 2, speed: 0.6, colors: ['#ff5a5f', '#1f5fbf'] },
  { kind: 'sailboat', track: LAGOON_LOOP, speed: 0.35, offset: 5, colors: ['#1f5fbf'] },
];

const WALKS: WalkerGroup[] = [
  { track: track(smoothPath([[-14.2, 5.2], [-8, 3.8], [0, 3.4], [8, 3.8], [14.0, 5.4]], false, 0.6), false, 0.05), count: 18, spread: 0.18 },
  { track: track(smoothPath([[-8.6, 7.0], [-6, 13.4], [0, 14.3], [7, 13.0], [9.4, 7.4]], false, 0.6), false, 0.05), count: 10, spread: 0.35 },
  { track: track(ROAD_3D.map(([x, y, z]) => [x + 0.55, y + 0.04, z] as V3), false), count: 6, spread: 0.06, speed: [0.2, 0.3] },
  { track: track(STAIRS.map(([x, y, z]) => [x, y + 0.06, z] as V3), false), count: 4, spread: 0.05, speed: [0.12, 0.2] },
];

export default function VillageIsland(props: IslandProps) {
  return (
    <group>
      <Baked build={build} palette={props.palette} seed={505} />
      <Pins {...props} />
      <Windmill {...props} />
      <Fleet specs={FLEET} palette={props.palette} animate={props.animate} seed={51} />
      <Walkers groups={WALKS} animate={props.animate} seed={52} />
    </group>
  );
}

