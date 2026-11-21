'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { glassMaterial, glowMaterial } from '../core/materials';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { helicopter } from './parts/aircraft';
import { crosswalk, footpath, road } from './parts/ground';
import { Fleet, Walkers, track, type FleetSpec, type WalkerGroup } from './parts/movers';
import { flowerBed, forest, roundTree, treeRow } from './parts/nature';
import { LOOKS, crowd, person, randomLook } from './parts/people';
import { at, bench, block, lamp, parkingLot, placeVehicle, postLamp } from './parts/structures';

/* Hospital: the knee-MRI data-efficiency study. A hospital: a ward tower with a
   helipad, a podium with the main entrance, an emergency department with ambulances,
   a car park and a garden. In front, a glass-roofed imaging suite holds an MRI
   scanner (a deep housing with a bore through it and a patient table), and above it
   floats a stack of slices with one highlighted, the way the study's attention model
   picks the slices that matter. The slices are abstract: no patient images are used
   anywhere on the site. */

const R = 15.5;
const TOWER = { x: 0.6, z: -8.2, w: 7.2, d: 3.4, h: 4.6 };
const PODIUM = { x: 0.2, z: -5.0, w: 10, d: 2.6, h: 1.25 };
const ER = { x: 8.3, z: -4.6, w: 3.8, d: 3.2, h: 1.45 };
const SUITE = { x: -7.4, z: 0.4, w: 5.2, d: 4.2, h: 1.7, yaw: 0.28 };
const LOOP: Array<[number, number]> = [[-4.2, 3.6], [11.6, 3.6], [11.6, -2.3], [-4.2, -2.3]];

/** The scanner, built in its own frame: bore along z, floor at y = 0. */
function scanner(b: MeshBuilder, g: MeshBuilder, p: Kit['p']) {
  const W = 1.5;
  const H = 1.5;
  const DEPTH = 1.15;
  const r = 0.32;
  const cy = 0.82;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + r, -H / 2);
  shape.lineTo(W / 2 - r, -H / 2);
  shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
  shape.lineTo(W / 2, H / 2 - r);
  shape.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2);
  shape.lineTo(-W / 2 + r, H / 2);
  shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r);
  shape.lineTo(-W / 2, -H / 2 + r);
  shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
  const hole = new THREE.Path();
  hole.absarc(0, 0.04, 0.3, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  b.extrude(shape, DEPTH, { position: [0, cy, -DEPTH / 2], color: p.mode === 'dark' ? '#e9eef4' : '#fbfcfd' }, 16);
  // Front cover: a slightly larger rounded bezel and a violet trim band.
  b.torus(0.33, 0.05, 6, 32, { position: [0, cy + 0.04, DEPTH / 2 + 0.01], color: '#cfd6df' });
  b.torus(0.33, 0.05, 6, 32, { position: [0, cy + 0.04, -DEPTH / 2 - 0.01], color: '#cfd6df' });
  b.box(W + 0.02, 0.05, DEPTH * 0.3, { position: [0, cy + H / 2 - 0.25, 0], color: p.accent.violet });
  b.box(W + 0.02, 0.05, DEPTH * 0.3, { position: [0, cy - H / 2 + 0.25, 0], color: p.accent.violet });
  g.torus(0.28, 0.012, 4, 32, { position: [0, cy + 0.04, -DEPTH * 0.3], color: '#c9b6ff' });
  b.box(1.3, 0.1, DEPTH, { position: [0, 0.05, 0], color: '#9aa6b5' });
  // Patient table: pedestal and a cradle reaching into the bore.
  b.box(0.42, 0.45, 1.0, { position: [0, 0.225, DEPTH / 2 + 0.75], color: '#cfd6df' });
  b.box(0.46, 0.06, 2.1, { position: [0, cy - 0.21, DEPTH / 2 + 0.35], color: '#f4f6f8' });
  b.box(0.4, 0.03, 1.4, { position: [0, cy - 0.17, DEPTH / 2 + 0.5], color: '#a5b4fc' });
}

