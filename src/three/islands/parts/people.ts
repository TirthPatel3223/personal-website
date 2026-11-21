import * as THREE from 'three';
import type { MeshBuilder } from '../../core/builder';
import type { Rng } from '../../core/math';

/* Little people, about 0.36 units tall (a house storey is about 0.6). Each pose is a
   template built once from a few boxes; placing a person copies the template with
   that person's clothes, skin and hair colours. */

export type Pose = 'stand' | 'sit' | 'lie';

export interface Look {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
}

export const SHIRTS = [
  '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#ffb4a2',
  '#6d597a', '#ffffff', '#ef476f', '#06d6a0', '#118ab2', '#ffd166', '#c77dff', '#90be6d',
];
export const PANTS = ['#22223b', '#4a4e69', '#3d405b', '#2b2d42', '#6b705c', '#1d3557', '#8d99ae', '#5e548e'];
export const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4a373'];
export const HAIRS = ['#2b1d14', '#4a3021', '#111111', '#8a4b2a', '#c9a227', '#5a3825', '#333333'];

const pick = <T,>(rng: Rng, a: readonly T[]) => a[Math.floor(rng() * a.length)];

export function randomLook(rng: Rng, over: Partial<Look> = {}): Look {
  return {
    shirt: over.shirt ?? pick(rng, SHIRTS),
    pants: over.pants ?? pick(rng, PANTS),
    skin: over.skin ?? pick(rng, SKINS),
    hair: over.hair ?? pick(rng, HAIRS),
  };
}

/** Uniforms: lab coats, scrubs, flight crew. */
export const LOOKS = {
  lab: (rng: Rng): Look => randomLook(rng, { shirt: '#f4f6f8', pants: pick(rng, ['#2b2d42', '#3d405b']) }),
  scrubs: (rng: Rng): Look => {
    const c = pick(rng, ['#5fb3b3', '#4f86c6', '#7bc4a4']);
    return randomLook(rng, { shirt: c, pants: c });
  },
  crew: (rng: Rng): Look => randomLook(rng, { shirt: '#1f2e4d', pants: '#1f2e4d' }),
  vest: (rng: Rng): Look => randomLook(rng, { shirt: '#f6b500', pants: '#2b2d42' }),
};

const PART = { shirt: 0, pants: 1, skin: 2, hair: 3 } as const;
type Part = (typeof PART)[keyof typeof PART];

interface Template {
  pos: Float32Array;
  part: Uint8Array;
}

const templates = new Map<Pose, Template>();

function template(pose: Pose): Template {
  const hit = templates.get(pose);
  if (hit) return hit;
  const pos: number[] = [];
  const part: number[] = [];
  const add = (g: THREE.BufferGeometry, p: Part, x: number, y: number, z: number) => {
    const ng = g.index ? g.toNonIndexed() : g;
    ng.translate(x, y, z);
    const a = ng.getAttribute('position');
    for (let i = 0; i < a.count; i++) {
      pos.push(a.getX(i), a.getY(i), a.getZ(i));
      part.push(p);
    }
    g.dispose();
    ng.dispose();
  };
  const sit = pose === 'sit';
  const torsoY = sit ? 0.245 : 0.225;
  if (sit) {
    add(new THREE.BoxGeometry(0.075, 0.045, 0.11), PART.pants, 0, 0.152, 0.045);
    add(new THREE.BoxGeometry(0.07, 0.13, 0.045), PART.pants, 0, 0.068, 0.1);
  } else {
    add(new THREE.BoxGeometry(0.078, 0.16, 0.048), PART.pants, 0, 0.08, 0);
  }
  add(new THREE.BoxGeometry(0.1, 0.13, 0.062), PART.shirt, 0, torsoY, 0);
  add(new THREE.BoxGeometry(0.024, 0.115, 0.036), PART.shirt, -0.063, torsoY - 0.008, 0);
  add(new THREE.BoxGeometry(0.024, 0.115, 0.036), PART.shirt, 0.063, torsoY - 0.008, 0);
  add(new THREE.IcosahedronGeometry(0.043, 0), PART.skin, 0, torsoY + 0.11, 0);
  add(new THREE.BoxGeometry(0.072, 0.028, 0.072), PART.hair, 0, torsoY + 0.142, -0.004);
  let arr = new Float32Array(pos);
  if (pose === 'lie') {
    // Lying on the back, head towards -z.
    const m = new THREE.Matrix4().makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(0, 0.035, 0.17));
    const v = new THREE.Vector3();
    arr = arr.slice();
    for (let i = 0; i < arr.length; i += 3) {
      v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(m);
      arr[i] = v.x;
      arr[i + 1] = v.y;
      arr[i + 2] = v.z;
    }
  }
  const t = { pos: arr, part: new Uint8Array(part) };
  templates.set(pose, t);
  return t;
}

const C = new THREE.Color();

/** Place one person (static) into a builder. `angle` is the facing yaw (0 = facing +z). */
export function person(b: MeshBuilder, x: number, y: number, z: number, angle: number, look: Look, pose: Pose = 'stand', scale = 1) {
  const t = template(pose);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(t.pos.slice(), 3));
  const col = new Float32Array(t.pos.length);
  const tones = [look.shirt, look.pants, look.skin, look.hair];
  for (let i = 0; i < t.part.length; i++) {
    C.set(tones[t.part[i]]);
    col[i * 3] = C.r;
    col[i * 3 + 1] = C.g;
    col[i * 3 + 2] = C.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  b.add(g, { position: [x, y, z], rotation: [0, angle, 0], scale });
}

/** A line of people along a polyline (queues), facing along it. */
export function queueLine(b: MeshBuilder, rng: Rng, pts: Array<[number, number]>, spacing: number, y = 0, fill = 1) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.floor(len / spacing);
    const face = Math.atan2(ax - bx, az - bz);
    for (let k = 0; k < n; k++) {
      if (rng() > fill) continue;
      const t = (k + 0.5) / n;
      person(b, ax + (bx - ax) * t + (rng() - 0.5) * 0.05, y, az + (bz - az) * t + (rng() - 0.5) * 0.05, face + (rng() - 0.5) * 0.5, randomLook(rng));
    }
  }
}

/** A loose group of standing people around a point. */
export function crowd(b: MeshBuilder, rng: Rng, cx: number, cz: number, r: number, n: number, y = 0, face?: number) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r;
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    person(b, x, y, z, face ?? rng() * Math.PI * 2, randomLook(rng));
  }
}

/* ── Templates for instanced walkers ─────────────────────────────────────────
   Body and head are separate meshes so clothes and skin can be tinted per instance
   (instance colour multiplies the vertex colour). */

export function walkerGeometries() {
  const t = template('stand');
  const make = (keep: (p: number) => boolean, tint: (p: number) => string) => {
    const pos: number[] = [];
    const col: number[] = [];
    for (let i = 0; i < t.part.length; i++) {
      if (!keep(t.part[i])) continue;
      pos.push(t.pos[i * 3], t.pos[i * 3 + 1], t.pos[i * 3 + 2]);
      C.set(tint(t.part[i]));
      col.push(C.r, C.g, C.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  };
  return {
    body: make((p) => p === PART.shirt || p === PART.pants, (p) => (p === PART.pants ? '#4b4f5c' : '#ffffff')),
    head: make((p) => p === PART.skin || p === PART.hair, (p) => (p === PART.hair ? '#3a2a20' : '#ffffff')),
  };
}
