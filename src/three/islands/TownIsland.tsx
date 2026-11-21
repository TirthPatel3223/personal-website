'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { litMaterial } from '../core/materials';
import { between, mulberry32 } from '../core/math';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { crosswalk, road } from './parts/ground';
import { Fleet, Walkers, track, type FleetSpec, type WalkerGroup } from './parts/movers';
import { flowerBed, forest, roundTree, treeRow } from './parts/nature';
import { crowd, person, queueLine, randomLook } from './parts/people';
import { at, awning, block, bench, cafeTable, fountain, lamp, parkingLot, placeVehicle, postLamp, umbrella } from './parts/structures';

/* Weather Town: the weather-and-dining pipeline. Restaurants ring a town square,
   each with its own sign, awning, lit dining room and patio. A raincloud hangs over
   the west side, where the patios stand empty and people hurry under umbrellas; on
   the dry east side the patios are full and queues reach the pavement. The project
   joined restaurant reviews with weather to measure exactly this kind of shift. */

const R = 15.5;
const LOOP: Array<[number, number]> = [[-10.6, 5.6], [10.6, 5.6], [10.6, -8.6], [-10.6, -8.6]];
/** West of this line it rains. */
const RAIN_X = -0.4;

interface Restaurant {
  name: string;
  x: number;
  z: number;
  /** Facing yaw (front = local +z). */
  yaw: number;
  w: number;
  h: number;
  wall: string;
  brand: string;
  text: string;
  font?: string;
  queue?: boolean;
}

const SERIF = 'Georgia, "Times New Roman", serif';

const RESTAURANTS: Restaurant[] = [
  { name: 'PIZZA', x: -4.6, z: -5.7, yaw: 0, w: 2.8, h: 1.5, wall: '#f3e2c7', brand: '#c1121f', text: '#fff6e5', font: SERIF },
  { name: 'SUSHI', x: -1.55, z: -5.7, yaw: 0, w: 2.8, h: 1.8, wall: '#2b2d42', brand: '#1d3557', text: '#ffffff' },
  { name: 'BURGERS', x: 1.5, z: -5.7, yaw: 0, w: 2.8, h: 1.5, wall: '#e9c46a', brand: '#9c2a12', text: '#ffe9a8', queue: true },
  { name: 'CAFÉ', x: 4.55, z: -5.7, yaw: 0, w: 2.8, h: 1.9, wall: '#e8ded2', brand: '#2d6a4f', text: '#f1faee', font: SERIF },
  { name: 'NOODLES', x: -8.2, z: -1.7, yaw: Math.PI / 2, w: 2.8, h: 1.6, wall: '#f4d6cc', brand: '#d62828', text: '#ffffff' },
  { name: 'DINER', x: -8.2, z: 1.5, yaw: Math.PI / 2, w: 2.8, h: 1.3, wall: '#d7f0f5', brand: '#0077b6', text: '#ffffff' },
  { name: 'TACOS', x: 8.2, z: -1.7, yaw: -Math.PI / 2, w: 2.8, h: 1.4, wall: '#ffd6a5', brand: '#f77f00', text: '#2b2d42', queue: true },
  { name: 'BAKERY', x: 8.2, z: 1.5, yaw: -Math.PI / 2, w: 2.8, h: 1.7, wall: '#fde2e4', brand: '#9d4edd', text: '#ffffff', font: SERIF },
];

const rainy = (x: number) => x < RAIN_X;

