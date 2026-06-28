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

const MODELS = [
  { name: 'Baseline', sub: 'Historical Average', mae: '7.08', tone: 'muted' },
  { name: 'XGBoost Local', sub: 'Individual Trees', mae: '4.39', tone: 'mid' },
  { name: 'XGBoost Global', sub: 'Unified Tree', mae: '3.91', tone: 'good' },
  { name: 'Prophet', sub: 'Time Series', mae: '3.27', tone: 'best' },
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
        {/* Per-model MAE summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {MODELS.map((m) => (
            <div
              key={m.name}
              className="glass mapblazer-accent-border hover-mapblazer-accent-border rounded-2xl p-5 text-center transition-colors"
            >
              <p
                className={`text-2xl md:text-3xl font-black mb-1 ${
                  m.tone === 'best' ? 'mapblazer-accent-text' : ''
                }`}
                style={
                  m.tone === 'best'
                    ? undefined
                    : { color: m.tone === 'muted' ? 'var(--muted)' : 'var(--title)' }
                }
              >
                {m.mae}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
                MAE (min)
              </p>
              <p className="text-sm font-semibold mt-2" style={{ color: 'var(--title)' }}>
                {m.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.8 }}>
                {m.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Error-distribution histogram */}
        <div className="glass mapblazer-accent-border rounded-2xl overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <BarChart3 className="w-4 h-4 mapblazer-accent-text" />
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              holdout-error-distribution
            </span>
          </div>
          <div className="p-4 sm:p-6" style={{ background: 'rgba(255,255,255,0.92)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mapblazer_error_histogram.png"
              alt="Prediction error distributions (Predicted − Actual) for the Baseline, Prophet, XGBoost Local, and XGBoost Global models on the holdout test set. Prophet and XGBoost Global concentrate errors tightly around zero, while the baseline shows heavy fat tails."
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          Signed error (Predicted − Actual) across the 50,000+ sample holdout set. The tighter and taller the
          spike around zero, the better. Prophet collapses the historical baseline&apos;s heavy fat tails into a
          narrow band — the large misses that actually break a route are cut by{' '}
          <span className="mapblazer-accent-text font-semibold">62.9%</span>.
        </p>
      </motion.div>
    </section>
  );
}
