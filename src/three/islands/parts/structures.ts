import * as THREE from 'three';
import { MeshBuilder } from '../../core/builder';
import { between, rotY } from '../../core/math';
import { person, randomLook } from './people';
import type { Kit, V2 } from './types';
import { carColor, vehicle, type VehicleKind } from './vehicles';

/* Buildings and street furniture. Positions are island-local; `angle` is a yaw, and a
   building's "front" is its local +z side before that yaw. */

type Side = 'front' | 'back' | 'left' | 'right';
const ALL_SIDES: Side[] = ['front', 'back', 'left', 'right'];

/** Local (u, v) on a footprint centred at (x, z) and turned by `angle`, to island coordinates. */
export function at(x: number, z: number, angle: number, u: number, v: number): V2 {
  const [ox, oz] = rotY(u, v, angle);
  return [x + ox, z + oz];
}

/** Yaw that turns a person (who faces +z) towards direction (dx, dz). */
export const faceYaw = (dx: number, dz: number) => Math.atan2(dx, dz);
/** Yaw that points a vehicle (which faces +x) along (dx, dz). */
export const driveYaw = (dx: number, dz: number) => Math.atan2(-dz, dx);

export interface WindowOpts {
  x: number;
  z: number;
  w: number;
  d: number;
  angle?: number;
  y0?: number;
  floors: number;
  floorH: number;
  pitch?: number;
  winW?: number;
  winH?: number;
  sides?: Side[];
  litChance?: number;
  /** Skip the ground floor (shopfronts, lobbies). */
  skipGround?: boolean;
  frame?: string;
}

/** Window panes on a box's faces: glass by day, a random share lit at night. */
export function windowGrid(k: Kit, o: WindowOpts) {
  const { p, rng } = k;
  const angle = o.angle ?? 0;
  const pitch = o.pitch ?? 0.42;
  const winW = o.winW ?? pitch * 0.55;
  const winH = o.winH ?? o.floorH * 0.5;
  const y0 = o.y0 ?? 0;
  const night = p.mode === 'dark';
  const lit = o.litChance ?? 0.55;
  for (const side of o.sides ?? ALL_SIDES) {
    const along = side === 'front' || side === 'back' ? o.w : o.d;
    const n = Math.max(1, Math.floor((along - 0.2) / pitch));
    const start = -((n - 1) * pitch) / 2;
    for (let f = o.skipGround ? 1 : 0; f < o.floors; f++) {
      const y = y0 + o.floorH * (f + 0.55);
      for (let i = 0; i < n; i++) {
        const t = start + i * pitch;
        let u = t;
        let v = o.d / 2 + 0.012;
        let size: [number, number, number] = [winW, winH, 0.02];
        if (side === 'back') v = -v;
        if (side === 'left' || side === 'right') {
          u = (side === 'right' ? 1 : -1) * (o.w / 2 + 0.012);
          v = t;
          size = [0.02, winH, winW];
        }
        const [wx, wz] = at(o.x, o.z, angle, u, v);
        const roll = rng();
        const on = night && roll < lit;
        const r = rng();
        (on ? k.glow : k.lit).box(size[0], size[1], size[2], {
          position: [wx, y, wz],
          rotation: [0, angle, 0],
          // Lit windows vary: warm, dim warm, and the odd cool office light.
          color: on ? (r < 0.15 ? '#9fb8d8' : r < 0.55 ? '#a87b45' : p.window) : p.glass,
        });
      }
    }
  }
}

export interface BlockOpts {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  angle?: number;
  y?: number;
  wall: string;
  roof?: string;
  floors?: number;
  windows?: 'grid' | 'band' | 'none';
  pitch?: number;
  litChance?: number;
  rooftop?: number;
  skipGround?: boolean;
  sides?: Side[];
}

