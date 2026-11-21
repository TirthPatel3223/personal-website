/* The Maltese Gear Cube solver's five stages, shared by the results chart and the
   "how the solver works" exhibit. Stage sizes from the solver's docs (coset counts), mean
   moves from the 100-scramble benchmark (quarter turns per stage). Names are the
   plain-language versions: corners, gear parity, gear rotation, gear colour, ring. */
export type StageMethod = 'table' | 'net';

export interface MalteseStage {
  name: string;
  /** Label for tight spaces (the exhibit's stage picker). */
  short: string;
  what: string;
  positions: string;
  method: StageMethod;
  moves: number;
}

export const MALTESE_STAGES: MalteseStage[] = [
  { name: 'Corners', short: 'Corners', what: 'the 7 corners', positions: '3.7 million', method: 'table', moves: 10.5 },
  { name: 'Gear angles, part 1', short: 'Gear angles 1', what: 'each gear, roughly', positions: '8.4 million', method: 'table', moves: 27.2 },
  { name: 'Gear angles, part 2', short: 'Gear angles 2', what: 'each gear, exactly', positions: '8.4 million', method: 'table', moves: 48.8 },
  { name: 'Gear positions', short: 'Gear positions', what: 'which gear sits where', positions: '3.2×10¹⁵', method: 'net', moves: 88.4 },
  { name: 'The ring', short: 'The ring', what: 'edges and centres', positions: '5.4×10²²', method: 'net', moves: 247.4 },
];

/** Mean quarter turns per verified solution, after back-to-back turns are merged. */
export const MALTESE_MEAN_MOVES = 406;

/**
 * The one real solve the exhibit's images show (scripts/3d/maltese-stage-solve.json): a
 * 3,000-move scramble, the quarter turns each stage spent, and the merged total. Every
 * stage boundary was replayed and checked on the simulator (export-maltese-stages.gen.mjs).
 */
export const MALTESE_STAGE_SOLVE = {
  scrambleMoves: 3000,
  perStage: [12, 28, 50, 128, 264],
  total: 452,
};
