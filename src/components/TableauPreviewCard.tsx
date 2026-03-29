"use client";

import { motion, Variants } from "framer-motion";
import { BarChart2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

/**
 * Tableau Public embed URL format:
 *   /views/<workbook>/<sheet>?:embed=y&:showVizHome=no&...
 * The embed=y param switches to stripped-UI mode (no site chrome).
 */
const TABLEAU_EMBED_URL =
  "https://public.tableau.com/views/MSBA_405/Dashboard" +
  "?:embed=y&:showVizHome=no&:tabs=no&:toolbar=no&:device=desktop";

const TABLEAU_PUBLIC_URL =
  "https://public.tableau.com/app/profile/tirth.patel3716/viz/MSBA_405/Dashboard";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function TableauPreviewCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#1f77b4] to-[#4e9bb9]">
          Tableau Dashboard
        </h2>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full bg-[#0a192f] border border-[#1f77b4]/40 rounded-2xl p-6 md:p-8 hover:shadow-[0_0_35px_rgba(31,119,180,0.15)] transition-shadow duration-300"
      >
        <div className="flex flex-col gap-8">
          {/* ── Header row ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#4e9bb9]" />
              <span className="text-sm font-semibold text-[#4e9bb9] uppercase tracking-wider">
                Live · Interactive Dashboard
              </span>
            </div>
            <a
              href={TABLEAU_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-[#1f77b4] hover:bg-[#4e9bb9] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors shadow-lg"
            >
              Open in Tableau Public
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* ── Embed window ───────────────────────────────────────── */}
          <div
            className="relative w-full rounded-xl overflow-hidden border border-[#4e9bb9]/30 shadow-2xl bg-[#0d1f33]"
            style={{ minHeight: "690px" }}
          >
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1f77b4]/20 bg-[#071526]">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-[#4e9bb9]/60 font-mono truncate">
                public.tableau.com · Weather-Driven Consumer Experience
              </span>
            </div>

            {/* Loading overlay — fades away once iframe fires onLoad */}
            {loading && !error && (
              <div className="absolute inset-x-0 bottom-0 top-[37px] flex flex-col items-center justify-center gap-4 bg-[#0a192f] z-10 pointer-events-none">
                <Loader2 className="w-8 h-8 text-[#4e9bb9] animate-spin" />
                <p className="text-neutral-400 text-sm">Loading dashboard…</p>
              </div>
            )}

            {/* Error fallback */}
            {error ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
                <AlertCircle className="w-10 h-10 text-red-400/70" />
                <p className="text-neutral-400 text-sm max-w-xs">
                  Could not load the dashboard inline.
                </p>
                <a
                  href={TABLEAU_PUBLIC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1f77b4] hover:bg-[#4e9bb9] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors"
                >
                  Open in Tableau Public
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <iframe
                id="tableau-dashboard-embed"
                src={TABLEAU_EMBED_URL}
                width="100%"
                height="650"
                frameBorder="0"
                allowFullScreen
                title="Weather-Driven Consumer Experience — Tableau Dashboard"
                className="block w-full"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            )}
          </div>

          {/* ── Key insights strip ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Cold Weather Paradox",
                desc: "Volume drops (101/day) but sentiment peaks at 0.71",
              },
              {
                label: "Extreme Heat Effect",
                desc: "Drops to ~30 reviews/day with lowest sentiment (0.65)",
              },
              {
                label: "Rain Resilience",
                desc: "50% volume drop (143/day) yet sentiment stays stable at 0.69",
              },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 bg-[#071526] border border-[#1f77b4]/20 rounded-xl p-4"
              >
                <span className="w-2 h-2 rounded-full bg-[#1f77b4] shrink-0 mt-1.5" />
                <div>
                  <p className="text-white text-sm font-semibold mb-0.5">
                    {label}
                  </p>
                  <p className="text-neutral-400 text-xs leading-relaxed">
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
