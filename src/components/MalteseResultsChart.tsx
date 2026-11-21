'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { MALTESE_BENCHMARK } from '@/data/malteseBenchmark';
import { MALTESE_STAGES } from '@/data/malteseStages';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* Mark colours come from --mv-* on .cube-body-bg (globals.css), validated per theme
   with the dataviz palette script. Text never wears them. */
type Method = 'table' | 'net';
const METHOD: Record<Method, { label: string; color: string }> = {
  table: { label: 'Exact lookup table', color: 'var(--mv-table, #0f9f90)' },
  net: { label: 'Neural network', color: 'var(--mv-net, #8b5cf6)' },
};

/* Stage data lives in src/data/malteseStages.ts (shared with the solver-stages exhibit). */
const STAGES = MALTESE_STAGES;

const TOTAL = STAGES.reduce((a, s) => a + s.moves, 0);
const MAX = Math.max(...STAGES.map((s) => s.moves));

function summary() {
  const xs = MALTESE_BENCHMARK.map((r) => r[1]).sort((a, b) => a - b);
  const median = (xs[(xs.length - 1) >> 1] + xs[xs.length >> 1]) / 2;
  return { min: xs[0], max: xs[xs.length - 1], median: Math.round(median), n: xs.length };
}

export default function MalteseResultsChart() {
  const [hover, setHover] = useState<number | null>(null);
  const st = summary();

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="section-title text-2xl font-bold tracking-tight" style={{ color: 'var(--title)' }}>
          Where the Moves Go
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="glass cube-accent-border rounded-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <BarChart3 className="w-4 h-4 cube-accent-text" />
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            benchmark · {st.n} random scrambles · laptop GPU
          </span>
        </div>

        <div className="p-5 md:p-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Average moves each stage adds to a solution.
            </p>
            <div className="flex flex-wrap gap-4 sm:ml-auto">
              {(Object.keys(METHOD) as Method[]).map((m) => (
                <span key={m} className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--foreground)' }}>
                  <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-[3px]" style={{ background: METHOD[m].color }} />
                  {METHOD[m].label}
                </span>
              ))}
            </div>
          </div>

          <ol className="flex flex-col gap-1" aria-label="Average moves per stage">
            {STAGES.map((s, i) => {
              /* The longest bar ends where its label begins: the label sits at the tip. */
              const width = `calc((100% - 3rem) * ${s.moves / MAX})`;
              const share = Math.round((s.moves / TOTAL) * 100);
              const active = hover === i;
              return (
                <li
                  key={s.name}
                  tabIndex={0}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="grid grid-cols-1 sm:grid-cols-[14rem_minmax(0,1fr)] items-center gap-x-5 gap-y-1.5 rounded-xl px-3 py-2.5 outline-none transition-colors"
                  style={{ background: active ? 'var(--mv-track)' : 'transparent' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--title)' }}>
                      <span className="font-mono text-xs mr-2" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                      {s.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {s.what} · {s.positions} positions
                    </p>
                  </div>

                  <div className="relative flex items-center gap-2 min-w-0 h-6">
                    <div
                      className="h-3.5 shrink-0"
                      style={{
                        width,
                        minWidth: 4,
                        background: METHOD[s.method].color,
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                    <span className="text-sm font-semibold" style={{ color: 'var(--title)', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(s.moves)}
                    </span>
                    {active && (
                      <div
                        role="tooltip"
                        className="absolute left-0 bottom-full mb-1 text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none z-10"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--title)',
                          boxShadow: '0 6px 20px rgba(0,0,0,.18)',
                        }}
                      >
                        {METHOD[s.method].label} · {share}% of all moves
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            The stages add up to {Math.round(TOTAL)} moves; joining back-to-back turns of the same face trims
            that to 406. Every one of the {st.n} solutions landed between {st.min} and {st.max} moves
            (median {st.median}), however deep the scramble.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
