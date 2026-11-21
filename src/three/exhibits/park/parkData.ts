/* Data, walkways and the timeline for the Mapblazer park exhibit. The layout JSON
   comes from scripts/3d/build-park-layout.py: one plot per ride (positions loosely
   follow the solver's walking times, spread out so every ride is visible), walkways
   along the plot borders, and a gate at the front. The itinerary is the route
   README's worked example, with the real walking minutes of every leg. */

export type RideKind = 'entrance' | 'dark' | 'show' | 'spinner' | 'water' | 'coaster' | 'train';
export type V2 = [number, number];

export interface ParkNode {
  id: number;
  name: string;
  kind: RideKind;
  variant: string;
  duration: number | null;
  /** Model centre. */
  x: number;
  z: number;
  /** Nominal footprint radius of the model, and the scale it is drawn at. */
  r?: number;
  scale?: number;
  /** Yaw that turns the model's front (local +z) towards its walkway. */
  yaw?: number;
  /** Walkway vertex where the ride's queue begins. */
  entry: number;
  cell?: V2[];
}

export interface ParkStop {
  id: number;
  arrive: string;
  queue: number;
  ride: number;
  /** Walk minutes from the previous stop (or the gate). */
  walk: number;
}

export interface ParkData {
  park: string;
  radius: number;
  island: number;
  plaza: { x: number; z: number; cell: V2[] };
  paths: { v: V2[]; e: Array<[number, number]>; gate: number; hub: number };
  nodes: ParkNode[];
  itinerary: ParkStop[];
  returnWalk: number;
}

/** Names exactly as stored, except a text-encoding artefact in the source data. */
export function displayName(name: string) {
  return name.replace(/â€™/g, '’');
}

const DAY_START = 9 * 60;

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m - DAY_START;
}

export function formatClock(t: number) {
  const total = DAY_START + Math.floor(t + 1e-6);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/* ── Places ─────────────────────────────────────────────────────────── */

/** Unit vector a ride faces (its front, where the queue is). */
export function facing(n: ParkNode): V2 {
  const yaw = n.yaw ?? 0;
  return [Math.sin(yaw), Math.cos(yaw)];
}

/** The ride's entrance arch, between its model and its walkway. */
export function archPoint(n: ParkNode): V2 {
  const [fx, fz] = facing(n);
  const d = (n.r ?? 2) * (n.scale ?? 1) + 0.3;
  return [n.x + fx * d, n.z + fz * d];
}

/** Where visitors stand outside the gate before the day starts. */
export function forecourt(data: ParkData): V2 {
  return [0, data.radius + 2.2];
}

/* ── Walkway graph ──────────────────────────────────────────────────── */

export function adjacency(data: ParkData) {
  const adj: number[][] = data.paths.v.map(() => []);
  for (const [a, b] of data.paths.e) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
}

const dist = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Shortest walkway route between two vertices (Dijkstra; n is ~100). */
export function shortestPath(data: ParkData, adj: number[][], from: number, to: number): number[] {
  const n = data.paths.v.length;
  const d = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const done = new Array<boolean>(n).fill(false);
  d[from] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0 || u === to) break;
    done[u] = true;
    for (const v of adj[u]) {
      const nd = d[u] + dist(data.paths.v[u], data.paths.v[v]);
      if (nd < d[v]) {
        d[v] = nd;
        prev[v] = u;
      }
    }
  }
  const out = [to];
  while (out[0] !== from && prev[out[0]] >= 0) out.unshift(prev[out[0]]);
  return out;
}

/* ── The planned day ────────────────────────────────────────────────── */

export interface Leg {
  /** 0-based stop this leg walks to; equal to stops.length for the walk back to the gate. */
  stop: number;
  name: string;
  /** Polyline from the previous ride's arch (or outside the gate) to this one's. */
  pts: V2[];
  /** Walkway edges used, as "a-b" keys with a < b. */
  edges: string[];
  length: number;
  /** Distance along the whole day's route where this leg starts. */
  start: number;
  /** Times in minutes from 9:00. */
  leave: number;
  walk: number;
  arrive: number;
  queueEnd: number;
  rideEnd: number;
  queue: number;
  ride: number;
  node: ParkNode | null;
}

export const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/**
 * The README's day replayed on the walkways. Each leg leaves as soon as the last
 * ride ends, walks for the solver's walking minutes, and waits if it is early for the
 * planned slot (the lunch break before Indiana Jones). Arrival times then match the
 * README's table to the minute and the loop closes at 350 minutes.
 */
