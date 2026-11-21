'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* The real Maltese Gear Cube: the simulator's own piece shapes and sticker colours
   (public/models/maltese-gear-cube.json, exported by scripts/3d/export-maltese.gen.mjs)
   playing a short scramble and its exact inverse. Each turn moves like the
   simulator's animator: the face layer turns 90°, the middle ring follows 45°, and
   each of the ring's gears also spins 270° about its own axis. Every piece kind is
   one InstancedMesh, so the 50 pieces cost about a dozen draw calls. */

type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
type Kind = 'corner' | 'centre' | 'edge' | 'gear';
const KINDS: Kind[] = ['corner', 'centre', 'edge', 'gear'];

interface MeshJson {
  positions: number[];
  indices: number[];
}
interface CubeJson {
  colors: Record<Face, string>;
  body: string;
  coreColor: string;
  coreRadius: number;
  protos: Record<Kind, { body: MeshJson; stickers: Array<MeshJson & { normal: [number, number, number] }> }>;
  pieces: Array<{ kind: Kind; colors: Face[] }>;
  moves: Array<{ name: string; face: Face; amount: number; axis: [number, number, number]; layer: number[]; ring: number[]; before: number[][] }>;
}

let request: Promise<CubeJson> | null = null;
function loadCube() {
  if (!request) {
    request = fetch('/models/maltese-gear-cube.json').then((r) => {
      if (!r.ok) throw new Error(`cube model: ${r.status}`);
      return r.json();
    });
    request.catch(() => {
      request = null;
    });
  }
  return request;
}

/** What the cube is doing now, for the robot arms. */
export interface CubeMotion {
  /** Face being worked on, or null between moves. */
  face: Face | null;
  /** 0 = arm at rest, 1 = gripper on the face. */
  engage: number;
  /** Current face angle (radians, about the face's outward normal). */
  angle: number;
}

export const makeMotion = (): CubeMotion => ({ face: null, engage: 0, angle: 0 });

const APPROACH = 0.55;
const TURN = 0.95;
const RELEASE = 0.45;
const HOLD_MID = 1.4;
const HOLD_END = 2.6;
const QUARTER = -Math.PI / 2;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t: number) => t * t * (3 - 2 * t);

function geometryOf(m: MeshJson, normal?: [number, number, number]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  g.setIndex(m.indices);
  if (normal) {
    const n = new Float32Array(m.positions.length);
    for (let i = 0; i < n.length; i += 3) n.set(normal, i);
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    return g;
  }
  const flat = g.toNonIndexed();
  g.dispose();
  flat.computeVertexNormals();
  return flat;
}

function quatOf(m: number[]) {
  const M4 = new THREE.Matrix4().set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1);
  return new THREE.Quaternion().setFromRotationMatrix(M4);
}

interface Prepared {
  data: CubeJson;
  /** Pose of every piece before each move. */
  poses: THREE.Quaternion[][];
  /** Index of each piece within its kind. */
  slot: number[];
  counts: Record<Kind, number>;
  schedule: Array<{ start: number; turn: number; release: number; end: number }>;
  loop: number;
  geoms: Record<Kind, { body: THREE.BufferGeometry; stickers: THREE.BufferGeometry[] }>;
  core: THREE.BufferGeometry;
}

function prepare(data: CubeJson): Prepared {
  const counts: Record<Kind, number> = { corner: 0, centre: 0, edge: 0, gear: 0 };
  const slot = data.pieces.map((p) => counts[p.kind]++);
  const poses = data.moves.map((m) => m.before.map(quatOf));
  const half = Math.floor(data.moves.length / 2);
  const schedule: Prepared['schedule'] = [];
  let t = 0.6;
  data.moves.forEach((_, i) => {
    const start = t;
    const turn = start + APPROACH;
    const release = turn + TURN;
    const end = release + RELEASE;
    schedule.push({ start, turn, release, end });
    t = end + (i === half - 1 ? HOLD_MID : 0.1);
  });
  const geoms = Object.fromEntries(
    KINDS.map((k) => [
      k,
      {
        body: geometryOf(data.protos[k].body),
        stickers: data.protos[k].stickers.map((s) => geometryOf(s, s.normal)),
      },
    ]),
  ) as Prepared['geoms'];
  return { data, poses, slot, counts, schedule, loop: t + HOLD_END, geoms, core: new THREE.SphereGeometry(data.coreRadius, 24, 16) };
}

const AXIS = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);
const qTurn = new THREE.Quaternion();
const qSpin = new THREE.Quaternion();
const qOut = new THREE.Quaternion();
const M = new THREE.Matrix4();
const ORIGIN = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);
const COL = new THREE.Color();

