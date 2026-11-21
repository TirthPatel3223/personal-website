import * as THREE from 'three';
import type { MeshBuilder } from '../../core/builder';
import type { ScenePalette } from '../../core/palette';

/* An airliner and a helicopter. The airliner is a twin-engine narrow-body, about 5.2
   long with a 5.0 span (real proportions), nose along +x, built from a lathed
   fuselage, two separate swept wings with dihedral, underwing engines, a swept fin
   and tailplanes. With the gear down its wheels touch y = -0.62. */

export interface AirlinerOpts {
  gearDown?: boolean;
  /** Fuselage stripe, fin and engine colour. */
  livery: string;
  scale?: number;
}

export function airliner(b: MeshBuilder, g: MeshBuilder, p: ScenePalette, o: AirlinerOpts) {
  const s = o.scale ?? 1;
  const S = (v: number) => v * s;
  const body = p.mode === 'dark' ? '#e6ecf4' : '#f6f8fb';
  const wing = p.mode === 'dark' ? '#aeb8c6' : '#c9d1dc';
  const night = p.mode === 'dark';

  // Fuselage: a lathe about y, turned onto x.
  const prof: Array<[number, number]> = [
    [0, 2.62], [0.12, 2.55], [0.22, 2.43], [0.28, 2.24], [0.3, 1.98], [0.3, -1.45],
    [0.28, -1.8], [0.22, -2.2], [0.13, -2.5], [0.04, -2.62],
  ];
  b.lathe(prof.map(([r, y]) => [S(r), S(y)] as [number, number]), 14, { rotation: [0, 0, -Math.PI / 2], color: body });

  // Cheatline and windows.
  b.box(S(3.9), S(0.035), S(0.612), { position: [S(0.15), S(-0.03), 0], color: o.livery });
  for (let x = -1.7; x <= 1.75; x += 0.17) {
    for (const z of [-0.297, 0.297]) {
      (night ? g : b).box(S(0.07), S(0.055), S(0.012), { position: [S(x), S(0.085), S(z)], color: night ? p.window : '#2a3647' });
    }
  }
  // Cockpit glazing.
  for (const z of [-0.12, 0.12]) {
    b.box(S(0.16), S(0.07), S(0.1), { position: [S(2.36), S(0.12), S(z)], rotation: [0, 0, -0.5], color: '#1d2836' });
  }

  // Wings: separate left and right, swept back, low on the fuselage, with dihedral.
  const wingPts: Array<[number, number]> = [
    [0.62, 0.22], [-0.78, 0.22], [-1.38, 2.5], [-0.92, 2.5],
  ].map(([x, z]) => [S(x), S(z)]);
  b.slab(wingPts, 0, S(0.06), { position: [0, S(-0.16), 0], rotation: [-0.07, 0, 0], color: wing });
  b.slab(
    wingPts.map(([x, z]) => [x, -z] as [number, number]).reverse(),
    0,
    S(0.06),
    { position: [0, S(-0.16), 0], rotation: [0.07, 0, 0], color: wing },
  );
  // Wing-to-body fairing.
  b.box(S(1.5), S(0.14), S(0.5), { position: [S(-0.1), S(-0.24), 0], color: body });

  // Engines under the wings.
  for (const z of [-1.02, 1.02]) {
    b.cylinder(S(0.17), S(0.15), S(0.78), 12, { position: [S(0.34), S(-0.36), S(z)], rotation: [0, 0, Math.PI / 2], color: o.livery });
    b.cylinder(S(0.145), S(0.145), S(0.02), 12, { position: [S(0.735), S(-0.36), S(z)], rotation: [0, 0, Math.PI / 2], color: '#1b1f27' });
    b.cylinder(S(0.08), S(0.05), S(0.12), 8, { position: [S(-0.1), S(-0.36), S(z)], rotation: [0, 0, Math.PI / 2], color: '#5b6270' });
    b.box(S(0.5), S(0.12), S(0.05), { position: [S(0.25), S(-0.22), S(z)], color: wing });
  }

  // Tailplanes and fin.
  const tailPts: Array<[number, number]> = [
    [-1.82, 0.12], [-2.42, 0.12], [-2.62, 1.05], [-2.32, 1.05],
  ].map(([x, z]) => [S(x), S(z)]);
  b.slab(tailPts, 0, S(0.04), { position: [0, S(0.06), 0], color: wing });
  b.slab(tailPts.map(([x, z]) => [x, -z] as [number, number]).reverse(), 0, S(0.04), { position: [0, S(0.06), 0], color: wing });
  const fin = new THREE.Shape();
  fin.moveTo(S(-1.7), S(0.2));
  fin.lineTo(S(-2.55), S(0.2));
  fin.lineTo(S(-2.66), S(1.3));
  fin.lineTo(S(-2.32), S(1.3));
  fin.closePath();
  b.extrude(fin, S(0.06), { position: [0, 0, S(-0.03)], color: o.livery }, 1);

  // Gear.
  if (o.gearDown) {
    const tyre = '#1b1f27';
    b.cylinder(S(0.025), S(0.025), S(0.3), 5, { position: [S(1.95), S(-0.42), 0], color: '#8b93a1' });
    b.cylinder(S(0.07), S(0.07), S(0.1), 8, { position: [S(1.95), S(-0.55), 0], rotation: [Math.PI / 2, 0, 0], color: tyre });
    for (const z of [-0.42, 0.42]) {
      b.cylinder(S(0.03), S(0.03), S(0.32), 5, { position: [S(-0.32), S(-0.4), S(z)], color: '#8b93a1' });
      b.cylinder(S(0.08), S(0.08), S(0.16), 8, { position: [S(-0.32), S(-0.54), S(z)], rotation: [Math.PI / 2, 0, 0], color: tyre });
    }
  }

  // Navigation lights: red on the left (port) tip, green on the right, white tail, red beacon.
  g.ico(S(0.05), 0, { position: [S(-1.15), S(-0.0), S(-2.5)], color: '#ff3b3b' });
  g.ico(S(0.05), 0, { position: [S(-1.15), S(-0.0), S(2.5)], color: '#3bff7a' });
  g.ico(S(0.04), 0, { position: [S(-2.64), S(0.05), 0], color: '#ffffff' });
  g.ico(S(0.04), 0, { position: [S(0.2), S(0.32), 0], color: '#ff4040' });
}

