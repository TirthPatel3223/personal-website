/**
 * Exports the real Maltese Gear Cube from the puzzle simulator (combinatorics-puzzle-simulator) for
 * the Puzzle Workshop island: the four piece shapes exactly as the simulator builds them
 * (manifold-3d, sharp edges: the island shows the cube small), each piece's sticker colours, and a
 * short turn sequence with every piece's pose before each turn, from the simulator's own exact engine.
 *
 * The island replays the turns the way the simulator's animator does: the face layer turns 90°, the
 * middle ring follows 45°, and each ring gear also spins 270° about its own axis.
 *
 * Run from the simulator checkout (it has vitest and manifold-3d):
 *   cd ../Cube_Modeling
 *   npx vitest run --root ../Personal_Website/scripts/3d --config ../Personal_Website/scripts/3d/maltese.vitest.config.mjs
 * Env: SIM_DIR (default ../../../Cube_Modeling from this file), OUT (default public/models/maltese-gear-cube.json).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SIM = resolve(process.env.SIM_DIR ?? join(HERE, '../../../Cube_Modeling'));
const OUT = resolve(process.env.OUT ?? join(HERE, '../../public/models/maltese-gear-cube.json'));

/** The turns the island plays: a short scramble, then its exact inverse. */
const SCRAMBLE = "R U' L U R' L'";

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const flat = (arr) => Array.from(arr, r4);

it('exports the Maltese Gear Cube for the website', async () => {
  const src = (p) => join(SIM, 'src', p);
  const { loadManifoldKernel } = await import(src('render/manifold.ts'));
  const { buildMalteseGeometry } = await import(src('maltese/render/pieces.ts'));
  const { PIECES } = await import(src('maltese/model.ts'));
  const { MalteseState } = await import(src('maltese/state.ts'));
  const { FACE_NORMAL } = await import(src('maltese/geometry.ts'));
  const { COLORS, LOOK } = await import(src('maltese/config.ts'));
  const { parseAlgorithm, invertSequence, formatMove } = await import(src('maltese/notation.ts'));

  const wasm = await loadManifoldKernel();
  // No fillets: the sharp bodies are a few thousand triangles, plenty at island scale.
  const geo = buildMalteseGeometry(wasm, null);

  const mesh = (m) => ({ positions: flat(m.positions), indices: Array.from(m.indices) });
  const proto = (p) => ({
    body: mesh(p.body),
    stickers: p.stickers.map((s) => ({ ...mesh(s), normal: Array.from(s.normal) })),
  });

  const parsed = parseAlgorithm(SCRAMBLE);
  if (!parsed.ok) throw new Error(parsed.error);
  const sequence = [...parsed.moves, ...invertSequence(parsed.moves)];

  const st = MalteseState.solved();
  const moves = sequence.map((move) => {
    const before = PIECES.map((p) => flat(st.matrix(p.id)));
    const { layer, ring } = st.movingParts(move.face);
    const out = { name: formatMove(move), face: move.face, amount: move.amount, axis: FACE_NORMAL[move.face], layer, ring, before };
    st.apply(move);
    return out;
  });
  if (!st.isSolved()) throw new Error('the sequence does not return to solved');

  const data = {
    format: 'maltese-island/1',
    source: 'combinatorics-puzzle-simulator (src/maltese), exported by scripts/3d/export-maltese.gen.mjs',
    colors: COLORS,
    body: LOOK.bodyColor,
    coreColor: LOOK.coreColor,
    protos: { corner: proto(geo.corner), centre: proto(geo.centre), edge: proto(geo.edge), gear: proto(geo.gear) },
    // The core (a hollow ball) is left out: at island scale a plain dark sphere does the same job.
    coreRadius: 28 / 30,
    pieces: PIECES.map((p) => ({ kind: p.kind, colors: p.colors })),
    solved: PIECES.map((p) => flat(MalteseState.solved().matrix(p.id))),
    moves,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  const json = JSON.stringify(data);
  writeFileSync(OUT, json + '\n');
  const tris = (m) => m.indices.length / 3;
  console.log(
    `wrote ${OUT}: ${(json.length / 1024).toFixed(0)} KB;`,
    Object.entries(data.protos)
      .map(([k, p]) => `${k} ${tris(p.body)} + ${p.stickers.reduce((s, x) => s + tris(x), 0)} tris`)
      .join(', '),
    `; moves ${moves.map((m) => m.name).join(' ')}`,
  );
});
