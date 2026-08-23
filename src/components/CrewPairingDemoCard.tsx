'use client';

import { motion, type Variants } from 'framer-motion';
import { PlayCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* The published demo site (viz/site/) — static HTML, CSS, one JS file and pre-recorded
   JSON. No backend, no model in the browser, nothing talking to a training machine.
   Redeployed by .github/workflows/pages.yml whenever viz/site/ changes. */
const DEMO_URL =
  'https://tirthpatel3223.github.io/Deep-Reinforcement-Learning-Approach-to-solving-the-Airline-Crew-Pairing-Problem/';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const NOTES = [
  {
    label: 'Four recordings',
    desc: 'Two 500-episode training runs, plus a beam search and a best-first search solving a month the policy has never seen.',
  },
  {
    label: 'Scrub any decision',
    desc: 'Play replays the construction one connection at a time; the panels show the top actions by Q-value and the reward the step earned.',
  },
  {
    label: 'Click a connection',
    desc: 'Any edge in the network opens the flight: route, times, block time, the pairing operating it, and how it joined.',
  },
];

export default function CrewPairingDemoCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* This page is statically prerendered, so a small embed regularly finishes loading
     before React hydrates and a JSX onLoad would never fire, stranding the overlay.
     Register the listener imperatively and time out regardless. */
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const done = () => setLoading(false);
    el.addEventListener('load', done);
    const timer = window.setTimeout(done, 3000);
    return () => {
      el.removeEventListener('load', done);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    /* Wider than the article column: the demo's own layout collapses to a single
       stacked column below 1000px, which buries its playback bar. The parent is
       centred (max-w-5xl mx-auto), so its centre is the viewport centre and a
       symmetric negative margin re-centres this wider block. 100vw includes the
       scrollbar, hence the 48px gutter — without it the page scrolls sideways. */
    <section
      className="relative"
      style={{
        width: 'min(1440px, calc(100vw - 48px))',
        marginLeft: 'calc((100% - min(1440px, 100vw - 48px)) / 2)',
      }}
    >
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2
            className="section-title text-2xl font-bold tracking-tight"
            style={{ color: 'var(--title)' }}
          >
            Watch It Solve a Month
          </h2>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="w-full border rounded-2xl p-6 md:p-8 transition-shadow duration-300"
          style={{
            background: 'var(--surface)',
            borderColor: 'rgba(99, 102, 241, 0.25)',
            boxShadow: '0 0 35px rgba(99, 102, 241, 0.07)',
          }}
        >
          <div className="flex flex-col gap-8">
            {/* ── Header row ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 crewpair-accent-text" />
                <span className="text-sm font-semibold crewpair-accent-text uppercase tracking-wider">
                  Interactive replay · recorded solves, no backend
                </span>
              </div>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors shadow-lg"
              >
                Open the demo full-screen
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-sm leading-relaxed -mt-2" style={{ color: 'var(--muted)' }}>
              Pick a recording from the drop-down inside the frame. Each one opens on the finished
              month, with every connection already drawn; press{' '}
              <span className="crewpair-accent-text font-semibold">Play</span> at the bottom of the
              frame to rewind to the first decision and watch the policy rebuild the schedule leg by
              leg. Nothing here runs a model in your browser; the searches were run offline and baked
              into the page.
            </p>

            {/* ── Embed window ───────────────────────────────────────── */}
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-2xl"
              style={{
                border: '1px solid rgba(99, 102, 241, 0.20)',
                background: 'var(--surface-raised)',
              }}
            >
              {/* Fake browser chrome */}
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{
                  borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
                  background: 'var(--background)',
                }}
              >
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span
                  className="ml-3 text-xs font-mono truncate"
                  style={{ color: 'var(--muted)', opacity: 0.6 }}
                >
                  tirthpatel3223.github.io · Deep RL Crew Pairing: interactive demo
                </span>
              </div>

              {/* Loading overlay */}
              {loading && !error && (
                <div
                  className="absolute inset-x-0 bottom-0 top-[41px] flex flex-col items-center justify-center gap-4 z-10 pointer-events-none"
                  style={{ background: 'var(--background)' }}
                >
                  <Loader2 className="w-8 h-8 crewpair-accent-text animate-spin" />
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Loading the replay…
                  </p>
                </div>
              )}

              {/* Error fallback */}
              {error ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
                  <AlertCircle className="w-10 h-10 text-red-400/70" />
                  <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
                    Could not load the demo inline.
                  </p>
                  <a
                    href={DEMO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors"
                  >
                    Open the demo
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  id="crew-pairing-demo-embed"
                  src={DEMO_URL}
                  width="100%"
                  frameBorder="0"
                  title="Deep RL Crew Pairing, interactive replay of a recorded solve"
                  className="block w-full h-[620px] md:h-[840px] xl:h-[1340px]"
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                />
              )}
            </div>

            {/* ── Notes strip ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {NOTES.map(({ label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--title)' }}>
                      {label}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