function build(k: Kit) {
  const { lit, glow, glass, p, rng, signs } = k;
  base(k, 37, R, 9);
  rimGlow(k, R, p.accent.violet);
  const dark = p.mode === 'dark';
  const wall = dark ? '#dfe5ec' : '#f7f9fb';

  // Roads, the drop-off loop and the access road to the island's edge.
  road(k, LOOP, 1.1, { closed: true, sidewalk: 0.3 });
  road(k, [[-1.2, 3.6], [-1.2, 15.4]], 1.2, { sidewalk: 0.25 });
  crosswalk(k, 0.2, -2.3, 0, 1.1);
  crosswalk(k, 8.3, -2.3, 0, 1.1);
  parkingLot(k, 3.9, 0.65, 10, 2, 0, 0.85);
  parkingLot(k, -7.6, 7.3, 8, 2, 0.3, 0.75);

  // Ward tower and podium.
  block(k, { ...TOWER, wall, floors: 7, windows: 'grid', pitch: 0.4, litChance: 0.6, rooftop: 0 });
  block(k, { ...PODIUM, wall: dark ? '#cbd3dd' : '#e9eef3', floors: 2, windows: 'band', pitch: 0.36, litChance: 0.7, rooftop: 3 });
  // Main entrance canopy, doors and sign.
  lit.box(3.6, 0.1, 1.5, { position: [PODIUM.x, 1.0, PODIUM.z + PODIUM.d / 2 + 0.6], color: dark ? '#7d8796' : '#c3cad4' });
  for (const s of [-1, 1]) lit.box(0.08, 1.0, 0.08, { position: [PODIUM.x + s * 1.6, 0.5, PODIUM.z + PODIUM.d / 2 + 1.25], color: '#5b6270' });
  glow.box(1.6, 0.6, 0.02, { position: [PODIUM.x, 0.32, PODIUM.z + PODIUM.d / 2 + 0.02], color: dark ? '#cfe3ff' : '#eaf3ff' });
  signs.push({ text: 'HOSPITAL', icon: 'cross', position: [TOWER.x, TOWER.h - 0.45, TOWER.z + TOWER.d / 2 + 0.03], width: 3.6, height: 0.62, bg: '#ffffff', fg: '#1d4ed8' });
  signs.push({ text: 'MAIN ENTRANCE', position: [PODIUM.x, 1.18, PODIUM.z + PODIUM.d / 2 + 1.36], width: 2.2, height: 0.26, bg: '#1d4ed8', fg: '#ffffff' });
  // Red cross on the podium front.
  lit.box(0.62, 0.62, 0.04, { position: [PODIUM.x - 3.2, 0.8, PODIUM.z + PODIUM.d / 2 + 0.03], color: '#ffffff' });
  for (const [w, h] of [[0.44, 0.14], [0.14, 0.44]] as const) {
    glow.box(w, h, 0.03, { position: [PODIUM.x - 3.2, 0.8, PODIUM.z + PODIUM.d / 2 + 0.06], color: '#ff2b3a' });
  }

  // Helipad on the tower roof, with an air ambulance.
  {
    const y = TOWER.h + 0.03;
    lit.cylinder(1.45, 1.45, 0.06, 24, { position: [TOWER.x - 1.4, y + 0.03, TOWER.z], color: '#2b313b' });
    lit.torus(1.15, 0.035, 4, 32, { position: [TOWER.x - 1.4, y + 0.07, TOWER.z], rotation: [Math.PI / 2, 0, 0], color: '#f2c230' });
    signs.push({ text: 'H', position: [TOWER.x - 1.4, y + 0.075, TOWER.z], tilt: -Math.PI / 2, width: 0.9, height: 0.9, bg: 'transparent', fg: '#ffffff', lit: false });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      glow.ico(0.035, 0, { position: [TOWER.x - 1.4 + Math.cos(a) * 1.4, y + 0.1, TOWER.z + Math.sin(a) * 1.4], color: '#7dff9a' });
    }
    const hb = new MeshBuilder();
    const hg = new MeshBuilder();
    helicopter(hb, hg, '#f1f3f5', '#d62828');
    k.lit.stamp(hb, { position: [TOWER.x + 1.6, y, TOWER.z + 0.1], rotation: [0, 2.6, 0], scale: 0.9 });
    k.glow.stamp(hg, { position: [TOWER.x + 1.6, y, TOWER.z + 0.1], rotation: [0, 2.6, 0], scale: 0.9 });
  }

  // Emergency department: building, canopy over the ambulance bay, red sign, ambulances.
  block(k, { ...ER, wall: dark ? '#d5dce5' : '#eef2f6', floors: 2, windows: 'grid', pitch: 0.45, litChance: 0.8 });
  lit.box(3.4, 0.1, 2.0, { position: [ER.x, 1.15, ER.z + ER.d / 2 + 0.95], color: dark ? '#7d8796' : '#c3cad4' });
  for (const s of [-1, 1]) lit.box(0.08, 1.15, 0.08, { position: [ER.x + s * 1.55, 0.57, ER.z + ER.d / 2 + 1.85], color: '#5b6270' });
  signs.push({ text: 'EMERGENCY', position: [ER.x, 1.38, ER.z + ER.d / 2 + 1.96], width: 2.6, height: 0.36, bg: '#b91c1c', fg: '#ffffff' });
  glow.box(1.2, 0.55, 0.02, { position: [ER.x, 0.3, ER.z + ER.d / 2 + 0.02], color: dark ? '#ffd6d6' : '#fff0f0' });
  placeVehicle(k, 'ambulance', ER.x - 0.8, ER.z + ER.d / 2 + 1.0, Math.PI / 2, '#f8f9fa', 0.06);
  placeVehicle(k, 'ambulance', ER.x + 0.75, ER.z + ER.d / 2 + 1.0, Math.PI / 2, '#f8f9fa', 0.06);
  for (const [dx, dz] of [[-0.1, 2.3], [0.3, 2.5], [1.5, 2.2]] as const) {
    person(lit, ER.x + dx, 0.06, ER.z + ER.d / 2 + dz, rng() * Math.PI * 2, LOOKS.scrubs(rng));
  }

  // A clinic block at the back left.
  {
    const [cx, cz, ca] = [-11.0, -4.6, 0.75];
    block(k, { x: cx, z: cz, w: 3.6, d: 2.6, h: 1.9, angle: ca, wall: dark ? '#cfd6df' : '#eef1f5', floors: 3, litChance: 0.5 });
    const [sx, sz] = at(cx, cz, ca, 0, 1.33);
    signs.push({ text: 'CLINIC', position: [sx, 1.6, sz], rotationY: ca, width: 1.4, height: 0.32, bg: '#1d4ed8', fg: '#ffffff' });
  }

  // The imaging suite: glass walls and roof, the scanner, a control room, staff and a patient.
  {
    const { x, z, w, d, h, yaw } = SUITE;
    lit.box(w, 0.1, d, { position: [x, 0.05, z], rotation: [0, yaw, 0], color: dark ? '#cfd6df' : '#f1f4f7' });
    // Frame.
    for (const [u, v] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]] as const) {
      const [px, pz] = at(x, z, yaw, u, v);
      lit.box(0.1, h, 0.1, { position: [px, h / 2 + 0.1, pz], rotation: [0, yaw, 0], color: '#5b6270' });
    }
    for (const [u, v, len, along] of [[0, -d / 2, w, true], [0, d / 2, w, true], [-w / 2, 0, d, false], [w / 2, 0, d, false]] as const) {
      const [px, pz] = at(x, z, yaw, u, v);
      lit.box(along ? len : 0.1, 0.1, along ? 0.1 : len, { position: [px, h + 0.12, pz], rotation: [0, yaw, 0], color: '#5b6270' });
    }
    // Back wall solid (with a violet band), glass elsewhere.
    const [bx, bz] = at(x, z, yaw, 0, -d / 2 + 0.06);
    lit.box(w, h, 0.12, { position: [bx, h / 2 + 0.1, bz], rotation: [0, yaw, 0], color: wall });
    const [vx, vz] = at(x, z, yaw, 0, -d / 2 + 0.13);
    glow.box(w - 0.2, 0.06, 0.02, { position: [vx, h - 0.25, vz], rotation: [0, yaw, 0], color: p.accent.violet });
    // A cutaway: no roof, and a low glass front, so the room reads from above.
    const pane = dark ? '#7fb2d6' : '#cfe8f7';
    const [fx, fz] = at(x, z, yaw, 0, d / 2);
    glass.box(w, 0.55, 0.03, { position: [fx, 0.375, fz], rotation: [0, yaw, 0], color: pane });
    for (const s of [-1, 1]) {
      const [sx, sz] = at(x, z, yaw, (s * w) / 2, 0);
      glass.box(0.03, h, d, { position: [sx, h / 2 + 0.1, sz], rotation: [0, yaw, 0], color: pane });
    }
    // Control room partition at the right end, with a console and two screens.
    const [cx, cz] = at(x, z, yaw, w / 2 - 1.15, 0.2);
    glass.box(0.03, h, d - 0.3, { position: [cx, h / 2 + 0.1, cz], rotation: [0, yaw, 0], color: pane });
    const [kx, kz] = at(x, z, yaw, w / 2 - 0.6, -0.6);
    lit.box(0.9, 0.32, 0.45, { position: [kx, 0.26, kz], rotation: [0, yaw + Math.PI / 2, 0], color: '#3d4350' });
    for (const o of [-0.2, 0.2]) {
      const [mx, mz] = at(kx, kz, yaw, -0.15, o);
      glow.box(0.02, 0.2, 0.3, { position: [mx, 0.55, mz], rotation: [0, yaw, 0], color: dark ? '#b9a6ff' : '#d9ceff' });
    }
    const [tx, tz] = at(x, z, yaw, w / 2 - 0.35, -0.6);
    person(lit, tx, 0.1, tz, yaw - Math.PI / 2, LOOKS.scrubs(rng), 'sit', 1.25);
    // Scanner: bore pointing across the room (towards the camera's right).
    const sb = new MeshBuilder();
    const sg = new MeshBuilder();
    scanner(sb, sg, p);
    const [ox, oz] = at(x, z, yaw, -0.9, -0.75);
    const syaw = yaw + 0.55;
    k.lit.stamp(sb, { position: [ox, 0.1, oz], rotation: [0, syaw, 0], scale: 1.12 });
    k.glow.stamp(sg, { position: [ox, 0.1, oz], rotation: [0, syaw, 0], scale: 1.12 });
    // Patient lying on the table, head into the bore.
    const [ptx, ptz] = at(ox, oz, syaw, 0, 0.95);
    person(lit, ptx, 0.1 + 0.75, ptz, syaw, randomLook(rng, { shirt: '#9ec5ff', pants: '#9ec5ff' }), 'lie', 1.45);
    const [nx, nz] = at(ox, oz, syaw, 0.6, 1.5);
    person(lit, nx, 0.1, nz, syaw - Math.PI / 2, LOOKS.scrubs(rng), 'stand', 1.25);
    const [mx, mz] = at(x, z, yaw, 0, -d / 2 + 0.14);
    signs.push({ text: 'MRI', position: [mx, h - 0.05, mz], rotationY: yaw, width: 1.1, height: 0.4, bg: p.accent.violet, fg: '#ffffff' });
  }

  // Garden with a pond, benches and people; trees along the roads.
  {
    const [gx, gz] = [8.0, 8.4];
    lit.cylinder(1.3, 1.3, 0.05, 20, { position: [gx, 0.03, gz], color: dark ? '#2f6f9f' : '#6cc3ec' });
    lit.torus(1.3, 0.08, 4, 24, { position: [gx, 0.05, gz], rotation: [Math.PI / 2, 0, 0], color: p.concrete });
    footpath(k, [[gx - 3.2, gz - 2.2], [gx, gz - 1.7], [gx + 3.0, gz - 1.0]], 0.7);
    for (const [bx, bz, a] of [[gx - 1.8, gz - 1.6, 0.5], [gx + 1.9, gz - 1.3, -0.5], [gx - 2.4, gz + 0.4, 1.4]] as const) bench(k, bx, bz, a, 1);
    flowerBed(lit, rng, p, gx + 2.6, gz + 1.3, 1.4, 0.5, 0.4);
    // A patient in a wheelchair with a nurse.
    const wx = gx - 0.4;
    const wz = gz - 2.4;
    person(lit, wx, 0.06, wz, 0.3, randomLook(rng, { shirt: '#9ec5ff' }), 'sit');
    for (const s of [-1, 1]) {
      const [rx, rz] = at(wx, wz, 0.3, s * 0.08, 0.02);
      lit.torus(0.09, 0.012, 4, 12, { position: [rx, 0.1, rz], rotation: [0, 0.3 + Math.PI / 2, 0], color: '#3d4350' });
    }
    const [ux, uz] = at(wx, wz, 0.3, 0, -0.25);
    person(lit, ux, 0.05, uz, 0.3, LOOKS.scrubs(rng));
  }
  crowd(lit, rng, PODIUM.x - 0.4, -2.7, 1.0, 7, 0.05);
  for (let x = -3.2; x <= 10.5; x += 2.6) lamp(k, x, 4.45, 1.0, -Math.PI / 2);
  for (const x of [-3, 3]) postLamp(k, PODIUM.x + x, PODIUM.z + PODIUM.d / 2 + 0.5, 0.8, p.accent.violet);
  treeRow(lit, rng, p, -0.2, 5.2, -0.2, 14.5, 6, 'round', 0.75);
  treeRow(lit, rng, p, -2.2, 5.2, -2.2, 14.5, 6, 'round', 0.75);
  for (let i = 0; i < 6; i++) roundTree(lit, rng, p, -3.6 + i * 3, -3.0 + (i % 2) * 0.2, 0.6);
  forest(lit, rng, p, 44, 12.2, 15.1, [
    [-1.2, 14, 1.8],
    [-7.6, 7.3, 3.4],
    [8.0, 8.4, 3.6],
  ]);
  forest(lit, rng, p, 10, 4, 12, [
    [-7.4, 0.4, 3.8],
    [3.9, 0.6, 3.8],
    [8, 8.4, 3.6],
    [-7.6, 7.3, 3.2],
    [0, -6, 6.2],
    [8.3, -4.6, 3.2],
    [-11.0, -4.6, 2.8],
    [-1.2, 9, 1.6],
    [3.6, 3.6, 8.5],
  ]);
}

