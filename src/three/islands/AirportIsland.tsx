'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { glowMaterial, litMaterial } from '../core/materials';
import { mulberry32 } from '../core/math';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { airliner } from './parts/aircraft';
import { crosswalk, dashes, road } from './parts/ground';
import { Fleet, Walkers, track, type FleetSpec } from './parts/movers';
import { forest, treeRow } from './parts/nature';
import { LOOKS, person, randomLook } from './parts/people';
import { block, faceYaw, lamp, parkingLot, placeVehicle } from './parts/structures';

/* Airport: the airline crew-pairing project. A runway along the front with real
   markings, a taxiway, an apron where three airliners stand at jet bridges with
   their ground crews, fuel and catering trucks and baggage trains, a glass terminal,
   a control tower, a hangar and a landside car park. One airliner flies touch-and-go
   circuits, flight crews walk out to their aircraft, and above the terminal hangs a
   small hologram of a time-space network: airports on a ring, time rising. */

const R = 17.5;
const RWY_Z = 10;
const RWY_HALF = 13;
const RWY_W = 2.4;
const TWY_Z = 6.6;
const TERM = { x: -1.5, z: -3.5, w: 17, d: 2.8, h: 1.55 };
const TERM_FRONT = TERM.z + TERM.d / 2;
const GATES = [-7.5, -1.5, 4.5];
const PLANE_Z = 2.0;
const PLANE_Y = 0.68;
const LIVERIES = ['#2563eb', '#d62828', '#0f9f90'];

function placeAirliner(k: Kit, x: number, y: number, z: number, yaw: number, livery: string, scale = 1) {
  const b = new MeshBuilder();
  const g = new MeshBuilder();
  airliner(b, g, k.p, { livery, gearDown: true, scale });
  k.lit.stamp(b, { position: [x, y, z], rotation: [0, yaw, 0] });
  k.glow.stamp(g, { position: [x, y, z], rotation: [0, yaw, 0] });
}

function cone(k: Kit, x: number, z: number) {
  k.lit.cone(0.05, 0.12, 6, { position: [x, 0.11, z], color: '#ff7b00' });
}