/** A flat-roofed building with a parapet, windows and rooftop plant. */
export function block(k: Kit, o: BlockOpts) {
  const { lit, p, rng } = k;
  const angle = o.angle ?? 0;
  const y = o.y ?? 0;
  const floors = o.floors ?? Math.max(1, Math.round(o.h / 0.6));
  lit.box(o.w, o.h, o.d, { position: [o.x, y + o.h / 2, o.z], rotation: [0, angle, 0], color: o.wall });
  const roof = o.roof ?? p.roof;
  lit.box(o.w - 0.06, 0.02, o.d - 0.06, { position: [o.x, y + o.h + 0.01, o.z], rotation: [0, angle, 0], color: roof });
  for (const [u, v, w, d] of [
    [0, o.d / 2 - 0.03, o.w, 0.06],
    [0, -o.d / 2 + 0.03, o.w, 0.06],
    [o.w / 2 - 0.03, 0, 0.06, o.d],
    [-o.w / 2 + 0.03, 0, 0.06, o.d],
  ] as const) {
    const [px, pz] = at(o.x, o.z, angle, u, v);
    lit.box(w, 0.09, d, { position: [px, y + o.h + 0.045, pz], rotation: [0, angle, 0], color: o.wall });
  }
  const units = o.rooftop ?? 2;
  for (let i = 0; i < units; i++) {
    const u = between(rng, -o.w / 2 + 0.35, o.w / 2 - 0.35);
    const v = between(rng, -o.d / 2 + 0.3, o.d / 2 - 0.3);
    const [px, pz] = at(o.x, o.z, angle, u, v);
    lit.box(0.32, 0.16, 0.24, { position: [px, y + o.h + 0.1, pz], rotation: [0, angle, 0], color: p.metal });
  }
  const mode = o.windows ?? 'grid';
  if (mode !== 'none') {
    const pitch = o.pitch ?? (mode === 'band' ? 0.3 : 0.42);
    windowGrid(k, {
      x: o.x,
      z: o.z,
      w: o.w,
      d: o.d,
      angle,
      y0: y,
      floors,
      floorH: o.h / floors,
      pitch,
      winW: mode === 'band' ? pitch * 0.9 : undefined,
      winH: mode === 'band' ? (o.h / floors) * 0.6 : undefined,
      litChance: o.litChance,
      skipGround: o.skipGround,
      sides: o.sides,
    });
  }
}

/** Gable roof prism whose ridge runs along local z. */
export function roofPrism(b: MeshBuilder, x: number, z: number, y: number, w: number, d: number, h: number, angle: number, color: string) {
  const g = new THREE.CylinderGeometry(1, 1, d, 3);
  g.rotateX(-Math.PI / 2);
  b.add(g, { position: [x, y + 0.5 * (h / 1.5), z], rotation: [0, angle, 0], scale: [w / 1.732, h / 1.5, 1], color });
}

/** A pitched-roof house with a door, windows on two floors and a chimney. */
export function house(k: Kit, x: number, z: number, w: number, d: number, h: number, angle: number, wall: string, roof: string, y = 0) {
  const { lit, p } = k;
  lit.box(w, h, d, { position: [x, y + h / 2, z], rotation: [0, angle, 0], color: wall });
  roofPrism(lit, x, z, y + h, w * 1.14, d * 1.08, w * 0.5, angle, roof);
  const [dx, dz] = at(x, z, angle, w * 0.18, d / 2 + 0.012);
  lit.box(0.13, 0.24, 0.02, { position: [dx, y + 0.12, dz], rotation: [0, angle, 0], color: p.wood });
  const floors = h > 0.9 ? 2 : 1;
  windowGrid(k, { x, z, w, d, angle, y0: y, floors, floorH: h / floors, pitch: 0.36, winW: 0.14, winH: 0.16, litChance: 0.6 });
  const [cx, cz] = at(x, z, angle, -w * 0.25, -d * 0.2);
  lit.box(0.14, 0.4, 0.14, { position: [cx, y + h + w * 0.25, cz], rotation: [0, angle, 0], color: p.wallAlt });
}

/** A hemisphere (domes). */
export function dome(b: MeshBuilder, x: number, y: number, z: number, r: number, color: string, segments = 12) {
  const prof: Array<[number, number]> = [];
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    prof.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  prof[prof.length - 1] = [0, r];
  b.lathe(prof, segments, { position: [x, y, z], color });
}

/** A striped awning sloping out from a wall: (x, z) is its centre at the wall. */
export function awning(k: Kit, x: number, y: number, z: number, w: number, depth: number, angle: number, colors: [string, string], stripes = 6) {
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    const u = -w / 2 + sw * (i + 0.5);
    const [ax, az] = at(x, z, angle, u, 0);
    const [bx, bz] = at(x, z, angle, u, depth);
    k.lit.beam([ax, y, az], [bx, y - depth * 0.45, bz], sw, 0.02, { color: colors[i % 2] });
  }
  const [fx, fz] = at(x, z, angle, 0, depth);
  k.lit.box(w, 0.07, 0.02, { position: [fx, y - depth * 0.45 - 0.035, fz], rotation: [0, angle, 0], color: colors[0] });
}