export function buildDay(data: ParkData): Leg[] {
  const adj = adjacency(data);
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const gateV = data.paths.gate;
  const fore = forecourt(data);
  const legs: Leg[] = [];
  let prevNode: ParkNode | null = null;
  let t = 0;
  let start = 0;
  const stops = data.itinerary.map((s) => ({ s, node: byId.get(s.id)! }));
  for (let k = 0; k <= stops.length; k++) {
    const target = k < stops.length ? stops[k] : null;
    const fromV = prevNode ? prevNode.entry : gateV;
    const toV = target ? target.node.entry : gateV;
    const route = shortestPath(data, adj, fromV, toV);
    const pts: V2[] = [];
    pts.push(prevNode ? archPoint(prevNode) : fore);
    for (const v of route) pts.push(data.paths.v[v]);
    pts.push(target ? archPoint(target.node) : fore);
    const clean = pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 1e-4);
    let length = 0;
    for (let i = 1; i < clean.length; i++) length += dist(clean[i - 1], clean[i]);
    const edges: string[] = [];
    for (let i = 1; i < route.length; i++) edges.push(edgeKey(route[i - 1], route[i]));
    const walk = target ? target.s.walk : data.returnWalk;
    const leave = t;
    const arrive = target ? Math.max(leave + walk, toMinutes(target.s.arrive)) : leave + walk;
    const queue = target ? target.s.queue : 0;
    const ride = target ? (target.node.duration ?? target.s.ride) : 0;
    legs.push({
      stop: k,
      name: target ? displayName(target.node.name) : 'the gate',
      pts: clean,
      edges,
      length,
      start,
      leave,
      walk,
      arrive,
      queueEnd: arrive + queue,
      rideEnd: arrive + queue + ride,
      queue,
      ride,
      node: target ? target.node : null,
    });
    start += length;
    t = arrive + queue + ride;
    prevNode = target ? target.node : null;
  }
  return legs;
}

export function dayEnd(legs: Leg[]) {
  return legs.length ? legs[legs.length - 1].rideEnd : 0;
}

export function routeLength(legs: Leg[]) {
  return legs.length ? legs[legs.length - 1].start + legs[legs.length - 1].length : 0;
}

export type Phase =
  | { kind: 'walk'; leg: Leg; f: number }
  | { kind: 'wait'; leg: Leg; lunch: boolean }
  | { kind: 'queue'; leg: Leg }
  | { kind: 'ride'; leg: Leg }
  | { kind: 'done'; leg: Leg };

export function phaseAt(legs: Leg[], t: number): Phase | null {
  if (!legs.length) return null;
  for (const leg of legs) {
    const walked = leg.leave + leg.walk;
    if (t < walked) return { kind: 'walk', leg, f: Math.max(0, (t - leg.leave) / Math.max(1e-6, leg.walk)) };
    if (!leg.node) break;
    if (t < leg.arrive) return { kind: 'wait', leg, lunch: t >= 240 && t < 300 };
    if (t < leg.queueEnd) return { kind: 'queue', leg };
    if (t < leg.rideEnd) return { kind: 'ride', leg };
  }
  return { kind: 'done', leg: legs[legs.length - 1] };
}

/** Point at distance d along a polyline. */
export function along(pts: V2[], d: number): { p: V2; dir: V2 } {
  let left = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = dist(a, b);
    if (left <= len || i === pts.length - 1) {
      const f = len > 1e-9 ? Math.min(1, left / len) : 0;
      const dir: V2 = len > 1e-9 ? [(b[0] - a[0]) / len, (b[1] - a[1]) / len] : [0, 1];
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], dir };
    }
    left -= len;
  }
  return { p: pts[pts.length - 1], dir: [0, 1] };
}

/** Where the visitor is at time t, and how far along the day's route they have come. */
export function visitorAt(legs: Leg[], t: number): { p: V2; dir: V2; progress: number; phase: Phase | null } {
  const phase = phaseAt(legs, t);
  if (!phase) return { p: [0, 0], dir: [0, 1], progress: 0, phase };
  const leg = phase.leg;
  if (phase.kind === 'walk') {
    const d = phase.f * leg.length;
    const { p, dir } = along(leg.pts, d);
    return { p, dir, progress: leg.start + d, phase };
  }
  const end = leg.pts[leg.pts.length - 1];
  const prev = leg.pts[leg.pts.length - 2] ?? end;
  const len = dist(end, prev) || 1;
  return { p: end, dir: [(end[0] - prev[0]) / len, (end[1] - prev[1]) / len], progress: leg.start + leg.length, phase };
}
