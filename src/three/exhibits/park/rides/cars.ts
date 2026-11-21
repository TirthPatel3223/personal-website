import * as THREE from 'three';
import { MeshBuilder } from '../../../core/builder';
import { mulberry32, type Rng } from '../../../core/math';
import { person, randomLook } from '../../../islands/parts/people';

/* Ride vehicles. Each faces +x with its wheels (or hull bottom) on y = 0, sized to
   the 0.36-tall people who ride in it. Parts painted '#ffffff' take the per-car tint
   from the mover's colours. Lights go into the glow builder. */

export interface CarGeometry {
  lit: THREE.BufferGeometry;
  glow: THREE.BufferGeometry | null;
}

type B = MeshBuilder;

/** A seated rider facing +x. */
function rider(b: B, rng: Rng, x: number, y: number, z: number, s = 1) {
  person(b, x, y - 0.1 * s, z, Math.PI / 2, randomLook(rng), 'sit', s);
}

function hullShape(len: number, wid: number, nose = 0.3) {
  const h = new THREE.Shape();
  const L = len / 2;
  const W = wid / 2;
  h.moveTo(-L, -W);
  h.lineTo(L - nose, -W);
  h.quadraticCurveTo(L, -W * 0.5, L, 0);
  h.quadraticCurveTo(L, W * 0.5, L - nose, W);
  h.lineTo(-L, W);
  h.closePath();
  return h;
}

/** Extruded flat-bottomed hull, from y0 up by h. */
function hull(b: B, len: number, wid: number, y0: number, h: number, color: string, nose = 0.3) {
  b.extrude(hullShape(len, wid, nose), h, { rotation: [-Math.PI / 2, 0, 0], position: [0, y0, 0], color }, 6);
}

