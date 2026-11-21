'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MeshBuilder } from '../../core/builder';
import { glowMaterial, litMaterial } from '../../core/materials';
import { mulberry32 } from '../../core/math';
import type { ScenePalette } from '../../core/palette';
import { AGENT_EDGES, AGENT_NODES, NODE_BY_ID, type AgentQuery } from '../../data/agentGraph';
import { nodeColor } from '../../islands/HubIsland';

/* The Course RAG assistant's LangGraph on a platform. A packet of light carries the
   chosen question along its real branch; at the retriever, k chunks in the vector
   store light up and stream to it; on uploads, the packet waits at the approval gate. */

const SCALE = 1.25;
const PY = 1.25;
const STORE = new THREE.Vector3(-0.9 * SCALE, 3.4, -4.6);
const pos = (id: string) => new THREE.Vector3(NODE_BY_ID[id].x * SCALE, PY, NODE_BY_ID[id].z * SCALE);

export default function AgentScene({
  palette,
  query,
  progress,
  retrieved,
  waiting,
}: {
  palette: ScenePalette;
  query: AgentQuery;
  progress: number;
  retrieved: boolean;
  waiting: boolean;
}) {
  const onPath = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < query.path.length - 1; i++) set.add(`${query.path[i]}>${query.path[i + 1]}`);
    return set;
  }, [query]);

  const geoms = useMemo(() => {
    const lit = new MeshBuilder();
    const glow = new MeshBuilder(palette.glow);
    lit.cylinder(6.9, 7.1, 0.3, 48, { position: [0, -0.15, 0], color: palette.concrete });
    glow.torus(6.92, 0.05, 4, 96, { position: [0, 0.01, 0], rotation: [Math.PI / 2, 0, 0], color: palette.accent.indigo });
    const dim = new THREE.Color(palette.accent.indigo).lerp(new THREE.Color(palette.ink), palette.mode === 'dark' ? 0.6 : 0.2).getStyle();
    for (const [a, b] of AGENT_EDGES) {
      const pa = pos(a).setY(0.08);
      const pb = pos(b).setY(0.08);
      const active = onPath.has(`${a}>${b}`);
      glow.strip(pa.x, pa.z, pb.x, pb.z, active ? 0.12 : 0.06, 0.06, { color: active ? palette.accent.indigo : dim });
    }
    for (const n of AGENT_NODES) {
      const x = n.x * SCALE;
      const z = n.z * SCALE;
      const h = n.kind === 'terminal' ? 0.5 : 0.95;
      lit.cylinder(0.26, 0.32, h, 6, { position: [x, h / 2, z], color: palette.wallAlt });
      glow.cylinder(0.27, 0.27, 0.1, 6, { position: [x, h + 0.04, z], color: nodeColor(palette, n.kind) });
    }
    return { lit: lit.build(), glow: glow.build() };
  }, [palette, onPath]);
  useEffect(
    () => () => {
      geoms.lit.dispose();
      geoms.glow.dispose();
    },
    [geoms],
  );

  // The vector store: a crystal and a cloud of chunk points.
  const cloud = useMemo(() => {
    const rng = mulberry32(23);
    const pts: number[] = [];
    for (let i = 0; i < 280; i++) {
      const u = rng() * 2 - 1;
      const t = rng() * Math.PI * 2;
      const r = 0.9 + rng() * 1.3;
      const s = Math.sqrt(1 - u * u);
      pts.push(Math.cos(t) * s * r, u * r * 0.75, Math.sin(t) * s * r);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pts.length), 3));
    return g;
  }, []);
  const crystal = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 0.7);
    g.ico(0.55, 0, { color: palette.accent.indigo });
    return g.build();
  }, [palette]);
  const pointMat = useMemo(() => new THREE.PointsMaterial({ vertexColors: true, size: 0.11, toneMapped: false }), []);
  const beams = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 2 * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
  const beamMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(palette.accent.teal).multiplyScalar(palette.mode === 'dark' ? 1.8 : 1),
        transparent: true,
        opacity: 0.8,
        toneMapped: false,
      }),
    [palette],
  );
  useEffect(
    () => () => {
      cloud.dispose();
      crystal.dispose();
      beams.dispose();
    },
    [cloud, crystal, beams],
  );
  useEffect(() => () => pointMat.dispose(), [pointMat]);
  useEffect(() => () => beamMat.dispose(), [beamMat]);

  // Light up k chunks (a fixed sample per question) once the retriever has run.
  useEffect(() => {
    const col = cloud.getAttribute('color') as THREE.BufferAttribute;
    const arr = col.array as Float32Array;
    const base = new THREE.Color(palette.accent.indigo).multiplyScalar(palette.mode === 'dark' ? 0.9 : 0.8);
    const hot = new THREE.Color(palette.accent.teal).multiplyScalar(palette.mode === 'dark' ? 2.2 : 1);
    const rng = mulberry32(query.id.length * 97 + query.k);
    const picked = new Set<number>();
    while (picked.size < (retrieved ? query.k : 0)) picked.add(Math.floor(rng() * 280));
    const posAttr = cloud.getAttribute('position') as THREE.BufferAttribute;
    const beamArr = (beams.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const target = pos('retriever').setY(1.1);
    let o = 0;
    for (let i = 0; i < 280; i++) {
      const c = picked.has(i) ? hot : base;
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
      if (picked.has(i) && o < beamArr.length) {
        beamArr.set([posAttr.getX(i) + STORE.x, posAttr.getY(i) + STORE.y, posAttr.getZ(i) + STORE.z, target.x, target.y, target.z], o);
        o += 6;
      }
    }
    col.needsUpdate = true;
    (beams.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    beams.setDrawRange(0, o / 3);
    beams.computeBoundingSphere();
  }, [cloud, beams, palette, query, retrieved]);

  const packet = useRef<THREE.Mesh>(null);
  const packetGeo = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 1.5);
    g.ico(0.22, 1, { color: waiting ? palette.accent.amber : palette.window });
    return g.build();
  }, [palette, waiting]);
  useEffect(() => () => packetGeo.dispose(), [packetGeo]);
  const store = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const i = Math.min(query.path.length - 2, Math.floor(progress));
    const f = Math.min(1, progress - i);
    const a = pos(query.path[i]);
    const b = pos(query.path[i + 1]);
    packet.current?.position.lerpVectors(a, b, f * f * (3 - 2 * f));
    if (packet.current) packet.current.scale.setScalar(waiting ? 1 + Math.sin(clock.elapsedTime * 6) * 0.18 : 1);
    if (store.current) store.current.rotation.y = clock.elapsedTime * 0.15;
  });

  return (
    <group>
      <mesh geometry={geoms.lit} material={litMaterial()} />
      <mesh geometry={geoms.glow} material={glowMaterial()} />
      {AGENT_NODES.map((n) => (
        <Html
          key={n.id}
          position={[n.x * SCALE, n.kind === 'terminal' ? 0.95 : 1.45, n.z * SCALE]}
          center
          className={`agent-label${query.path.includes(n.id) ? ' agent-label-on' : ''}`}
        >
          {n.label}
        </Html>
      ))}
      <group position={STORE}>
        <mesh geometry={crystal} material={glowMaterial()} />
        <group ref={store}>
          <points geometry={cloud} material={pointMat} />
        </group>
        <Html position={[0, -1.6, 0]} center className="agent-label">
          ChromaDB
        </Html>
      </group>
      <lineSegments geometry={beams} material={beamMat} />
      <mesh ref={packet} geometry={packetGeo} material={glowMaterial()} />
    </group>
  );
}