/** Above the imaging suite: abstract slices, one highlighted by the "attention". */
function SliceStack({ palette, animate }: IslandProps) {
  const group = useRef<THREE.Group>(null);
  const focus = useRef<THREE.Mesh>(null);
  const slices = useMemo(() => {
    const b = new MeshBuilder();
    for (let i = 0; i < 10; i++) b.box(2.4, 0.025, 1.7, { position: [0, i * 0.24, 0], color: palette.accent.violet });
    return b.build();
  }, [palette]);
  const frame = useMemo(() => {
    const g = new MeshBuilder(palette.glow);
    const c = palette.accent.violet;
    g.box(2.5, 0.04, 0.05, { position: [0, 0, 0.87], color: c });
    g.box(2.5, 0.04, 0.05, { position: [0, 0, -0.87], color: c });
    g.box(0.05, 0.04, 1.78, { position: [1.24, 0, 0], color: c });
    g.box(0.05, 0.04, 1.78, { position: [-1.24, 0, 0], color: c });
    return g.build();
  }, [palette]);
  useEffect(
    () => () => {
      slices.dispose();
      frame.dispose();
    },
    [slices, frame],
  );
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    if (group.current) group.current.rotation.y = 0.4 + t.current * 0.15;
    const stops = [2, 3, 7, 5];
    const phase = (t.current * 0.35) % stops.length;
    const i = Math.floor(phase);
    const f = phase - i;
    const from = stops[i];
    const to = stops[(i + 1) % stops.length];
    const s = f < 0.7 ? 0 : (f - 0.7) / 0.3;
    if (focus.current) focus.current.position.y = (from + (to - from) * s * s * (3 - 2 * s)) * 0.24;
  });
  return (
    <group ref={group} position={[SUITE.x, 3.0, SUITE.z]}>
      <mesh geometry={slices} material={glassMaterial()} />
      <mesh ref={focus} geometry={frame} material={glowMaterial()} />
    </group>
  );
}