function build(k: Kit) {
  const { lit, glow, p, rng, signs } = k;
  base(k, 47, R, 9.5);
  rimGlow(k, R, p.accent.blue);
  const dark = p.mode === 'dark';
  const white = dark ? '#c9ccd2' : '#f8f9fa';
  const yellow = '#f2c230';

  // Runway: asphalt, centre line, threshold bars, numbers, touchdown marks, lights.
  lit.box(RWY_HALF * 2, 0.06, RWY_W, { position: [0, 0.03, RWY_Z], color: p.asphalt });
  dashes(k, [[-RWY_HALF + 2.2, RWY_Z], [RWY_HALF - 2.2, RWY_Z]], white, 0.6, 0.45, 0.06);
  for (const end of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const z = RWY_Z - RWY_W / 2 + 0.2 + (i + (i >= 4 ? 0.6 : 0)) * ((RWY_W - 0.4) / 8.6);
      lit.box(1.0, 0.01, 0.12, { position: [end * (RWY_HALF - 0.75), 0.065, z], color: white });
    }
    for (let j = 0; j < 3; j++) {
      for (const s of [-1, 1]) {
        lit.box(0.7, 0.01, 0.1, { position: [end * (RWY_HALF - 3.4 - j * 1.4), 0.065, RWY_Z + s * 0.62], color: white });
      }
    }
    signs.push({
      text: end < 0 ? '09' : '27',
      position: [end * (RWY_HALF - 2.0), 0.068, RWY_Z],
      tilt: -Math.PI / 2,
      rotationY: end < 0 ? -Math.PI / 2 : Math.PI / 2,
      width: 1.1,
      height: 0.9,
      bg: 'transparent',
      fg: white,
      lit: false,
    });
    for (let i = 0; i < 6; i++) {
      const z = RWY_Z - RWY_W / 2 + (i + 0.5) * (RWY_W / 6);
      glow.ico(0.05, 0, { position: [end * (RWY_HALF + 0.02), 0.1, z], color: end < 0 ? '#3bff7a' : '#ff3b3b' });
    }
  }
  for (let x = -RWY_HALF + 0.4; x <= RWY_HALF - 0.3; x += 1.3) {
    for (const s of [-1, 1]) glow.ico(0.045, 0, { position: [x, 0.1, RWY_Z + s * (RWY_W / 2 + 0.06)], color: '#fff6d8' });
  }

  // Taxiway with a yellow centre line, blue edge lights, and three links to the runway.
  lit.box(25, 0.05, 1.3, { position: [-0.5, 0.03, TWY_Z], color: p.asphalt });
  dashes(k, [[-12.5, TWY_Z], [11.5, TWY_Z]], yellow, 1e3, 0, 0.05);
  for (const x of [-11.5, -0.5, 10.5]) {
    lit.box(1.3, 0.05, RWY_Z - TWY_Z - RWY_W / 2 + 0.3, { position: [x, 0.03, (TWY_Z + RWY_Z - RWY_W / 2) / 2], color: p.asphalt });
    dashes(k, [[x, TWY_Z], [x, RWY_Z - 0.2]], yellow, 1e3, 0, 0.05);
    lit.box(1.3, 0.01, 0.08, { position: [x, 0.066, RWY_Z - RWY_W / 2 - 0.35], color: yellow });
  }
  for (let x = -12.5; x <= 11.5; x += 1.6) {
    for (const s of [-1, 1]) glow.ico(0.035, 0, { position: [x, 0.08, TWY_Z + s * 0.7], color: '#3d7bff' });
  }
  // A plane holding short of the runway.
  placeAirliner(k, 10.5, PLANE_Y * 0.8 + 0.02, 6.2, -Math.PI / 2, LIVERIES[2], 0.8);

  // Apron with lead-in lines and stands.
  lit.box(22, 0.05, 7.6, { position: [-1.0, 0.025, 2.2], color: p.concrete });
  for (const gx of GATES) {
    dashes(k, [[gx, TWY_Z - 0.7], [gx, -0.9]], yellow, 1e3, 0, 0.05, 0.055);
    lit.box(0.9, 0.01, 0.08, { position: [gx, 0.055, -0.85], color: yellow });
  }
  // Service road markings along the terminal and behind the tails.
  dashes(k, [[-10.5, -1.45], [8.6, -1.45]], white, 0.25, 0.25, 0.04, 0.055);
  dashes(k, [[-10.5, 5.35], [8.6, 5.35]], white, 0.25, 0.25, 0.04, 0.055);

  // Aircraft at the gates, nose in, with jet bridges and ground handling.
  GATES.forEach((gx, i) => {
    placeAirliner(k, gx, PLANE_Y, PLANE_Z, Math.PI / 2, LIVERIES[i]);
    // Jet bridge: fixed tunnel from the terminal, rotunda, then a sloping tunnel to the front door.
    const rx = gx - 2.0;
    const rz = TERM_FRONT + 0.9;
    lit.box(0.42, 0.42, 0.9, { position: [rx, 0.95, TERM_FRONT + 0.45], color: dark ? '#9aa6b5' : '#d5dbe3' });
    lit.cylinder(0.36, 0.36, 0.55, 10, { position: [rx, 0.95, rz], color: dark ? '#8793a3' : '#c8d0da' });
    lit.cylinder(0.08, 0.1, 0.7, 6, { position: [rx, 0.35, rz], color: '#5b6270' });
    const door: [number, number, number] = [gx - 0.5, 0.82, PLANE_Z - 1.85];
    lit.beam([rx + 0.3, 0.93, rz + 0.1], door, 0.4, 0.42, { color: dark ? '#9aa6b5' : '#d5dbe3' });
    lit.box(0.08, 0.6, 0.08, { position: [door[0] - 0.4, 0.3, door[2] - 0.3], color: '#5b6270' });
    for (const s of [-1, 1]) lit.cylinder(0.06, 0.06, 0.05, 8, { position: [door[0] - 0.4 + s * 0.12, 0.06, door[2] - 0.3], rotation: [Math.PI / 2, 0, 0], color: '#15171c' });
    // Fuel truck at the right wing, belt loader and baggage train at the hold, catering at the back.
    placeVehicle(k, 'fuel', gx + 1.75, PLANE_Z + 0.2, Math.PI / 2, '#e9ecef', 0.05);
    placeVehicle(k, 'loader', gx + 0.82, PLANE_Z + 1.25, Math.PI, '#f2c230', 0.05);
    placeVehicle(k, 'tug', gx + 1.85, PLANE_Z + 2.4, Math.PI, '#f2c230', 0.05);
    for (let c = 0; c < 2; c++) placeVehicle(k, 'cart', gx + 2.4 + c * 0.55, PLANE_Z + 2.4, Math.PI, '#5c636a', 0.05);
    if (i !== 1) placeVehicle(k, 'catering', gx + 1.15, PLANE_Z + 3.1, Math.PI / 2 + 0.3, '#f1f3f5', 0.05);
    placeVehicle(k, 'pushback', gx + 0.6, -1.0, 0, '#f2c230', 0.05, 0.85);
    cone(k, gx - 2.55, PLANE_Z + 1.2);
    cone(k, gx + 2.55, PLANE_Z + 1.2);
    cone(k, gx, PLANE_Z + 3.1);
    // Ground crew.
    for (const [dx, dz] of [[1.3, 1.0], [0.4, 1.7], [2.3, 2.0], [-0.9, -0.2]] as const) {
      person(lit, gx + dx, 0.05, PLANE_Z + dz, rng() * Math.PI * 2, LOOKS.vest(rng));
    }
  });

  // Terminal: glass airside facade, deep roof overhang, gate signs, rooftop sign.
  block(k, { x: TERM.x, z: TERM.z, w: TERM.w, d: TERM.d, h: TERM.h, wall: dark ? '#b8c2cf' : '#e6ebf1', floors: 2, windows: 'band', pitch: 0.34, litChance: 0.65, rooftop: 4 });
  lit.box(TERM.w + 0.6, 0.12, TERM.d + 0.9, { position: [TERM.x, TERM.h + 0.12, TERM.z + 0.2], color: dark ? '#56616f' : '#a7b2c0' });
  glow.box(TERM.w + 0.62, 0.04, 0.04, { position: [TERM.x, TERM.h + 0.07, TERM.z + TERM.d / 2 + 0.66], color: p.accent.blue });
  for (let x = TERM.x - TERM.w / 2 + 0.6; x < TERM.x + TERM.w / 2; x += 1.6) {
    lit.box(0.06, TERM.h, 0.06, { position: [x, TERM.h / 2, TERM.z + TERM.d / 2 + 0.55], color: '#5b6270' });
  }
  GATES.forEach((gx, i) => {
    signs.push({ text: `A${i + 1}`, position: [gx - 2.0, TERM.h + 0.45, TERM_FRONT + 0.04], width: 0.6, height: 0.42, bg: '#f2c230', fg: '#16181d' });
  });
  signs.push({ text: 'AIRPORT', position: [TERM.x + 4.5, TERM.h + 0.62, TERM.z + 0.4], width: 3.2, height: 0.62, bg: '#0d1626', fg: dark ? '#9cc8ff' : '#e8f1ff' });
  lit.box(3.3, 0.1, 0.1, { position: [TERM.x + 4.5, TERM.h + 0.22, TERM.z + 0.35], color: '#3d4350' });

  // Control tower.
  {
    const [tx, tz] = [12.0, -4.6];
    lit.cylinder(0.42, 0.55, 5.6, 10, { position: [tx, 2.8, tz], color: dark ? '#cfd6df' : '#eef1f5' });
    lit.cylinder(0.75, 0.5, 0.35, 10, { position: [tx, 5.75, tz], color: dark ? '#9aa6b5' : '#d5dbe3' });
    lit.cylinder(0.95, 0.85, 0.7, 10, { position: [tx, 6.3, tz], color: '#1d2a3a' });
    glow.cylinder(0.96, 0.86, 0.5, 10, { position: [tx, 6.3, tz], color: dark ? '#7fb0ff' : '#cfe3ff' });
    lit.cylinder(1.05, 1.05, 0.12, 10, { position: [tx, 6.72, tz], color: dark ? '#9aa6b5' : '#d5dbe3' });
    lit.cylinder(0.03, 0.03, 0.9, 4, { position: [tx, 7.2, tz], color: '#5b6270' });
    glow.ico(0.07, 0, { position: [tx, 7.68, tz], color: '#ff3b3b' });
    lit.box(1.6, 0.9, 1.4, { position: [tx, 0.45, tz + 0.2], color: dark ? '#b8c2cf' : '#e6ebf1' });
  }

  // Hangar with a business jet half inside.
  {
    const [hx, hz] = [-13.6, 1.4];
    const roof = new THREE.CylinderGeometry(2.2, 2.2, 4.2, 18, 1, false, 0, Math.PI);
    lit.add(roof, { position: [hx, 0.6, hz], rotation: [Math.PI / 2, 0, Math.PI / 2], scale: [1, 1, 0.65], color: dark ? '#7d8796' : '#c3cad4' });
    lit.box(4.2, 0.6, 4.4, { position: [hx, 0.3, hz], rotation: [0, Math.PI / 2, 0], color: dark ? '#7d8796' : '#c3cad4' });
    lit.box(0.05, 1.7, 3.8, { position: [hx + 2.11, 0.85, hz], color: '#11151b' });
    placeAirliner(k, hx + 1.5, 0.5, hz, 0, '#495057', 0.55);
  }

  // Fuel farm and a windsock.
  for (const [x, z] of [[13.0, 0.8], [14.3, 2.2], [12.8, 2.6]] as const) {
    lit.cylinder(0.62, 0.62, 0.75, 14, { position: [x, 0.375, z], color: dark ? '#cfd6df' : '#f4f6f8' });
    lit.cylinder(0.64, 0.64, 0.05, 14, { position: [x, 0.6, z], color: '#d62828' });
  }
  lit.cylinder(0.02, 0.02, 1.0, 4, { position: [-8.5, 0.5, 8.0], color: '#d9d9d9' });
  lit.cone(0.09, 0.45, 8, { position: [-8.3, 0.95, 8.0], rotation: [0, 0, Math.PI / 2], color: '#ff7b00' });

  // Landside: road loop, car parks, taxi rank, bus stop and people.
  const loop: Array<[number, number]> = [[-11, -6.0], [8.2, -6.0], [8.2, -12.6], [-11, -12.6]];
  road(k, loop, 1.1, { closed: true, sidewalk: 0.25 });
  parkingLot(k, -5.8, -9.3, 9, 2, 0, 0.82);
  parkingLot(k, 3.4, -9.3, 7, 2, 0, 0.7);
  lit.box(TERM.w - 2, 0.05, 0.9, { position: [TERM.x, 0.03, -5.25], color: p.path });
  crosswalk(k, -1.5, -6.0, 0, 1.1);
  for (const x of [-9, -8.2, -7.4]) placeVehicle(k, 'taxi', x, -5.68, 0, '#f2c230', 0.05);
  placeVehicle(k, 'bus', 4.2, -5.68, 0, '#2563eb', 0.05);
  for (let i = 0; i < 16; i++) {
    const x = TERM.x - 7 + rng() * 14;
    person(lit, x, 0.05, -5.15 - rng() * 0.25, faceYaw(rng() - 0.5, 1), randomLook(rng));
  }
  for (let i = 0; i < 4; i++) lamp(k, -10 + i * 5.6, -6.75, 1.1, Math.PI / 2);
  // Apron floodlight masts.
  for (const [x, z] of [[-11.2, 0.0], [9.2, 0.0], [-11.2, 5.6], [9.2, 5.6]] as const) {
    lit.cylinder(0.05, 0.07, 3.2, 6, { position: [x, 1.6, z], color: '#5b6270' });
    glow.box(0.5, 0.12, 0.2, { position: [x, 3.25, z], color: '#fff3d6' });
  }

  // Trees around the landside and the rim.
  treeRow(lit, rng, p, -10.5, -13.6, 7.5, -13.6, 9, 'round', 0.8);
  forest(lit, rng, p, 40, 14.5, 17.1, [
    [0, RWY_Z, 2.2],
    [-RWY_HALF, RWY_Z, 2],
    [RWY_HALF, RWY_Z, 2],
    [-13.6, 1.4, 3.2],
    [13.4, 1.8, 2.4],
    [12, -4.6, 1.6],
  ]);
}

