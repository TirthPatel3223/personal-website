"use client";

import { motion, Variants } from "framer-motion";
import { BarChart2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

const TABLEAU_EMBED_URL =
  "https://public.tableau.com/views/CovidData_Visualization/India" +
  "?:embed=y&:showVizHome=no&:tabs=no&:toolbar=no&:device=desktop";

const TABLEAU_PUBLIC_URL =
  "https://public.tableau.com/app/profile/tirth.patel3716/viz/CovidData_Visualization/India";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function CovidTableauCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#e07020] to-[#f59e0b]">
          Tableau Dashboard
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full border rounded-2xl p-6 md:p-8 transition-shadow duration-300"
        style={{
          background: "var(--surface)",
          borderColor: "rgba(224, 112, 32, 0.25)",
          boxShadow: "0 0 35px rgba(224, 112, 32, 0.06)",
        }}
      >
        <div className="flex flex-col gap-8">
          {/* ── Header row ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 covid-accent-text" />
              <span className="text-sm font-semibold covid-accent-text uppercase tracking-wider">
                Live · Interactive Dashboard
              </span>
            </div>
            <a
              href={TABLEAU_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-[#e07020] hover:bg-[#c45a10] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors shadow-lg"
            >
              Open in Tableau Public
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* ── Embed window ───────────────────────────────────────── */}
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-2xl"
            style={{
              minHeight: "900px",
              borderColor: "rgba(224, 112, 32, 0.20)",
              border: "1px solid rgba(224, 112, 32, 0.20)",
              background: "var(--surface-raised)",
            }}
          >
            {/* Fake browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                borderBottom: "1px solid rgba(224, 112, 32, 0.15)",
                background: "var(--background)",
              }}
            >
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs font-mono truncate" style={{ color: "var(--muted)", opacity: 0.6 }}>
                public.tableau.com · COVID-19 Impact Analysis — India
              </span>
            </div>

            {/* Loading overlay */}
            {loading && !error && (
              <div
                className="absolute inset-x-0 bottom-0 top-[37px] flex flex-col items-center justify-center gap-4 z-10 pointer-events-none"
                style={{ background: "var(--background)" }}
              >
                <Loader2 className="w-8 h-8 covid-accent-text animate-spin" />
                <p className="text-sm" style={{ color: "var(--muted)" }}>Loading dashboard…</p>
              </div>
            )}

            {/* Error fallback */}
            {error ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
                <AlertCircle className="w-10 h-10 text-red-400/70" />
                <p className="text-sm max-w-xs" style={{ color: "var(--muted)" }}>
                  Could not load the dashboard inline.
                </p>
                <a
                  href={TABLEAU_PUBLIC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#e07020] hover:bg-[#c45a10] text-white font-bold rounded-full px-5 py-2.5 text-sm transition-colors"
                >
                  Open in Tableau Public
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <iframe
                id="covid-tableau-dashboard-embed"
                src={TABLEAU_EMBED_URL}
                width="100%"
                height="860"
                frameBorder="0"
                allowFullScreen
                title="COVID-19 Impact Analysis — India Dashboard"
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
                label: "Vaccination Impact",
                desc: "Sharp decline in death rate even though there is a sharp increase in the number of cases after vaccination",
              },
              {
                label: "Second Wave Severity",
                desc: "2.2M+ weekly cases peak around February 2021",
              },
              {
                label: "Vaccination Milestone",
                desc: "140M+ total people vaccinated across India",
              },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: "var(--background)",
                  border: "1px solid rgba(224, 112, 32, 0.15)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-[#e07020] shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--title)" }}>
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
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