function restaurant(k: Kit, r: Restaurant) {
  const { lit, glow, p, rng, signs } = k;
  const dark = p.mode === 'dark';
  const d = 2.2;
  block(k, { x: r.x, z: r.z, w: r.w, d, h: r.h, angle: r.yaw, wall: r.wall, floors: 2, windows: 'grid', pitch: 0.5, litChance: 0.6, skipGround: true, rooftop: 1, sides: ['front', 'left', 'right'] });
  // Shopfront: dining-room windows, a door, the awning and the sign.
  const [fx, fz] = at(r.x, r.z, r.yaw, -0.25, d / 2 + 0.015);
  (dark ? glow : lit).box(r.w * 0.62, 0.42, 0.02, { position: [fx, 0.34, fz], rotation: [0, r.yaw, 0], color: dark ? '#ffcf86' : p.glass });
  const [dx, dz] = at(r.x, r.z, r.yaw, r.w * 0.36, d / 2 + 0.015);
  lit.box(0.26, 0.5, 0.02, { position: [dx, 0.25, dz], rotation: [0, r.yaw, 0], color: '#3d2b1f' });
  const [ax, az] = at(r.x, r.z, r.yaw, 0, d / 2);
  awning(k, ax, 0.72, az, r.w - 0.1, 0.55, r.yaw, [r.brand, '#ffffff'], 8);
  const [sx, sz] = at(r.x, r.z, r.yaw, 0, d / 2 + 0.04);
  lit.box(r.w * 0.82, 0.42, 0.06, { position: [sx, 1.02, sz], rotation: [0, r.yaw, 0], color: '#1b1d24' });
  const [tx, tz] = at(r.x, r.z, r.yaw, 0, d / 2 + 0.075);
  signs.push({ text: r.name, position: [tx, 1.02, tz], rotationY: r.yaw, width: r.w * 0.78, height: 0.38, bg: r.brand, fg: r.text, font: r.font });
  // Patio: tables, chairs, umbrellas. Full on the dry side, empty in the rain.
  const wet = rainy(r.x);
  for (let i = 0; i < 3; i++) {
    const [px, pz] = at(r.x, r.z, r.yaw, -r.w / 2 + 0.55 + i * ((r.w - 1.1) / 2), d / 2 + 1.15);
    cafeTable(k, px, pz, 4, wet ? 0 : 2 + Math.floor(rng() * 3), '#4a3a2c');
    if (!wet) umbrella(k, px, pz, i % 2 ? r.brand : '#f1f1ee', 0.36, 0.6);
    else lit.cylinder(0.03, 0.03, 0.62, 5, { position: [px, 0.31, pz], color: i % 2 ? r.brand : '#d9d9d9' });
  }
  // Planters marking the patio.
  for (const u of [-r.w / 2 + 0.1, r.w / 2 - 0.1]) {
    const [px, pz] = at(r.x, r.z, r.yaw, u, d / 2 + 1.75);
    lit.box(0.2, 0.18, 0.2, { position: [px, 0.09, pz], color: '#6b4f3a' });
    lit.ico(0.15, 0, { position: [px, 0.26, pz], color: p.foliage });
  }
  if (r.queue) {
    const pts: Array<[number, number]> = [at(r.x, r.z, r.yaw, r.w * 0.36, d / 2 + 0.25), at(r.x, r.z, r.yaw, r.w * 0.36 + 0.05, d / 2 + 2.5), at(r.x, r.z, r.yaw, r.w * 0.36 - 0.4, d / 2 + 3.2)];
    queueLine(lit, rng, pts, 0.24, 0.05, 0.95);
  }
}