/** A touch-and-go circuit: approach, land, roll, take off, climb out and round again. */
function circuit() {
  const pts: Array<[number, number, number]> = [
    [-24, 5.2, RWY_Z],
    [-15, 1.8, RWY_Z],
    [-10, PLANE_Y, RWY_Z],
    [-3, PLANE_Y, RWY_Z],
    [3.5, PLANE_Y + 0.15, RWY_Z],
    [10, 2.0, RWY_Z],
    [18, 5.2, 8.5],
    [24, 8.2, 0],
    [17, 10, -14],
    [-2, 10.5, -21],
    [-20, 9.5, -12],
    [-28, 7.5, 2],
  ];
  return new THREE.CatmullRomCurve3(
    pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    true,
    'catmullrom',
    0.5,
  );
}

function useAirliner(palette: IslandProps['palette'], livery: string, gearDown: boolean) {
  const geoms = useMemo(() => {
    const b = new MeshBuilder();
    const g = new MeshBuilder(palette.glow);
    airliner(b, g, palette, { livery, gearDown });
    return { lit: b.build(), glow: g.build() };
  }, [palette, livery, gearDown]);
  useEffect(
    () => () => {
      geoms.lit.dispose();
      geoms.glow.dispose();
    },
    [geoms],
  );
  return geoms;
}

