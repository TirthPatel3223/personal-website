'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { MALTESE_STAGES } from '@/data/malteseStages';
import { glowMaterial, litMaterial } from '../core/materials';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { footpath } from './parts/ground';
import { Walkers, track } from './parts/movers';
import { flowerBed, forest, roundTree, bush } from './parts/nature';
import { LOOKS, crowd, person, randomLook } from './parts/people';
import { at, bench, block, faceYaw, parkingLot, placeVehicle, postLamp } from './parts/structures';
import MalteseCube, { makeMotion } from './workshop/MalteseCube';
import RobotArm from './workshop/RobotArm';

/* Puzzle Workshop: the Maltese Gear Cube solver and the Puzzle Lab. On a stage in
   the middle, two robot arms turn the real Maltese Gear Cube (the simulator's own
   geometry) through a scramble and back. Behind it stands the lab, with a conveyor
   carrying puzzles out to the stage; to the left a compute cluster, to the right a
   gallery of the simulator's other five puzzles, and a screen showing the solver's
   average moves per stage. */

const R = 15;
const STAGE: [number, number] = [0, 0.6];
const STAGE_R = 3.7;
const STAGE_TOP = 0.45;
const CUBE = { center: [STAGE[0], STAGE_TOP + 2.8, STAGE[1]] as [number, number, number], size: 1.25, yaw: -0.5 };
const ARM_REACH = 3.3;
const SHOULDER_Y = STAGE_TOP + 1.95;
const nR: [number, number] = [Math.cos(CUBE.yaw), -Math.sin(CUBE.yaw)];
const ARM_R: [number, number, number] = [STAGE[0] + nR[0] * ARM_REACH, SHOULDER_Y, STAGE[1] + nR[1] * ARM_REACH];
const ARM_L: [number, number, number] = [STAGE[0] - nR[0] * ARM_REACH, SHOULDER_Y, STAGE[1] - nR[1] * ARM_REACH];
const LAB: [number, number] = [0, -9.2];
const GALLERY: Array<[number, number]> = [
  [5.9, -4.3],
  [7.9, -3.4],
  [9.4, -1.8],
  [10.2, 0.2],
  [10.1, 2.3],
];
const CLUSTER: [number, number] = [-9.6, -2.2];
const SCREEN: [number, number] = [-7.2, 4.6];

/** The simulator's other five puzzles, as small stickered models. */
function puzzleModel(b: MeshBuilder, i: number, x: number, y: number, z: number) {
  const ink = '#16181d';
  const sticker = (face: [number, number, number], color: string, s: number, cx: number, cy: number, cz: number, size = 0.8) => {
    const [fx, fy, fz] = face;
    const d = s / 2 + 0.005;
    b.box(fx ? 0.01 : s * size, fy ? 0.01 : s * size, fz ? 0.01 : s * size, {
      position: [cx + fx * d, cy + fy * d, cz + fz * d],
      color,
    });
  };
  const cube = (cx: number, cy: number, cz: number, s: number, rot: [number, number, number] = [0, 0, 0], colors = ['#f5f5f2', '#11a94f', '#d0142c']) => {
    const sub = new MeshBuilder();
    sub.box(s, s, s, { color: ink });
    sticker([0, 1, 0], colors[0], s, 0, 0, 0);
    sticker([0, 0, 1], colors[1], s, 0, 0, 0);
    sticker([1, 0, 0], colors[2], s, 0, 0, 0);
    sticker([-1, 0, 0], '#ffd21f', s, 0, 0, 0);
    sticker([0, 0, -1], '#1557d6', s, 0, 0, 0);
    b.stamp(sub, { position: [cx, cy, cz], rotation: rot });
  };
  switch (i) {
    case 0: {
      // Tangram Cube: a cube cut along a body diagonal, one half turned.
      cube(x, y, z, 0.5, [0, 0.35, 0]);
      const t = new MeshBuilder();
      t.cone(0.3, 0.32, 3, { color: '#f77f00' });
      b.stamp(t, { position: [x + 0.12, y + 0.3, z + 0.12], rotation: [0.6, 0.3, 0.3] });
      break;
    }
    case 1: {
      // Tangram Cube Extreme: mid shape-shift, a corner layer standing proud.
      cube(x, y - 0.04, z, 0.5, [0, 0.2, 0]);
      cube(x + 0.1, y + 0.24, z + 0.05, 0.3, [0.5, 0.9, 0.2], ['#ffd21f', '#d0142c', '#1557d6']);
      break;
    }
    case 2:
    case 3: {
      // Curvy Copter (and Plus): curved cuts as rings across each face.
      cube(x, y, z, 0.5, [0, 0.5, 0], ['#f8f9fa', '#f77f00', '#2b9348']);
      for (const r of [[Math.PI / 2, 0, 0], [0, 0, Math.PI / 2], [0, Math.PI / 2, 0]] as const) {
        b.torus(0.25, 0.018, 4, 18, { position: [x, y, z], rotation: [r[0], r[1] + 0.5, r[2]], color: ink });
      }
      if (i === 3) b.ico(0.08, 0, { position: [x, y + 0.27, z], color: '#ffd21f' });
      break;
    }
    case 4: {
      // David's Gear Cube: a 2x2x2 with gear rings.
      for (const dx of [-0.13, 0.13])
        for (const dy of [-0.13, 0.13])
          for (const dz of [-0.13, 0.13]) b.box(0.25, 0.25, 0.25, { position: [x + dx, y + dy, z + dz], color: (dx > 0) === (dz > 0) ? '#1557d6' : '#f5f5f2' });
      b.torus(0.31, 0.03, 4, 24, { position: [x, y, z], rotation: [Math.PI / 2, 0, 0], color: '#c9a227' });
      b.torus(0.31, 0.03, 4, 24, { position: [x, y, z], color: '#c9a227' });
      break;
    }
  }
}

