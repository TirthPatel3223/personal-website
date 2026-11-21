import type { Kit, V2, V3 } from './types';

/* Roads, footpaths and painted markings. Ground layers stack a few hundredths apart
   so they never z-fight: grass 0, sidewalks to 0.04, asphalt to 0.06, paint 0.065. */

export interface RoadOpts {
  closed?: boolean;
  line?: 'dash' | 'solid' | 'none';
  lineColor?: string;
  /** Extra width on each side for a sidewalk. */
  sidewalk?: number;
  color?: string;
  sidewalkColor?: string;
}

function strips(k: Kit, pts: V2[], width: number, closed: boolean, y: number, h: number, color: string) {
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 1e-4) continue;
    k.lit.box(len, h, width, {
      position: [(ax + bx) / 2, y, (az + bz) / 2],
      rotation: [0, Math.atan2(az - bz, bx - ax), 0],
      color,
    });
  }
  pts.forEach(([x, z], i) => {
    if (!closed && (i === 0 || i === pts.length - 1)) return;
    k.lit.cylinder(width / 2, width / 2, h, 10, { position: [x, y, z], color });
  });
}

function paint(k: Kit, pts: V2[], closed: boolean, y: number, color: string, dash: number, gap: number, w = 0.05) {
  const n = closed ? pts.length : pts.length - 1;
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 1e-4) continue;
    const ux = (bx - ax) / len;
    const uz = (bz - az) / len;
    const yaw = Math.atan2(az - bz, bx - ax);
    for (let d = carry; d < len; d += dash + gap) {
      const e = Math.min(len, d + dash);
      if (e - d < 0.05) continue;
      const m = (d + e) / 2;
      k.lit.box(e - d, 0.01, w, { position: [ax + ux * m, y, az + uz * m], rotation: [0, yaw, 0], color });
    }
    carry = ((carry - len) % (dash + gap) + dash + gap) % (dash + gap);
  }
}

/** A road along ground points, with an optional sidewalk and centre line. */
export function road(k: Kit, pts: V2[], width: number, o: RoadOpts = {}) {
  const closed = o.closed ?? false;
  if (o.sidewalk) strips(k, pts, width + o.sidewalk * 2, closed, 0.02, 0.04, o.sidewalkColor ?? k.p.path);
  strips(k, pts, width, closed, 0.035, 0.05, o.color ?? k.p.asphalt);
  const line = o.line ?? 'dash';
  if (line !== 'none') {
    const c = o.lineColor ?? (k.p.mode === 'dark' ? '#c9ccd2' : '#f8f9fa');
    if (line === 'dash') paint(k, pts, closed, 0.065, c, 0.32, 0.3);
    else paint(k, pts, closed, 0.065, c, 1e3, 0);
  }
}

/** A footpath (paving colour, no markings). */
export function footpath(k: Kit, pts: V2[], width: number, closed = false, color?: string) {
  strips(k, pts, width, closed, 0.02, 0.04, color ?? k.p.path);
}

/** Painted dashes along a polyline (taxiway centre lines, lane edges). */
export function dashes(k: Kit, pts: V2[], color: string, dash = 0.3, gap = 0.3, w = 0.05, y = 0.065, closed = false) {
  paint(k, pts, closed, y, color, dash, gap, w);
}

/** Zebra crossing centred at (x, z) across a road running along `angle`. */
export function crosswalk(k: Kit, x: number, z: number, angle: number, roadWidth: number, depth = 0.5) {
  const n = Math.floor(roadWidth / 0.12);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let i = 0; i < n; i++) {
    const t = -roadWidth / 2 + (i + 0.5) * (roadWidth / n);
    // Stripes run along the road; they are spread across it.
    k.lit.box(depth, 0.01, 0.06, { position: [x - s * t, 0.066, z - c * t], rotation: [0, angle, 0], color: '#f1f3f5' });
  }
}

/** A sloped road through 3D points (hill roads), level across its width. */
export function road3(k: Kit, pts: V3[], width: number, color?: string, edge?: string) {
  const c = color ?? k.p.asphalt;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    k.lit.beam([a[0], a[1] + 0.03, a[2]], [b[0], b[1] + 0.03, b[2]], width, 0.06, { color: c });
    if (edge) {
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const len = Math.hypot(dx, dz) || 1;
      const nx = (-dz / len) * (width / 2 + 0.03);
      const nz = (dx / len) * (width / 2 + 0.03);
      for (const s of [-1, 1]) {
        k.lit.beam(
          [a[0] + nx * s, a[1] + 0.09, a[2] + nz * s],
          [b[0] + nx * s, b[1] + 0.09, b[2] + nz * s],
          0.05,
          0.1,
          { color: edge },
        );
      }
    }
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y, z] = pts[i];
    k.lit.cylinder(width / 2, width / 2, 0.06, 10, { position: [x, y + 0.03, z], color: c });
  }
}

/** Sample a smooth closed or open curve through control points (Catmull-Rom), every `step`. */
export function smoothPath(ctrl: V2[], closed: boolean, step = 0.4): V2[] {
  const n = ctrl.length;
  const out: V2[] = [];
  const segs = closed ? n : n - 1;
  const get = (i: number) => (closed ? ctrl[((i % n) + n) % n] : ctrl[Math.max(0, Math.min(n - 1, i))]);
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const m = Math.max(2, Math.ceil(len / step));
    for (let j = 0; j < m; j++) {
      const t = j / m;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(ctrl[n - 1]);
  return out;
}