/** Lets the sticker colours glow a little (instance colour times `selfLit`), so they read at night. */
function selfLit(m: THREE.MeshStandardMaterial, amount: number) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * ${amount.toFixed(3)};`,
    );
  };
  m.customProgramCacheKey = () => `self-lit-${amount.toFixed(3)}`;
  return m;
}

export default function MalteseCube({ animate, motion, glow = 0.3 }: { animate: boolean; motion?: CubeMotion; glow?: number }) {
  const [prep, setPrep] = useState<Prepared | null>(null);
  useEffect(() => {
    let live = true;
    loadCube()
      .then((d) => {
        if (live) setPrep(prepare(d));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (!prep) return;
      for (const k of KINDS) {
        prep.geoms[k].body.dispose();
        prep.geoms[k].stickers.forEach((g) => g.dispose());
      }
      prep.core.dispose();
    },
    [prep],
  );

  const materials = useMemo(() => {
    if (!prep) return null;
    return {
      body: new THREE.MeshStandardMaterial({ color: prep.data.body, roughness: 0.42, metalness: 0.08 }),
      sticker: selfLit(
        new THREE.MeshStandardMaterial({
          color: '#ffffff',
          roughness: 0.38,
          metalness: 0,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
        glow,
      ),
      core: new THREE.MeshStandardMaterial({ color: prep.data.coreColor, roughness: 0.9 }),
    };
  }, [prep, glow]);
  useEffect(
    () => () => {
      if (!materials) return;
      materials.body.dispose();
      materials.sticker.dispose();
      materials.core.dispose();
    },
    [materials],
  );

  const bodies = useRef<Partial<Record<Kind, THREE.InstancedMesh | null>>>({});
  const stickers = useRef<Partial<Record<Kind, Array<THREE.InstancedMesh | null>>>>({});
  const time = useRef(0);
  const drawn = useRef(-1);

  // Sticker colours per instance.
  useEffect(() => {
    if (!prep) return;
    const { data, slot } = prep;
    data.pieces.forEach((p, id) => {
      (stickers.current[p.kind] ?? []).forEach((mesh, s) => {
        if (!mesh) return;
        mesh.setColorAt(slot[id], COL.set(data.colors[p.colors[s]]));
      });
    });
    for (const k of KINDS) {
      for (const mesh of stickers.current[k] ?? []) if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    drawn.current = -1;
  }, [prep]);

  useFrame((_, dt) => {
    if (!prep) return;
    if (animate) time.current = (time.current + Math.min(dt, 0.1)) % prep.loop;
    const t = time.current;
    if (!animate && drawn.current >= 0) return;
    const { data, poses, schedule, slot } = prep;
    // Which move are we on, and how far through it?
    let i = schedule.findIndex((s) => t < s.end);
    let base: THREE.Quaternion[];
    let fraction = 0;
    let moving = false;
    if (i < 0) {
      base = poses[0];
      i = -1;
    } else {
      const s = schedule[i];
      if (t < s.turn) base = poses[i];
      else if (t < s.release) {
        base = poses[i];
        fraction = ease((t - s.turn) / TURN);
        moving = true;
      } else base = poses[(i + 1) % poses.length];
      if (motion) {
        motion.face = t >= s.start ? data.moves[i].face : null;
        motion.engage = t < s.start ? 0 : t < s.turn ? smooth((t - s.start) / APPROACH) : t < s.release ? 1 : 1 - smooth((t - s.release) / RELEASE);
        motion.angle = t < s.turn ? 0 : QUARTER * data.moves[i].amount * (t < s.release ? fraction : 1);
      }
    }
    if (i < 0 && motion) {
      motion.face = null;
      motion.engage = 0;
      motion.angle = 0;
    }
    const move = i >= 0 ? data.moves[i] : null;
    const layer = moving && move ? new Set(move.layer) : null;
    const ring = moving && move ? new Set(move.ring) : null;
    if (move) AXIS.set(move.axis[0], move.axis[1], move.axis[2]);
    const angle = move ? QUARTER * move.amount * fraction : 0;
    data.pieces.forEach((p, id) => {
      qOut.copy(base[id]);
      if (layer?.has(id)) {
        qTurn.setFromAxisAngle(AXIS, angle);
        qOut.premultiply(qTurn);
      } else if (ring?.has(id) && move) {
        qTurn.setFromAxisAngle(AXIS, angle * 0.5);
        qOut.premultiply(qTurn);
        if (p.kind === 'gear') {
          qSpin.setFromAxisAngle(Z, Math.sign(move.amount) * (Math.PI / 2) * 3 * fraction * Math.abs(move.amount));
          qOut.multiply(qSpin);
        }
      }
      M.compose(ORIGIN, qOut, ONE);
      bodies.current[p.kind]?.setMatrixAt(slot[id], M);
      for (const mesh of stickers.current[p.kind] ?? []) mesh?.setMatrixAt(slot[id], M);
    });
    for (const k of KINDS) {
      const b = bodies.current[k];
      if (b) b.instanceMatrix.needsUpdate = true;
      for (const mesh of stickers.current[k] ?? []) if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
    drawn.current = t;
  });

  if (!prep || !materials) return null;
  return (
    <group>
      <mesh geometry={prep.core} material={materials.core} />
      {KINDS.map((k) => (
        <group key={k}>
          <instancedMesh
            ref={(m) => {
              bodies.current[k] = m;
            }}
            args={[prep.geoms[k].body, materials.body, prep.counts[k]]}
            frustumCulled={false}
          />
          {prep.geoms[k].stickers.map((g, s) => (
            <instancedMesh
              key={s}
              ref={(m) => {
                (stickers.current[k] ??= [])[s] = m;
              }}
              args={[g, materials.sticker, prep.counts[k]]}
              frustumCulled={false}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
