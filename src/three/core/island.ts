import * as THREE from 'three';
import { between, mulberry32 } from './math';
import type { ScenePalette } from './palette';

/* The floating-island body shared by every diorama: a flat grass top (props sit at
   y = 0), a short grass skirt, then a rocky underside that tapers to a point. Rims are
   shaped with a few seeded harmonics so no two islands share a silhouette. The result
   is non-indexed and vertex-coloured, ready to drop into a MeshBuilder. */
export function islandGeometry(
  seed: number,
  radius: number,
  depth: number,
  p: ScenePalette,
): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  // About one rim vertex per 2 units, so big islands keep a smooth outline.
  const N = Math.max(24, Math.round(radius * 3));
  const harmonics = [1, 2, 3, 5].map((k) => ({
    k,
    amp: between(rng, 0.03, 0.08) / Math.sqrt(k),
    phase: rng() * Math.PI * 2,
  }));
  const shape = (a: number) => 1 + harmonics.reduce((s, h) => s + h.amp * Math.sin(h.k * a + h.phase), 0);
  const angles = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2);

  const ring = (scale: number, y: number, jitter: number) =>
    angles.map((a) => {
      const r = radius * scale * shape(a) * (1 + (rng() - 0.5) * jitter);
      return new THREE.Vector3(Math.cos(a) * r, y + (rng() - 0.5) * jitter * 3, Math.sin(a) * r);
    });

  const skirt = 0.6;
  const top = ring(1, 0, 0);
  const inner = ring(0.55, 0, 0);
  const lip = ring(1.0, -skirt, 0.015);
  const r1 = ring(0.9, -skirt - depth * 0.26, 0.06);
  const r2 = ring(0.64, -skirt - depth * 0.55, 0.1);
  const r3 = ring(0.32, -skirt - depth * 0.82, 0.14);
  const tip = new THREE.Vector3(between(rng, -0.05, 0.05) * radius, -skirt - depth, between(rng, -0.05, 0.05) * radius);
  const center = new THREE.Vector3(0, 0, 0);

  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  const mixA = new THREE.Color();
  const mixB = new THREE.Color();

  const tri = (a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, color: THREE.Color) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
    for (let i = 0; i < 3; i++) col.push(color.r, color.g, color.b);
  };
  const shade = (from: string, to: string, t: number) => c.copy(mixA.set(from)).lerp(mixB.set(to), t);

  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    // Top: a fan to the inner ring, then the annulus out to the rim. Normals face +y.
    tri(center, inner[j], inner[i], shade(p.grass, p.grassDark, rng() * 0.35));
    tri(inner[i], top[j], top[i], shade(p.grass, p.grassDark, rng() * 0.45));
    tri(inner[i], inner[j], top[j], shade(p.grass, p.grassDark, rng() * 0.45));
  }

  const band = (u: THREE.Vector3[], l: THREE.Vector3[], from: string, to: string, spread: number) => {
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      tri(u[i], l[j], l[i], shade(from, to, rng() * spread));
      tri(u[i], u[j], l[j], shade(from, to, rng() * spread));
    }
  };
  band(top, lip, p.grassDark, p.grass, 0.25);
  band(lip, r1, p.dirt, p.rock, 0.35);
  band(r1, r2, p.rock, p.rockDark, 0.4);
  band(r2, r3, p.rockDark, p.rock, 0.25);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    tri(r3[i], r3[j], tip, shade(p.rockDark, p.rock, rng() * 0.2));
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
