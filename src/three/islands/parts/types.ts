import type { MeshBuilder } from '../../core/builder';
import type { Rng } from '../../core/math';
import type { ScenePalette } from '../../core/palette';
import type { SignSpec } from './signs';

/** Everything an island's static build writes into: one draw call per builder. */
export interface Kit {
  /** Flat-shaded, vertex-coloured, lit. */
  lit: MeshBuilder;
  /** Unlit, HDR at night: windows, lamps, neon. */
  glow: MeshBuilder;
  /** Translucent: glass walls, holograms. */
  glass: MeshBuilder;
  signs: SignSpec[];
  p: ScenePalette;
  rng: Rng;
}

export type V3 = [number, number, number];
export type V2 = [number, number];