function build(k: Kit) {
  const { lit, glow, glass, p, rng, signs } = k;
  base(k, 11, R, 9);
  rimGlow(k, R, p.accent.teal);
  const teal = p.accent.teal;
  const dark = p.mode === 'dark';

  // Plaza and paths.
  lit.cylinder(5.4, 5.4, 0.04, 48, { position: [STAGE[0], 0.02, STAGE[1]], color: p.path });
  footpath(k, [[0, 5.6], [0, 14.2]], 1.6);
  footpath(k, [[0, -4.6], [0, -7.1]], 1.4);
  footpath(k, [[4.6, -1.8], [6.9, -2.6], [9.0, -0.6], [9.3, 2.6], [8.6, 4.6]], 1.0);
  footpath(k, [[-4.9, -0.8], [-7.3, -1.6]], 1.0);
  footpath(k, [[-3.6, 3.8], [-6.2, 6.4], [-7.6, 8.4]], 1.0);

  // The stage: a raised disc with an inner deck, neon rings and a maglev pedestal.
  lit.cylinder(STAGE_R, STAGE_R + 0.15, STAGE_TOP, 48, { position: [STAGE[0], STAGE_TOP / 2, STAGE[1]], color: p.concrete });
  lit.cylinder(STAGE_R - 0.35, STAGE_R - 0.35, 0.03, 48, { position: [STAGE[0], STAGE_TOP + 0.015, STAGE[1]], color: dark ? '#1b2330' : '#e3e8ee' });
  glow.torus(STAGE_R + 0.02, 0.04, 4, 72, { position: [STAGE[0], STAGE_TOP, STAGE[1]], rotation: [Math.PI / 2, 0, 0], color: teal });
  glow.torus(STAGE_R - 0.4, 0.02, 4, 72, { position: [STAGE[0], STAGE_TOP + 0.035, STAGE[1]], rotation: [Math.PI / 2, 0, 0], color: teal });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    const dx = Math.cos(a) * (STAGE_R - 0.45);
    const dz = Math.sin(a) * (STAGE_R - 0.45);
    glow.beam([STAGE[0] - dx, STAGE_TOP + 0.035, STAGE[1] - dz], [STAGE[0] + dx, STAGE_TOP + 0.035, STAGE[1] + dz], 0.015, 0.01, { color: teal });
  }
  lit.cylinder(0.55, 0.75, 0.9, 20, { position: [STAGE[0], STAGE_TOP + 0.45, STAGE[1]], color: dark ? '#2a313c' : '#cfd6df' });
  glow.torus(0.6, 0.035, 4, 32, { position: [STAGE[0], STAGE_TOP + 0.92, STAGE[1]], rotation: [Math.PI / 2, 0, 0], color: teal });
  // Arm pedestals.
  for (const a of [ARM_R, ARM_L]) {
    lit.cylinder(0.42, 0.55, SHOULDER_Y - 0.68 - STAGE_TOP, 16, { position: [a[0], STAGE_TOP + (SHOULDER_Y - 0.68 - STAGE_TOP) / 2, a[2]], color: dark ? '#3a424f' : '#aeb7c4' });
    glow.torus(0.5, 0.025, 4, 28, { position: [a[0], STAGE_TOP + 0.1, a[2]], rotation: [Math.PI / 2, 0, 0], color: teal });
  }
  // Steps up to the stage at the front.
  for (let i = 0; i < 3; i++) {
    lit.box(1.6, 0.15 * (i + 1), 0.3, { position: [STAGE[0], 0.075 * (i + 1), STAGE[1] + STAGE_R + 0.85 - i * 0.3], color: p.concrete });
  }

  // Researchers and visitors watching the robots.
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (0.15 + rng() * 0.7) + (i % 2 ? 0 : Math.PI * 0.95);
    const r = STAGE_R + 0.7 + rng() * 1.1;
    const x = STAGE[0] + Math.cos(a) * r;
    const z = STAGE[1] + Math.sin(a) * r;
    person(lit, x, 0.04, z, faceYaw(STAGE[0] - x, STAGE[1] - z) + (rng() - 0.5) * 0.4, i % 3 === 0 ? LOOKS.lab(rng) : randomLook(rng));
  }
  crowd(lit, rng, 1.8, 5.4, 0.8, 5, 0.04, Math.PI);
  person(lit, -1.5, STAGE_TOP, -2.2, faceYaw(1.5, 2.8), LOOKS.lab(rng));
  person(lit, 1.3, STAGE_TOP, -2.4, faceYaw(-1.3, 3), LOOKS.lab(rng));
  // A console on the stage.
  lit.box(0.9, 0.38, 0.4, { position: [-1.6, STAGE_TOP + 0.19, -1.6], rotation: [0, 0.6, 0], color: dark ? '#262c36' : '#c6ced8' });
  glow.box(0.75, 0.32, 0.02, { position: [-1.5, STAGE_TOP + 0.5, -1.45], rotation: [-0.5, 0.6, 0], color: teal });

  // The lab: three storeys, glass front, a canopy over the door, solar on the roof.
  block(k, { x: LAB[0], z: LAB[1], w: 11, d: 3.8, h: 2.7, wall: dark ? '#cfd6df' : '#eef1f5', floors: 3, windows: 'band', litChance: 0.4, rooftop: 0, skipGround: false });
  lit.box(3.2, 0.08, 1.1, { position: [LAB[0], 0.95, LAB[1] + 2.4], color: dark ? '#46505f' : '#9aa6b5' });
  for (const x of [-1.5, 1.5]) lit.box(0.06, 0.95, 0.06, { position: [LAB[0] + x, 0.475, LAB[1] + 2.9], color: '#5b6270' });
  glow.box(1.4, 0.75, 0.02, { position: [LAB[0], 0.42, LAB[1] + 1.92], color: dark ? '#9be9dc' : '#cdeee9' });
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      lit.box(1.9, 0.04, 1.1, { position: [LAB[0] - 3.6 + i * 2.4, 2.98 + j * 0.02, LAB[1] - 0.6 + j * 1.3], rotation: [-0.3, 0, 0], color: '#1f3b6b' });
    }
  }
  lit.box(5.6, 0.08, 0.1, { position: [LAB[0], 3.0, LAB[1] + 1.93], color: '#3d4350' });
  for (const x of [-2.3, 2.3]) lit.box(0.06, 0.4, 0.06, { position: [LAB[0] + x, 2.88, LAB[1] + 1.93], color: '#3d4350' });
  signs.push({ text: 'PUZZLE WORKSHOP', position: [LAB[0], 3.38, LAB[1] + 1.99], width: 5.4, height: 0.62, bg: '#0d1620', fg: teal });
  flowerBed(lit, rng, p, -3.4, -6.7, 2.6, 0.5);
  flowerBed(lit, rng, p, 3.4, -6.7, 2.6, 0.5);
  placeVehicle(k, 'van', 6.2, -7.0, Math.PI, '#e9ecef', 0);
  person(lit, 5.5, 0.04, -6.5, faceYaw(0.4, -0.3), LOOKS.vest(rng));

  // The compute cluster: an open pavilion of racks with blinking lights.
  {
    const [cx, cz] = CLUSTER;
    const ang = 0.12;
    lit.box(4.3, 0.12, 5.8, { position: [cx, 0.06, cz], rotation: [0, ang, 0], color: p.concrete });
    for (const [u, v] of [[-2, -2.7], [2, -2.7], [-2, 2.7], [2, 2.7]] as const) {
      const [x, z] = at(cx, cz, ang, u, v);
      lit.box(0.12, 2.1, 0.12, { position: [x, 1.1, z], color: '#5b6270' });
    }
    lit.box(4.6, 0.12, 6.1, { position: [cx, 2.2, cz], rotation: [0, ang, 0], color: dark ? '#3a424f' : '#8f9aa8' });
    glow.box(4.62, 0.05, 6.12, { position: [cx, 2.13, cz], rotation: [0, ang, 0], color: teal });
    for (const u of [-1.0, 0.9]) {
      for (let r = 0; r < 6; r++) {
        const v = -2.2 + r * 0.88;
        const [x, z] = at(cx, cz, ang, u, v);
        lit.box(0.62, 1.55, 0.7, { position: [x, 0.9, z], rotation: [0, ang, 0], color: '#15191f' });
        for (let l = 0; l < 6; l++) {
          const [lx, lz] = at(cx, cz, ang, u + (u > 0 ? -0.32 : 0.32), v + (rng() - 0.5) * 0.4);
          glow.box(0.02, 0.03, 0.12, { position: [lx, 0.35 + l * 0.2, lz], rotation: [0, ang, 0], color: rng() < 0.7 ? '#37e6b0' : '#5aa8ff' });
        }
      }
    }
    person(lit, cx + 0.1, 0.12, cz + 1.6, faceYaw(-1, 0), LOOKS.lab(rng));
    person(lit, cx, 0.12, cz - 1.2, faceYaw(1, 0.2), randomLook(rng));
    signs.push({ text: 'COMPUTE', position: [cx + 0.5, 2.45, cz + 3.0], rotationY: ang, width: 1.8, height: 0.4, bg: '#0d1620', fg: teal });
  }

  // The puzzle gallery: five glass cases and their visitors.
  GALLERY.forEach(([x, z], i) => {
    lit.box(0.85, 0.95, 0.85, { position: [x, 0.475, z], rotation: [0, 0.3 * i, 0], color: dark ? '#d5dbe3' : '#f4f6f8' });
    glow.box(0.87, 0.04, 0.87, { position: [x, 0.97, z], rotation: [0, 0.3 * i, 0], color: teal });
    glass.box(0.78, 0.8, 0.78, { position: [x, 1.4, z], rotation: [0, 0.3 * i, 0], color: dark ? '#9fd7e6' : '#d6f1f8' });
    puzzleModel(lit, i, x, 1.3, z);
    const vx = x - 0.75;
    const vz = z + 0.55;
    if (i % 2 === 0) person(lit, vx, 0.04, vz, faceYaw(x - vx, z - vz), randomLook(rng));
  });
  crowd(lit, rng, 8.0, -0.8, 0.9, 4, 0.04);
  signs.push({ text: 'PUZZLE LAB', position: [8.4, 1.25, 4.3], rotationY: 0.25, width: 2.0, height: 0.5, bg: teal, fg: '#06201d' });
  lit.box(2.1, 0.6, 0.12, { position: [8.4, 1.25, 4.23], rotation: [0, 0.25, 0], color: '#2b313b' });
  for (const dx of [-0.8, 0.8]) {
    const [x, z] = at(8.4, 4.23, 0.25, dx, 0);
    lit.box(0.08, 0.95, 0.08, { position: [x, 0.47, z], color: '#2b313b' });
  }

  // The results screen: average moves per solver stage (table stages teal, network stages violet).
  {
    const [sx, sz] = SCREEN;
    const yaw = 0.42;
    for (const dx of [-1.4, 1.4]) {
      const [x, z] = at(sx, sz, yaw, dx, -0.08);
      lit.box(0.12, 2.0, 0.12, { position: [x, 1.0, z], color: '#2b313b' });
    }
    lit.box(3.5, 2.0, 0.12, { position: [sx, 2.0, sz], rotation: [0, yaw, 0], color: '#151a21' });
    const [fx, fz] = at(sx, sz, yaw, 0, 0.07);
    const max = Math.max(...MALTESE_STAGES.map((s) => s.moves));
    signs.push({
      text: '',
      position: [fx, 2.0, fz],
      rotationY: yaw,
      width: 3.3,
      height: 1.8,
      bg: '#0b1118',
      fg: '#e6fffb',
      draw: (ctx, w, h) => {
        ctx.fillStyle = '#e6fffb';
        ctx.font = `800 ${h * 0.11}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('AVERAGE MOVES PER STAGE', w * 0.06, h * 0.07);
        const n = MALTESE_STAGES.length;
        const bw = (w * 0.86) / n;
        MALTESE_STAGES.forEach((s, j) => {
          const bh = (s.moves / max) * h * 0.6;
          const x0 = w * 0.07 + j * bw;
          ctx.fillStyle = s.method === 'table' ? '#2dd4bf' : '#a78bfa';
          ctx.fillRect(x0 + bw * 0.12, h * 0.9 - bh, bw * 0.76, bh);
          ctx.fillStyle = '#e6fffb';
          ctx.font = `700 ${h * 0.08}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(String(s.moves), x0 + bw / 2, h * 0.9 - bh - h * 0.1);
        });
      },
    });
  }

  // Parking, benches, lamps, gardens and trees.
  parkingLot(k, -8.3, 9.4, 6, 1, 0.45, 0.8);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const x = STAGE[0] + Math.cos(a) * 5.15;
    const z = STAGE[1] + Math.sin(a) * 5.15;
    if (Math.abs(x) < 1.2 && z > 0) continue;
    postLamp(k, x, z, 0.9, teal);
  }
  for (const [x, z, a, s] of [
    [-2.6, 7.6, Math.PI / 2, 2],
    [2.6, 7.6, -Math.PI / 2, 1],
    [-2.6, 10.6, Math.PI / 2, 0],
    [2.6, 10.6, -Math.PI / 2, 2],
  ] as const) {
    bench(k, x, z, a, s);
  }
  for (let z = 6.6; z < 13.5; z += 1.7) {
    roundTree(lit, rng, p, -1.6, z, 0.75);
    roundTree(lit, rng, p, 1.6, z, 0.75);
  }
  for (let i = 0; i < 16; i++) bush(lit, rng, p, -4.2 + rng() * 8.4, -5.6 - rng() * 0.6, 0.8);
  forest(lit, rng, p, 46, 11.3, 14.3, [
    [0, 13, 1.6],
    [-8.3, 9.4, 2.6],
    [8.4, 4.3, 1.6],
    [-7.6, 8.6, 1.2],
  ]);
  forest(lit, rng, p, 10, 6.5, 11, [
    [LAB[0], LAB[1], 6.5],
    [CLUSTER[0], CLUSTER[1], 3.8],
    [SCREEN[0], SCREEN[1], 2.4],
    [8.5, -0.8, 3.6],
    [0, 8, 2.4],
    [0, 0.6, 6],
    [-8.3, 9.4, 2.8],
    [-6.2, 6.4, 1.0],
  ]);
}

