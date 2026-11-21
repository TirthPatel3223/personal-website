import * as THREE from 'three';
import { MeshBuilder } from '../../core/builder';
import type { Rng } from '../../core/math';

/* Road, airside and water vehicles. Every model points along +x with its wheels on
   y = 0, and is about to scale with the people (a car is ~0.9 long). The paint is
   the `color` argument; instanced fleets pass white and tint each instance. Lights
   go into the glow builder so they bloom at night. */

export type VehicleKind =
  | 'car'
  | 'suv'
  | 'van'
  | 'bus'
  | 'taxi'
  | 'ambulance'
  | 'fuel'
  | 'catering'
  | 'tug'
  | 'cart'
  | 'pushback'
  | 'loader'
  | 'followme'
  | 'boat'
  | 'sailboat'
  | 'tram';

export const CAR_COLORS = [
  '#c1121f', '#f1f3f5', '#212529', '#adb5bd', '#1d3557', '#457b9d', '#e9c46a',
  '#2a9d8f', '#6c757d', '#8d0801', '#dee2e6', '#003049', '#f77f00', '#5c677d',
];

export const carColor = (rng: Rng) => CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)];

const GLASS = '#1f2a38';
const TYRE = '#15171c';
const HEAD = '#fff1c1';
const TAIL = '#ff2a2a';

function wheels(b: MeshBuilder, xs: number[], halfTrack: number, r = 0.075, w = 0.05) {
  for (const x of xs) {
    for (const z of [-halfTrack, halfTrack]) {
      b.cylinder(r, r, w, 8, { position: [x, r, z], rotation: [Math.PI / 2, 0, 0], color: TYRE });
    }
  }
}

function lights(g: MeshBuilder | null, front: number, back: number, y: number, z: number) {
  if (!g) return;
  for (const s of [-1, 1]) {
    g.box(0.02, 0.04, 0.07, { position: [front, y, s * z], color: HEAD });
    g.box(0.02, 0.035, 0.07, { position: [back, y, s * z], color: TAIL });
  }
}

