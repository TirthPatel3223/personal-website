'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../core/builder';
import { glassMaterial, glowMaterial } from '../core/materials';
import { mulberry32 } from '../core/math';
import type { ScenePalette } from '../core/palette';
import { AGENT_EDGES, AGENT_NODES, AGENT_QUERIES, NODE_BY_ID } from '../data/agentGraph';
import { Baked, base, rimGlow, type IslandProps, type Kit } from './kit';
import { footpath, road, smoothPath } from './parts/ground';
import { Fleet, Walkers, track, type FleetSpec, type WalkerGroup } from './parts/movers';
import { flowerBed, forest, roundTree, treeRow } from './parts/nature';
import { person, randomLook } from './parts/people';
import { at, bench, block, cafeTable, dome, faceYaw, parkingLot, postLamp, roofPrism, umbrella } from './parts/structures';

/* Campus: the Course RAG assistant, on a university campus. A lecture hall with
   a portico, a domed library, a clock tower and a student centre frame a quad. In the
   middle of the quad the assistant's real LangGraph (13 nodes plus START and END)
   floats over a plinth, with packets of light running its branches; above it a
   crystal and a point cloud stand for the ChromaDB vector store, and pages of slides
   and transcripts fly into it from the library and the lecture hall. A student asks
   the documented example question, and the answer comes back. */

const R = 15.5;
const HALL = { x: 0, z: -9.0, w: 8.4, d: 3.4, h: 2.3 };
const LIBRARY = { x: -8.6, z: -3.6, w: 4.6, d: 4.0, h: 2.0 };
const CENTER = { x: 8.6, z: -3.4, w: 4.6, d: 3.2, h: 1.6 };
const CLOCK: [number, number] = [5.6, -9.0];
const PLINTH: [number, number] = [0, -0.6];
const GRAPH = { y: 2.3, s: 0.62 };
const CRYSTAL_Y = 5.0;

export function nodeColor(p: ScenePalette, kind: string) {
  if (kind === 'gate') return p.accent.amber;
  if (kind === 'terminal') return p.white;
  if (kind === 'retriever') return p.accent.teal;
  return p.accent.indigo;
}

const gx = (x: number) => PLINTH[0] + x * GRAPH.s;
const gz = (z: number) => PLINTH[1] + z * GRAPH.s;

