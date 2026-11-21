/**
 * Exports what the "how the solver works" stage images need: the Maltese Gear Cube's filleted piece
 * shapes (the simulator's full-quality bodies, with the core) and every piece's pose at each stage
 * boundary of one real solve.
 *
 * The solve comes from maltese-stage-solve.json, written by maltese-stage-solve.py (the ladder solver,
 * one rung at a time). Here the scramble and each stage's moves are replayed on the simulator's own
 * engine, and each boundary is checked: after stage 1 every corner is home, after stage 2 every gear
 * angle is even, after stage 3 every gear is flat, after stage 4 every gear is on its own face, after
 * stage 5 the cube is solved. A failed check is an error, so the images can only show what happened.
 *
 * Run from the simulator checkout (it has vitest and manifold-3d), with absolute paths:
 *   cd ../Cube_Modeling
 *   npx vitest run --root <abs>/scripts/3d --config <abs>/scripts/3d/maltese-stages.vitest.config.mjs
 * Env: SIM_DIR (default ../../../Cube_Modeling from this file), OUT (default render/maltese-stages.json
 * next to this file; it is render input only, ~5 MB, and is not committed).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SIM = resolve(process.env.SIM_DIR ?? join(HERE, '../../../Cube_Modeling'));
const OUT = resolve(process.env.OUT ?? join(HERE, 'render/maltese-stages.json'));
const SOLVE = join(HERE, 'maltese-stage-solve.json');

const r5 = (x) => Math.round(x * 1e5) / 1e5;
const flat = (arr) => Array.from(arr, r5);

it('exports the Maltese stage poses', async () => {
  const src = (p) => join(SIM, 'src', p);
  const { loadManifoldKernel } = await import(src('render/manifold.ts'));
  const { buildMalteseGeometry, defaultFillet } = await import(src('maltese/render/pieces.ts'));
  const { PIECES } = await import(src('maltese/model.ts'));
  const { MalteseState } = await import(src('maltese/state.ts'));
  const { GEAR_SLOTS } = await import(src('maltese/geometry.ts'));
  const { COLORS, LOOK } = await import(src('maltese/config.ts'));
  const { parseAlgorithm } = await import(src('maltese/notation.ts'));

  const solve = JSON.parse(readFileSync(SOLVE, 'utf8'));
  const parse = (text) => {
    const r = parseAlgorithm(text);
    if (!r.ok) throw new Error(r.error);
    return r.moves;
  };

  const gears = PIECES.filter((p) => p.kind === 'gear');
  const checks = [
    (st) => PIECES.every((p) => p.kind !== 'corner' || st.ori[p.id] === p.homeOri),
    (st) => gears.every((p) => st.ori[p.id] % 2 === 0),
    (st) => gears.every((p) => st.ori[p.id] === 0),
    (st) => gears.every((p) => GEAR_SLOTS[st.slot[p.id]].face === GEAR_SLOTS[p.home].face),
    (st) => st.isSolved(),
  ];

  const st = MalteseState.solved();
  st.applyAll(parse(solve.scramble));
  if (st.isSolved()) throw new Error('the scramble leaves the cube solved');
  const poses = [PIECES.map((p) => flat(st.matrix(p.id)))];
  solve.stages.forEach((stage, i) => {
    // Each earlier check must still hold: a stage only uses moves that keep earlier stages solved.
    st.applyAll(parse(stage.moves));
    for (let k = 0; k <= i; k++) {
      if (!checks[k](st)) throw new Error(`after stage ${i + 1} (${stage.rung}) check ${k + 1} fails`);
    }
    poses.push(PIECES.map((p) => flat(st.matrix(p.id))));
  });

  const wasm = await loadManifoldKernel();
  const geo = buildMalteseGeometry(wasm, defaultFillet());
  const body = (m) => ({ positions: flat(m.positions), normals: flat(m.normals), indices: Array.from(m.indices) });
  const proto = (p) => ({
    body: body(p.body),
    stickers: p.stickers.map((s) => ({ positions: flat(s.positions), indices: Array.from(s.indices), normal: Array.from(s.normal) })),
  });

  const data = {
    format: 'maltese-stages/1',
    source: 'combinatorics-puzzle-simulator (src/maltese) + deeprubik-ladder solve, scripts/3d/export-maltese-stages.gen.mjs',
    colors: COLORS,
    body: LOOK.bodyColor,
    coreColor: LOOK.coreColor,
    protos: { corner: proto(geo.corner), centre: proto(geo.centre), edge: proto(geo.edge), gear: proto(geo.gear) },
    core: body(geo.core),
    pieces: PIECES.map((p) => ({ kind: p.kind, colors: p.colors, name: p.name })),
    stages: solve.stages.map((s) => ({ rung: s.rung, cost: s.cost })),
    poses,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data));
  console.log(`wrote ${OUT}: ${poses.length} poses, every stage check passed`);
});