function CircuitJet({ palette, animate }: IslandProps) {
  const up = useAirliner(palette, palette.accent.blue, false);
  const down = useAirliner(palette, palette.accent.blue, true);
  const curve = useMemo(() => circuit(), []);
  const ref = useRef<THREE.Group>(null);
  const gearUp = useRef<THREE.Group>(null);
  const gearDown = useRef<THREE.Group>(null);
  const s = useRef({ u: 0.06, roll: 0 });
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), t2: new THREE.Vector3(), e: new THREE.Euler(0, 0, 0, 'YZX') }), []);
  useFrame((_, dt) => {
    const jet = ref.current;
    if (!jet) return;
    const st = s.current;
    curve.getPointAt(st.u, tmp.p);
    // Slower on the ground, faster in the air.
    const v = 0.016 + 0.01 * Math.min(1, tmp.p.y / 6);
    if (animate) st.u = (st.u + Math.min(dt, 0.1) * v) % 1;
    curve.getPointAt(st.u, tmp.p);
    curve.getTangentAt(st.u, tmp.t);
    curve.getTangentAt((st.u + 0.01) % 1, tmp.t2);
    const yaw = Math.atan2(-tmp.t.z, tmp.t.x);
    const yaw2 = Math.atan2(-tmp.t2.z, tmp.t2.x);
    let dyaw = yaw2 - yaw;
    if (dyaw > Math.PI) dyaw -= Math.PI * 2;
    if (dyaw < -Math.PI) dyaw += Math.PI * 2;
    const targetRoll = tmp.p.y < 1.2 ? 0 : Math.max(-0.5, Math.min(0.5, -dyaw * 6));
    st.roll += (targetRoll - st.roll) * Math.min(1, dt * 2);
    tmp.e.set(st.roll, yaw, Math.atan2(tmp.t.y, Math.hypot(tmp.t.x, tmp.t.z)));
    jet.position.copy(tmp.p);
    jet.quaternion.setFromEuler(tmp.e);
    const low = tmp.p.y < 3.2;
    if (gearDown.current) gearDown.current.visible = low;
    if (gearUp.current) gearUp.current.visible = !low;
  });
  return (
    <group ref={ref}>
      <group ref={gearUp}>
        <mesh geometry={up.lit} material={litMaterial()} />
        <mesh geometry={up.glow} material={glowMaterial()} />
      </group>
      <group ref={gearDown} visible={false}>
        <mesh geometry={down.lit} material={litMaterial()} />
        <mesh geometry={down.glow} material={glowMaterial()} />
      </group>
    </group>
  );
}