function build(k: Kit) {
  const { lit, glow, glass, p, rng, signs } = k;
  base(k, 61, R, 9);
  rimGlow(k, R, p.accent.indigo);
  const dark = p.mode === 'dark';
  const brick = dark ? '#7a3a2c' : '#b3553d';
  const stone = dark ? '#d8d2c4' : '#f3eee2';

  // The quad: lawn, diagonal and cross paths, a ring round the plinth.
  lit.box(11, 0.03, 10.5, { position: [0, 0.015, -0.6], color: dark ? '#2f7258' : '#86cf9f' });
  footpath(k, [[0, -6.9], [0, 14.6]], 1.4);
  footpath(k, [[-5.4, -0.6], [5.4, -0.6]], 1.2);
  footpath(k, [[-5.2, -5.6], [5.2, 4.4]], 0.8);
  footpath(k, [[5.2, -5.6], [-5.2, 4.4]], 0.8);
  footpath(k, [[-5.4, -0.6], [LIBRARY.x + LIBRARY.w / 2, LIBRARY.z + 0.4]], 1.0);
  footpath(k, [[5.4, -0.6], [CENTER.x - CENTER.w / 2, CENTER.z + 0.4]], 1.0);
  footpath(k, [[3.0, -6.9], [CLOCK[0], CLOCK[1] + 1.2]], 0.8);
  lit.cylinder(3.6, 3.6, 0.04, 40, { position: [PLINTH[0], 0.02, PLINTH[1]], color: p.path });

  // Lecture hall: brick, a white portico of columns with a pediment, steps, sign.
  block(k, { ...HALL, wall: brick, roof: dark ? '#4b5568' : '#6c7b91', floors: 3, windows: 'grid', pitch: 0.48, litChance: 0.55, rooftop: 0 });
  roofPrism(lit, HALL.x, HALL.z, HALL.h, HALL.d * 1.05, HALL.w * 1.02, 0.9, Math.PI / 2, dark ? '#4b5568' : '#6c7b91');
  const front = HALL.z + HALL.d / 2;
  for (let i = 0; i < 3; i++) lit.box(4.8, 0.1 * (i + 1), 0.3, { position: [HALL.x, 0.05 * (i + 1), front + 1.5 - i * 0.3], color: stone });
  for (let i = 0; i < 6; i++) {
    lit.cylinder(0.13, 0.15, 1.75, 10, { position: [HALL.x - 2.0 + i * 0.8, 0.95, front + 0.95], color: stone });
  }
  lit.box(4.8, 0.3, 1.3, { position: [HALL.x, 1.95, front + 0.6], color: stone });
  roofPrism(lit, HALL.x, front + 0.6, 2.1, 4.9, 1.4, 0.7, 0, stone);
  signs.push({ text: 'LECTURE HALL', position: [HALL.x, 1.95, front + 1.26], width: 3.4, height: 0.26, bg: '#3b2a20', fg: '#f5deb3', font: 'Georgia, "Times New Roman", serif' });
  glow.box(1.2, 0.8, 0.02, { position: [HALL.x, 0.5, front + 0.02], color: dark ? '#ffd9a0' : '#fff1d6' });

  // Library with a copper dome.
  block(k, { ...LIBRARY, angle: 0.35, wall: stone, roof: '#8a8f99', floors: 2, windows: 'grid', pitch: 0.5, litChance: 0.7, rooftop: 0 });
  lit.cylinder(1.05, 1.1, 0.5, 16, { position: [LIBRARY.x, LIBRARY.h + 0.25, LIBRARY.z], color: stone });
  dome(lit, LIBRARY.x, LIBRARY.h + 0.5, LIBRARY.z, 1.05, dark ? '#3f7f73' : '#5fae9e', 16);
  lit.cylinder(0.12, 0.16, 0.35, 8, { position: [LIBRARY.x, LIBRARY.h + 1.7, LIBRARY.z], color: stone });
  {
    const [sx, sz] = at(LIBRARY.x, LIBRARY.z, 0.35, 0, LIBRARY.d / 2 + 0.03);
    signs.push({ text: 'LIBRARY', position: [sx, 1.55, sz], rotationY: 0.35, width: 2.0, height: 0.32, bg: stone, fg: '#3b2a20', font: 'Georgia, "Times New Roman", serif' });
    const [dx, dz] = at(LIBRARY.x, LIBRARY.z, 0.35, 0, LIBRARY.d / 2 + 0.02);
    glow.box(0.8, 0.6, 0.02, { position: [dx, 0.35, dz], rotation: [0, 0.35, 0], color: dark ? '#ffd9a0' : '#fff1d6' });
  }

  // Student centre: glass, a terrace of tables.
  block(k, { ...CENTER, angle: -0.35, wall: dark ? '#9aa6b5' : '#dfe5ec', floors: 2, windows: 'band', pitch: 0.3, litChance: 0.75, rooftop: 2 });
  {
    const [sx, sz] = at(CENTER.x, CENTER.z, -0.35, 0, CENTER.d / 2 + 0.03);
    signs.push({ text: 'STUDENT CENTER', position: [sx, 1.4, sz], rotationY: -0.35, width: 2.6, height: 0.3, bg: '#312e81', fg: '#e0e7ff' });
    for (let i = 0; i < 4; i++) {
      const [tx, tz] = at(CENTER.x, CENTER.z, -0.35, -1.6 + i * 1.05, CENTER.d / 2 + 1.0);
      cafeTable(k, tx, tz, 4, 1 + (i % 3));
      umbrella(k, tx, tz, i % 2 ? p.accent.indigo : '#f1f1ee', 0.38, 0.62);
    }
  }

  // Clock tower.
  {
    const [cx, cz] = CLOCK;
    lit.box(1.1, 5.4, 1.1, { position: [cx, 2.7, cz], color: brick });
    lit.box(1.3, 0.2, 1.3, { position: [cx, 5.5, cz], color: stone });
    lit.box(1.0, 0.9, 1.0, { position: [cx, 6.05, cz], color: stone });
    lit.cone(0.85, 1.3, 4, { position: [cx, 7.15, cz], rotation: [0, Math.PI / 4, 0], color: dark ? '#3f7f73' : '#5fae9e' });
    signs.push({
      text: '',
      position: [cx, 6.05, cz + 0.51],
      width: 0.75,
      height: 0.75,
      bg: 'transparent',
      fg: '#222',
      draw: (ctx, w, h) => {
        ctx.fillStyle = '#fbf6e8';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3b2a20';
        ctx.lineWidth = w * 0.04;
        ctx.stroke();
        ctx.lineCap = 'round';
        for (const [a, l] of [[-Math.PI / 2 + 0.4, 0.3], [-Math.PI / 2 + 2.6, 0.38]] as const) {
          ctx.beginPath();
          ctx.moveTo(w / 2, h / 2);
          ctx.lineTo(w / 2 + Math.cos(a) * w * l, h / 2 + Math.sin(a) * h * l);
          ctx.stroke();
        }
      },
    });
  }

  // The plinth for the assistant, with its name; a holo plate the graph floats over.
  lit.cylinder(2.9, 3.1, 0.5, 48, { position: [PLINTH[0], 0.25, PLINTH[1]], color: dark ? '#262c3a' : '#cfd6e4' });
  glow.torus(2.92, 0.045, 4, 80, { position: [PLINTH[0], 0.5, PLINTH[1]], rotation: [Math.PI / 2, 0, 0], color: p.accent.indigo });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    glow.beam([PLINTH[0] + Math.cos(a) * 2.6, 0.5, PLINTH[1] + Math.sin(a) * 2.6], [gx(Math.cos(a) * 4.4), GRAPH.y - 0.05, gz(Math.sin(a) * 2.6)], 0.014, 0.014, { color: p.accent.indigo });
  }
  glass.box(6.6, 0.02, 3.9, { position: [PLINTH[0], GRAPH.y - 0.06, PLINTH[1]], color: dark ? '#4c4fb5' : '#c7d2fe' });
  signs.push({ text: 'COURSE ASSISTANT', position: [PLINTH[0], 0.27, PLINTH[1] + 3.02], width: 3.0, height: 0.34, bg: '#1e1b4b', fg: '#c7d2fe' });

  // The graph: edges as light paths, nodes as small pylons.
  const dim = new THREE.Color(p.accent.indigo).lerp(new THREE.Color(p.ink), dark ? 0.35 : 0.1).getStyle();
  for (const [a, b] of AGENT_EDGES) {
    const na = NODE_BY_ID[a];
    const nb = NODE_BY_ID[b];
    glow.beam([gx(na.x), GRAPH.y, gz(na.z)], [gx(nb.x), GRAPH.y, gz(nb.z)], 0.045, 0.02, { color: dim });
  }
  for (const n of AGENT_NODES) {
    const h = n.kind === 'terminal' ? 0.16 : 0.32;
    glow.cylinder(0.15, 0.15, h, 6, { position: [gx(n.x), GRAPH.y + h / 2, gz(n.z)], color: nodeColor(p, n.kind) });
  }

  // A student asks the documented question; the answer comes back.
  const q = AGENT_QUERIES[0];
  person(lit, -1.6, 0.04, 3.4, faceYaw(1.6, -4.0), randomLook(rng, { shirt: '#ef476f' }));
  person(lit, -1.1, 0.04, 3.8, faceYaw(1.1, -4.4), randomLook(rng));
  signs.push({ text: q.prompt, position: [-2.6, 1.2, 3.5], width: 3.2, height: 0.4, bg: '#ffffff', fg: '#1f2937', weight: 700 });
  signs.push({ text: 'HW3 is due April 30 at 11:59 PM', position: [2.6, 3.5, PLINTH[1] + 1.2], width: 3.6, height: 0.4, bg: '#4338ca', fg: '#ffffff', weight: 700 });

  // Students on the lawn, benches, a bike rack, flower beds.
  for (let i = 0; i < 14; i++) {
    const x = (rng() - 0.5) * 9.5;
    const z = -0.6 + (rng() - 0.5) * 9.4;
    if (Math.hypot(x - PLINTH[0], z - PLINTH[1]) < 3.9 || Math.abs(x) < 0.9 || Math.abs(z + 0.6) < 0.8) continue;
    person(lit, x, 0.0, z, rng() * 6.3, randomLook(rng), 'sit');
  }
  for (const [bx, bz, a] of [[-3.2, -4.9, 0.6], [3.2, -4.9, -0.6], [-3.4, 3.6, 2.5], [3.4, 3.6, -2.5]] as const) bench(k, bx, bz, a, 1 + (bx > 0 ? 1 : 0));
  for (let i = 0; i < 6; i++) {
    const x = -4.0 + i * 0.32;
    lit.torus(0.1, 0.012, 4, 10, { position: [x, 0.12, 6.4], rotation: [0, Math.PI / 2, 0], color: '#2b2d42' });
    lit.torus(0.1, 0.012, 4, 10, { position: [x, 0.12, 6.7], rotation: [0, Math.PI / 2, 0], color: '#2b2d42' });
    lit.box(0.02, 0.02, 0.32, { position: [x, 0.2, 6.55], color: ['#ef476f', '#118ab2', '#06d6a0'][i % 3] });
  }
  flowerBed(lit, rng, p, -1.6, -6.4, 2.2, 0.5);
  flowerBed(lit, rng, p, 1.6, -6.4, 2.2, 0.5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    postLamp(k, PLINTH[0] + Math.cos(a) * 3.8, PLINTH[1] + Math.sin(a) * 3.8, 0.8, p.accent.indigo);
  }

  // Front road, car park and the shuttle stop.
  road(k, smoothPath([[-15, 7.8], [-6, 9.4], [0, 9.6], [6, 9.4], [15, 7.8]], false, 0.6), 1.1, { sidewalk: 0.3 });
  parkingLot(k, -7.6, 11.6, 6, 2, 0.15, 0.8);
  lit.box(1.4, 0.05, 0.5, { position: [4.2, 1.0, 10.6], color: '#3d4350' });
  for (const x of [3.6, 4.8]) lit.box(0.05, 1.0, 0.05, { position: [x, 0.5, 10.6], color: '#3d4350' });
  for (let i = 0; i < 3; i++) person(lit, 3.8 + i * 0.3, 0.04, 10.5, Math.PI, randomLook(rng));

  // Trees: avenues along the quad, a forest round the rim.
  treeRow(lit, rng, p, -0.95, 6.0, -0.95, 13.5, 5, 'round', 0.75);
  treeRow(lit, rng, p, 0.95, 6.0, 0.95, 13.5, 5, 'round', 0.75);
  treeRow(lit, rng, p, -5.9, -5.6, -5.9, 4.4, 6, 'round', 0.8);
  treeRow(lit, rng, p, 5.9, -5.6, 5.9, 4.4, 6, 'round', 0.8);
  for (const [x, z] of [[-3.8, -2.6], [3.8, -2.6], [-3.8, 1.6], [3.8, 1.6]] as const) roundTree(lit, rng, p, x, z, 0.95);
  forest(lit, rng, p, 46, 12.3, 15.1, [
    [0, 13, 2.0],
    [-7.6, 11.6, 3.6],
    [-14, 7.8, 1.4],
    [14, 7.8, 1.4],
  ]);
  forest(lit, rng, p, 8, 8, 12.2, [
    [HALL.x, HALL.z, 5.2],
    [LIBRARY.x, LIBRARY.z, 3.6],
    [CENTER.x, CENTER.z, 3.8],
    [CLOCK[0], CLOCK[1], 1.6],
    [0, 9.6, 2.4],
    [-7.6, 11.6, 3.6],
    [6, 9.6, 1.5],
    [-6, 9.6, 1.5],
  ]);
}