/** Puzzles riding the conveyor from the lab to the stage. */
function Conveyor({ palette, animate }: IslandProps) {
  const from = useMemo(() => new THREE.Vector3(2.4, 0.42, -7.0), []);
  const to = useMemo(() => new THREE.Vector3(1.9, 0.42, -3.3), []);
  const belt = useMemo(() => {
    const b = new MeshBuilder();
    const g = new MeshBuilder(palette.glow);
    b.beam([from.x, 0.3, from.z], [to.x, 0.3, to.z], 0.6, 0.16, { color: '#2b313b' });
    for (const s of [-1, 1]) {
      g.beam([from.x + s * 0.31, 0.38, from.z], [to.x + s * 0.31, 0.38, to.z], 0.02, 0.02, { color: palette.accent.teal });
    }
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      b.box(0.5, 0.25, 0.06, { position: [from.x + (to.x - from.x) * t, 0.11, from.z + (to.z - from.z) * t], color: '#5b6270' });
    }
    return { lit: b.build(), glow: g.build() };
  }, [palette, from, to]);
  const box = useMemo(() => {
    const b = new MeshBuilder();
    b.box(0.3, 0.3, 0.3, { color: '#16181d' });
    const st: Array<[[number, number, number], [number, number, number], string]> = [
      [[0, 0.152, 0], [0.24, 0.01, 0.24], '#f5f5f2'],
      [[0, 0, 0.152], [0.24, 0.24, 0.01], '#11a94f'],
      [[0.152, 0, 0], [0.01, 0.24, 0.24], '#8b3ec2'],
      [[-0.152, 0, 0], [0.01, 0.24, 0.24], '#d0142c'],
      [[0, 0, -0.152], [0.24, 0.24, 0.01], '#1557d6'],
    ];
    for (const [pos, size, c] of st) b.box(size[0], size[1], size[2], { position: pos, color: c });
    return b.build();
  }, []);
  useEffect(
    () => () => {
      belt.lit.dispose();
      belt.glow.dispose();
      box.dispose();
    },
    [belt, box],
  );
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t.current * 0.12 + i / 4) % 1;
      m.position.lerpVectors(from, to, u);
      m.position.y = 0.55;
      m.rotation.y = i * 0.7;
      m.scale.setScalar(Math.min(1, u * 12, (1 - u) * 12));
    });
  });
  return (
    <group>
      <mesh geometry={belt.lit} material={litMaterial()} />
      <mesh geometry={belt.glow} material={glowMaterial()} />
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={box}
          material={litMaterial()}
        />
      ))}
    </group>
  );
}

