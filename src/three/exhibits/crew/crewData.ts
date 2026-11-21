/* Types and replay logic for the crew-pairing exhibit. The JSON is produced by
   scripts/3d/build-crew-data.mjs from the project's own replay files. */

export const EV_START = 0;
export const EV_ADD = 1;
export const EV_CLOSE = 2;
export const EV_STRAND = 3;

/** Ground time before a leg: quick turn (30 to 44 min), sit (45 min to 4 h), overnight rest. */
export const CONN_QUICK = 1;
export const CONN_SIT = 2;
export const CONN_REST = 3;

export type Step = [
  type: 0 | 1 | 2 | 3,
  pairing: number,
  leg: number,
  deadhead: 0 | 1,
  coverage1e5: number,
  considered: Array<[action: number, leg: number, q1000: number, chosen: 0 | 1]>,
  base: number,
  conn: 0 | 1 | 2 | 3,
  buffer: number,
  critical: 0 | 1,
];

export interface CrewReplay {
  id: string;
  title: string;
  crewClass: string;
  algo: string;
  instance: string;
  rules: { minSit: number; critSlack: number };
  bases: number[];
  airports: string[];
  /** Unit layout per airport: outstations on radius 1, bases on a small inner triangle. */
  pos: Array<[number, number]>;
  legs: Array<[dep: number, arr: number, depT: number, arrT: number]>;
  steps: Step[];
  summary: { coverage: number; covered: number; legs: number; pairings: number; stranded: number; critical: number };
}

export const DATASETS = [
  { id: 'cockpit-beam', label: 'Cockpit crew, beam search' },
  { id: 'cabin-astar', label: 'Cabin crew, best-first search' },
] as const;

export type DatasetId = (typeof DATASETS)[number]['id'];

export const ACTION_LABEL = ['Start with', 'Fly', 'Ride as passenger on', 'Finish the trip'];

/** Everything about the replay that does not depend on the current step. */
export interface ReplayIndex {
  /** Step at which a crew was given the leg to fly, or -1. */
  legFlown: Int32Array;
  /** Step at which a crew rode the leg as passengers, or -1. */
  legRidden: Int32Array;
  legPairing: Int32Array;
  /** Pairing whose crew rode the leg as passengers. */
  legRider: Int32Array;
  legCritical: Uint8Array;
  /** Step that finished or dropped each pairing. */
  pairingEnd: Map<number, { step: number; dropped: boolean }>;
  /** Steps that added a leg to each pairing, in order. */
  pairingSteps: Map<number, number[]>;
  /** Running totals after n steps (index n). */
  finished: Int32Array;
  dropped: Int32Array;
  critical: Int32Array;
  days: number;
}

export function buildIndex(r: CrewReplay): ReplayIndex {
  const n = r.legs.length;
  const legFlown = new Int32Array(n).fill(-1);
  const legRidden = new Int32Array(n).fill(-1);
  const legPairing = new Int32Array(n).fill(-1);
  const legRider = new Int32Array(n).fill(-1);
  const legCritical = new Uint8Array(n);
  const pairingEnd = new Map<number, { step: number; dropped: boolean }>();
  const pairingSteps = new Map<number, number[]>();
  const total = r.steps.length;
  const finished = new Int32Array(total + 1);
  const dropped = new Int32Array(total + 1);
  const critical = new Int32Array(total + 1);
  r.steps.forEach(([type, pairing, leg, dh, , , , , , crit], i) => {
    finished[i + 1] = finished[i];
    dropped[i + 1] = dropped[i];
    critical[i + 1] = critical[i] + crit;
    if ((type === EV_START || type === EV_ADD) && leg >= 0) {
      if (dh) {
        legRidden[leg] = i;
        legRider[leg] = pairing;
      } else {
        legFlown[leg] = i;
        legPairing[leg] = pairing;
        legCritical[leg] = crit;
      }
      const list = pairingSteps.get(pairing);
      if (list) list.push(i);
      else pairingSteps.set(pairing, [i]);
    }
    if (type === EV_CLOSE) {
      pairingEnd.set(pairing, { step: i, dropped: false });
      finished[i + 1]++;
    }
    if (type === EV_STRAND) {
      pairingEnd.set(pairing, { step: i, dropped: true });
      dropped[i + 1]++;
    }
  });
  let tMax = 0;
  for (const l of r.legs) tMax = Math.max(tMax, l[3]);
  return { legFlown, legRidden, legPairing, legRider, legCritical, pairingEnd, pairingSteps, finished, dropped, critical, days: Math.ceil(tMax / 1440) };
}

/** True when the pairing has been dropped by the time `upTo` steps have played. */
export function isDropped(ix: ReplayIndex, pairing: number, upTo: number) {
  const end = ix.pairingEnd.get(pairing);
  return !!end && end.dropped && end.step < upTo;
}

/** "Day 3, 14:05": times in the data are minutes from the start of the month. */
export function formatClock(min: number) {
  const day = Math.floor(min / 1440) + 1;
  const m = Math.round(min % 1440);
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `Day ${day}, ${hh}:${mm}`;
}

export function legRoute(r: CrewReplay, leg: number) {
  const [a, b] = r.legs[leg];
  return `${r.airports[a]} to ${r.airports[b]}`;
}

/** The trip the agent is working on after `upTo` steps, as the side panel lists it. */
export interface TripView {
  pairing: number;
  base: number;
  /** Steps that added its legs, oldest first. */
  steps: number[];
  status: 'building' | 'finished' | 'dropped';
}

export function currentTrip(r: CrewReplay, ix: ReplayIndex, upTo: number): TripView | null {
  // Before the first decision, and once the month is finished, nothing is highlighted.
  if (upTo <= 0 || upTo >= r.steps.length) return null;
  const last = r.steps[upTo - 1];
  const pairing = last[1];
  if (pairing < 0) return null;
  const all = ix.pairingSteps.get(pairing) ?? [];
  const steps = all.filter((s) => s < upTo);
  const firstStep = steps.length ? r.steps[steps[0]] : last;
  const status = last[0] === EV_CLOSE ? 'finished' : last[0] === EV_STRAND ? 'dropped' : 'building';
  return { pairing, base: firstStep[6] >= 0 ? firstStep[6] : last[6], steps, status };
}