/* ── The vector store, packets and the pages flying in ───────────────── */

function Crystal({ palette, animate }: IslandProps) {
  const group = useRef<THREE.Group>(null);
  const crystal = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 0.8);
    g.ico(0.6, 0, { color: palette.accent.indigo });
    return g.build();
  }, [palette]);
  const cloud = useMemo(() => {
    const rng = mulberry32(19);
    const pts: number[] = [];
    for (let i = 0; i < 300; i++) {
      const u = rng() * 2 - 1;
      const th = rng() * Math.PI * 2;
      const r = 1.0 + rng() * 0.9;
      const s = Math.sqrt(1 - u * u);
      pts.push(Math.cos(th) * s * r, u * r * 0.6, Math.sin(th) * s * r);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);
  const pointMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(palette.accent.teal).multiplyScalar(palette.mode === 'dark' ? 1.8 : 1),
        size: 0.08,
        toneMapped: false,
      }),
    [palette],
  );
  useEffect(
    () => () => {
      crystal.dispose();
      cloud.dispose();
    },
    [crystal, cloud],
  );
  useEffect(() => () => pointMat.dispose(), [pointMat]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    if (!group.current) return;
    group.current.position.y = CRYSTAL_Y + Math.sin(t.current * 0.9) * 0.1;
    group.current.children[0].rotation.set(t.current * 0.3, t.current * 0.5, 0);
    group.current.children[1].rotation.y = -t.current * 0.12;
  });
  return (
    <group ref={group} position={[PLINTH[0], CRYSTAL_Y, PLINTH[1]]}>
      <mesh geometry={crystal} material={glowMaterial()} />
      <points geometry={cloud} material={pointMat} />
    </group>
  );
}

