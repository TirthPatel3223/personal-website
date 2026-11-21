import * as THREE from 'three';
import { MeshBuilder } from '../../core/builder';
import { islandGeometry } from '../../core/island';
import { mulberry32, type Rng } from '../../core/math';
import type { ScenePalette } from '../../core/palette';
import { footpath, road } from '../../islands/parts/ground';
import { track, type FleetSpec, type WalkerGroup } from '../../islands/parts/movers';
import { bush, flowerBed, palm, pine, roundTree } from '../../islands/parts/nature';
import { crowd, person, queueLine, randomLook } from '../../islands/parts/people';
import type { SignSpec } from '../../islands/parts/signs';
import { awning, at, bench, cafeTable, fountain, hedge, parkingLot, postLamp, umbrella } from '../../islands/parts/structures';
import type { Kit } from '../../islands/parts/types';
import { archPoint, forecourt, type ParkData, type V2 } from './parkData';
import { buildRide } from './rides';
import type { SpinDef } from './rides/kit';
import type { BuiltSpin, PlacedSpin, WorldMover } from './rides/motion';

/* Builds the whole park once per palette: the island, hedge, walkways, entrance
   plaza and gate, every ride stamped into its plot with a queue and an entrance
   arch, trees and benches in the spare lawn, and the tracks people walk. Static
   things end up in three merged meshes; the result also lists what moves. */

export const PATH_W = 1.1;

export interface ParkWorld {
  lit: THREE.BufferGeometry;
  glow: THREE.BufferGeometry;
  glass: THREE.BufferGeometry | null;
  signs: SignSpec[];
  movers: WorldMover[];
  spins: PlacedSpin[];
  walkers: WalkerGroup[];
  fleet: FleetSpec[];
  /** Ride hover/click targets. */
  targets: Array<{ id: number; x: number; z: number; r: number }>;
  vertices: number;
}

const TROPICAL = new Set(['jungle', 'temple', 'boathouse', 'tiki', 'subs', 'flume']);
const ALPINE = new Set(['alpine', 'canoes', 'fort', 'ship', 'minetrain']);

function segDist(px: number, pz: number, a: V2, b: V2) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(a[0] + dx * t - px, a[1] + dz * t - pz);
}

function inside(poly: V2[], x: number, z: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

function buildSpin(s: SpinDef): BuiltSpin {
  return {
    lit: s.lit.build(),
    glow: s.glow && !s.glow.empty ? s.glow.build() : null,
    pivot: s.pivot,
    axis: s.axis,
    speed: s.speed,
    phase: s.phase ?? 0,
    bob: s.bob,
    cycle: s.cycle,
    children: (s.children ?? []).map(buildSpin),
  };
}

/** A flat strip of paving from a to b. */
function pave(k: Kit, a: V2, b: V2, w: number, color: string, y = 0.02, h = 0.04) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 1e-4) return;
  k.lit.box(len, h, w, { position: [(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2], rotation: [0, Math.atan2(a[1] - b[1], b[0] - a[0]), 0], color });
}

