/* Small, dependency-free helpers shared by the scenes. Everything random is seeded,
   so an island looks the same on every visit and in every theme. */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (rng: Rng, min: number, max: number) => min + (max - min) * rng();

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Frame-rate independent exponential approach (lambda ~ 1/seconds). */
export const dampFactor = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rotate (x, z) about the y axis. */
export function rotY(x: number, z: number, angle: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c + z * s, -x * s + z * c];
}