function Packets({ palette, animate }: IslandProps) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const geometry = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 1.4);
    g.ico(0.07, 1, { color: palette.window });
    return g.build();
  }, [palette]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const paths = useMemo(
    () =>
      AGENT_QUERIES.map((q) => {
        const pts = q.path.map((id) => new THREE.Vector3(gx(NODE_BY_ID[id].x), GRAPH.y + 0.18, gz(NODE_BY_ID[id].z)));
        const lengths = pts.slice(1).map((p, i) => p.distanceTo(pts[i]));
        return { pts, lengths, total: lengths.reduce((a, b) => a + b, 0) };
      }),
    [],
  );
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    paths.forEach((path, i) => {
      const m = refs.current[i];
      if (!m) return;
      let d = ((t.current * 0.8 + i * 1.9) % (path.total + 1)) - 0.5;
      d = Math.max(0, Math.min(path.total, d));
      let seg = 0;
      while (seg < path.lengths.length - 1 && d > path.lengths[seg]) {
        d -= path.lengths[seg];
        seg++;
      }
      const f = path.lengths[seg] ? d / path.lengths[seg] : 0;
      m.position.lerpVectors(path.pts[seg], path.pts[seg + 1], Math.min(1, f));
    });
  });
  return (
    <>
      {paths.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={geometry}
          material={glowMaterial()}
        />
      ))}
    </>
  );
}

