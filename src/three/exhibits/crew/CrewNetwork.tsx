'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { glowMaterial, litMaterial } from '../../core/materials';
import type { ScenePalette } from '../../core/palette';
import { useJetGeometry } from '../../islands/kit';
import { currentTrip, EV_ADD, EV_START, isDropped, type CrewReplay, type ReplayIndex } from './crewData';

/* The month of flying as a hub-and-spoke tower. The three crew bases stand as pillars
   in the middle, the outstations on a wide ring around them (the repo dashboard's
   layout), and time runs upward through the month. Almost every flight goes between
   a base and an outstation, so each leg is a spoke from a pillar to the ring at the
   height of its day. Outbound and return legs bend to opposite sides, so a round trip
   reads as a petal. Colour says what has happened to each flight, not which pairing
   it is in: the trip being built is white, critical connections are red. */

export const R = 12;
export const H = 15;
const SEG = 12;
const BEND = 0.1;
const LIFT = 0.16;
/** Where the calendar ruler stands, in radians around the ring. */
export const RULER_ANGLE = -0.32;
export const RULER_R = R + 2.3;
/** Below this stage width the ruler's date labels are hidden (see .crew-label-day). */
const COMPACT_STAGE = 600;

export interface CrewTones {
  waiting: [string, number];
  covered: [string, number];
  dropped: [string, number];
  active: string;
  critical: string;
  ride: string;
  option: string;
  base: string;
  pole: string;
  floor: string;
  ring: string;
  background: string;
}

export function crewTones(p: ScenePalette): CrewTones {
  const dark = p.mode === 'dark';
  return dark
    ? {
        waiting: ['#7b8ba3', 0.09],
        covered: ['#60a5fa', 0.5],
        dropped: ['#a78bfa', 0.55],
        active: '#ffffff',
        critical: '#f87171',
        ride: '#fbbf24',
        option: '#cbd5e1',
        base: p.accent.blue,
        pole: '#3b4a61',
        floor: '#0e182b',
        ring: '#22314a',
        background: '#0a1120',
      }
    : {
        waiting: ['#64748b', 0.12],
        covered: ['#2563eb', 0.42],
        dropped: ['#7c3aed', 0.5],
        active: '#0f172a',
        critical: '#dc2626',
        ride: '#d97706',
        option: '#475569',
        base: p.accent.blue,
        pole: '#b7c2d3',
        floor: '#e2e8f1',
        ring: '#c3cddb',
        background: '#eef2f8',
      };
}

/* ── Geometry ───────────────────────────────────────────────────────── */

export interface CrewLayout {
  /** Pole position per airport. */
  xz: Array<[number, number]>;
  y: (minutes: number) => number;
  days: number;
  /** Per leg: start, bezier control, end (9 floats). */
  ctl: Float32Array;
}

export function useCrewLayout(replay: CrewReplay, days: number): CrewLayout {
  return useMemo(() => {
    const xz = replay.pos.map(([x, z]) => [x * R, z * R] as [number, number]);
    const y = (t: number) => (t / (days * 1440)) * H;
    const ctl = new Float32Array(replay.legs.length * 9);
    replay.legs.forEach(([a, b, ta, tb], i) => {
      const [x0, z0] = xz[a];
      const [x1, z1] = xz[b];
      const y0 = y(ta);
      const y1 = y(tb);
      const dx = x1 - x0;
      const dz = z1 - z0;
      // Bend to the right of travel, so out and back legs form a petal.
      ctl.set([x0, y0, z0, (x0 + x1) / 2 + dz * BEND, (y0 + y1) / 2 + 2 * LIFT, (z0 + z1) / 2 - dx * BEND, x1, y1, z1], i * 9);
    });
    return { xz, y, days, ctl };
  }, [replay, days]);
}

export function legPoint(ctl: Float32Array, leg: number, t: number, out: THREE.Vector3) {
  const o = leg * 9;
  const u = 1 - t;
  const a = u * u;
  const b = 2 * u * t;
  const c = t * t;
  return out.set(
    a * ctl[o] + b * ctl[o + 3] + c * ctl[o + 6],
    a * ctl[o + 1] + b * ctl[o + 4] + c * ctl[o + 7],
    a * ctl[o + 2] + b * ctl[o + 5] + c * ctl[o + 8],
  );
}