/** Overhead hologram: 14 "airports" on a ring, legs drawn from one time to a later one. */
function Hologram({ palette, animate }: IslandProps) {
  const ref = useRef<THREE.Group>(null);
  const { lines, nodes } = useMemo(() => {
    const rng = mulberry32(5);
    const n = 14;
    const radius = 2.4;
    const node = (i: number, h: number) =>
      new THREE.Vector3(Math.cos((i / n) * Math.PI * 2) * radius, h, Math.sin((i / n) * Math.PI * 2) * radius);
    const pts: number[] = [];
    const tmp = new THREE.Vector3();
    for (let leg = 0; leg < 70; leg++) {
      const a = Math.floor(rng() * n);
      let b = Math.floor(rng() * n);
      if (b === a) b = (a + 3) % n;
      const h0 = rng() * 3.2;
      const h1 = h0 + 0.25 + rng() * 0.5;
      const p0 = node(a, h0);
      const p1 = node(b, h1);
      const control = p0.clone().add(p1).multiplyScalar(0.5 * 0.55).setY((h0 + h1) / 2 + 0.1);
      const curve = new THREE.QuadraticBezierCurve3(p0, control, p1);
      for (let s = 0; s < 10; s++) {
        curve.getPoint(s / 10, tmp);
        pts.push(tmp.x, tmp.y, tmp.z);
        curve.getPoint((s + 1) / 10, tmp);
        pts.push(tmp.x, tmp.y, tmp.z);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const ring: number[] = [];
    for (let i = 0; i < n; i++) {
      for (let h = 0; h <= 3.6; h += 0.6) {
        const v = node(i, h);
        ring.push(v.x, v.y, v.z);
      }
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ring, 3));
    return { lines: lineGeo, nodes: nodeGeo };
  }, []);
  const materials = useMemo(() => {
    const c = new THREE.Color(palette.accent.blue).multiplyScalar(palette.mode === 'dark' ? 1.6 : 1);
    return {
      line: new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: palette.mode === 'dark' ? 0.7 : 0.85, toneMapped: false }),
      point: new THREE.PointsMaterial({ color: c, size: 0.16, toneMapped: false }),
    };
  }, [palette]);
  useEffect(
    () => () => {
      lines.dispose();
      nodes.dispose();
    },
    [lines, nodes],
  );
  useEffect(
    () => () => {
      materials.line.dispose();
      materials.point.dispose();
    },
    [materials],
  );
  useFrame((_, dt) => {
    if (animate && ref.current) ref.current.rotation.y += dt * 0.12;
  });
  return (
    <group ref={ref} position={[TERM.x - 4.5, 4.4, TERM.z - 0.4]} scale={1.15}>
      <lineSegments geometry={lines} material={materials.line} />
      <points geometry={nodes} material={materials.point} />
    </group>
  );
}

