'use client';

import { motion, type Variants } from 'framer-motion';
import { LineChart, Table2 } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* Straight from the notebook's printed output (cell 5): OLS of each outcome on
   rating_centered + treatment, HC1 robust standard errors, n = 6,686 hosts. */
const ROWS = [
  {
    outcome: 'avg_pos_sentiment',
    plain: 'Positive review sentiment',
    effect: '−0.0020',
    p: '0.3635',
  },
  {
    outcome: 'avg_neg_sentiment',
    plain: 'Negative review sentiment',
    effect: '−0.0005',
    p: '0.1561',
  },
  {
    outcome: 'avg_neu_sentiment',
    plain: 'Neutral review sentiment',
    effect: '+0.0029',
    p: '0.1820',
  },
  {
    outcome: 'avg_compound_sentiment',
    plain: 'Overall sentiment score',
    effect: '+0.0026',
    p: '0.5200',
  },
  {
    outcome: 'total_reviews_across_listings',
    plain: 'Review volume per host',
    effect: '−2.4903',
    p: '0.9286',
  },
  {
    outcome: 'review_scores_value',
    plain: 'Value-for-money sub-rating',
    effect: '−0.0023',
    p: '0.7100',
  },
];

export default function AirbnbRDDResults() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2
          className="section-title text-2xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-[#a10d33] to-[#d1214e] dark:from-[#FF385C] dark:to-[#FF9A8B]"
          style={{ color: 'transparent' }}
        >
          The Discontinuity, Plotted
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
        {/* ── The six RDD plots ─────────────────────────────────────── */}
        <div className="glass airbnb-accent-border rounded-2xl overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <LineChart className="w-4 h-4 airbnb-accent-text" />
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              RDD analysis.ipynb · six outcomes, control vs. treatment fits at c = 4.8
            </span>
          </div>

          <div className="px-5 pt-5">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Each panel plots one outcome against <span className="font-mono">host_rating</span>{' '}
              inside the ±0.05 bandwidth, with the dashed line marking the 4.80 Superhost cutoff.
              The <span style={{ color: '#d62728', fontWeight: 600 }}>red</span> fit is the control
              side, the <span style={{ color: '#2ca02c', fontWeight: 600 }}>green</span> fit the
              treated side.{' '}
              <strong style={{ color: 'var(--title)' }}>
                What a badge effect would look like is a visible step between the two lines where
                they meet the dashed line
              </strong>{' '}
              In all six panels, they meet it at effectively the same height.
            </p>
          </div>

          {/* The figure is a matplotlib PNG on an opaque white canvas, so it gets its own
              white plate in both themes rather than floating as an unframed slab in dark. */}
          <div className="p-5">
            <a
              href="/airbnb_rdd_regressions.png"
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl overflow-hidden airbnb-plot-plate"
              style={{ border: '1px solid rgba(255, 56, 92, 0.22)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/airbnb_rdd_regressions.png"
                alt="Six regression discontinuity plots (positive, negative, neutral and compound review sentiment, total reviews across listings, and the review-scores value sub-rating), each plotted against host rating between 4.74 and 4.86 with separate fitted lines on either side of the dashed 4.80 cutoff. No panel shows a visible jump at the cutoff."
                width={1489}
                height={1790}
                loading="lazy"
                className="w-full h-auto block"
              />
            </a>
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              Click the figure to open it full size.
            </p>
          </div>
        </div>

        {/* ── Coefficient table ─────────────────────────────────────── */}
        <div className="glass airbnb-accent-border rounded-2xl overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Table2 className="w-4 h-4 airbnb-accent-text" />
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              OLS jump at c = 4.8 · HC1 robust standard errors · n = 6,686 hosts
            </span>
          </div>

          {/* Wide table scrolls inside its own container rather than the page */}
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm" style={{ minWidth: 620, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    className="text-left font-semibold pb-3 pr-4 text-xs uppercase tracking-wider"
                    style={{ color: 'var(--muted)' }}
                  >
                    Outcome
                  </th>
                  <th
                    className="text-right font-semibold pb-3 px-3 text-xs uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--muted)' }}
                  >
                    Superhost effect
                    <span className="block font-normal normal-case tracking-normal" style={{ opacity: 0.8 }}>
                      jump at the cutoff
                    </span>
                  </th>
                  <th
                    className="text-right font-semibold pb-3 px-3 text-xs uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--muted)' }}
                  >
                    p-value
                    <span className="block font-normal normal-case tracking-normal" style={{ opacity: 0.8 }}>
                      robust
                    </span>
                  </th>
                  <th
                    className="text-right font-semibold pb-3 pl-3 text-xs uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--muted)' }}
                  >
                    Sig. at 5%
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.outcome} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 pr-4 align-top">
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: 'var(--title)' }}
                      >
                        {r.outcome}
                      </span>
                      <span
                        className="block text-xs mt-0.5"
                        style={{ color: 'var(--muted)' }}
                      >
                        {r.plain}
                      </span>
                    </td>
                    <td
                      className="text-right px-3 py-3 font-mono align-top whitespace-nowrap"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {r.effect}
                    </td>
                    <td
                      className="text-right px-3 py-3 font-mono align-top whitespace-nowrap"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {r.p}
                    </td>
                    <td className="text-right pl-3 py-3 align-top whitespace-nowrap">
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'var(--muted)' }}
                      >
                        No
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-5">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              The smallest p-value in the table is 0.156, so nothing is close to the 5% line, and the
              point estimates themselves are tiny: two-thousandths of a sentiment scale that runs
              from 0 to 1, and about two and a half reviews on hosts averaging hundreds. The result
              is not &ldquo;a small effect we lacked the power to detect&rdquo; so much as no
              detectable step at all.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          Read narrowly, this is the badge&apos;s{' '}
          <span className="airbnb-accent-text font-semibold">demand-side effect at the margin</span>,
          in a single post-Guest-Favorite cross-section. It is consistent with the removal of the
          Superhost search filter having drained the discovery channel that the 2023 finding partly
          rested on. It is not evidence that the badge does nothing at all: the{' '}
          <span className="airbnb-accent-text font-semibold">supply-side incentive</span> (hosts
          working to earn and keep it) is a different question that this design cannot answer, and
          no manipulation test, covariate-balance check or bandwidth-sensitivity check was run here.
        </p>
      </motion.div>
    </section>
  );
}