/** Pages (slides and transcripts) arcing from the library and the hall into the store. */
function Pages({ palette, animate }: IslandProps) {
  const N = 10;
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const page = useMemo(() => {
    const b = new MeshBuilder();
    b.box(0.28, 0.36, 0.01, { color: '#ffffff' });
    for (let i = 0; i < 4; i++) b.box(0.18, 0.02, 0.012, { position: [0, 0.1 - i * 0.07, 0], color: '#94a3b8' });
    return b.build();
  }, []);
  useEffect(() => () => page.dispose(), [page]);
  const curves = useMemo(() => {
    const target = new THREE.Vector3(PLINTH[0], CRYSTAL_Y, PLINTH[1]);
    const from = [
      new THREE.Vector3(LIBRARY.x, LIBRARY.h + 1.8, LIBRARY.z),
      new THREE.Vector3(HALL.x, HALL.h + 1.0, HALL.z + 0.5),
    ];
    return from.map((f) => new THREE.QuadraticBezierCurve3(f, f.clone().lerp(target, 0.5).setY(CRYSTAL_Y + 2.2), target));
  }, []);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (animate) t.current += Math.min(dt, 0.1);
    refs.current.forEach((m, i) => {
      if (!m) return;
      const c = curves[i % curves.length];
      const u = (t.current * 0.16 + i / N) % 1;
      c.getPoint(u, m.position);
      m.rotation.set(t.current + i, t.current * 0.7 + i, 0);
      m.scale.setScalar(Math.min(1, (1 - u) * 6));
    });
  });
  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={page}
          material={palette.mode === 'dark' ? glowMaterial() : glassMaterial()}
        />
      ))}
    </>
  );
}

const FRONT = track(smoothPath([[-15, 7.8], [-6, 9.4], [0, 9.6], [6, 9.4], [15, 7.8]], false, 0.6), false, 0.06);
const FLEET: FleetSpec[] = [
  { kind: 'car', track: FRONT, count: 4, speed: 0.9, lane: 0.27 },
  { kind: 'bus', track: FRONT, speed: 0.7, lane: 0.27, offset: 7, colors: ['#4338ca'], scale: 0.85 },
];
const WALKS: WalkerGroup[] = [
  { track: track([[0, 14.2], [0, -6.8]], false, 0.04), count: 16, spread: 0.45 },
  { track: track([[-5.4, -0.6], [5.4, -0.6]], false, 0.04), count: 8, spread: 0.4 },
  { track: track([[-5.2, -5.6], [5.2, 4.4]], false, 0.04), count: 5, spread: 0.2 },
  { track: track([[5.2, -5.6], [-5.2, 4.4]], false, 0.04), count: 5, spread: 0.2 },
  { track: track([[-5.4, -0.6], [LIBRARY.x + LIBRARY.w / 2, LIBRARY.z + 0.4]], false, 0.04), count: 3 },
  { track: track([[5.4, -0.6], [CENTER.x - CENTER.w / 2, CENTER.z + 0.4]], false, 0.04), count: 3 },
  { track: track(Array.from({ length: 28 }, (_, i) => [PLINTH[0] + Math.cos((i / 28) * Math.PI * 2) * 3.35, PLINTH[1] + Math.sin((i / 28) * Math.PI * 2) * 3.35] as [number, number]), true, 0.04), count: 7, spread: 0.15 },
];

export default function HubIsland(props: IslandProps) {
  return (
    <group>
      <Baked build={build} palette={props.palette} seed={606} />
      <Crystal {...props} />
      <Packets {...props} />
      <Pages {...props} />
      <Fleet specs={FLEET} palette={props.palette} animate={props.animate} seed={61} />
      <Walkers groups={WALKS} animate={props.animate} seed={62} />
    </group>
  );
}
