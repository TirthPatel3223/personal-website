'use client';

import { motion, type Variants } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* Every run scores all four families on the same holdout and writes them to
   gold.kpis. Numbers below are the run stamped in RUN_ID; the pipeline retrains
   weekly, so the live dashboard is always the current authority. */
const RUN_ID = '20260822T203750Z';

const COLUMNS = [
  { key: 'mae',    label: 'MAE',        unit: 'min' },
  { key: 'rmse',   label: 'RMSE',       unit: 'min' },
  { key: 'within', label: 'Within 10m', unit: '%'   },
  { key: 'severe', label: 'Severe miss', unit: '%'  },
  { key: 'bias',   label: 'Bias',       unit: 'min' },
  { key: 'high',   label: 'High-wait MAE', unit: 'min' },
  { key: 'peak',   label: 'Peak MAE',   unit: 'min' },
] as const;

type Row = {
  model: string;
  kind: string;
  champion?: boolean;
  baseline?: boolean;
  mae: string; rmse: string; within: string; severe: string;
  bias: string; high: string; peak: string;
};

const ROWS: Row[] = [
  {
    model: 'prophet_fleet', kind: 'one Prophet per ride', champion: true,
    mae: '7.01', rmse: '11.49', within: '76.6', severe: '13.6', bias: '+1.2', high: '10.3', peak: '7.8',
  },
  {
    model: 'xgb_global', kind: 'one tree, ride as categorical',
    mae: '8.26', rmse: '12.88', within: '71.8', severe: '17.6', bias: '+3.8', high: '12.1', peak: '9.4',
  },
  {
    model: 'xgb_local_fleet', kind: 'one tree per ride',
    mae: '8.45', rmse: '14.70', within: '71.9', severe: '19.3', bias: '+3.7', high: '12.9', peak: '10.0',
  },
  {
    model: 'baseline_ride_mean', kind: 'per-ride historical mean', baseline: true,
    mae: '9.51', rmse: '14.46', within: '64.5', severe: '23.5', bias: '+1.0', high: '14.4', peak: '9.1',
  },
];

export default function MapblazerResultsChart() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2
          className="section-title text-2xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-[#f97316] to-[#fbbf24]"
          style={{ color: 'transparent' }}
        >
          Model Performance
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
        <div className="glass mapblazer-accent-border rounded-2xl overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <BarChart3 className="w-4 h-4 mapblazer-accent-text" />
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              gold.kpis_last · run {RUN_ID}
            </span>
          </div>

          <div className="px-5 pt-5">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Backtest on the final 20% of history: <strong style={{ color: 'var(--title)' }}>78,110
              observations</strong> the models never saw, split by time rather than at random.
            </p>
          </div>

          {/* Wide table scrolls inside its own container rather than the page */}
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm" style={{ minWidth: 720, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    className="text-left font-semibold pb-3 pr-4 text-xs uppercase tracking-wider"
                    style={{ color: 'var(--muted)' }}
                  >
                    Model
                  </th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className="text-right font-semibold pb-3 px-3 text-xs uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--muted)' }}
                    >
                      {c.label}
                      <span className="block font-normal normal-case tracking-normal" style={{ opacity: 0.6 }}>
                        {c.unit}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr
                    key={r.model}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: r.champion ? 'rgba(244, 150, 17, 0.07)' : undefined,
                    }}
                  >
                    <td className="py-3 pr-4 align-top">
                      <span
                        className={`font-mono text-sm font-semibold ${r.champion ? 'mapblazer-accent-text' : ''}`}
                        style={r.champion ? undefined : { color: 'var(--title)', opacity: r.baseline ? 0.65 : 1 }}
                      >
                        {r.model}
                      </span>
                      {r.champion && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider mapblazer-accent-text">
                          champion
                        </span>
                      )}
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.75 }}>
                        {r.kind}
                      </span>
                    </td>
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`text-right px-3 py-3 font-mono align-top whitespace-nowrap ${
                          r.champion ? 'font-bold mapblazer-accent-text' : ''
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
              Lower is better everywhere except <span className="font-mono">Within 10m</span>. A severe
              miss is off by more than 15 minutes. <span className="font-mono">High-wait</span> and{' '}
              <span className="font-mono">Peak MAE</span> cover long queues and 11:00 to 20:00, since about
              37% of readings are zero and one average would flatter a model that always predicts short queues.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.8 }}>
              The baseline wins only on bias, which a historical mean gets by construction.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          The champion beats the baseline by{' '}
          <span className="mapblazer-accent-text font-semibold">26.3% on MAE</span>, lifts ±10-minute
          accuracy from 64.5% to <span className="mapblazer-accent-text font-semibold">76.6%</span> and
          cuts severe misses by <span className="mapblazer-accent-text font-semibold">42.1%</span>. The
          pipeline retrains every Sunday, so the live dashboard above is always the latest word.
        </p>
      </motion.div>
    </section>
  );
}