const BUILDERS: Record<string, (b: B, g: B, rng: Rng) => void> = {
  log(b, _g, rng) {
    b.cylinder(0.17, 0.17, 0.95, 8, { position: [0, 0.14, 0], rotation: [0, 0, Math.PI / 2], color: '#7a5532' });
    b.box(0.8, 0.08, 0.26, { position: [0, 0.29, 0], color: '#4a3220' });
    b.cylinder(0.12, 0.17, 0.12, 8, { position: [0.52, 0.14, 0], rotation: [0, 0, Math.PI / 2], color: '#9a7048' });
    for (const x of [-0.25, 0.08]) rider(b, rng, x, 0.24, 0);
  },
  bobsled(b, _g, rng) {
    b.taperBox(0.7, 0.18, 0.3, 0.9, 0.8, { position: [0, 0.12, 0], color: '#ffffff' });
    b.cone(0.15, 0.24, 8, { position: [0.45, 0.13, 0], rotation: [0, 0, -Math.PI / 2], color: '#ffffff' });
    b.box(0.74, 0.03, 0.32, { position: [0, 0.035, 0], color: '#d6d9de' });
    b.box(0.12, 0.08, 0.28, { position: [0.24, 0.24, 0], color: '#1f2a38' });
    for (const x of [-0.2, 0.06]) rider(b, rng, x, 0.18, 0);
  },
  mine(b, _g, rng) {
    for (const x of [-0.18, 0.18]) for (const z of [-0.13, 0.13]) b.cylinder(0.06, 0.06, 0.04, 8, { position: [x, 0.06, z], rotation: [Math.PI / 2, 0, 0], color: '#2b2d42' });
    b.taperBox(0.56, 0.2, 0.32, 1.06, 1.08, { position: [0, 0.18, 0], color: '#9c4f2a' });
    b.box(0.58, 0.03, 0.34, { position: [0, 0.29, 0], color: '#5e3b22' });
    for (const x of [-0.12, 0.12]) rider(b, rng, x, 0.2, 0);
  },
  loco(b, g) {
    for (const x of [-0.22, 0.05, 0.25]) for (const z of [-0.13, 0.13]) b.cylinder(x === 0.05 ? 0.09 : 0.06, x === 0.05 ? 0.09 : 0.06, 0.04, 10, { position: [x, x === 0.05 ? 0.09 : 0.06, z], rotation: [Math.PI / 2, 0, 0], color: '#c1121f' });
    b.box(0.66, 0.06, 0.28, { position: [0, 0.12, 0], color: '#2b2d42' });
    b.cylinder(0.11, 0.11, 0.42, 10, { position: [0.1, 0.25, 0], rotation: [0, 0, Math.PI / 2], color: '#2b2d42' });
    b.cylinder(0.05, 0.035, 0.16, 8, { position: [0.24, 0.42, 0], color: '#2b2d42' });
    b.cylinder(0.07, 0.07, 0.03, 8, { position: [0.24, 0.5, 0], color: '#d4a017' });
    b.box(0.22, 0.26, 0.3, { position: [-0.2, 0.29, 0], color: '#8d0801' });
    b.box(0.26, 0.04, 0.34, { position: [-0.2, 0.44, 0], color: '#2b2d42' });
    b.cone(0.1, 0.14, 6, { position: [0.36, 0.08, 0], rotation: [0, 0, Math.PI / 2], color: '#c1121f' });
    g.box(0.03, 0.06, 0.06, { position: [0.32, 0.3, 0], color: '#fff1c1' });
  },
  coaster(b, _g, rng) {
    b.taperBox(0.5, 0.15, 0.3, 0.92, 0.9, { position: [0, 0.1, 0], color: '#ffffff' });
    b.box(0.08, 0.14, 0.3, { position: [0.21, 0.23, 0], color: '#ffffff' });
    b.box(0.52, 0.03, 0.32, { position: [0, 0.03, 0], color: '#3d405b' });
    rider(b, rng, -0.05, 0.16, 0);
  },
  spacecar(b, g, rng) {
    b.taperBox(0.55, 0.14, 0.26, 0.8, 0.85, { position: [0, 0.09, 0], color: '#e9ecef' });
    b.cone(0.13, 0.2, 6, { position: [0.36, 0.09, 0], rotation: [0, 0, -Math.PI / 2], color: '#3a86ff' });
    g.box(0.02, 0.03, 0.2, { position: [-0.28, 0.1, 0], color: '#ff4d6d' });
    rider(b, rng, -0.06, 0.14, 0);
  },
  boat(b, g, rng) {
    hull(b, 1.0, 0.42, -0.06, 0.18, '#ffffff', 0.32);
    hull(b, 1.02, 0.44, -0.08, 0.04, '#3d2b1f', 0.32);
    for (const x of [-0.3, -0.05, 0.2]) {
      b.box(0.04, 0.08, 0.38, { position: [x - 0.08, 0.1, 0], color: '#6b4f3a' });
      for (const z of [-0.09, 0.09]) rider(b, rng, x, 0.14, z, 0.9);
    }
    g.box(0.03, 0.03, 0.03, { position: [0.42, 0.16, 0], color: '#ffd166' });
  },
  canoe(b, _g, rng) {
    hull(b, 1.15, 0.26, -0.04, 0.12, '#a0522d', 0.42);
    b.box(0.9, 0.02, 0.2, { position: [0, 0.08, 0], color: '#6b3a1f' });
    for (const x of [-0.36, -0.12, 0.12, 0.34]) {
      rider(b, rng, x, 0.1, 0, 0.85);
      b.beam([x + 0.05, 0.26, -0.18], [x - 0.05, 0.02, -0.26], 0.02, 0.01, { color: '#d4a373' });
    }
  },
  jungleboat(b, g, rng) {
    hull(b, 1.2, 0.46, -0.06, 0.18, '#e9d8a6', 0.35);
    hull(b, 1.22, 0.48, -0.08, 0.05, '#2d6a4f', 0.35);
    for (const x of [-0.42, 0.3]) for (const z of [-0.2, 0.2]) b.box(0.025, 0.42, 0.025, { position: [x, 0.33, z], color: '#5e4129' });
    for (let i = 0; i < 6; i++) {
      b.box(0.82, 0.03, 0.09, { position: [-0.06, 0.55, -0.225 + i * 0.09], color: i % 2 ? '#ffffff' : '#2d6a4f' });
    }
    for (const x of [-0.3, -0.05, 0.2]) for (const z of [-0.1, 0.1]) rider(b, rng, x, 0.14, z, 0.9);
    g.box(0.03, 0.03, 0.03, { position: [0.5, 0.18, 0], color: '#ffd166' });
  },
  ship(b, g, rng) {
    // A three-masted sailing ship, about 2.2 long.
    const s = new THREE.Shape();
    s.moveTo(-1.0, -0.26);
    s.lineTo(0.6, -0.26);
    s.quadraticCurveTo(1.1, -0.12, 1.15, 0);
    s.quadraticCurveTo(1.1, 0.12, 0.6, 0.26);
    s.lineTo(-1.0, 0.26);
    s.closePath();
    b.extrude(s, 0.32, { rotation: [-Math.PI / 2, 0, 0], position: [0, -0.08, 0], color: '#2b2d42' }, 8);
    b.extrude(s, 0.06, { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.2, 0], scale: [1.01, 1.04, 1], color: '#d4a017' }, 8);
    b.box(1.95, 0.02, 0.46, { position: [0.05, 0.24, 0], color: '#a47148' });
    b.box(0.5, 0.22, 0.5, { position: [-0.78, 0.36, 0], color: '#5e4129' });
    b.box(0.54, 0.03, 0.54, { position: [-0.78, 0.48, 0], color: '#d4a017' });
    for (const [x, h] of [[0.55, 1.7], [0.0, 2.0], [-0.5, 1.6]] as const) {
      b.cylinder(0.025, 0.03, h, 5, { position: [x, 0.24 + h / 2, 0], color: '#5e4129' });
      for (const [y, w] of [[0.55, 0.62], [1.0, 0.5], [1.4, 0.36]] as const) {
        if (y + 0.3 > h) continue;
        b.box(0.02, 0.02, w + 0.08, { position: [x, 0.24 + y + 0.32, 0], color: '#5e4129' });
        b.taperBox(0.02, 0.34, w, 1, 0.82, { position: [x + 0.03, 0.24 + y + 0.14, 0], color: '#fbf6e9' });
      }
      b.box(0.14, 0.08, 0.01, { position: [x + 0.07, 0.24 + h + 0.02, 0], color: '#c1121f' });
    }
    b.beam([0.7, 0.32, 0], [1.45, 0.6, 0], 0.03, 0.03, { color: '#5e4129' });
    for (let i = 0; i < 6; i++) person(b, -0.6 + i * 0.25, 0.25, (i % 2 ? 1 : -1) * 0.15, Math.PI / 2, randomLook(rng));
    for (const x of [-0.95, 0.9]) g.box(0.05, 0.07, 0.05, { position: [x, 0.62, 0], color: '#ffd166' });
  },
  sub(b, g) {
    b.cylinder(0.17, 0.17, 0.9, 10, { position: [0, 0.1, 0], rotation: [0, 0, Math.PI / 2], color: '#ffd60a' });
    b.ico(0.17, 1, { position: [0.45, 0.1, 0], scale: [1.2, 1, 1], color: '#ffd60a' });
    b.ico(0.17, 1, { position: [-0.45, 0.1, 0], scale: [0.9, 1, 1], color: '#ffd60a' });
    b.box(0.3, 0.16, 0.18, { position: [0.02, 0.32, 0], color: '#ffd60a' });
    b.box(0.06, 0.18, 0.02, { position: [-0.6, 0.12, 0], color: '#ffb703' });
    b.box(0.06, 0.02, 0.24, { position: [-0.6, 0.12, 0], color: '#ffb703' });
    for (const x of [-0.25, 0, 0.25]) for (const z of [-1, 1]) g.cylinder(0.04, 0.04, 0.02, 8, { position: [x, 0.13, z * 0.17], rotation: [Math.PI / 2, 0, 0], color: '#bfefff' });
  },
  raft(b, _g, rng) {
    for (let i = 0; i < 6; i++) b.cylinder(0.05, 0.05, 0.8, 6, { position: [0, 0.03, -0.25 + i * 0.1], rotation: [0, 0, Math.PI / 2], color: i % 2 ? '#8a6240' : '#7a5532' });
    b.box(0.03, 0.4, 0.03, { position: [-0.3, 0.25, 0], color: '#5e4129' });
    b.box(0.02, 0.22, 0.3, { position: [-0.3, 0.38, 0], color: '#fbf6e9' });
    for (const x of [-0.1, 0.12, 0.3]) person(b, x, 0.07, (rng() - 0.5) * 0.3, Math.PI / 2 + (rng() - 0.5), randomLook(rng));
  },
  minicar(b, g, rng) {
    for (const x of [-0.16, 0.16]) for (const z of [-0.12, 0.12]) b.cylinder(0.055, 0.055, 0.04, 8, { position: [x, 0.055, z], rotation: [Math.PI / 2, 0, 0], color: '#15171c' });
    b.box(0.5, 0.1, 0.22, { position: [0, 0.1, 0], color: '#ffffff' });
    b.taperBox(0.18, 0.08, 0.2, 0.7, 0.9, { position: [0.14, 0.19, 0], color: '#ffffff' });
    b.box(0.02, 0.06, 0.18, { position: [0.04, 0.2, 0], color: '#1f2a38' });
    rider(b, rng, -0.08, 0.13, 0, 0.85);
    for (const z of [-0.07, 0.07]) g.box(0.02, 0.025, 0.04, { position: [0.25, 0.12, z], color: '#fff1c1' });
  },
  circusloco(b, g) {
    for (const x of [-0.12, 0.12]) for (const z of [-0.1, 0.1]) b.cylinder(0.06, 0.06, 0.03, 8, { position: [x, 0.06, z], rotation: [Math.PI / 2, 0, 0], color: '#d62828' });
    b.box(0.46, 0.05, 0.22, { position: [0, 0.1, 0], color: '#264653' });
    b.cylinder(0.08, 0.08, 0.26, 10, { position: [0.08, 0.2, 0], rotation: [0, 0, Math.PI / 2], color: '#2a9d8f' });
    b.cylinder(0.035, 0.05, 0.14, 8, { position: [0.17, 0.33, 0], color: '#264653' });
    b.box(0.16, 0.2, 0.22, { position: [-0.14, 0.22, 0], color: '#e9c46a' });
    b.box(0.2, 0.03, 0.26, { position: [-0.14, 0.33, 0], color: '#d62828' });
    g.box(0.02, 0.04, 0.04, { position: [0.22, 0.22, 0], color: '#fff1c1' });
  },
  circuscar(b, _g, rng) {
    for (const x of [-0.12, 0.12]) for (const z of [-0.1, 0.1]) b.cylinder(0.05, 0.05, 0.03, 8, { position: [x, 0.05, z], rotation: [Math.PI / 2, 0, 0], color: '#ffd166' });
    b.box(0.42, 0.14, 0.22, { position: [0, 0.14, 0], color: '#ffffff' });
    for (let i = 0; i < 5; i++) b.box(0.015, 0.16, 0.015, { position: [-0.16 + i * 0.08, 0.29, 0.1], color: '#ffd166' });
    b.taperBox(0.46, 0.06, 0.26, 0.6, 0.6, { position: [0, 0.4, 0], color: '#d62828' });
    rider(b, rng, 0, 0.18, 0, 0.8);
  },
  monohead(b, g) {
    b.box(0.6, 0.2, 0.26, { position: [-0.05, 0.12, 0], color: '#ffffff' });
    b.ico(0.13, 1, { position: [0.28, 0.13, 0], scale: [1.6, 0.8, 1], color: '#ffffff' });
    b.box(0.5, 0.07, 0.27, { position: [-0.05, 0.2, 0], color: '#1f2a38' });
    b.box(0.2, 0.06, 0.18, { position: [0.32, 0.17, 0], rotation: [0, 0, -0.35], color: '#1f2a38' });
    b.box(0.03, 0.05, 0.03, { position: [0.0, 0.25, 0], color: '#ffffff' });
    g.box(0.02, 0.03, 0.12, { position: [0.48, 0.1, 0], color: '#fff1c1' });
    g.box(0.6, 0.012, 0.272, { position: [-0.05, 0.05, 0], color: '#5ec8ff' });
  },
  monocar(b, g) {
    b.box(0.72, 0.2, 0.26, { position: [0, 0.12, 0], color: '#ffffff' });
    b.box(0.66, 0.07, 0.27, { position: [0, 0.2, 0], color: '#1f2a38' });
    g.box(0.72, 0.012, 0.272, { position: [0, 0.05, 0], color: '#5ec8ff' });
  },
  trolley(b, g, rng) {
    for (const x of [-0.3, 0.3]) for (const z of [-0.12, 0.12]) b.cylinder(0.07, 0.07, 0.03, 10, { position: [x, 0.07, z], rotation: [Math.PI / 2, 0, 0], color: '#2b2d42' });
    b.box(1.0, 0.07, 0.34, { position: [0, 0.15, 0], color: '#2a9d8f' });
    for (const x of [-0.45, -0.15, 0.15, 0.45]) for (const z of [-0.15, 0.15]) b.cylinder(0.012, 0.012, 0.36, 4, { position: [x, 0.36, z], color: '#d4a017' });
    b.box(1.06, 0.04, 0.38, { position: [0, 0.56, 0], color: '#8d0801' });
    b.taperBox(1.02, 0.06, 0.34, 0.9, 0.7, { position: [0, 0.61, 0], color: '#8d0801' });
    for (let i = 0; i < 4; i++) {
      b.box(0.05, 0.06, 0.3, { position: [-0.36 + i * 0.24, 0.22, 0], color: '#6b4f3a' });
      person(b, -0.36 + i * 0.24 + 0.06, 0.08, (rng() - 0.5) * 0.12, Math.PI / 2, randomLook(rng), 'sit', 0.9);
    }
    g.box(0.03, 0.05, 0.05, { position: [0.52, 0.3, 0], color: '#fff1c1' });
  },
  jeep(b, g, rng) {
    for (const x of [-0.3, 0.3]) for (const z of [-0.17, 0.17]) b.cylinder(0.085, 0.085, 0.06, 10, { position: [x, 0.085, z], rotation: [Math.PI / 2, 0, 0], color: '#15171c' });
    b.box(0.95, 0.16, 0.38, { position: [0, 0.18, 0], color: '#7c7353' });
    b.box(0.24, 0.12, 0.36, { position: [0.34, 0.31, 0], color: '#6b6347' });
    for (const x of [-0.38, 0.2]) for (const z of [-0.17, 0.17]) b.box(0.02, 0.32, 0.02, { position: [x, 0.42, z], color: '#3f3b2c' });
    b.box(0.66, 0.025, 0.4, { position: [-0.09, 0.59, 0], color: '#a39b74' });
    for (const x of [-0.28, -0.04, 0.18]) for (const z of [-0.09, 0.09]) rider(b, rng, x, 0.26, z, 0.85);
    for (const z of [-0.12, 0.12]) g.box(0.02, 0.04, 0.05, { position: [0.48, 0.24, z], color: '#fff1c1' });
  },
};

const cache = new Map<string, CarGeometry>();

/** Car geometry by key, built once per glow intensity. */
export function carGeometry(key: string, glow: number): CarGeometry {
  const id = `${key}@${glow}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const b = new MeshBuilder();
  const g = new MeshBuilder(glow);
  (BUILDERS[key] ?? BUILDERS.coaster)(b, g, mulberry32(key.length * 97 + key.charCodeAt(0)));
  const out = { lit: b.build(), glow: g.empty ? null : g.build() };
  cache.set(id, out);
  return out;
}