/** A queue: switchback rails in front of the ride, filled with `people` guests. */
function queueArea(b: MeshBuilder, rng: Rng, r: number, lanes: number, people: number, pad: string, rail: string) {
  const depth = 1.0;
  const w = 1.0;
  b.box(2 * w + 0.2, 0.03, depth + 0.15, { position: [0, 0.035, r - depth / 2 - 0.02], color: pad });
  const step = depth / lanes;
  const path: V2[] = [[0, r + 0.25], [0, r - step * 0.5]];
  for (let i = 0; i < lanes; i++) {
    const z = r - step * (i + 0.5);
    const dir = i % 2 ? 1 : -1;
    path.push([dir * (w - 0.1), z]);
    if (i < lanes - 1) path.push([dir * (w - 0.1), z - step]);
    // Rails between lanes, open at alternating ends.
    if (i < lanes) {
      const rz = z - step / 2;
      const gapLeft = i % 2 === 0;
      const x0 = gapLeft ? -w + 0.32 : -w;
      const x1 = gapLeft ? w : w - 0.32;
      if (i < lanes - 1) {
        b.beam([x0, 0.16, rz], [x1, 0.16, rz], 0.015, 0.015, { color: rail });
        for (let x = x0; x <= x1 + 1e-6; x += 0.5) b.box(0.02, 0.17, 0.02, { position: [x, 0.085, rz], color: rail });
      }
    }
  }
  for (const s of [-1, 1]) {
    b.beam([s * w, 0.16, r - depth], [s * w, 0.16, r - 0.05], 0.015, 0.015, { color: rail });
    for (let z = r - depth; z <= r - 0.04; z += 0.5) b.box(0.02, 0.17, 0.02, { position: [s * w, 0.085, z], color: rail });
  }
  // People along the line, from the entrance inwards.
  let left = people;
  for (let i = 0; i < path.length - 1 && left > 0; i++) {
    const [ax, az] = path[i];
    const [bx, bz] = path[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.min(left, Math.floor(len / 0.19));
    const face = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / Math.max(1, Math.floor(len / 0.19));
      person(b, ax + (bx - ax) * t + (rng() - 0.5) * 0.04, 0.04, az + (bz - az) * t + (rng() - 0.5) * 0.04, face + (rng() - 0.5) * 0.6, randomLook(rng));
    }
    left -= n;
  }
}

