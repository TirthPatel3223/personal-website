'use client';

import { motion, type Variants } from 'framer-motion';
import { Activity, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* Rebuilt and redeployed by the publish workflow every Sunday at 08:00 UTC. It is a
   single static HTML file with inline SVG and no JavaScript, so it embeds cleanly and
   follows the viewer's colour scheme on its own. */
const DASHBOARD_URL = 'https://tirthpatel3223.github.io/Mapblazer_Wait_Time_Prediction/';

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
    label: 'Rebuilt every Sunday',
    desc: 'Regenerated from the gold _last tables two hours after the training job, then deployed to Pages.',
  },
  {
    label: 'Provenance on the page',
    desc: 'Run id, run status and publish timestamp are printed, so a fallback week is visibly a fallback.',
  },
  {
    label: 'Static HTML, zero JS',
    desc: 'Inline SVG charts and no external assets, so it survives a strict Content-Security-Policy.',
  },
];

export default function MapblazerDashboardCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* The dashboard is a ~40KB static file and regularly finishes loading before React
     hydrates, so a JSX onLoad handler never fires and the opaque overlay would sit on
     top of it forever. Register the listener imperatively and time out regardless. */
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const done = () => setLoading(false);
    el.addEventListener('load', done);
    const timer = window.setTimeout(done, 2500);
    return () => {
      el.removeEventListener('load', done);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2
          className="section-title text-2xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-[#f97316] to-[#fbbf24]"
          style={{ color: 'transparent' }}
        >
          Live Dashboard
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
          borderColor: 'rgba(244, 150, 17, 0.25)',
          boxShadow: '0 0 35px rgba(244, 150, 17, 0.06)',
        }}
      >
        <div className="flex flex-col gap-8">
          {/* ── Header row ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 mapblazer-accent-text" />
              <span className="text-sm font-semibold mapblazer-accent-text uppercase tracking-wider">
                Live · This week&apos;s serving run
              </span>
            </div>
            <a
              href={DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-[#f49611] hover:bg-[#d47c05] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors shadow-lg"
            >
              Open the dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* ── Embed window ───────────────────────────────────────── */}
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-2xl"
            style={{
              minHeight: '780px',
              border: '1px solid rgba(244, 150, 17, 0.20)',
              background: 'var(--surface-raised)',
            }}
          >
            {/* Fake browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                borderBottom: '1px solid rgba(244, 150, 17, 0.15)',
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
                tirthpatel3223.github.io · Mapblazer Wait-Time Forecast
              </span>
            </div>

            {/* Loading overlay */}
            {loading && !error && (
              <div
                className="absolute inset-x-0 bottom-0 top-[41px] flex flex-col items-center justify-center gap-4 z-10 pointer-events-none"
                style={{ background: 'var(--background)' }}
              >
                <Loader2 className="w-8 h-8 mapblazer-accent-text animate-spin" />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Loading dashboard…
                </p>
              </div>
            )}

            {/* Error fallback */}
            {error ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
                <AlertCircle className="w-10 h-10 text-red-400/70" />
                <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
                  Could not load the dashboard inline.
                </p>
                <a
                  href={DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#f49611] hover:bg-[#d47c05] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors"
                >
                  Open the dashboard
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                id="mapblazer-forecast-dashboard-embed"
                src={DASHBOARD_URL}
                width="100%"
                height="740"
                frameBorder="0"
                title="Mapblazer Wait-Time Forecast, live dashboard"
                className="block w-full"
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
                  border: '1px solid rgba(244, 150, 17, 0.15)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-[#f49611] shrink-0 mt-1.5" />
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
    </section>
  );
}