const APRON_LOOP = track([[-10.5, -1.45], [8.6, -1.45], [8.6, 5.35], [-10.5, 5.35]], true, 0.05);
const LAND_LOOP = track([[-11, -6.0], [8.2, -6.0], [8.2, -12.6], [-11, -12.6]], true, 0.06);

const FLEET: FleetSpec[] = [
  { kind: 'tug', track: APRON_LOOP, speed: 0.75, lane: 0.25, offset: 3, colors: ['#f2c230'], trailers: { kind: 'cart', count: 3, spacing: 0.55, colors: ['#5c636a'] } },
  { kind: 'tug', track: APRON_LOOP, speed: 0.75, lane: 0.25, offset: 26, colors: ['#f2c230'], trailers: { kind: 'cart', count: 2, spacing: 0.55, colors: ['#5c636a'] } },
  { kind: 'followme', track: APRON_LOOP, speed: 1.0, lane: 0.25, offset: 14, colors: ['#f2c230'] },
  { kind: 'bus', track: APRON_LOOP, speed: 0.6, lane: 0.25, offset: 40, colors: ['#e9ecef'], scale: 0.8 },
  { kind: 'catering', track: APRON_LOOP, speed: 0.7, lane: 0.25, offset: 33, colors: ['#f1f3f5'] },
  { kind: 'car', track: LAND_LOOP, count: 5, speed: 1.1, lane: 0.27 },
  { kind: 'taxi', track: LAND_LOOP, count: 2, speed: 1.1, lane: 0.27, offset: 9, colors: ['#f2c230'] },
  { kind: 'bus', track: LAND_LOOP, speed: 0.9, lane: 0.27, offset: 20, colors: ['#2563eb'] },
];

const WALKS = [
  // Flight crews walking from the terminal to their aircraft, and back.
  ...GATES.map((gx) => ({ track: track([[gx - 1.2, -1.3], [gx - 0.9, 0.0]], false, 0.05), count: 2, spread: 0.12, look: LOOKS.crew, speed: [0.12, 0.2] as [number, number] })),
  { track: track([[-9, -5.2], [6, -5.2]], false, 0.05), count: 10, spread: 0.25 },
  { track: track([[-1.5, -5.4], [-1.5, -8.3], [-7, -8.3]], false, 0.06), count: 4 },
  { track: track([[-1.5, -5.4], [-1.5, -8.3], [5, -8.3]], false, 0.06), count: 4 },
];

export default function AirportIsland(props: IslandProps) {
  return (
    <group>
      <Baked build={build} palette={props.palette} seed={404} />
      <CircuitJet {...props} />
      <Hologram {...props} />
      <Fleet specs={FLEET} palette={props.palette} animate={props.animate} seed={41} />
      <Walkers groups={WALKS} animate={props.animate} seed={42} />
    </group>
  );
}