export function umbrella(k: Kit, x: number, z: number, color: string, r = 0.36, h = 0.62, y = 0) {
  k.lit.cylinder(0.012, 0.012, h, 4, { position: [x, y + h / 2, z], color: '#d9d9d9' });
  k.lit.cone(r, 0.16, 8, { position: [x, y + h + 0.05, z], color });
  k.lit.box(0.03, 0.03, 0.03, { position: [x, y + h + 0.14, z], color: '#ffffff' });
}

/** A round cafe table with chairs; `seated` of them get a diner. */
export function cafeTable(k: Kit, x: number, z: number, seats = 4, seated = 2, chair = '#6b4f3a', y = 0, top = '#f1f1ee') {
  const { lit, rng } = k;
  lit.cylinder(0.13, 0.13, 0.02, 10, { position: [x, y + 0.22, z], color: top });
  lit.cylinder(0.015, 0.015, 0.21, 4, { position: [x, y + 0.105, z], color: '#495057' });
  const rot = rng() * Math.PI;
  const order = Array.from({ length: seats }, (_, i) => i).sort(() => rng() - 0.5);
  const sitting = new Set(order.slice(0, seated));
  for (let i = 0; i < seats; i++) {
    const a = rot + (i / seats) * Math.PI * 2;
    const cx = x + Math.cos(a) * 0.23;
    const cz = z + Math.sin(a) * 0.23;
    const yaw = faceYaw(-Math.cos(a), -Math.sin(a));
    lit.box(0.09, 0.015, 0.09, { position: [cx, y + 0.13, cz], rotation: [0, yaw, 0], color: chair });
    const [bx, bz] = [x + Math.cos(a) * 0.28, z + Math.sin(a) * 0.28];
    lit.box(0.09, 0.12, 0.015, { position: [bx, y + 0.2, bz], rotation: [0, yaw, 0], color: chair });
    for (const [du, dv] of [[-0.035, -0.035], [0.035, -0.035], [-0.035, 0.035], [0.035, 0.035]] as const) {
      const [lx, lz] = at(cx, cz, yaw, du, dv);
      lit.box(0.01, 0.125, 0.01, { position: [lx, y + 0.0625, lz], color: chair });
    }
    if (sitting.has(i)) {
      const [px, pz] = at(cx, cz, yaw, 0, -0.045);
      person(lit, px, y - 0.005, pz, yaw, randomLook(rng), 'sit');
    }
  }
}

export function bench(k: Kit, x: number, z: number, angle: number, sitters = 0, y = 0) {
  const { lit, p, rng } = k;
  lit.box(0.55, 0.03, 0.14, { position: [x, y + 0.13, z], rotation: [0, angle, 0], color: p.wood });
  const [bx, bz] = at(x, z, angle, 0, -0.07);
  lit.box(0.55, 0.12, 0.025, { position: [bx, y + 0.21, bz], rotation: [0, angle, 0], color: p.wood });
  for (const u of [-0.23, 0.23]) {
    const [lx, lz] = at(x, z, angle, u, 0);
    lit.box(0.03, 0.12, 0.13, { position: [lx, y + 0.06, lz], rotation: [0, angle, 0], color: '#3d405b' });
  }
  for (let i = 0; i < sitters; i++) {
    const [px, pz] = at(x, z, angle, (i - (sitters - 1) / 2) * 0.22, -0.05);
    person(lit, px, y - 0.005, pz, angle, randomLook(rng), 'sit');
  }
}

/** A street lamp with an arm; the head glows. */
export function lamp(k: Kit, x: number, z: number, h = 1.1, angle = 0, color?: string, y = 0) {
  const { lit, glow, p } = k;
  lit.cylinder(0.025, 0.035, h, 5, { position: [x, y + h / 2, z], color: '#3d4350' });
  const [ax, az] = at(x, z, angle, 0.16, 0);
  lit.beam([x, y + h, z], [ax, y + h, az], 0.03, 0.03, { color: '#3d4350' });
  glow.box(0.1, 0.035, 0.07, { position: [ax, y + h - 0.03, az], rotation: [0, angle, 0], color: color ?? p.window });
}

