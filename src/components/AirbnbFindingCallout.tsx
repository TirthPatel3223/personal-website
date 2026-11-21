'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowRight, TrendingDown } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* The six outcomes, in the order the notebook regresses them. Grouped here the way a
   reader would name them rather than by column name. */
const OUTCOMES = [
  'positive review sentiment',
  'negative review sentiment',
  'neutral review sentiment',
  'overall (compound) sentiment',
  'review volume per host',
  'the value-for-money sub-rating',
];

export default function AirbnbFindingCallout() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="glass border airbnb-accent-border rounded-2xl overflow-hidden mb-8"
    >
      {/* Accent rail marks this out as the headline finding rather than another stat card */}
      <div className="airbnb-accent-bg px-6 py-3 flex items-center gap-2.5">
        <TrendingDown className="w-4 h-4 airbnb-accent-text shrink-0" />
        <span
          className="text-xs uppercase tracking-wider font-bold airbnb-accent-text"
          style={{ letterSpacing: '0.12em' }}
        >
          What the numbers say
        </span>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-lg md:text-xl font-semibold leading-snug" style={{ color: 'var(--title)' }}>
          Crossing the 4.8 Superhost cutoff moved{' '}
          <span className="airbnb-accent-text">five of the six outcomes</span> not at all. The one
          that does jump, review volume, is the one the design can least vouch for.
        </p>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          The six were {OUTCOMES.slice(0, 4).join(', ')}, {OUTCOMES[4]}, and {OUTCOMES[5]}. Five
          are indistinguishable from zero (p from 0.2253 to 0.9744). Review volume jumps by about 79
          reviews (p = 0.0201), but total reviews build up over a host&apos;s whole history, so the
          step more likely reflects more established hosts than the badge.
        </p>

        {/* Then / now: the comparison that carries the argument */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-3 items-stretch">
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            <p
              className="text-xs uppercase tracking-wider font-bold mb-2"
              style={{ color: 'var(--muted)' }}
            >
              Before Guest Favorite
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              Mishra, Huang &amp; Kalwani (2023) found a{' '}
              <strong style={{ color: 'var(--title)' }}>significant positive effect</strong> on
              bookings and revenue at this same cutoff, when guests could still filter search by
              Superhost.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center px-1">
            <ArrowRight className="w-5 h-5 airbnb-accent-text" />
          </div>

          <div
            className="rounded-xl p-4 airbnb-accent-bg"
            style={{ border: '1px solid rgba(255, 56, 92, 0.28)' }}
          >
            <p
              className="text-xs uppercase tracking-wider font-bold mb-2 airbnb-accent-text"
            >
              After Guest Favorite
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              Guest Favorite launched in November 2023 and replaced the Superhost search filter
              around January 2024. On post-change data, the same design finds{' '}
              <strong style={{ color: 'var(--title)' }}>
                no effect on guest sentiment or perceived value
              </strong>
              .
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          The likely reading:{' '}
          <span className="airbnb-accent-text font-semibold">
            Guest Favorite now does the job the Superhost badge used to do
          </span>
          . The badge still exists, but the search filter that made guests respond to it is gone.
        </p>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          Caveat: these are two separate studies on different samples, so this shows the effect is
          gone, not that Guest Favorite caused it. Reading the review-volume jump as a badge effect
          would need manipulation and balance tests that this notebook does not run.
        </p>
      </div>
    </motion.div>
  );
}
