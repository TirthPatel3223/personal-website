'use client';

import { motion, type Variants } from 'framer-motion';
import { BarChart3, Search } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const COLUMNS = [
  { key: 'coverage', label: 'Coverage', unit: 'held-out mean' },
  { key: 'stranded', label: 'Stranded', unit: 'pairings' },
  { key: 'short', label: 'Short conns', unit: 'robust' },
  { key: 'critical', label: 'Critical conns', unit: 'fragile' },
] as const;

type Row = {
  policy: string;
  kind: string;
  champion?: boolean;
  baseline?: boolean;
  coverage: string;
  stranded: string;
  short: string;
  critical: string;
};

/* From runs/multi-{cockpit,cabin}/evaluation.json and docs/results.md. Connection
   counts for the reference solution are measured with this project's own classifiers
   on pristine instance1, so the two columns are like for like. */
const ROWS: Row[] = [
  {
    policy: 'multi-cabin',
    kind: 'ViT-DQN, 40 training variants',
    champion: true,
    coverage: '0.658',
    stranded: '13.3',
    short: '54.6',
    critical: '90.4',
  },
  {
    policy: 'multi-cockpit',
    kind: 'same network, tighter duty limits',
    coverage: '0.629',
    stranded: '15.9',
    short: '52.6',
    critical: '85.0',
  },
  {
    policy: 'single-instance',
    kind: 'trained on one month, transferred',
    coverage: '0.528',
    stranded: 'N/A',
    short: 'N/A',
    critical: 'N/A',
  },
  {
    policy: 'random masked',
    kind: 'legal moves, chosen at random',
    baseline: true,
    coverage: '0.47',
    stranded: '~55',
    short: 'N/A',
    critical: 'N/A',
  },
  {
    policy: 'GERAD reference',
    kind: 'classical cost optimizer, deadheads throughout',
    baseline: true,
    coverage: '1.00',
    stranded: 'N/A',
    short: '10',
    critical: '310',
  },
];

const SEARCH_ROWS = [
  { seed: 'seed 42', greedy: '0.612', beam: '0.651', win: true },
  { seed: 'seed 45', greedy: '0.613', beam: '0.647', win: true },
  { seed: 'seed 0', greedy: '0.687', beam: '0.687', win: false },
];

export default function CrewPairingResultsChart() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2
          className="section-title text-2xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
          style={{ color: 'transparent' }}
        >
          Policy Performance
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col gap-6"
      >
        <div className="glass crewpair-accent-border rounded-2xl overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <BarChart3 className="w-4 h-4 crewpair-accent-text" />
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              runs/multi-{'{'}cockpit,cabin{'}'}/evaluation.json · 8 held-out variants
            </span>
          </div>

          <div className="px-5 pt-5">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Every policy is scored on the same{' '}
              <strong style={{ color: 'var(--title)' }}>8 held-out instances</strong> (perturbations
              of the base month whose seeds were never sampled during training), and the reference
              solution is re-measured with this project&apos;s own connection classifiers, so the
              robustness columns compare like with like.
            </p>
          </div>

          {/* Wide table scrolls inside its own container rather than the page */}
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm" style={{ minWidth: 660, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    className="text-left font-semibold pb-3 pr-4 text-xs uppercase tracking-wider"
                    style={{ color: 'var(--muted)' }}
                  >
                    Policy
                  </th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className="text-right font-semibold pb-3 px-3 text-xs uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--muted)' }}
                    >
                      {c.label}
                      <span
                        className="block font-normal normal-case tracking-normal"
                        style={{ opacity: 0.6 }}
                      >
                        {c.unit}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr
                    key={r.policy}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: r.champion ? 'rgba(99, 102, 241, 0.07)' : undefined,
                    }}
                  >
                    <td className="py-3 pr-4 align-top">
                      <span
                        className={`font-mono text-sm font-semibold ${
                          r.champion ? 'crewpair-accent-text' : ''
                        }`}
                        style={
                          r.champion
                            ? undefined
                            : { color: 'var(--title)', opacity: r.baseline ? 0.65 : 1 }
                        }
                      >
                        {r.policy}
                      </span>
                      {r.champion && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider crewpair-accent-text">
                          best
                        </span>
                      )}
                      <span
                        className="block text-xs mt-0.5"
                        style={{ color: 'var(--muted)', opacity: 0.75 }}
                      >
                        {r.kind}
                      </span>
                    </td>
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`text-right px-3 py-3 font-mono align-top whitespace-nowrap ${
                          r.champion ? 'font-bold crewpair-accent-text' : ''
                        }`}
                        style={
                          r.champion
                            ? undefined
                            : { color: 'var(--foreground)', opacity: r.baseline ? 0.6 : 0.85 }
                        }
                      >
                        {r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-5 space-y-2">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              A <span className="font-mono">short</span> connection is a tight same-airport turn the
              crew can make because it follows the aircraft, the robust kind. A{' '}
              <span className="font-mono">critical</span> connection has under 15 minutes of buffer,
              so one late inbound cascades. Higher is better in the short column and lower in the
              other three.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.85 }}>
              The reference row is not a like-for-like coverage comparison: it reaches 1.00 by
              deadheading throughout, which the headline runs deliberately did not model. The
              comparison that does hold is robustness, and even per covered leg, the reference&apos;s
              critical-connection rate is about 2.3 times the learned policy&apos;s. The trade this
              project makes is coverage for resilience, and it is a trade rather than a win.
            </p>
          </div>
        </div>

        {/* ── Inference-time search lift ──────────────────────────────── */}
        <div className="glass crewpair-accent-border rounded-2xl overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Search className="w-4 h-4 crewpair-accent-text" />
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              search.py · beam 8×4 vs. greedy decoding, same checkpoint
            </span>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              The trained Q-function is already a value estimate, so at inference it doubles as a
              search heuristic. No retraining, no new data, just a larger decode budget.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SEARCH_ROWS.map((r) => (
                <div
                  key={r.seed}
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-wider font-semibold mb-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    {r.seed}
                  </p>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-lg" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                      {r.greedy}
                    </span>
                    <span style={{ color: 'var(--muted)', opacity: 0.5 }}>→</span>
                    <span
                      className={`text-2xl font-black ${r.win ? 'crewpair-accent-text' : ''}`}
                      style={r.win ? undefined : { color: 'var(--muted)', opacity: 0.7 }}
                    >
                      {r.beam}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                    {r.win ? 'greedy → beam 8×4' : 'tie: greedy already optimal here'}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              About four coverage points for roughly three times the wall clock, nine seconds against
              three per instance. The anytime best-first variant is seeded with a full greedy dive, so
              whatever budget it is given, it cannot return a worse answer than greedy.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          The number that matters most here is not the coverage headline but the{' '}
          <span className="crewpair-accent-text font-semibold">
            train-versus-held-out gap of 0.00 to 0.05
          </span>{' '}
          at plateau. A construction policy that had memorized its training month would show a wide
          one. Alongside{' '}
          <span className="crewpair-accent-text font-semibold">zero feasibility violations</span> from
          an independent re-checker, that is what makes the rest of the table worth reading.
        </p>
      </motion.div>
    </section>
  );
}
