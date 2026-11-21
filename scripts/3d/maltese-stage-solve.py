"""Solve one deep Maltese scramble with the ladder solver and write each rung's moves separately.

Run from the pipeline checkout:  python <this> <out.json> [seed] [scramble_len]
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT))

from core.ladder import Ladder, table_solve  # noqa: E402
from core.perm_model import build_point_model  # noqa: E402
from core.structure import analyse  # noqa: E402
from puzzles.registry import get_puzzle  # noqa: E402

out = Path(sys.argv[1])
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7
slen = int(sys.argv[3]) if len(sys.argv) > 3 else 3000

entry = get_puzzle("maltese")
ladders = entry.ladders()
name = entry.default_ladder
puzzle = entry.build()
model = build_point_model(puzzle)
structure = analyse(model)
ladder = Ladder(model, structure, ladders[name], mitm_radius=7, log=lambda _m: None)
ladder.build(cache_dir=entry.cache_dir(name, 7))
assert ladder.ready()
notation = entry.notation(ladder.alg)

rng = np.random.default_rng(seed)
scramble = rng.integers(0, model.num_moves, size=slen).tolist()
state = puzzle.apply_word(puzzle.goal, scramble)
lab = np.asarray(structure.decode(state), dtype=np.int32)

t0 = time.time()
stages = []
full = []
for rung in ladder.rungs:
    q = rung.quotient
    vec = q.project(lab)
    if rung.table is not None:
        acts = table_solve(q, rung.table, vec)
    else:
        acts = rung.heuristic.solve(vec, width=4096, weight=0.3)
    assert acts is not None, rung.spec.name
    words = []
    cost = 0
    for a in acts:
        lab = lab[rung.actions.tables[a]]
        words.append(rung.actions.words[a])
        cost += int(rung.actions.costs[a])
    word = ladder.alg.concat(*words) if words else ladder.alg.concat()
    full.extend(list(word))
    stages.append({"rung": rung.spec.name, "cost": cost, "moves": notation.format(list(word))})
    print(rung.spec.name, cost, flush=True)

final = puzzle.apply_word(state, full)
assert np.array_equal(final, puzzle.goal), "not solved"
data = {
    "seed": seed,
    "scramble_len": slen,
    "scramble": notation.format(scramble),
    "stages": stages,
    "simplified_len": notation.describe(ladder.alg.simplify(full)),
    "seconds": round(time.time() - t0, 1),
}
out.write_text(json.dumps(data, indent=1))
print("ok", data["simplified_len"], data["seconds"], "s")
