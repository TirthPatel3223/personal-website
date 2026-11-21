import * as THREE from 'three';
import type { Accent } from '../core/palette';
import { smoothstep } from '../core/math';

/* The archipelago's layout and the camera's flight plan. Islands sit on a ring;
   the camera flies around the outside, stopping once per project. Sibling projects
   share an island (two stops). The order here IS the tour order: reorder the arrays
   to change it. */

export type IslandId = 'workshop' | 'park' | 'mri' | 'airport' | 'village' | 'hub' | 'town';

export interface IslandDef {
  id: IslandId;
  name: string;
  accent: Accent;
  projects: string[];
  radius: number;
  y: number;
}

export const ISLANDS: IslandDef[] = [
  { id: 'workshop', name: 'Puzzle Workshop', accent: 'teal', projects: ['deep-cube-solver', 'puzzle-lab'], radius: 15, y: 0 },
  { id: 'park', name: 'Theme Park', accent: 'amber', projects: ['mapblazer-wait-time-prediction', 'mapblazer-route-optimization'], radius: 17, y: 2 },
  { id: 'mri', name: 'Hospital', accent: 'violet', projects: ['knee-mri-data-efficiency'], radius: 15.5, y: -1.5 },
  { id: 'airport', name: 'Airport', accent: 'blue', projects: ['airline-crew-pairing-rl'], radius: 17.5, y: 1.2 },
  { id: 'village', name: 'Airbnb Village', accent: 'rausch', projects: ['airbnb-superhost-rdd'], radius: 16.5, y: -0.8 },
  { id: 'hub', name: 'Campus', accent: 'indigo', projects: ['course-rag-pipeline'], radius: 15.5, y: 1.6 },
  { id: 'town', name: 'Weather Town', accent: 'sky', projects: ['weather-dining-pipeline'], radius: 15.5, y: -0.5 },
];

export const RING_RADIUS = 68;
export const FOV = 30;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

/** Island 0 sits at the front of the ring (+z), the rest follow anticlockwise. */
export function islandAngle(i: number) {
  return Math.PI / 2 + (i / ISLANDS.length) * Math.PI * 2;
}

export function islandPosition(i: number): [number, number, number] {
  const a = islandAngle(i);
  return [Math.cos(a) * RING_RADIUS, ISLANDS[i].y, Math.sin(a) * RING_RADIUS];
}

/** Rotate an island so its local +z (the "front" of each diorama) faces outward. */
export function islandFacing(i: number) {
  return Math.PI / 2 - islandAngle(i);
}

export interface Stop {
  project: string;
  island: number;
  /** Which side of the screen the overlay card takes on wide screens. */
  side: 1 | -1;
  phiOffset: number;
  zoom: number;
}

export const STOPS: Stop[] = ISLANDS.flatMap((isl, i) =>
  isl.projects.map((project, j) => ({
    project,
    island: i,
    side: 1 as 1 | -1,
    phiOffset: isl.projects.length > 1 ? (j === 0 ? -0.08 : 0.09) : 0,
    zoom: isl.projects.length > 1 && j === 1 ? 0.86 : 1,
  })),
).map((s, k) => ({ ...s, side: (k % 2 === 0 ? 1 : -1) as 1 | -1 }));

export const STOP_COUNT = STOPS.length;

export interface Pose {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

export const makePose = (): Pose => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() });

const UP = new THREE.Vector3(0, 1, 0);
const tmpF = new THREE.Vector3();
const tmpR = new THREE.Vector3();

interface OrbitParams {
  phi: number;
  dist: number;
  y: number;
  shift: number;
  radius: number;
}

function stopParams(stop: Stop, aspect: number): OrbitParams {
  const isl = ISLANDS[stop.island];
  const wide = aspect > 1;
  // Distance that fits the island in ~60% of a wide screen, or the full width of a tall one.
  const frac = wide ? 0.6 : 0.86;
  const dist = Math.max(40, (2.2 * isl.radius) / (2 * Math.max(aspect, 0.42) * TAN * frac)) * stop.zoom;
  return { phi: islandAngle(stop.island) + stop.phiOffset, dist, y: isl.y, shift: stop.side, radius: isl.radius };
}

function orbitPose(o: OrbitParams, aspect: number, out: Pose) {
  const c = Math.cos(o.phi);
  const s = Math.sin(o.phi);
  const elevation = 0.46;
  out.look.set(c * RING_RADIUS, o.y + 2.2, s * RING_RADIUS);
  out.pos.set(c * (RING_RADIUS + o.dist), o.y + 2.2 + o.dist * elevation, s * (RING_RADIUS + o.dist));
  // Slide the aim point so the island sits beside the card (wide) or above it (tall).
  tmpF.subVectors(out.look, out.pos).normalize();
  if (aspect > 1) {
    tmpR.crossVectors(tmpF, UP).normalize();
    const visibleWidth = 2 * o.dist * aspect * TAN;
    out.look.addScaledVector(tmpR, -o.shift * visibleWidth * 0.2);
  } else {
    const visibleHeight = 2 * o.dist * TAN;
    out.look.y -= visibleHeight * 0.2;
  }
}

/** Wide overview of the whole ring, used for the hero (and the outro, from higher). */
function overviewPose(aspect: number, out: Pose, high: boolean) {
  const span = RING_RADIUS * 2 + 36;
  const wide = aspect > 1;
  const frac = wide ? 0.47 : 1;
  const dist = Math.min(460, span / (2 * Math.max(aspect, 0.42) * TAN * frac));
  const el = high ? 0.95 : 0.5;
  out.pos.set(0, Math.sin(el) * dist, Math.cos(el) * dist);
  out.look.set(0, -6, 0);
  if (wide && !high) {
    // Push the ring right of the hero text.
    const visibleWidth = 2 * dist * aspect * TAN;
    out.look.x -= visibleWidth * 0.26;
    out.pos.x -= visibleWidth * 0.26;
  }
}

const A = makePose();
const B = makePose();

const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/**
 * Camera pose for a keyframe position kf: 0 = hero overview, 1..N = the stops,
 * N + 1 = the high outro. Each stop holds for part of its scroll span.
 */
export function poseAt(kf: number, aspect: number, out: Pose) {
  const N = STOP_COUNT;
  const k = Math.max(0, Math.min(N + 1, kf));
  if (k < 1) {
    overviewPose(aspect, A, false);
    orbitPose(stopParams(STOPS[0], aspect), aspect, B);
    const t = smoothstep(0, 1, k);
    out.pos.lerpVectors(A.pos, B.pos, t);
    out.look.lerpVectors(A.look, B.look, t);
    return;
  }
  if (k >= N) {
    orbitPose(stopParams(STOPS[N - 1], aspect), aspect, A);
    overviewPose(aspect, B, true);
    const t = smoothstep(0, 1, k - N);
    out.pos.lerpVectors(A.pos, B.pos, t);
    out.look.lerpVectors(A.look, B.look, t);
    return;
  }
  const i = Math.floor(k);
  const u = smoothstep(0.3, 0.88, k - i);
  const a = stopParams(STOPS[i - 1], aspect);
  const b = stopParams(STOPS[i], aspect);
  orbitPose(
    {
      phi: lerpAngle(a.phi, b.phi, u),
      dist: a.dist + (b.dist - a.dist) * u + Math.sin(u * Math.PI) * 16,
      y: a.y + (b.y - a.y) * u,
      shift: a.shift + (b.shift - a.shift) * u,
      radius: a.radius,
    },
    aspect,
    out,
  );
}
