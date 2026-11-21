// Compacts the crew-pairing replay files for the 3D exhibit.
//
//   node scripts/3d/build-crew-data.mjs            (downloads from GitHub)
//   node scripts/3d/build-crew-data.mjs <dir>      (reads solve-*.json from a local folder)
//
// Source: TirthPatel3223/Deep-Reinforcement-Learning-Approach-to-solving-the-Airline-
// Crew-Pairing-Problem, viz/site/data/. Every leg, decision and alternative is kept;
// only the encoding changes (names become indices, objects become arrays).
// Output: public/data/crew/<id>.json

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO =
  'https://raw.githubusercontent.com/TirthPatel3223/Deep-Reinforcement-Learning-Approach-to-solving-the-Airline-Crew-Pairing-Problem/main/viz/site/data';
const FILES = ['solve-cockpit-beam.json', 'solve-cabin-astar.json'];
const OUT = join(process.cwd(), 'public', 'data', 'crew');

const EVENT = { start: 0, append: 1, close: 2, strand: 3 };
const ACTION = { START: 0, APPEND: 1, DEADHEAD: 2, CLOSE: 3 };

/* The repo's connection rules (config/constraints.yaml), used only for the exhibit's
   wording: a sit connection needs 45 minutes on the ground, and one with under 15
   minutes to spare beyond that is a static critical connection. The critical flag
   itself comes from the recording (a negative robustness reward on the append). */
const RULES = { minSit: 45, critSlack: 15 };