/** Add one vehicle, in its own frame, to builders `b` (paint, glass, tyres) and `g` (lights). */
export function vehicle(b: MeshBuilder, g: MeshBuilder | null, kind: VehicleKind, color: string) {
  switch (kind) {
    case 'car':
    case 'taxi':
    case 'followme': {
      wheels(b, [-0.29, 0.29], 0.17);
      b.box(0.9, 0.15, 0.38, { position: [0, 0.135, 0], color });
      b.taperBox(0.5, 0.13, 0.34, 0.76, 0.86, { position: [-0.04, 0.275, 0], color: GLASS });
      b.box(0.37, 0.025, 0.29, { position: [-0.05, 0.345, 0], color });
      lights(g, 0.451, -0.451, 0.16, 0.12);
      if (kind === 'taxi' && g) g.box(0.12, 0.05, 0.08, { position: [-0.05, 0.38, 0], color: '#fff3b0' });
      if (kind === 'followme' && g) {
        g.box(0.16, 0.05, 0.2, { position: [-0.05, 0.38, 0], color: '#ffb300' });
      }
      break;
    }
    case 'suv': {
      wheels(b, [-0.31, 0.31], 0.18, 0.085);
      b.box(0.96, 0.19, 0.4, { position: [0, 0.17, 0], color });
      b.taperBox(0.66, 0.15, 0.37, 0.9, 0.9, { position: [-0.06, 0.34, 0], color: GLASS });
      b.box(0.6, 0.03, 0.34, { position: [-0.07, 0.43, 0], color });
      lights(g, 0.481, -0.481, 0.2, 0.13);
      break;
    }
    case 'van':
    case 'ambulance': {
      wheels(b, [-0.34, 0.34], 0.19, 0.085);
      b.box(1.05, 0.36, 0.44, { position: [-0.04, 0.27, 0], color });
      b.taperBox(0.22, 0.2, 0.44, 0.45, 1, { position: [0.585, 0.19, 0], color });
      b.box(0.1, 0.13, 0.42, { position: [0.48, 0.38, 0], rotation: [0, 0, -0.5], color: GLASS });
      b.box(0.5, 0.11, 0.45, { position: [0.08, 0.36, 0], color: GLASS });
      if (kind === 'ambulance') {
        b.box(1.06, 0.06, 0.45, { position: [-0.04, 0.22, 0], color: '#d62828' });
        b.box(0.04, 0.12, 0.12, { position: [-0.58, 0.32, 0], color: '#d62828' });
        if (g) {
          g.box(0.1, 0.05, 0.34, { position: [0.36, 0.475, 0], color: '#ff2b2b' });
          g.box(0.1, 0.05, 0.12, { position: [-0.5, 0.475, 0.14], color: '#2b6bff' });
          g.box(0.1, 0.05, 0.12, { position: [-0.5, 0.475, -0.14], color: '#ff2b2b' });
        }
      }
      lights(g, 0.7, -0.571, 0.18, 0.14);
      break;
    }
    case 'bus':
    case 'tram': {
      const len = kind === 'tram' ? 1.9 : 2.2;
      wheels(b, kind === 'tram' ? [-0.6, 0.6] : [-0.72, 0.7], 0.22, 0.09);
      b.box(len, 0.5, 0.5, { position: [0, 0.37, 0], color });
      b.box(len - 0.25, 0.16, 0.51, { position: [-0.05, 0.47, 0], color: GLASS });
      b.box(0.02, 0.22, 0.42, { position: [len / 2 + 0.005, 0.45, 0], color: GLASS });
      b.box(len - 0.1, 0.04, 0.44, { position: [0, 0.64, 0], color: '#d9dde3' });
      lights(g, len / 2 + 0.01, -len / 2 - 0.01, 0.2, 0.17);
      break;
    }
    case 'fuel': {
      wheels(b, [-0.55, -0.25, 0.45], 0.2, 0.09);
      b.box(0.36, 0.34, 0.46, { position: [0.5, 0.3, 0], color: '#e9ecef' });
      b.box(0.04, 0.14, 0.4, { position: [0.685, 0.38, 0], color: GLASS });
      b.box(1.0, 0.1, 0.4, { position: [-0.22, 0.15, 0], color: '#495057' });
      b.cylinder(0.21, 0.21, 0.95, 12, { position: [-0.22, 0.42, 0], rotation: [0, 0, Math.PI / 2], color });
      lights(g, 0.69, -0.73, 0.2, 0.15);
      break;
    }
    case 'catering': {
      wheels(b, [-0.4, 0.42], 0.2, 0.09);
      b.box(0.34, 0.32, 0.46, { position: [0.48, 0.28, 0], color: '#e9ecef' });
      b.box(0.04, 0.13, 0.4, { position: [0.655, 0.36, 0], color: GLASS });
      b.box(0.85, 0.1, 0.42, { position: [-0.12, 0.17, 0], color: '#495057' });
      for (const s of [-1, 1]) b.beam([-0.45, 0.22, s * 0.15], [0.2, 0.5, s * 0.15], 0.03, 0.03, { color: '#6c757d' });
      b.box(0.8, 0.36, 0.46, { position: [-0.12, 0.72, 0], color });
      lights(g, 0.66, -0.55, 0.2, 0.15);
      break;
    }
    case 'tug': {
      wheels(b, [-0.13, 0.13], 0.13, 0.06, 0.05);
      b.box(0.42, 0.14, 0.3, { position: [0, 0.12, 0], color });
      b.box(0.12, 0.14, 0.26, { position: [-0.1, 0.25, 0], color: '#343a40' });
      for (const [x, z] of [[0.08, 0.12], [0.08, -0.12], [-0.16, 0.12], [-0.16, -0.12]] as const) {
        b.box(0.02, 0.2, 0.02, { position: [x, 0.29, z], color: '#343a40' });
      }
      b.box(0.3, 0.02, 0.3, { position: [-0.04, 0.4, 0], color });
      lights(g, 0.211, -0.211, 0.13, 0.1);
      break;
    }
    case 'cart': {
      wheels(b, [-0.15, 0.15], 0.12, 0.045, 0.04);
      b.box(0.46, 0.04, 0.3, { position: [0, 0.1, 0], color: '#5c636a' });
      const bags = ['#2b2d42', '#9d0208', '#264653', '#e9c46a', '#6d597a', '#3d5a80'];
      let n = Math.floor(color.charCodeAt(1) % 3);
      for (const [x, z, h] of [[-0.11, -0.07, 0.12], [0.1, -0.07, 0.1], [-0.11, 0.07, 0.09], [0.1, 0.07, 0.13]] as const) {
        b.box(0.18, h, 0.12, { position: [x, 0.12 + h / 2, z], color: bags[n++ % bags.length] });
      }
      b.box(0.48, 0.015, 0.32, { position: [0, 0.32, 0], color });
      for (const [x, z] of [[0.22, 0.15], [0.22, -0.15], [-0.22, 0.15], [-0.22, -0.15]] as const) {
        b.box(0.015, 0.2, 0.015, { position: [x, 0.22, z], color: '#495057' });
      }
      break;
    }
    case 'pushback': {
      wheels(b, [-0.25, 0.25], 0.22, 0.07, 0.07);
      b.box(0.78, 0.13, 0.5, { position: [0, 0.13, 0], color });
      b.box(0.16, 0.08, 0.3, { position: [-0.2, 0.235, 0], color: '#343a40' });
      lights(g, 0.391, -0.391, 0.14, 0.18);
      break;
    }
    case 'loader': {
      wheels(b, [-0.3, 0.3], 0.16, 0.06, 0.05);
      b.box(0.8, 0.1, 0.3, { position: [0, 0.12, 0], color });
      b.beam([-0.45, 0.2, 0], [0.5, 0.62, 0], 0.18, 0.04, { color: '#343a40' });
      b.box(0.14, 0.14, 0.24, { position: [-0.25, 0.24, 0], color: '#343a40' });
      break;
    }
    case 'boat': {
      const hull = new THREE.Shape();
      hull.moveTo(-0.55, -0.2);
      hull.lineTo(0.3, -0.2);
      hull.quadraticCurveTo(0.62, -0.08, 0.66, 0);
      hull.quadraticCurveTo(0.62, 0.08, 0.3, 0.2);
      hull.lineTo(-0.55, 0.2);
      hull.closePath();
      b.extrude(hull, 0.16, { rotation: [-Math.PI / 2, 0, 0], position: [0, -0.04, 0], color: '#f8f9fa' }, 6);
      b.extrude(hull, 0.04, { rotation: [-Math.PI / 2, 0, 0], position: [0, -0.06, 0], scale: [1.01, 1.04, 1], color }, 6);
      b.box(0.36, 0.14, 0.26, { position: [-0.08, 0.19, 0], color: '#e9ecef' });
      b.box(0.04, 0.1, 0.24, { position: [0.11, 0.22, 0], rotation: [0, 0, -0.45], color: GLASS });
      if (g) g.box(0.03, 0.03, 0.03, { position: [-0.1, 0.3, 0], color: '#ffffff' });
      break;
    }
    case 'sailboat': {
      const hull = new THREE.Shape();
      hull.moveTo(-0.5, -0.17);
      hull.lineTo(0.25, -0.17);
      hull.quadraticCurveTo(0.6, -0.06, 0.66, 0);
      hull.quadraticCurveTo(0.6, 0.06, 0.25, 0.17);
      hull.lineTo(-0.5, 0.17);
      hull.closePath();
      b.extrude(hull, 0.14, { rotation: [-Math.PI / 2, 0, 0], position: [0, -0.04, 0], color: '#ffffff' }, 6);
      b.extrude(hull, 0.03, { rotation: [-Math.PI / 2, 0, 0], position: [0, -0.06, 0], scale: [1.01, 1.04, 1], color }, 6);
      b.cylinder(0.015, 0.015, 1.25, 4, { position: [0.05, 0.72, 0], color: '#d9d9d9' });
      const sail = new THREE.Shape();
      sail.moveTo(0, 0);
      sail.lineTo(0, 1.05);
      sail.lineTo(-0.5, 0);
      sail.closePath();
      b.extrude(sail, 0.01, { position: [0.03, 0.17, -0.005], color: '#fbfbf8' }, 1);
      const jib = new THREE.Shape();
      jib.moveTo(0, 0);
      jib.lineTo(0, 0.95);
      jib.lineTo(0.42, 0);
      jib.closePath();
      b.extrude(jib, 0.01, { position: [0.08, 0.17, 0.01], color: '#f1f1ee' }, 1);
      break;
    }
  }
}

/** Geometry pair for instanced fleets: white paint (tinted per instance) and lights. */
export function vehicleGeometry(kind: VehicleKind, glow: number) {
  const b = new MeshBuilder();
  const g = new MeshBuilder(glow);
  vehicle(b, g, kind, '#ffffff');
  return { body: b.build(), lights: g.empty ? null : g.build() };
}