function build(k: Kit) {
  const { lit, p, rng, signs } = k;
  base(k, 71, R, 9);
  rimGlow(k, R, p.accent.sky);
  const dark = p.mode === 'dark';

  // Streets, the square and the crossings.
  road(k, LOOP, 1.2, { closed: true, sidewalk: 0.35 });
  road(k, [[0, 5.6], [0, 15.2]], 1.2, { sidewalk: 0.3 });
  lit.box(13.6, 0.05, 8.6, { position: [0, 0.025, -0.4], color: p.path });
  for (let x = -6; x <= 6; x += 1.2) lit.box(0.03, 0.006, 8.5, { position: [x, 0.052, -0.4], color: dark ? '#6f7480' : '#d8d1c3' });
  crosswalk(k, -6.5, 5.6, 0, 1.2);
  crosswalk(k, 6.5, 5.6, 0, 1.2);
  crosswalk(k, -10.6, -0.4, Math.PI / 2, 1.2);
  crosswalk(k, 10.6, -0.4, Math.PI / 2, 1.2);
  fountain(k, 0, 0.6, 1.0);
  for (const [x, z] of [[-2.6, 2.4], [2.6, 2.4], [-2.6, -1.6], [2.6, -1.6]] as const) roundTree(lit, rng, p, x, z, 0.75);
  for (const [x, z, a] of [[-1.5, 3.1, Math.PI], [1.5, 3.1, Math.PI]] as const) bench(k, x, z, a, 2);

  for (const r of RESTAURANTS) restaurant(k, r);

  // Corner buildings to close the square, and taller blocks behind for a skyline.
  for (const [x, z, w, d, h, a, c] of [
    [-8.2, -5.6, 2.6, 2.6, 2.4, 0, '#cbd5e1'],
    [8.2, -5.6, 2.6, 2.6, 2.8, 0, '#d6ccc2'],
    [-6.4, -11.0, 3.4, 2.4, 3.6, 0, '#b8c0cc'],
    [-2.2, -11.6, 3.6, 2.4, 4.4, 0, '#c9c2b8'],
    [2.2, -11.6, 3.6, 2.4, 3.2, 0, '#bfc8d3'],
    [6.4, -11.0, 3.4, 2.4, 4.0, 0, '#d0c4bc'],
  ] as const) {
    block(k, { x, z, w, d, h, angle: a, wall: c, floors: Math.round(h / 0.6), windows: 'grid', pitch: 0.4, litChance: 0.55, rooftop: 2 });
  }

  // The wet side: puddles and people under umbrellas. The dry side: crowds.
  const puddle = dark ? '#2a4a66' : '#9cc8e8';
  for (let i = 0; i < 12; i++) {
    const x = between(rng, -6, RAIN_X - 0.4);
    const z = between(rng, -3.6, 3.6);
    lit.cylinder(between(rng, 0.15, 0.35), between(rng, 0.15, 0.35), 0.01, 10, { position: [x, 0.056, z], scale: [1.4, 1, 1], color: puddle });
  }
  for (let i = 0; i < 9; i++) {
    const x = between(rng, -6.2, RAIN_X - 0.6);
    const z = between(rng, -3.4, 4.6);
    if (Math.hypot(x, z - 0.6) < 1.4) continue;
    const yaw = rng() * Math.PI * 2;
    person(lit, x, 0.05, z, yaw, randomLook(rng));
    umbrella(k, x, z, ['#264653', '#1d3557', '#2b2d42', '#e63946'][i % 4], 0.22, 0.42, 0.05);
  }
  crowd(lit, rng, 3.4, 1.0, 1.4, 10, 0.05);
  crowd(lit, rng, 4.8, 4.4, 0.8, 6, 0.05);

  // Street life: parked cars, a bus stop, food trucks, lamps, trees.
  for (const x of [-8.6, -7.6, -3.8, 3.8, 7.6, 8.6]) placeVehicle(k, 'car', x, 6.45, x < 0 ? 0 : Math.PI, undefined, 0.06);
  for (const [x, label, color] of [[-4.6, 'COFFEE', '#6b4f3a'], [4.6, 'ICE CREAM', '#ff5d8f']] as const) {
    placeVehicle(k, 'van', x, 7.0, 0, color, 0.05, 1.3);
    signs.push({ text: label, position: [x - 0.05, 0.92, 7.3], width: 1.1, height: 0.22, bg: '#fff6e5', fg: color });
    crowd(lit, rng, x, 7.9, 0.5, 3, 0.04, Math.PI);
  }
  parkingLot(k, -6.8, 11.2, 8, 2, 0, 0.85);
  // A food market on the green in front: two rows of stalls, shoppers, picnic tables.
  lit.box(8.2, 0.04, 5.0, { position: [5.6, 0.02, 10.6], color: p.path });
  const canopies = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#457b9d', '#ef476f', '#8ac926', '#ff7b00'];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 4; i++) {
      const x = 2.6 + i * 2.0;
      const z = 9.2 + row * 2.6;
      for (const [dx, dz] of [[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]] as const) {
        lit.box(0.04, 0.75, 0.04, { position: [x + dx, 0.375, z + dz], color: '#d9d9d9' });
      }
      lit.taperBox(1.6, 0.3, 1.1, 0.15, 0.9, { position: [x, 0.9, z], color: canopies[(row * 4 + i) % canopies.length] });
      lit.box(1.4, 0.32, 0.4, { position: [x, 0.16, z - 0.3], color: p.wood });
      for (let g = 0; g < 4; g++) {
        lit.box(0.22, 0.08, 0.22, { position: [x - 0.48 + g * 0.32, 0.36, z - 0.3], color: ['#ffd166', '#ef476f', '#06d6a0', '#f77f00'][g] });
      }
      person(lit, x, 0.04, z + 0.05, Math.PI, randomLook(rng));
      crowd(lit, rng, x, z - 0.95, 0.45, 2, 0.04, 0);
    }
  }
  signs.push({ text: 'FOOD MARKET', position: [5.6, 1.35, 8.05], width: 2.6, height: 0.42, bg: '#264653', fg: '#ffd166' });
  for (const x of [4.4, 6.8]) lit.box(0.06, 1.35, 0.06, { position: [x, 0.67, 8.05], color: '#3d4350' });
  for (const [tx, tz] of [[3.4, 13.2], [5.6, 13.4], [7.8, 13.0]] as const) cafeTable(k, tx, tz, 4, 3, '#6b4f3a');
  flowerBed(lit, rng, p, -1.6, 13.4, 1.6, 0.5, 0.2);
  for (let x = -9.2; x <= 9.2; x += 3.07) lamp(k, x, 5.0, 1.05, -Math.PI / 2);
  for (const z of [-6.6, -3.2, 0.2, 3.6]) {
    lamp(k, -10.0, z, 1.05, Math.PI);
    lamp(k, 10.0, z, 1.05, 0);
  }
  for (const [x, z] of [[-5.6, 3.6], [5.6, 3.6], [-5.6, -3.6], [5.6, -3.6]] as const) postLamp(k, x, z, 0.8, p.accent.sky);
  treeRow(lit, rng, p, -11.6, -7.2, -11.6, 4.4, 5, 'round', 0.75);
  treeRow(lit, rng, p, 11.6, -7.2, 11.6, 4.4, 5, 'round', 0.75);
  forest(lit, rng, p, 40, 12.3, 15.1, [
    [0, 13, 1.8],
    [-6.8, 11.2, 3.4],
    [-6.4, -11.0, 2.4],
    [6.4, -11.0, 2.4],
  ]);
  forest(lit, rng, p, 8, 6.5, 12.2, [
    [0, -0.4, 11.6],
    [-6.8, 11.2, 3.6],
    [0, 8, 1.6],
    [5.6, 10.6, 5.0],
    [-4.6, 7.0, 1.4],
    [4.6, 7.0, 1.4],
    [-2.2, -11.6, 7.5],
  ]);
  signs.push({ text: 'TOWN SQUARE', position: [0, 0.07, 3.85], tilt: -Math.PI / 2, width: 2.6, height: 0.42, bg: 'transparent', fg: dark ? '#8b93a1' : '#a49b8b', lit: false, font: SERIF });
}