/** A light helicopter (air ambulance), nose along +x, skids on y = 0. */
export function helicopter(b: MeshBuilder, g: MeshBuilder, color: string, stripe: string) {
  b.ico(0.32, 1, { position: [0.05, 0.4, 0], scale: [1.35, 0.85, 0.85], color });
  b.box(0.2, 0.12, 0.3, { position: [0.38, 0.42, 0], rotation: [0, 0, -0.4], color: '#1d2836' });
  b.beam([-0.3, 0.45, 0], [-1.2, 0.58, 0], 0.08, 0.08, { color });
  b.beam([-0.05, 0.33, 0], [-0.6, 0.45, 0], 0.27, 0.06, { color: stripe });
  b.box(0.2, 0.28, 0.03, { position: [-1.18, 0.7, 0], rotation: [0, 0, 0.3], color: stripe });
  for (const z of [-0.24, 0.24]) {
    b.beam([-0.4, 0.02, z], [0.45, 0.02, z], 0.03, 0.03, { color: '#3d4350' });
    b.beam([-0.15, 0.03, z], [-0.1, 0.22, z * 0.6], 0.025, 0.025, { color: '#3d4350' });
    b.beam([0.25, 0.03, z], [0.2, 0.22, z * 0.6], 0.025, 0.025, { color: '#3d4350' });
  }
  b.cylinder(0.03, 0.03, 0.12, 5, { position: [0, 0.72, 0], color: '#3d4350' });
  b.box(2.0, 0.015, 0.07, { position: [0, 0.79, 0], rotation: [0, 0.6, 0], color: '#2b2f38' });
  b.box(2.0, 0.015, 0.07, { position: [0, 0.79, 0], rotation: [0, 0.6 + Math.PI / 2, 0], color: '#2b2f38' });
  g.ico(0.03, 0, { position: [-0.3, 0.68, 0], color: '#ff3b3b' });
}