/** A post lamp (globe on a pole): parks and plazas. */
export function postLamp(k: Kit, x: number, z: number, h = 0.8, color?: string, y = 0) {
  k.lit.cylinder(0.02, 0.03, h, 5, { position: [x, y + h / 2, z], color: '#2f3640' });
  k.glow.ico(0.06, 0, { position: [x, y + h + 0.04, z], color: color ?? k.p.window });
}

/** A fence (posts and two rails) along a polyline. */
export function fence(k: Kit, pts: V2[], h = 0.28, color = '#e9ecef', spacing = 0.5, y = 0) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / spacing));
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      k.lit.box(0.03, h, 0.03, { position: [ax + (bx - ax) * t, y + h / 2, az + (bz - az) * t], color });
    }
    for (const fy of [h * 0.45, h * 0.9]) k.lit.beam([ax, y + fy, az], [bx, y + fy, bz], 0.02, 0.02, { color });
  }
}

export function hedge(k: Kit, ax: number, az: number, bx: number, bz: number, w = 0.22, h = 0.26, y = 0) {
  k.lit.beam([ax, y + h / 2, az], [bx, y + h / 2, bz], w, h, { color: k.p.mode === 'dark' ? '#285c45' : '#4f9e6c' });
}

/** A round fountain: basin, water, a tiered column and a glowing spray. */
export function fountain(k: Kit, x: number, z: number, r = 0.9, y = 0) {
  const { lit, glow, p } = k;
  lit.lathe([[r * 0.85, 0], [r, 0], [r, 0.18], [r * 0.9, 0.2], [r * 0.88, 0.05]], 20, { position: [x, y, z], color: p.concrete });
  lit.cylinder(r * 0.88, r * 0.88, 0.04, 20, { position: [x, y + 0.1, z], color: p.mode === 'dark' ? '#2f6f9f' : '#6cc3ec' });
  lit.cylinder(0.08, 0.12, 0.5, 8, { position: [x, y + 0.3, z], color: p.concrete });
  lit.cylinder(0.3, 0.12, 0.08, 10, { position: [x, y + 0.55, z], color: p.concrete });
  glow.cone(0.22, 0.45, 8, { position: [x, y + 0.82, z], color: p.mode === 'dark' ? '#9fd8ff' : '#d8f1ff' });
}

/** Place a vehicle into the static build. `angle` points its nose (it faces +x unturned). */
export function placeVehicle(k: Kit, kind: VehicleKind, x: number, z: number, angle: number, color?: string, y = 0, scale = 1) {
  const b = new MeshBuilder();
  const g = new MeshBuilder();
  vehicle(b, g, kind, color ?? carColor(k.rng));
  k.lit.stamp(b, { position: [x, y, z], rotation: [0, angle, 0], scale });
  k.glow.stamp(g, { position: [x, y, z], rotation: [0, angle, 0], scale });
}

/** A car park: asphalt, painted bays and parked cars. Bays face the lot's local ±z. */
export function parkingLot(
  k: Kit,
  x: number,
  z: number,
  cols: number,
  rows: 1 | 2,
  angle = 0,
  fill = 0.75,
  kinds: VehicleKind[] = ['car', 'car', 'suv', 'car', 'van'],
) {
  const { lit, p, rng } = k;
  const bay = 0.52;
  const depth = 1.0;
  const aisle = 0.95;
  const w = cols * bay + 0.3;
  const d = rows * depth + aisle + 0.2;
  lit.box(w, 0.05, d, { position: [x, 0.025, z], rotation: [0, angle, 0], color: p.asphalt });
  for (let r = 0; r < rows; r++) {
    const v0 = r === 0 ? d / 2 - 0.1 - depth / 2 : -d / 2 + 0.1 + depth / 2;
    for (let c = 0; c <= cols; c++) {
      const u = -cols * bay * 0.5 + c * bay;
      const [lx, lz] = at(x, z, angle, u, v0);
      lit.box(0.025, 0.012, depth * 0.85, { position: [lx, 0.055, lz], rotation: [0, angle, 0], color: '#e9ecef' });
    }
    for (let c = 0; c < cols; c++) {
      if (rng() > fill) continue;
      const u = -cols * bay * 0.5 + (c + 0.5) * bay;
      const [cx, cz] = at(x, z, angle, u, v0 + (rng() - 0.5) * 0.06);
      const nose = r === 0 ? angle - Math.PI / 2 : angle + Math.PI / 2;
      placeVehicle(k, kinds[Math.floor(rng() * kinds.length)], cx, cz, nose + (rng() - 0.5) * 0.06, undefined, 0.05);
    }
  }
}