async function load(name) {
  const local = process.argv[2];
  if (local) return JSON.parse(readFileSync(join(local, name), 'utf8'));
  const res = await fetch(`${REPO}/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

const TAU = Math.PI * 2;
const wrap = (a) => ((a % TAU) + TAU) % TAU;

/* Hub-and-spoke layout, as in the repo's dashboard: the bases sit on a small inner
   triangle and the outstations on an outer ring. Each outstation's place on the ring
   is the leg-weighted average direction of the bases it is flown from, so an airport
   shared by two bases lands between them; each base then turns to face its airports.
   Both replays fly the same network, so one layout is computed from all of them and
   switching replays keeps every airport in place. Unit-scaled (outer ring radius 1). */
function layout(all) {
  const d = all[0];
  for (const o of all) {
    if (JSON.stringify(o.airports) !== JSON.stringify(d.airports) || JSON.stringify(o.bases) !== JSON.stringify(d.bases))
      throw new Error('the replays do not share one airport network');
  }
  const legs = all.flatMap((o) => Object.values(o.legs));
  const bases = d.bases;
  const outs = d.airports.filter((a) => !bases.includes(a));
  const count = (o, b) => legs.filter((l) => (l.dep === o && l.arr === b) || (l.dep === b && l.arr === o)).length;
  const weights = new Map(outs.map((o) => [o, bases.map((b) => count(o, b))]));

  // Seed the base directions 120 degrees apart, busiest base first.
  const load = bases.map((_, i) => outs.reduce((s, o) => s + weights.get(o)[i], 0));
  const order = bases.map((_, i) => i).sort((a, b) => load[b] - load[a]);
  const baseAng = new Array(bases.length);
  order.forEach((bi, k) => (baseAng[bi] = wrap(Math.PI / 2 + (k * TAU) / bases.length)));

  let ringAng = new Map();
  for (let iter = 0; iter < 4; iter++) {
    const keyed = outs.map((o) => {
      const w = weights.get(o);
      let x = 0;
      let z = 0;
      w.forEach((n, i) => {
        x += n * Math.cos(baseAng[i]);
        z += n * Math.sin(baseAng[i]);
      });
      const total = w.reduce((s, n) => s + n, 0);
      return { o, key: total ? wrap(Math.atan2(z, x)) : 0, total };
    });
    // Ties (airports flown from one base only) fan out busiest-first from the middle.
    keyed.sort((a, b) => a.key - b.key || b.total - a.total);
    const step = TAU / outs.length;
    const start = keyed.length ? keyed[0].key : 0;
    ringAng = new Map(keyed.map((k, i) => [k.o, wrap(start + i * step)]));
    // Each base faces the leg-weighted middle of its airports.
    for (let i = 0; i < bases.length; i++) {
      let x = 0;
      let z = 0;
      for (const o of outs) {
        const n = weights.get(o)[i];
        x += n * Math.cos(ringAng.get(o));
        z += n * Math.sin(ringAng.get(o));
      }
      if (x || z) baseAng[i] = wrap(Math.atan2(z, x));
    }
    // Keep the three bases visibly apart.
    for (let pass = 0; pass < 8; pass++) {
      for (let i = 0; i < bases.length; i++)
        for (let j = i + 1; j < bases.length; j++) {
          let gap = wrap(baseAng[j] - baseAng[i]);
          if (gap > Math.PI) gap -= TAU;
          const need = (TAU / bases.length) * 0.75;
          if (Math.abs(gap) < need) {
            const push = (need - Math.abs(gap)) / 2;
            const s = gap >= 0 ? 1 : -1;
            baseAng[i] = wrap(baseAng[i] - s * push);
            baseAng[j] = wrap(baseAng[j] + s * push);
          }
        }
    }
  }
  // Turn the whole layout so the busiest base points to the left of the exhibit's
  // opening camera (CrewExhibit: camera at x 9, z 40). Its fan of round trips then
  // opens sideways across the screen instead of collapsing toward the viewer.
  const view = Math.atan2(40, 9);
  const left = view + Math.PI / 2;
  const best = left - baseAng[order[0]];
  const R0 = 0.2;
  return d.airports.map((a) => {
    const bi = bases.indexOf(a);
    if (bi >= 0) return [+(Math.cos(baseAng[bi] + best) * R0).toFixed(4), +(Math.sin(baseAng[bi] + best) * R0).toFixed(4)];
    const t = ringAng.get(a) + best;
    return [+Math.cos(t).toFixed(4), +Math.sin(t).toFixed(4)];
  });
}

function compact(d, pos) {
  const airports = d.airports;
  const aIdx = new Map(airports.map((a, i) => [a, i]));
  const legIds = Object.keys(d.legs);
  const lIdx = new Map(legIds.map((id, i) => [id, i]));
  const legs = legIds.map((id) => {
    const l = d.legs[id];
    return [aIdx.get(l.dep), aIdx.get(l.arr), l.dep_t, l.arr_t];
  });
  const steps = d.steps.map((s) => {
    const e = s.event;
    const considered = (s.considered ?? []).map((c) => [
      ACTION[c.action] ?? -1,
      c.leg ? lIdx.get(c.leg) : -1,
      Math.round(c.q * 1000),
      c.chosen ? 1 : 0,
    ]);
    const append = e.type === 'append';
    const critical = append && !e.dh && (e.reward?.robustness ?? 0) < 0 ? 1 : 0;
    return [
      EVENT[e.type],
      e.pairing ?? -1,
      e.leg ? lIdx.get(e.leg) : -1,
      e.dh ? 1 : 0,
      Math.round((s.coverage ?? 0) * 100000),
      considered,
      e.base != null ? aIdx.get(e.base) : -1,
      append ? (e.conn ?? 0) : 0,
      append && e.buffer != null ? e.buffer : -1,
      critical,
    ];
  });
  const sum = d.summary;
  return {
    id: d.id,
    title: d.title,
    crewClass: d.crew_class,
    algo: d.algo,
    instance: d.instance,
    rules: RULES,
    bases: d.bases.map((b) => aIdx.get(b)),
    airports,
    pos,
    legs,
    steps,
    summary: {
      coverage: sum.coverage,
      covered: sum.covered,
      legs: sum.n_legs,
      pairings: sum.pairings,
      stranded: sum.stranded,
      critical: sum.critical_connections,
    },
  };
}

mkdirSync(OUT, { recursive: true });
const raw = [];
for (const f of FILES) raw.push(await load(f));
const pos = layout(raw);
for (const [k, f] of FILES.entries()) {
  const d = raw[k];
  const c = compact(d, pos);
  if (c.legs.length !== d.n_legs) throw new Error(`${f}: leg count mismatch`);
  if (c.steps.length !== d.steps.length) throw new Error(`${f}: step count mismatch`);
  // The exhibit counts critical connections and dropped trips from the events, so
  // those counts must end exactly at the recording's own summary.
  const crit = c.steps.filter((s) => s[9]).length;
  const strands = c.steps.filter((s) => s[0] === 3).length;
  if (crit !== c.summary.critical || strands !== c.summary.stranded)
    throw new Error(`${f}: ${crit} critical / ${strands} stranded events vs summary ${c.summary.critical} / ${c.summary.stranded}`);
  const id = f.replace(/^solve-/, '').replace(/\.json$/, '');
  const out = join(OUT, `${id}.json`);
  writeFileSync(out, JSON.stringify(c));
  console.log(`${f}: ${c.legs.length} legs, ${c.steps.length} steps, coverage ${c.summary.coverage} -> ${out}`);
}