const WALKS = [
  { track: track(Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [STAGE[0] + Math.cos(a) * 4.75, STAGE[1] + Math.sin(a) * 4.75] as [number, number];
    }), true, 0.04), count: 12, spread: 0.3 },
  { track: track([[0, 13.8], [0, 5.6]], false, 0.04), count: 7, spread: 0.45 },
  { track: track([[4.6, -1.8], [6.9, -2.6], [9.0, -0.6], [9.3, 2.6], [8.6, 4.6]], false, 0.04), count: 5 },
  { track: track([[0, -4.7], [0, -6.9]], false, 0.04), count: 3, look: LOOKS.lab },
  { track: track([[-3.6, 3.8], [-6.2, 6.4], [-7.6, 8.4]], false, 0.04), count: 3 },
];

export default function WorkshopIsland(props: IslandProps) {
  const { palette, animate } = props;
  const motion = useMemo(() => makeMotion(), []);
  const ring = useRef<THREE.Mesh>(null);
  const ringGeo = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 1.2);
    g.torus(1.25, 0.03, 4, 48, { rotation: [Math.PI / 2, 0, 0], color: palette.accent.teal });
    g.torus(1.45, 0.015, 4, 48, { rotation: [Math.PI / 2, 0, 0], color: palette.accent.teal });
    return g.build();
  }, [palette]);
  useEffect(() => () => ringGeo.dispose(), [ringGeo]);
  useFrame(({ clock }) => {
    if (!animate || !ring.current) return;
    ring.current.position.y = CUBE.center[1] - 1.85 + Math.sin(clock.elapsedTime * 1.3) * 0.05;
    ring.current.rotation.y = clock.elapsedTime * 0.4;
  });
  return (
    <group>
      <Baked build={build} palette={palette} seed={101} />
      <group position={CUBE.center} rotation={[0, CUBE.yaw, 0]} scale={CUBE.size}>
        <MalteseCube animate={animate} motion={motion} glow={palette.mode === 'dark' ? 0.35 : 0.08} />
      </group>
      <mesh ref={ring} geometry={ringGeo} material={glowMaterial()} position={[CUBE.center[0], CUBE.center[1] - 1.85, CUBE.center[2]]} />
      <RobotArm palette={palette} accent={palette.accent.teal} base={ARM_R} cube={CUBE} faces={['R']} motion={motion} animate={animate} />
      <RobotArm palette={palette} accent={palette.accent.teal} base={ARM_L} cube={CUBE} faces={['L', 'U']} motion={motion} animate={animate} phase={2.1} />
      <Conveyor {...props} />
      <Walkers groups={WALKS} animate={animate} seed={11} />
    </group>
  );
}