function RainCloud({ palette, animate }: IslandProps) {
  const DROPS = 260;
  const rain = useRef<THREE.InstancedMesh>(null);
  const cloud = useRef<THREE.Group>(null);
  const cloudGeo = useMemo(() => {
    const rng = mulberry32(13);
    const b = new MeshBuilder();
    const tone = palette.mode === 'dark' ? '#4a566b' : '#aeb9c8';
    for (let i = 0; i < 14; i++) {
      b.ico(between(rng, 1.0, 1.7), 1, {
        position: [between(rng, -3.2, 3.2), between(rng, -0.3, 0.5), between(rng, -2.2, 2.2)],
        scale: [1.35, 0.8, 1],
        color: tone,
      });
    }
    return b.build();
  }, [palette]);
  const dropGeo = useMemo(() => new THREE.BoxGeometry(0.025, 0.4, 0.025), []);
  const dropMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.mode === 'dark' ? '#9cc3e6' : '#5b8fc2').multiplyScalar(palette.mode === 'dark' ? 1.3 : 1),
        transparent: true,
        opacity: 0.75,
        toneMapped: false,
      }),
    [palette],
  );
  useEffect(
    () => () => {
      cloudGeo.dispose();
      dropGeo.dispose();
    },
    [cloudGeo, dropGeo],
  );
  useEffect(() => () => dropMat.dispose(), [dropMat]);
  const sim = useRef<{ x: Float32Array; y: Float32Array; z: Float32Array; m: THREE.Matrix4 } | null>(null);
  const t = useRef(0);
  const HEIGHT = 6.8;
  useFrame((_, dt) => {
    if (!sim.current) {
      const rng = mulberry32(31);
      const x = new Float32Array(DROPS);
      const y = new Float32Array(DROPS);
      const z = new Float32Array(DROPS);
      for (let i = 0; i < DROPS; i++) {
        x[i] = between(rng, -3.4, 3.4);
        z[i] = between(rng, -2.6, 2.6);
        y[i] = rng() * HEIGHT;
      }
      sim.current = { x, y, z, m: new THREE.Matrix4() };
    }
    const s = sim.current;
    const step = Math.min(dt, 0.1);
    if (animate) t.current += step;
    const mesh = rain.current;
    if (!mesh) return;
    for (let i = 0; i < DROPS; i++) {
      if (animate) {
        s.y[i] -= step * 8;
        if (s.y[i] < 0) s.y[i] += HEIGHT;
      }
      s.m.makeTranslation(s.x[i], s.y[i] - HEIGHT - 0.2, s.z[i]);
      mesh.setMatrixAt(i, s.m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (cloud.current) cloud.current.position.x = -4.0 + Math.sin(t.current * 0.25) * 0.35;
  });
  return (
    <group ref={cloud} position={[-4.0, 7.2, -0.6]}>
      <mesh geometry={cloudGeo} material={litMaterial()} />
      <instancedMesh ref={rain} args={[dropGeo, dropMat, DROPS]} frustumCulled={false} />
    </group>
  );
}

const ROAD_LOOP = track(LOOP, true, 0.06);
const SOUTH = track([[0, 15.0], [0, 5.6]], false, 0.06);
const FLEET: FleetSpec[] = [
  { kind: 'car', track: ROAD_LOOP, count: 6, speed: 0.95, lane: 0.3 },
  { kind: 'taxi', track: ROAD_LOOP, count: 2, speed: 0.95, lane: 0.3, offset: 5, colors: ['#f2c230'] },
  { kind: 'bus', track: ROAD_LOOP, speed: 0.75, lane: 0.3, offset: 21, colors: ['#1f77b4'], scale: 0.9 },
  { kind: 'van', track: ROAD_LOOP, speed: 0.85, lane: 0.3, offset: 33, colors: ['#ffffff'] },
  { kind: 'car', track: SOUTH, count: 2, speed: 0.8, lane: 0.3 },
];
const WALKS: WalkerGroup[] = [
  { track: track([[-10.0, 4.9], [10.0, 4.9]], false, 0.05), count: 12, spread: 0.12 },
  { track: track([[-10.0, -7.9], [10.0, -7.9]], false, 0.05), count: 6, spread: 0.12 },
  { track: track([[-9.9, -7.9], [-9.9, 4.9]], false, 0.05), count: 4, spread: 0.1 },
  { track: track([[9.9, -7.9], [9.9, 4.9]], false, 0.05), count: 5, spread: 0.1 },
  { track: track([[1.0, 4.2], [5.6, -3.4]], false, 0.05), count: 6, spread: 0.3 },
  { track: track([[0.6, 14.6], [0.6, 6.4]], false, 0.05), count: 5, spread: 0.1 },
];

export default function TownIsland(props: IslandProps) {
  return (
    <group>
      <Baked build={build} palette={props.palette} seed={707} />
      <RainCloud {...props} />
      <Fleet specs={FLEET} palette={props.palette} animate={props.animate} seed={71} />
      <Walkers groups={WALKS} animate={props.animate} seed={72} />
    </group>
  );
}

