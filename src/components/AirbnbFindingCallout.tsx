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
          <span className="airbnb-accent-text">none of the six outcomes</span> tested: no
          significant jump in guest sentiment, in how many reviews a host receives, or in how guests
          rate value for money.
        </p>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          The six were {OUTCOMES.slice(0, 4).join(', ')}, {OUTCOMES[4]}, and {OUTCOMES[5]}. Every
          one was estimated the same way (an OLS jump term at the cutoff with robust standard
          errors), and every one came back statistically indistinguishable from zero, with p-values
          ranging from 0.156 to 0.929. Not one cleared the 5% line.
        </p>

        {/* Then / now — the comparison that carries the argument */}
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
              Mishra, Huang &amp; Kalwani (2023) ran a regression discontinuity on this same 4.8
              cutoff and found a <strong style={{ color: 'var(--title)' }}>significant positive
              effect</strong> of the badge on bookings and revenue. Guests could filter search by
              Superhost, so the badge did real discovery work.
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
              Airbnb launched Guest Favorite in November 2023 and dropped the Superhost filter from
              search around January 2024. Re-run on post-change data, the same design finds{' '}
              <strong style={{ color: 'var(--title)' }}>no detectable effect at all</strong>.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          The reading that fits both results is that{' '}
          <span className="airbnb-accent-text font-semibold">
            Guest Favorite has taken over the job the Superhost badge used to do
          </span>
          . The badge itself never went away; it is still awarded quarterly and still shown on
          listing pages, but the mechanism that made it move guest behaviour, being a filter guests
          searched by, was handed to a different badge. What is left at the cutoff is a label with
          no measurable pull.
        </p>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          Worth stating plainly: this is a before-and-after across two separate studies on different
          samples, not one design that observes the switch happening. It shows the earlier effect is
          absent now; it does not by itself isolate Guest Favorite as the cause, and Guest Favorite
          status is not observable in this dataset.
        </p>
      </div>
    </motion.div>
  );
}