export function buildParkWorld(data: ParkData, p: ScenePalette): ParkWorld {
  const rng = mulberry32(2026);
  const k: Kit = {
    lit: new MeshBuilder(),
    glow: new MeshBuilder(p.glow),
    glass: new MeshBuilder(),
    signs: [],
    p,
    rng,
  };
  const { lit, glow, glass } = k;
  const R = data.radius;
  const RI = data.island;
  const amber = p.accent.amber;
  const dark = p.mode === 'dark';
  const V = data.paths.v;
  const E = data.paths.e;
  const hub = V[data.paths.hub];
  const stopIndex = new Map(data.itinerary.map((s, i) => [s.id, i]));

  // ── Ground ──
  lit.add(islandGeometry(91, RI, 14, p));
  glow.torus(RI * 0.988, 0.07, 4, 128, { position: [0, 0.02, 0], rotation: [Math.PI / 2, 0, 0], color: amber });

  // Hedge round the park, open at the gate.
  {
    const N = 160;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2;
      const a1 = ((i + 1) / N) * Math.PI * 2;
      const x0 = Math.cos(a0) * (R + 0.35);
      const z0 = Math.sin(a0) * (R + 0.35);
      if (z0 > 0 && Math.abs(x0) < 3.6) continue;
      hedge(k, x0, z0, Math.cos(a1) * (R + 0.35), Math.sin(a1) * (R + 0.35), 0.4, 0.5);
    }
  }

  // ── Walkways ──
  const pathColor = p.path;
  const degree = new Array<number>(V.length).fill(0);
  for (const [a, b] of E) {
    degree[a]++;
    degree[b]++;
  }
  // The plaza is paved all over; walkways elsewhere.
  lit.slab(data.plaza.cell, 0, 0.035, { color: pathColor });
  for (const [a, b] of E) {
    if (a === data.paths.hub || b === data.paths.hub || (a === data.paths.gate && b === data.paths.hub)) continue;
    footpath(k, [V[a], V[b]], PATH_W);
  }
  V.forEach(([x, z], i) => {
    if (degree[i] >= 2) lit.cylinder(PATH_W / 2, PATH_W / 2, 0.04, 8, { position: [x, 0.02, z], color: pathColor });
  });
  // Lamps and benches along the walkways.
  for (const [a, b] of E) {
    if (a === data.paths.hub || b === data.paths.hub) continue;
    const A = V[a];
    const B = V[b];
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    if (len < 2.2) continue;
    const ux = (B[0] - A[0]) / len;
    const uz = (B[1] - A[1]) / len;
    const nx = -uz;
    const nz = ux;
    const mx = (A[0] + B[0]) / 2;
    const mz = (A[1] + B[1]) / 2;
    postLamp(k, mx + nx * 0.75, mz + nz * 0.75, 0.95, p.window);
    if (len > 3 && rng() < 0.38) {
      const t = 0.28;
      const bx = A[0] + (B[0] - A[0]) * t - nx * 0.78;
      const bz = A[1] + (B[1] - A[1]) * t - nz * 0.78;
      bench(k, bx, bz, Math.atan2(nx, nz), Math.floor(rng() * 3));
    }
  }

  // ── Entrance: car parks, road, ticket booths, gate, Main Street, hub ──
  {
    const roadPts: V2[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * 0.27 + (i / 40) * Math.PI * 0.46;
      roadPts.push([Math.cos(a) * (R + 4.6), Math.sin(a) * (R + 4.6)]);
    }
    road(k, roadPts, 1.35, { sidewalk: 0.25 });
    for (const s of [-1, 1]) {
      const phi = Math.PI / 2 - s * 0.29;
      parkingLot(k, Math.cos(phi) * (R + 2.3), Math.sin(phi) * (R + 2.3), 7, 2, -(phi + Math.PI / 2), 0.8);
    }
    // Forecourt.
    lit.box(8.0, 0.04, 3.6, { position: [0, 0.02, R + 1.6], color: pathColor });
    pave(k, [0, R + 3.2], [0, R + 4.6], 2.0, pathColor);
    for (const s of [-1, 1]) {
      const bx = s * 2.9;
      const bz = R + 1.9;
      lit.box(1.2, 0.85, 0.75, { position: [bx, 0.42, bz], color: dark ? '#f1e4d3' : '#fff6e5' });
      lit.taperBox(1.4, 0.3, 0.95, 0.6, 0.6, { position: [bx, 1.0, bz], color: '#c1121f' });
      for (let w = 0; w < 2; w++) (dark ? glow : lit).box(0.35, 0.25, 0.02, { position: [bx - 0.3 + w * 0.6, 0.55, bz + 0.385], color: dark ? p.window : p.glass });
      k.signs.push({ text: 'TICKETS', position: [bx, 1.0, bz + 0.48], width: 0.9, height: 0.2, bg: '#fff3d6', fg: '#7a1f1f' });
      queueLine(lit, rng, [[bx - 0.3, bz + 0.5], [bx - 0.3, bz + 1.7]], 0.27, 0.04);
      queueLine(lit, rng, [[bx + 0.3, bz + 0.5], [bx + 0.3, bz + 1.4]], 0.27, 0.04);
    }
    crowd(lit, rng, 0, R + 1.7, 1.3, 14, 0.04);
    // Gate: two towers, an arch with the park's name, turnstiles.
    const cream = dark ? '#e7d8c3' : '#fbefdc';
    for (const s of [-1, 1]) {
      lit.box(1.2, 3.1, 1.2, { position: [s * 2.55, 1.55, R], color: cream });
      lit.box(1.35, 0.15, 1.35, { position: [s * 2.55, 3.15, R], color: '#c1121f' });
      lit.cone(0.95, 1.2, 4, { position: [s * 2.55, 3.8, R], rotation: [0, Math.PI / 4, 0], color: '#c1121f' });
      glow.ico(0.1, 0, { position: [s * 2.55, 4.45, R], color: amber });
      lit.box(0.55, 1.1, 0.04, { position: [s * 2.55, 0.9, R + 0.62], color: '#7a2e1f' });
      for (let f = 0; f < 2; f++) (dark ? glow : lit).box(0.24, 0.3, 0.02, { position: [s * 2.55, 1.9 + f * 0.6, R + 0.62], color: dark ? p.window : p.glass });
    }
    lit.box(4.0, 0.75, 0.55, { position: [0, 2.75, R], color: cream });
    k.signs.push({ text: 'THEME PARK', position: [0, 2.75, R + 0.29], width: 3.6, height: 0.58, bg: '#7a1f1f', fg: '#ffe9a8', font: 'Georgia, "Times New Roman", serif' });
    for (let i = 0; i < 6; i++) {
      const x = -1.6 + i * 0.64;
      lit.box(0.1, 0.3, 0.5, { position: [x, 0.15, R], color: '#5b6270' });
      lit.box(0.25, 0.03, 0.03, { position: [x + 0.12, 0.26, R], color: '#adb5bd' });
    }
    // Main Street: shops either side, lamps, people.
    const SHOPS = [
      { name: 'GIFTS', c: '#d62828', wall: '#f4e1c1' },
      { name: 'CANDY', c: '#ff5d8f', wall: '#e9d5ff' },
      { name: 'PHOTOS', c: '#3a86ff', wall: '#d7f0f5' },
      { name: 'SNACKS', c: '#f77f00', wall: '#ffe5d9' },
    ];
    SHOPS.forEach((s, i) => {
      const side = i % 2 ? 1 : -1;
      const z = R - 1.6 - Math.floor(i / 2) * 2.0;
      const x = side * 2.45;
      const yaw = -side * (Math.PI / 2);
      lit.box(1.5, 1.35, 1.75, { position: [x, 0.675, z], rotation: [0, yaw, 0], color: dark ? '#d9cdb8' : s.wall });
      lit.taperBox(1.65, 0.5, 1.9, 0.55, 0.8, { position: [x, 1.6, z], rotation: [0, yaw, 0], color: s.c });
      const [fx, fz] = at(x, z, yaw, 0, 0.88);
      (dark ? glow : lit).box(1.0, 0.45, 0.02, { position: [fx, 0.38, fz], rotation: [0, yaw, 0], color: dark ? p.window : p.glass });
      awning(k, fx, 0.82, fz, 1.4, 0.4, yaw, [s.c, '#ffffff'], 6);
      const [sx, sz] = at(x, z, yaw, 0, 0.9);
      k.signs.push({ text: s.name, position: [sx, 1.12, sz], rotationY: yaw, width: 1.25, height: 0.3, bg: '#1b1d24', fg: '#fff3d6' });
    });
    for (let z = R - 0.7; z > hub[1] + 1.6; z -= 1.5) {
      postLamp(k, -1.35, z, 0.95, amber);
      postLamp(k, 1.35, z, 0.95, amber);
    }
    // Hub: fountain, flower beds, balloon seller, cafe tables, food carts.
    fountain(k, hub[0], hub[1], 1.2);
    flowerBed(lit, rng, p, hub[0] - 2.1, hub[1] + 1.3, 1.1, 0.5, 0.5);
    flowerBed(lit, rng, p, hub[0] + 2.1, hub[1] + 1.3, 1.1, 0.5, -0.5);
    {
      const [bx, bz] = [hub[0] + 1.7, hub[1] + 0.2];
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
    crowd(lit, rng, hub[0], hub[1] + 2.2, 1.4, 10, 0.04);
  }

  // Everything paved so far: used to keep trees and tables off the walkways.
  const spurs: Array<[V2, V2]> = [];
  const clearOfPaths = (x: number, z: number, m: number) => {
    for (const [a, b] of E) if (segDist(x, z, V[a], V[b]) < PATH_W / 2 + m) return false;
    for (const [a, b] of spurs) if (segDist(x, z, a, b) < 0.4 + m) return false;
    return true;
  };

  // Plaza cafe tables and carts, off the walking lines.
  for (let i = 0; i < 9; i++) {
    const x = hub[0] + (rng() - 0.5) * 11;
    const z = hub[1] - 2.5 + rng() * 4.5;
    if (!inside(data.plaza.cell, x, z) || !clearOfPaths(x, z, 0.6) || Math.hypot(x - hub[0], z - hub[1]) < 2.2 || Math.abs(x) < 3.4) continue;
    cafeTable(k, x, z, 4, 1 + Math.floor(rng() * 3));
    umbrella(k, x, z, rng() < 0.5 ? '#d62828' : amber, 0.42, 0.7);
  }

  // ── Rides ──
  const movers: WorldMover[] = [];
  const spins: PlacedSpin[] = [];
  const targets: ParkWorld['targets'] = [];
  const rides = data.nodes.filter((n) => n.kind !== 'entrance');
  for (const n of rides) {
    const r = n.r ?? 2.2;
    const s = n.scale ?? 1;
    const yaw = n.yaw ?? 0;
    const cs = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const toWorld = (lx: number, ly: number, lz: number): [number, number, number] => [n.x + (lx * cs + lz * sn) * s, ly * s, n.z + (-lx * sn + lz * cs) * s];
    const place = { position: [n.x, 0, n.z] as [number, number, number], rotation: [0, yaw, 0] as [number, number, number], scale: s };
    const ride = buildRide(n.variant, p, n.id * 31 + 7, r);

    // Queue and entrance arch in front of the ride.
    const stop = stopIndex.get(n.id);
    const q = new MeshBuilder();
    const qGlow = new MeshBuilder(p.glow);
    const lanes = r > 3 ? 4 : r > 2.5 ? 3 : 3;
    const guests = stop !== undefined ? Math.round(data.itinerary[stop].queue / 2) + 3 : 2 + Math.floor(rng() * 5);
    queueArea(q, rng, r, lanes, guests, dark ? '#9a9387' : '#e4dccb', dark ? '#3d4350' : '#5b6270');
    const archZ = r + 0.3 / s;
    const archCol = stop !== undefined ? amber : dark ? '#3a7d6b' : '#2a9d8f';
    for (const x of [-0.6, 0.6]) q.box(0.08, 0.85, 0.08, { position: [x, 0.425, archZ], color: dark ? '#e7d8c3' : '#fbefdc' });
    q.box(1.45, 0.24, 0.1, { position: [0, 0.95, archZ], color: archCol });
    qGlow.box(1.2, 0.03, 0.11, { position: [0, 0.82, archZ], color: stop !== undefined ? amber : p.window });
    lit.stamp(q, place);
    glow.stamp(qGlow, place);

    lit.stamp(ride.lit, place);
    glow.stamp(ride.glow, place);
    glass.stamp(ride.glass, place);
    for (const sg of ride.signs) {
      k.signs.push({ ...sg, position: toWorld(...sg.position), rotationY: (sg.rotationY ?? 0) + yaw, width: sg.width * s, height: sg.height * s });
    }
    for (const m of ride.movers) {
      movers.push({
        car: m.car,
        head: m.head,
        track: track(m.pts.map(([x, y, z]) => toWorld(x, y, z)), m.closed),
        trains: m.trains,
        cars: m.cars,
        gap: m.gap,
        speed: m.speed,
        gravity: m.gravity ?? 0,
        bob: m.bob ?? 0,
        colors: m.colors,
        level: m.level ?? false,
        scale: s,
      });
    }
    // Each turning part's group sits at the ride's origin, turned and scaled like the
    // ride; the part's own pivot is applied inside it.
    for (const sp of ride.spins) spins.push({ spin: buildSpin(sp), position: [n.x, 0, n.z], yaw, scale: s });
    targets.push({ id: n.id, x: n.x, z: n.z, r: r * s });

    // Spur walkway from the arch to the main walkway.
    const arch = archPoint(n);
    const entry = V[n.entry];
    pave(k, arch, entry, 0.8, pathColor, 0.021, 0.042);
    spurs.push([arch, entry]);
  }
  // ── Lawns: trees, bushes, flowers and a few people in the spare corners ──
  for (const n of rides) {
    if (!n.cell) continue;
    const r = (n.r ?? 2.2) * (n.scale ?? 1);
    const arch = archPoint(n);
    const xs = n.cell.map((q) => q[0]);
    const zs = n.cell.map((q) => q[1]);
    const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    let placed = 0;
    for (let tries = 0; tries < 60 && placed < 6; tries++) {
      const x = x0 + rng() * (x1 - x0);
      const z = z0 + rng() * (z1 - z0);
      if (!inside(n.cell, x, z)) continue;
      if (Math.hypot(x - n.x, z - n.z) < r + 0.45) continue;
      if (Math.hypot(x - arch[0], z - arch[1]) < 1.6) continue;
      if (Math.hypot(x, z) > R - 0.6) continue;
      if (!clearOfPaths(x, z, 0.45)) continue;
      const roll = rng();
      const sz = 0.8 + rng() * 0.35;
      if (roll < 0.62) {
        if (TROPICAL.has(n.variant)) palm(lit, rng, p, x, z, sz);
        else if (ALPINE.has(n.variant)) pine(lit, rng, p, x, z, sz);
        else if (rng() < 0.75) roundTree(lit, rng, p, x, z, sz);
        else pine(lit, rng, p, x, z, sz);
      } else if (roll < 0.8) bush(lit, rng, p, x, z, 1 + rng() * 0.5);
      else if (roll < 0.9) flowerBed(lit, rng, p, x, z, 0.8, 0.4, rng() * 3);
      else crowd(lit, rng, x, z, 0.35, 2 + Math.floor(rng() * 2), 0.0);
      placed++;
    }
  }
  // Woods between the hedge and the shore, leaving the front open.
  {
    let placed = 0;
    // Low-detail trees: the belt is only ever seen from a distance.
    for (let tries = 0; tries < 2400 && placed < 170; tries++) {
      const a = rng() * Math.PI * 2;
      const d = R + 1.0 + rng() * (RI - R - 2.0);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (z > 0 && Math.abs(x) < R * 0.78) continue;
      const sz = 0.9 + rng() * 0.6;
      const leaf = rng() < 0.5 ? p.foliage : p.foliageAlt;
      lit.cylinder(0.07 * sz, 0.1 * sz, 0.6 * sz, 4, { position: [x, 0.3 * sz, z], color: p.trunk });
      if (rng() < 0.5) {
        lit.cone(0.55 * sz, 0.9 * sz, 6, { position: [x, 0.85 * sz, z], rotation: [0, rng() * 3, 0], color: leaf });
        lit.cone(0.38 * sz, 0.7 * sz, 6, { position: [x, 1.3 * sz, z], rotation: [0, rng() * 3, 0], color: leaf });
      } else lit.ico(0.5 * sz, 0, { position: [x, 0.95 * sz, z], rotation: [rng(), rng(), 0], scale: [1, 0.9, 1], color: leaf });
      placed++;
    }
  }

  // ── People walking the walkways ──
  const adj: number[][] = V.map(() => []);
  for (const [a, b] of E) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const walkers: WalkerGroup[] = [];
  for (let w = 0; w < 30; w++) {
    let v = Math.floor(rng() * V.length);
    let prev = -1;
    const pts: V2[] = [V[v]];
    for (let step = 0; step < 9; step++) {
      const opts = adj[v].filter((u) => u !== prev && u !== data.paths.gate);
      if (!opts.length) break;
      prev = v;
      v = opts[Math.floor(rng() * opts.length)];
      pts.push(V[v]);
    }
    if (pts.length > 2) walkers.push({ track: track(pts, false, 0.04), count: 4, spread: 0.32 });
  }
  const fc = forecourt(data);
  walkers.push({ track: track([[0, fc[1] + 2.0], [0, hub[1] + 1.4]], false, 0.04), count: 18, spread: 0.75 });
  walkers.push({ track: track([[-3.6, R + 2.6], [3.6, R + 2.6]], false, 0.04), count: 8, spread: 0.5 });
  walkers.push({
    track: track(Array.from({ length: 20 }, (_, i) => [hub[0] + Math.cos((i / 20) * Math.PI * 2) * 1.9, hub[1] + Math.sin((i / 20) * Math.PI * 2) * 1.9] as V2), true, 0.04),
    count: 9,
    spread: 0.25,
  });

  // Buses and cars on the road out front.
  const roadTrack = track(
    Array.from({ length: 41 }, (_, i) => {
      const a = Math.PI * 0.27 + (i / 40) * Math.PI * 0.46;
      return [Math.cos(a) * (R + 4.6), Math.sin(a) * (R + 4.6)] as V2;
    }),
    false,
    0.06,
  );
  const fleet: FleetSpec[] = [
    { kind: 'car', track: roadTrack, count: 5, speed: 1.1, lane: 0.33 },
    { kind: 'tram', track: roadTrack, speed: 0.7, lane: 0.33, offset: 6, colors: ['#ffd166'], scale: 0.85 },
    { kind: 'bus', track: roadTrack, speed: 0.8, lane: 0.33, offset: 20, colors: ['#3a86ff'] },
  ];

  const geo = { lit: lit.build(), glow: glow.build(), glass: glass.empty ? null : glass.build() };
  const vertices = geo.lit.getAttribute('position').count + geo.glow.getAttribute('position').count;
  return { ...geo, signs: k.signs, movers, spins, walkers, fleet, targets, vertices };
}