/** Flashing light bars on the two ambulances in the bay. */
function Beacons({ palette, animate }: IslandProps) {
  const red = useRef<THREE.Mesh>(null);
  const blue = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const make = (color: string) => {
      const g = new MeshBuilder(palette.glow * 1.6);
      for (const dx of [-0.8, 0.75]) g.box(0.36, 0.06, 0.12, { position: [ER.x + dx, 0.56, ER.z + ER.d / 2 + 1.0 + 0.36], color });
      return g.build();
    };
    return { red: make('#ff2020'), blue: make('#2050ff') };
  }, [palette]);
  useEffect(
    () => () => {
      geo.red.dispose();
      geo.blue.dispose();
    },
    [geo],
  );
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    const on = Math.floor(t.current * 3) % 2 === 0;
    if (red.current) red.current.visible = on;
    if (blue.current) blue.current.visible = !on;
  });
  return (
    <>
      <mesh ref={red} geometry={geo.red} material={glowMaterial()} />
      <mesh ref={blue} geometry={geo.blue} material={glowMaterial()} />
    </>
  );
}

const ROAD_LOOP = track(LOOP, true, 0.06);
const ACCESS = track([[-1.2, 15.0], [-1.2, 3.6]], false, 0.06);
const FLEET: FleetSpec[] = [
  { kind: 'car', track: ROAD_LOOP, count: 4, speed: 0.9, lane: 0.27 },
  { kind: 'ambulance', track: ROAD_LOOP, speed: 1.2, lane: 0.27, offset: 11, colors: ['#f8f9fa'] },
  { kind: 'taxi', track: ROAD_LOOP, speed: 0.9, lane: 0.27, offset: 30, colors: ['#f2c230'] },
  { kind: 'car', track: ACCESS, count: 2, speed: 0.8, lane: 0.28 },
  { kind: 'bus', track: ACCESS, speed: 0.6, lane: 0.28, offset: 6, colors: ['#1d4ed8'], scale: 0.85 },
];
const WALKS: WalkerGroup[] = [
  { track: track([[-4.2, -2.85], [11.6, -2.85]], false, 0.05), count: 12, spread: 0.12 },
  { track: track([[-4.2, 4.15], [11.6, 4.15]], false, 0.05), count: 6, spread: 0.1 },
  { track: track([[0.2, -2.6], [0.2, -0.4], [3.9, -0.4]], false, 0.05), count: 4 },
  { track: track([[4.8, 6.2], [8.0, 6.7], [11.0, 7.4]], false, 0.05), count: 4, spread: 0.2 },
  { track: track([[-4.4, 0.2], [-4.4, 3.2]], false, 0.05), count: 2, look: LOOKS.scrubs },
];

export default function MriIsland(props: IslandProps) {
  return (
    <group>
      <Baked build={build} palette={props.palette} seed={303} />
      <SliceStack {...props} />
      <Beacons {...props} />
      <Fleet specs={FLEET} palette={props.palette} animate={props.animate} seed={31} />
      <Walkers groups={WALKS} animate={props.animate} seed={32} />
    </group>
  );
}
