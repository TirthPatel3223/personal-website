import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* Collects many small primitives (boxes, cones, cylinders...) into ONE vertex-coloured
   geometry. A whole island of props then costs a single draw call, which is what lets
   seven dioramas run at full frame rate on a laptop GPU.

   Two builders are used per island: a lit one (flat-shaded standard material) and a
   glow one (unlit, tone mapping off) whose colours are scaled by an HDR multiplier so
   windows and neon pick up bloom in dark mode. */

type V3 = [number, number, number];

export interface PartOptions {
  position?: V3;
  rotation?: V3;
  /** Overrides `rotation` when set. */
  quaternion?: THREE.Quaternion;
  scale?: V3 | number;
  color?: string;
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const C = new THREE.Color();
const D = new THREE.Vector3();

export class MeshBuilder {
  private parts: THREE.BufferGeometry[] = [];

  constructor(private readonly intensity = 1) {}

  add(source: THREE.BufferGeometry, o: PartOptions = {}): this {
    const g = source.index ? source.toNonIndexed() : source.clone();
    source.dispose();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'color') g.deleteAttribute(name);
    }

    const r = o.rotation ?? [0, 0, 0];
    const s = o.scale ?? 1;
    if (o.quaternion) Q.copy(o.quaternion);
    else {
      E.set(r[0], r[1], r[2]);
      Q.setFromEuler(E);
    }
    if (typeof s === 'number') S.set(s, s, s);
    else S.set(s[0], s[1], s[2]);
    const p = o.position ?? [0, 0, 0];
    P.set(p[0], p[1], p[2]);
    M.compose(P, Q, S);
    g.applyMatrix4(M);

    const count = g.getAttribute('position').count;
    const existing = g.getAttribute('color') as THREE.BufferAttribute | undefined;
    // Mirroring scales flip the winding; flip it back so faces keep pointing out.
    if (S.x * S.y * S.z < 0) {
      const a = g.getAttribute('position') as THREE.BufferAttribute;
      const swap = (attr: THREE.BufferAttribute) => {
        for (let i = 0; i < attr.count; i += 3) {
          for (let c = 0; c < attr.itemSize; c++) {
            const t = attr.getComponent(i + 1, c);
            attr.setComponent(i + 1, c, attr.getComponent(i + 2, c));
            attr.setComponent(i + 2, c, t);
          }
        }
      };
      swap(a);
      if (existing) swap(existing);
    }
    if (o.color !== undefined || !existing) {
      C.set(o.color ?? '#ffffff').multiplyScalar(this.intensity);
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        arr[i * 3] = C.r;
        arr[i * 3 + 1] = C.g;
        arr[i * 3 + 2] = C.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    } else if (this.intensity !== 1) {
      const arr = existing.array as Float32Array;
      for (let i = 0; i < arr.length; i++) arr[i] *= this.intensity;
    }
    this.parts.push(g);
    return this;
  }

  box(w: number, h: number, d: number, o: PartOptions = {}) {
    return this.add(new THREE.BoxGeometry(w, h, d), o);
  }

  cylinder(rTop: number, rBottom: number, h: number, segments: number, o: PartOptions = {}) {
    return this.add(new THREE.CylinderGeometry(rTop, rBottom, h, segments), o);
  }

  cone(r: number, h: number, segments: number, o: PartOptions = {}) {
    return this.add(new THREE.ConeGeometry(r, h, segments), o);
  }

  ico(r: number, detail: number, o: PartOptions = {}) {
    return this.add(new THREE.IcosahedronGeometry(r, detail), o);
  }

  torus(radius: number, tube: number, radial: number, tubular: number, o: PartOptions = {}) {
    return this.add(new THREE.TorusGeometry(radius, tube, radial, tubular), o);
  }

  tube(curve: THREE.Curve<THREE.Vector3>, segments: number, radius: number, sides: number, o: PartOptions = {}) {
    return this.add(new THREE.TubeGeometry(curve, segments, radius, sides, false), o);
  }

  /** A box whose top face is scaled by (sx, sz): car cabins, hipped roofs, plinths. */
  taperBox(w: number, h: number, d: number, sx: number, sz: number, o: PartOptions = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) pos.setXYZ(i, pos.getX(i) * sx, pos.getY(i), pos.getZ(i) * sz);
    }
    return this.add(g, o);
  }

  /** A box running from point a to point b (beams, rails, cables, sloped roads). It stays level across its width. */
  beam(a: V3, b: V3, w: number, h = w, o: PartOptions = {}) {
    D.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = D.length();
    if (len < 1e-6) return this;
    const yaw = Math.atan2(-D.z, D.x);
    const pitch = Math.atan2(D.y, Math.hypot(D.x, D.z));
    E.set(0, yaw, pitch, 'YZX');
    const q = new THREE.Quaternion().setFromEuler(E);
    E.set(0, 0, 0, 'XYZ');
    return this.box(len, h, w, {
      ...o,
      position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
      quaternion: q,
    });
  }

  /** A thin rod from a to b (cylinder): poles, cables, spokes. */
  rod(a: V3, b: V3, r: number, segments = 5, o: PartOptions = {}) {
    D.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = D.length();
    if (len < 1e-6) return this;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), D.normalize());
    return this.cylinder(r, r, len, segments, {
      ...o,
      position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
      quaternion: q,
    });
  }

  /** A slab whose outline is given as ground points (x, z), from height y0 to y1. */
  slab(points: Array<[number, number]>, y0: number, y1: number, o: PartOptions = {}, holes: Array<Array<[number, number]>> = []) {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
    for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
    const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 6 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0, 0);
    return this.add(g, o);
  }

  /** Extrude a 2D shape (in its own x, y) along +z by `depth`. */
  extrude(shape: THREE.Shape, depth: number, o: PartOptions = {}, curveSegments = 12) {
    return this.add(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments }), o);
  }

  /** Revolve a profile of (radius, height) points about the y axis. */
  lathe(profile: Array<[number, number]>, segments: number, o: PartOptions = {}) {
    return this.add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments), o);
  }

  /** Append another builder's parts, transformed (a prefab placed in the scene). */
  stamp(other: MeshBuilder, o: PartOptions = {}) {
    if (other.empty) return this;
    return this.add(other.build(), o);
  }

  /** A flat strip between two ground points (paths, runways, roads). */
  strip(ax: number, az: number, bx: number, bz: number, width: number, y: number, o: PartOptions = {}) {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    return this.box(len, 0.06, width, {
      ...o,
      position: [(ax + bx) / 2, y, (az + bz) / 2],
      rotation: [0, -Math.atan2(dz, dx), 0],
    });
  }

  get empty() {
    return this.parts.length === 0;
  }

  build(): THREE.BufferGeometry {
    if (this.parts.length === 0) return new THREE.BufferGeometry();
    const merged = mergeGeometries(this.parts, false) ?? new THREE.BufferGeometry();
    for (const part of this.parts) part.dispose();
    this.parts = [];
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    return merged;
  }
}