/* Fat lines (screen-space width) with a fixed capacity, refilled in place so a long
   replay never reallocates GPU buffers. */
function makeFat(capacity: number, width: number, opts: { dashed?: boolean; dash?: number; gap?: number; opacity?: number } = {}) {
  const geo = new LineSegmentsGeometry();
  geo.setPositions(new Float32Array(Math.max(1, capacity) * 6));
  geo.setColors(new Float32Array(Math.max(1, capacity) * 6));
  const mat = new LineMaterial({
    vertexColors: true,
    linewidth: width,
    transparent: true,
    opacity: opts.opacity ?? 1,
    depthWrite: false,
    toneMapped: false,
    dashed: !!opts.dashed,
    dashSize: opts.dash ?? 0.3,
    gapSize: opts.gap ?? 0.2,
  });
  const line = new LineSegments2(geo, mat);
  if (opts.dashed) line.computeLineDistances();
  line.frustumCulled = false;
  geo.instanceCount = 0;
  return line;
}

class FatWriter {
  private pos: Float32Array;
  private col: Float32Array;
  private dist: Float32Array | null;
  private n = 0;
  private run = 0;
  constructor(private line: LineSegments2) {
    const g = line.geometry;
    this.pos = (g.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.array as Float32Array;
    this.col = (g.attributes.instanceColorStart as THREE.InterleavedBufferAttribute).data.array as Float32Array;
    const d = g.attributes.instanceDistanceStart as THREE.InterleavedBufferAttribute | undefined;
    this.dist = d ? (d.data.array as Float32Array) : null;
  }
  get capacity() {
    return this.pos.length / 6;
  }
  /** Start a new dash run (each leg's dashes start fresh). */
  restart() {
    this.run = 0;
  }
  seg(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Color, c2: THREE.Color = c) {
    if (this.n >= this.capacity) return;
    const o = this.n * 6;
    this.pos[o] = a.x;
    this.pos[o + 1] = a.y;
    this.pos[o + 2] = a.z;
    this.pos[o + 3] = b.x;
    this.pos[o + 4] = b.y;
    this.pos[o + 5] = b.z;
    this.col[o] = c.r;
    this.col[o + 1] = c.g;
    this.col[o + 2] = c.b;
    this.col[o + 3] = c2.r;
    this.col[o + 4] = c2.g;
    this.col[o + 5] = c2.b;
    if (this.dist) {
      const len = a.distanceTo(b);
      this.dist[this.n * 2] = this.run;
      this.dist[this.n * 2 + 1] = this.run + len;
      this.run += len;
    }
    this.n++;
  }
  leg(ctl: Float32Array, leg: number, c: THREE.Color, tmpA: THREE.Vector3, tmpB: THREE.Vector3) {
    this.restart();
    legPoint(ctl, leg, 0, tmpA);
    for (let s = 1; s <= SEG; s++) {
      legPoint(ctl, leg, s / SEG, tmpB);
      this.seg(tmpA, tmpB, c);
      tmpA.copy(tmpB);
    }
  }
  begin() {
    this.n = 0;
    this.run = 0;
  }
  end() {
    const g = this.line.geometry;
    (g.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
    (g.attributes.instanceColorStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
    const d = g.attributes.instanceDistanceStart as THREE.InterleavedBufferAttribute | undefined;
    if (d) d.data.needsUpdate = true;
    g.instanceCount = this.n;
  }
}

function hdr(hex: string, gain: number) {
  return new THREE.Color(hex).multiplyScalar(gain);
}

/* ── Labels ─────────────────────────────────────────────────────────── */

export type LabelEls = RefObject<Map<string, HTMLElement | null>>;
export type LabelAlign = 'center' | 'right' | 'above';
/** `stack` labels (the base tags) are lifted clear of each other when they collide. */
type Anchor = { key: string; pos: THREE.Vector3; align: LabelAlign; stack?: boolean };

/** DOM labels live in an overlay over the canvas; this moves them to their 3D anchors. */
function LabelProjector({ anchors, movers, els }: { anchors: Anchor[]; movers: Array<{ key: string; at: RefObject<THREE.Vector3 | null>; align: LabelAlign }>; els: LabelEls }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  const sizes = useRef(new WeakMap<HTMLElement, [number, number]>());
  useFrame(({ camera, size }) => {
    const map = els.current;
    if (!map) return;
    const project = (pos: THREE.Vector3 | null) => {
      if (!pos) return null;
      v.copy(pos).project(camera);
      if (v.z > 1 || v.z < -1) return null;
      return [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height] as const;
    };
    const put = (el: HTMLElement, x: number, y: number, align: LabelAlign) => {
      const shift = align === 'right' ? 'translate(6px, -50%)' : align === 'above' ? 'translate(-50%, calc(-100% - 10px))' : 'translate(-50%, -50%)';
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) ${shift}`;
      el.style.visibility = 'visible';
    };
    const placed: Array<[number, number, number, number]> = [];
    const stacked: Array<{ el: HTMLElement; x: number; y: number; align: LabelAlign }> = [];
    const place = (key: string, pos: THREE.Vector3 | null, align: LabelAlign, stack?: boolean) => {
      const el = map.get(key);
      if (!el) return;
      const at = project(pos);
      if (!at) {
        el.style.visibility = 'hidden';
        return;
      }
      if (stack) stacked.push({ el, x: at[0], y: at[1], align });
      else put(el, at[0], at[1], align);
    };
    for (const a of anchors) place(a.key, a.pos, a.align, a.stack);
    for (const m of movers) place(m.key, m.at.current, m.align);
    // Lift colliding tags (the three bases sit close together on small screens).
    stacked.sort((p, q) => q.y - p.y);
    for (const s of stacked) {
      let wh = sizes.current.get(s.el);
      if (!wh || wh[0] === 0) {
        wh = [s.el.offsetWidth, s.el.offsetHeight];
        sizes.current.set(s.el, wh);
      }
      const [w, h] = wh;
      let y = s.y;
      for (let guard = 0; guard < 4; guard++) {
        const hit = placed.find(([px, py, pw, ph]) => Math.abs(px - s.x) < (pw + w) / 2 + 3 && Math.abs(py - y) < (ph + h) / 2 + 2);
        if (!hit) break;
        y = hit[1] - (hit[3] + h) / 2 - 3;
      }
      placed.push([s.x, y, w, h]);
      put(s.el, s.x, y, s.align);
    }
  });
  return null;
}

/** Days marked on the calendar ruler. */
export function rulerDays(days: number) {
  const out: number[] = [];
  for (let d = 1; d <= days; d += 7) out.push(d);
  return out;
}

/** Keeps the whole tower in frame at any stage shape. It walks the camera along its
    current direction until every anchor, padded by the size of the label it carries,
    lands inside the stage. On narrow (phone) stages the calendar ruler would leave the
    tower off-centre, so a horizontal lens shift re-centres the content. */
type FitPoint = { p: THREE.Vector3; l: number; r: number; t: number; b: number };
function FitCamera({ target }: { target: THREE.Vector3 }) {
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const points = useMemo(() => {
    const out: FitPoint[] = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      out.push({ p: new THREE.Vector3(Math.cos(a) * (R + 1.05), -0.25, Math.sin(a) * (R + 1.05)), l: 20, r: 20, t: 8, b: 8 });
      out.push({ p: new THREE.Vector3(Math.cos(a) * R, H, Math.sin(a) * R), l: 4, r: 4, t: 4, b: 4 });
    }
    out.push({ p: new THREE.Vector3(0, H + 0.55, 0), l: 30, r: 30, t: 34, b: 0 });
    return out;
  }, []);
  // The ruler's labels: the dates need room on wide stages; phones hide them (CSS).
  const ruler = useMemo(() => {
    const rx = Math.cos(RULER_ANGLE) * (RULER_R + 0.6);
    const rz = Math.sin(RULER_ANGLE) * (RULER_R + 0.6);
    return {
      wide: [0, H / 2, H].map((yy) => ({ p: new THREE.Vector3(rx, yy, rz), l: 0, r: 104, t: 10, b: 10 })),
      compact: [0, H].map((yy) => ({ p: new THREE.Vector3(rx, yy, rz), l: 2, r: 4, t: 2, b: 2 })),
    };
  }, []);
  useEffect(() => {
    if (width < 2 || height < 2) return;
    const state = get();
    const camera = state.camera as THREE.PerspectiveCamera;
    const controls = state.controls as unknown as { update: () => void } | null;
    const narrow = width / height < 1.1;
    const all = [...points, ...(width < COMPACT_STAGE ? ruler.compact : ruler.wide)];
    const dir = camera.position.clone().sub(target).normalize();
    const v = new THREE.Vector3();
    camera.filmOffset = 0;
    camera.updateProjectionMatrix();
    // Pixel bounds of the padded anchors at a given distance.
    const bounds = (dist: number) => {
      camera.position.copy(target).addScaledVector(dir, dist);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const f of all) {
        v.copy(f.p).project(camera);
        const x = (v.x * 0.5 + 0.5) * width;
        const y = (-v.y * 0.5 + 0.5) * height;
        x0 = Math.min(x0, x - f.l);
        x1 = Math.max(x1, x + f.r);
        y0 = Math.min(y0, y - f.t);
        y1 = Math.max(y1, y + f.b);
      }
      return { x0, x1, y0, y1 };
    };
    const M = 8;
    const fits = (dist: number) => {
      const b = bounds(dist);
      const okX = narrow ? b.x1 - b.x0 <= width - 2 * M : b.x0 >= M && b.x1 <= width - M;
      return okX && b.y0 >= M && b.y1 <= height - M;
    };
    let lo = 8;
    let hi = 300;
    for (let i = 0; i < 26; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    const b = bounds(hi);
    if (narrow) {
      // Shift the lens so the padded content sits in the middle of the stage.
      const c = ((b.x0 + b.x1) / 2 - width / 2) / (width / 2);
      camera.filmOffset = c * (width / height) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.getFilmWidth();
    }
    camera.updateProjectionMatrix();
    controls?.update();
  }, [width, height, get, target, points, ruler]);
  return null;
}

/* ── Scene ──────────────────────────────────────────────────────────── */

export default function CrewNetwork({
  replay,
  index,
  step,
  palette,
  showAlternatives,
  flightSeconds,
  labels,
  target,
}: {
  replay: CrewReplay;
  index: ReplayIndex;
  step: number;
  palette: ScenePalette;
  showAlternatives: boolean;
  flightSeconds: number;
  labels: LabelEls;
  target: THREE.Vector3;
}) {
  const tones = useMemo(() => crewTones(palette), [palette]);
  const dark = palette.mode === 'dark';
  const layout = useCrewLayout(replay, index.days);
  const { ctl, xz, y } = layout;
  const n = replay.legs.length;
  const baseSet = useMemo(() => new Set(replay.bases), [replay]);
  const outstations = useMemo(() => replay.airports.map((_, i) => i).filter((i) => !baseSet.has(i)), [replay, baseSet]);

  /* Every leg, thin, coloured by what has happened to it. RGBA so waiting legs can
     sit far back. */
  const legLines = useMemo(() => {
    const pos = new Float32Array(n * SEG * 2 * 3);
    const tmp = new THREE.Vector3();
    let o = 0;
    for (let l = 0; l < n; l++) {
      for (let s = 0; s < SEG; s++) {
        legPoint(ctl, l, s / SEG, tmp);
        pos.set([tmp.x, tmp.y, tmp.z], o);
        legPoint(ctl, l, (s + 1) / SEG, tmp);
        pos.set([tmp.x, tmp.y, tmp.z], o + 3);
        o += 6;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * SEG * 2 * 4), 4));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false });
    const line = new THREE.LineSegments(g, m);
    line.renderOrder = 0;
    return line;
  }, [ctl, n]);

  const fat = useMemo(() => {
    const critTotal = index.legCritical.reduce((s, v) => s + v, 0);
    let rideTotal = 0;
    for (let l = 0; l < n; l++) if (index.legRidden[l] >= 0) rideTotal++;
    let maxTrip = 0;
    index.pairingSteps.forEach((s) => (maxTrip = Math.max(maxTrip, s.length)));
    const critical = makeFat(critTotal * SEG, 2.4);
    const ride = makeFat(rideTotal * SEG, 1.7, { dashed: true, dash: 0.3, gap: 0.24, opacity: 0.7 });
    const active = makeFat(maxTrip * (SEG + 1) + 4, 3.6);
    const options = makeFat(8 * SEG, 1.6, { dashed: true, dash: 0.14, gap: 0.16, opacity: 0.85 });
    ride.renderOrder = 1;
    critical.renderOrder = 2;
    active.renderOrder = 3;
    options.renderOrder = 4;
    return {
      critical,
      ride,
      active,
      options,
      w: { critical: new FatWriter(critical), ride: new FatWriter(ride), active: new FatWriter(active), options: new FatWriter(options) },
    };
  }, [index, n]);

  /* Static frame: outstation poles, the calendar ruler with day ticks, week rings. */
  const frame = useMemo(() => {
    const pts: number[] = [];
    const col: number[] = [];
    const push = (a: number[], b: number[], c: THREE.Color, alpha: number) => {
      pts.push(...a, ...b);
      col.push(c.r, c.g, c.b, alpha, c.r, c.g, c.b, alpha);
    };
    const pole = new THREE.Color(tones.pole);
    const ring = new THREE.Color(tones.ring);
    for (const i of outstations) {
      const [x, z] = xz[i];
      push([x, 0, z], [x, H, z], pole, 0.9);
    }
    const rx = Math.cos(RULER_ANGLE) * RULER_R;
    const rz = Math.sin(RULER_ANGLE) * RULER_R;
    const ox = Math.cos(RULER_ANGLE);
    const oz = Math.sin(RULER_ANGLE);
    const top = y(layout.days * 1440);
    push([rx, 0, rz], [rx, top, rz], ring, 1);
    for (let d = 0; d <= layout.days; d++) {
      const yy = y(d * 1440);
      const week = d % 7 === 0;
      const len = week ? 0.55 : 0.25;
      push([rx, yy, rz], [rx + ox * len, yy, rz + oz * len], ring, 1);
      if (week) {
        for (let s = 0; s < 96; s++) {
          const a0 = (s / 96) * Math.PI * 2;
          const a1 = ((s + 1) / 96) * Math.PI * 2;
          push([Math.cos(a0) * R, yy, Math.sin(a0) * R], [Math.cos(a1) * R, yy, Math.sin(a1) * R], ring, 0.55);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    return g;
  }, [outstations, xz, y, layout.days, tones]);
  const frameMat = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }), []);

  /* Small red beads where a critical connection happens: on the airport's pole, at the
     moment the crew leaves after too little time on the ground. */
  const beadTotal = useMemo(() => Math.max(1, index.legCritical.reduce((sum, v) => sum + v, 0)), [index]);
  const beadGeo = useMemo(() => new THREE.SphereGeometry(0.16, 12, 8), []);
  const beadMat = useMemo(() => new THREE.MeshBasicMaterial({ color: hdr(tones.critical, dark ? 1.6 : 1), toneMapped: false }), [tones, dark]);
  const beadsRef = useRef<THREE.InstancedMesh>(null);

  /* Highlighted outstation poles for the airports the current trip touches. */
  const hotPoles = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(outstations.length * 6), 3));
    g.setDrawRange(0, 0);
    const line = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color: hdr(tones.active, dark ? 1 : 1), transparent: true, opacity: dark ? 0.55 : 0.45, depthWrite: false, toneMapped: false }),
    );
    line.frustumCulled = false;
    return line;
  }, [outstations, tones, dark]);

  useEffect(
    () => () => {
      legLines.geometry.dispose();
      (legLines.material as THREE.Material).dispose();
    },
    [legLines],
  );
  useEffect(
    () => () => {
      for (const l of [fat.critical, fat.ride, fat.active, fat.options]) {
        l.geometry.dispose();
        l.material.dispose();
      }
    },
    [fat],
  );
  useEffect(() => () => frame.dispose(), [frame]);
  useEffect(() => () => frameMat.dispose(), [frameMat]);
  useEffect(() => () => beadGeo.dispose(), [beadGeo]);
  useEffect(() => () => beadMat.dispose(), [beadMat]);
  useEffect(
    () => () => {
      hotPoles.geometry.dispose();
      (hotPoles.material as THREE.Material).dispose();
    },
    [hotPoles],
  );

  const trip = useMemo(() => currentTrip(replay, index, step), [replay, index, step]);

  /* Repaint for the current step. */
  useEffect(() => {
    const c = new THREE.Color();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const waiting = new THREE.Color(tones.waiting[0]);
    const covered = new THREE.Color(tones.covered[0]);
    const dropped = new THREE.Color(tones.dropped[0]);
    const red = new THREE.Color(tones.critical);
    const activeC = hdr(tones.active, dark ? 1.9 : 1);
    const activeWait = hdr(tones.active, dark ? 1.2 : 1);
    const redHot = hdr(tones.critical, dark ? 1.35 : 1);
    const droppedHot = hdr(tones.dropped[0], dark ? 1.4 : 1);
    const rideC = new THREE.Color(tones.ride);
    const optionC = new THREE.Color(tones.option);
    const activePairing = trip ? trip.pairing : -1;

    // Thin layer.
    const colors = legLines.geometry.getAttribute('color') as THREE.BufferAttribute;
    const arr = colors.array as Float32Array;
    for (let l = 0; l < n; l++) {
      const flown = index.legFlown[l] >= 0 && index.legFlown[l] < step;
      const p = index.legPairing[l];
      let alpha: number;
      if (flown && p === activePairing) alpha = 0;
      else if (flown && isDropped(index, p, step)) {
        c.copy(dropped);
        alpha = tones.dropped[1];
      } else if (flown && index.legCritical[l]) {
        c.copy(red);
        alpha = 0.6;
      } else if (flown) {
        c.copy(covered);
        alpha = tones.covered[1];
      } else {
        c.copy(waiting);
        alpha = tones.waiting[1];
      }
      const start = l * SEG * 2 * 4;
      for (let v = 0; v < SEG * 2; v++) {
        const o = start + v * 4;
        arr[o] = c.r;
        arr[o + 1] = c.g;
        arr[o + 2] = c.b;
        arr[o + 3] = alpha;
      }
    }
    colors.needsUpdate = true;

    // Critical connections: the leg flown after too short a wait, plus a bead.
    const wc = fat.w.critical;
    wc.begin();
    let beadCount = 0;
    const m = new THREE.Matrix4();
    for (let l = 0; l < n; l++) {
      if (!index.legCritical[l] || index.legFlown[l] < 0 || index.legFlown[l] >= step) continue;
      if (index.legPairing[l] !== activePairing) wc.leg(ctl, l, redHot, a, b);
      legPoint(ctl, l, 0, a);
      m.makeTranslation(a.x, a.y, a.z);
      beadsRef.current?.setMatrixAt(beadCount++, m);
    }
    wc.end();
    const bm = beadsRef.current;
    if (bm) {
      bm.count = beadCount;
      bm.instanceMatrix.needsUpdate = true;
    }

    // Crews riding as passengers (trips that were later dropped never happened).
    const wr = fat.w.ride;
    wr.begin();
    for (let l = 0; l < n; l++) {
      if (index.legRidden[l] < 0 || index.legRidden[l] >= step) continue;
      if (isDropped(index, index.legRider[l], step)) continue;
      wr.leg(ctl, l, rideC, a, b);
    }
    wr.end();

    // The trip being built: its legs and the waits between them on the poles.
    const wa = fat.w.active;
    wa.begin();
    const hot = new Set<number>();
    if (trip) {
      const tone = trip.status === 'dropped' ? droppedHot : activeC;
      let prevLeg = -1;
      for (const s of trip.steps) {
        const [, , leg, dh, , , , , , crit] = replay.steps[s];
        if (prevLeg >= 0) {
          const [, arrA, , arrT] = replay.legs[prevLeg];
          const [x, z] = xz[arrA];
          a.set(x, y(arrT), z);
          b.set(x, y(replay.legs[leg][2]), z);
          wa.restart();
          wa.seg(a, b, crit ? redHot : trip.status === 'dropped' ? droppedHot : activeWait);
        }
        // Passenger rides keep their dashed layer, except on a dropped trip.
        if (trip.status === 'dropped') wa.leg(ctl, leg, tone, a, b);
        else if (!dh) wa.leg(ctl, leg, crit ? redHot : tone, a, b);
        hot.add(replay.legs[leg][0]);
        hot.add(replay.legs[leg][1]);
        prevLeg = leg;
      }
    }
    wa.end();

    // The options it passed on at its latest decision.
    const wo = fat.w.options;
    wo.begin();
    const last = step > 0 ? replay.steps[step - 1] : null;
    if (showAlternatives && last) {
      for (const [action, leg, , chosen] of last[5]) {
        if (leg < 0 || chosen || action === 3 || leg === last[2]) continue;
        wo.leg(ctl, leg, optionC, a, b);
      }
    }
    wo.end();

    // Light up the poles of the airports this trip visits.
    const hp = hotPoles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const harr = hp.array as Float32Array;
    let k = 0;
    for (const i of hot) {
      if (baseSet.has(i)) continue;
      const [x, z] = xz[i];
      harr.set([x, 0, z, x, H, z], k * 6);
      k++;
    }
    hp.needsUpdate = true;
    hotPoles.geometry.setDrawRange(0, k * 2);
  }, [step, trip, replay, index, n, ctl, xz, y, tones, dark, legLines, fat, hotPoles, baseSet, showAlternatives, beadTotal]);

  /* ── Moving parts: the jet, the "now" ring and the labels that follow them. ── */
  const { lit, glow } = useJetGeometry(palette, palette.accent.blue);
  const jet = useRef<THREE.Group>(null);
  const crewDot = useRef<THREE.Mesh>(null);
  const nowRing = useRef<THREE.LineLoop>(null);
  const flight = useRef({ leg: -1, t: 1, step: -1 });
  const planeAt = useRef<THREE.Vector3 | null>(null);
  const nowAt = useRef<THREE.Vector3 | null>(null);
  const nowY = useRef(-1);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), d: new THREE.Vector3(), q: new THREE.Vector3(), plane: new THREE.Vector3(), now: new THREE.Vector3() }), []);

  // The leg the crew is on: the newest leg of the current trip.
  const flyingLeg = trip && trip.steps.length ? replay.steps[trip.steps[trip.steps.length - 1]][2] : -1;
  const freshLeg = step > 0 && (replay.steps[step - 1][0] === EV_START || replay.steps[step - 1][0] === EV_ADD);

  useFrame((_, dt) => {
    const f = flight.current;
    if (flyingLeg !== f.leg) {
      // Only a leg added in normal play is flown; after a scrub the crew is shown landed.
      f.t = freshLeg && step > f.step && step - f.step <= 2 ? 0 : 1;
      f.leg = flyingLeg;
    }
    f.step = step;
    const g = jet.current;
    const dot = crewDot.current;
    if (g && dot) {
      if (flyingLeg < 0 || trip?.status === 'dropped') {
        g.visible = false;
        dot.visible = false;
        planeAt.current = null;
      } else {
        f.t = flightSeconds <= 0 ? 1 : Math.min(1, f.t + dt / flightSeconds);
        const e = f.t < 1 ? f.t * f.t * (3 - 2 * f.t) : 1;
        legPoint(ctl, flyingLeg, e, tmp.p);
        legPoint(ctl, flyingLeg, Math.min(1, e + 0.02), tmp.q);
        legPoint(ctl, flyingLeg, Math.max(0, e - 0.02), tmp.d);
        tmp.q.sub(tmp.d);
        g.visible = true;
        g.position.copy(tmp.p);
        dot.visible = true;
        dot.position.copy(tmp.p);
        g.rotation.set(0, Math.atan2(-tmp.q.z, tmp.q.x), 0);
        tmp.plane.copy(tmp.p).y += 0.7;
        planeAt.current = tmp.plane;
      }
    }
    // The "now" ring rides at the departure time of the leg the crew is on.
    const ring = nowRing.current;
    if (ring) {
      if (flyingLeg < 0) {
        ring.visible = false;
        nowAt.current = null;
      } else {
        const want = y(replay.legs[flyingLeg][2]);
        nowY.current = nowY.current < 0 ? want : THREE.MathUtils.damp(nowY.current, want, 6, dt);
        ring.visible = true;
        ring.position.y = nowY.current;
        nowAt.current = tmp.now.set(Math.cos(RULER_ANGLE) * (RULER_R + 0.6), nowY.current, Math.sin(RULER_ANGLE) * (RULER_R + 0.6));
      }
    }
  });

  const nowGeo = useMemo(() => {
    const pts: number[] = [];
    for (let s = 0; s < 128; s++) {
      const a = (s / 128) * Math.PI * 2;
      pts.push(Math.cos(a) * (R + 0.15), 0, Math.sin(a) * (R + 0.15));
    }
    return new THREE.Float32BufferAttribute(pts, 3);
  }, []);

  const anchors = useMemo<Anchor[]>(() => {
    const out: Anchor[] = [];
    replay.bases.forEach((bi) => {
      const [x, z] = xz[bi];
      out.push({ key: `apt-${bi}`, pos: new THREE.Vector3(x, H + 0.55, z), align: 'above', stack: true });
    });
    for (const i of outstations) {
      const [x, z] = xz[i];
      const s = (R + 1.05) / R;
      out.push({ key: `apt-${i}`, pos: new THREE.Vector3(x * s, -0.25, z * s), align: 'center' });
    }
    for (const d of rulerDays(layout.days)) {
      out.push({
        key: `day-${d}`,
        pos: new THREE.Vector3(Math.cos(RULER_ANGLE) * (RULER_R + 0.6), y((d - 1) * 1440), Math.sin(RULER_ANGLE) * (RULER_R + 0.6)),
        align: 'right',
      });
    }
    return out;
  }, [replay, xz, outstations, layout.days, y]);
  const movers = useMemo(
    () => [
      { key: 'plane', at: planeAt, align: 'above' as const },
      { key: 'now', at: nowAt, align: 'right' as const },
    ],
    [],
  );

  const activeBase = trip ? trip.base : -1;

  return (
    <group>
      <primitive object={legLines} />
      <lineSegments geometry={frame} material={frameMat} />
      <primitive object={hotPoles} />
      <primitive object={fat.ride} />
      <primitive object={fat.critical} />
      <primitive object={fat.active} />
      <primitive object={fat.options} />
      <instancedMesh key={beadTotal} ref={beadsRef} args={[beadGeo, beadMat, beadTotal]} count={0} frustumCulled={false} renderOrder={5} />

      {/* Floor, with a tinted hub where the bases stand. */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R + 1.9, 96]} />
        <meshStandardMaterial color={tones.floor} roughness={0.9} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R * 0.2 + 1.3, 64]} />
        <meshBasicMaterial color={tones.base} transparent opacity={dark ? 0.12 : 0.14} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Outstation markers on the floor. */}
      {outstations.map((i) => (
        <mesh key={i} position={[xz[i][0], 0.02, xz[i][1]]}>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 16]} />
          <meshStandardMaterial color={tones.pole} roughness={0.6} />
        </mesh>
      ))}

      {/* The crew bases: pillars through the whole month. */}
      {replay.bases.map((bi) => {
        const on = bi === activeBase;
        return (
          <group key={bi} position={[xz[bi][0], 0, xz[bi][1]]}>
            <mesh position={[0, H / 2, 0]}>
              <cylinderGeometry args={[0.2, 0.2, H, 20]} />
              <meshStandardMaterial
                color={tones.base}
                emissive={tones.base}
                emissiveIntensity={on ? (dark ? 1.6 : 0.5) : dark ? 0.45 : 0.15}
                roughness={0.4}
                transparent
                opacity={on ? 1 : 0.8}
                toneMapped={!dark}
              />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.55, 0.62, 0.12, 24]} />
              <meshStandardMaterial color={tones.base} roughness={0.5} />
            </mesh>
          </group>
        );
      })}

      <lineLoop ref={nowRing} visible={false}>
        <bufferGeometry>
          <primitive object={nowGeo} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color={hdr(tones.active, dark ? 1.3 : 1)} transparent opacity={dark ? 0.38 : 0.4} depthWrite={false} toneMapped={false} />
      </lineLoop>

      {/* The crew: a glowing marker under the jet, so its place in the tangle is obvious. */}
      <mesh ref={crewDot} visible={false} renderOrder={6}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshBasicMaterial color={hdr(tones.active, dark ? 2.4 : 1)} toneMapped={false} />
      </mesh>
      <group ref={jet} scale={1.4} visible={false}>
        <mesh geometry={lit} material={litMaterial()} />
        <mesh geometry={glow} material={glowMaterial()} />
      </group>

      <LabelProjector anchors={anchors} movers={movers} els={labels} />
      <FitCamera target={target} />
    </group>
  );
}
