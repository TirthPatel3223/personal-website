"use client";

import { motion, Variants } from "framer-motion";
import { Bot, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

const RAG_URL = "https://tirth-courserag.duckdns.org";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const HIGHLIGHTS = [
  {
    label: "Deadline Queries",
    desc: 'Ask "When is HW3 due?" — answer is extracted, re-verified, and cited',
  },
  {
    label: "File Upload",
    desc: "Drag in a PDF, approve the LLM-proposed Drive folder, and it's instantly queryable",
  },
  {
    label: "Source Explanation",
    desc: 'Ask "Why did you give me that?" and see the exact raw chunks used',
  },
];

export default function CourseRAGPreviewCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--title)" }}>
          Live Demo
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full rounded-2xl p-6 md:p-8 transition-shadow duration-300"
        style={{
          background: "rgba(20, 184, 166, 0.04)",
          border: "1px solid rgba(20, 184, 166, 0.30)",
          boxShadow: "0 0 0 rgba(20,184,166,0)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 0 35px rgba(20,184,166,0.12)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 0 0 rgba(20,184,166,0)")
        }
      >
        <div className="flex flex-col gap-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" style={{ color: "rgb(45,212,191)" }} />
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "rgb(45,212,191)" }}
              >
                Live · Interactive RAG System
              </span>
            </div>
            <a
              href={RAG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 font-bold rounded-full px-5 py-2.5 text-sm transition-colors shadow-lg"
              style={{
                background: "rgba(20,184,166,0.15)",
                color: "rgb(45,212,191)",
                border: "1px solid rgba(20,184,166,0.40)",
              }}
            >
              Open Full Site
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Embed window */}
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-2xl"
            style={{
              minHeight: "700px",
              border: "1px solid rgba(20,184,166,0.25)",
              background: "rgba(10,20,30,0.6)",
            }}
          >
            {/* Fake browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                borderBottom: "1px solid rgba(20,184,166,0.18)",
                background: "rgba(5,15,20,0.8)",
              }}
            >
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span
                className="ml-3 text-xs font-mono truncate"
                style={{ color: "rgba(45,212,191,0.55)" }}
              >
                tirth-courserag.duckdns.org
              </span>
            </div>

            {/* Loading overlay */}
            {loading && !error && (
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-4 z-10 pointer-events-none"
                style={{ top: "37px", background: "rgba(5,15,25,0.85)" }}
              >
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: "rgb(45,212,191)" }}
                />
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Loading RAG system…
                </p>
              </div>
            )}

            {/* Error fallback */}
            {error ? (
              <div className="flex flex-col items-center justify-center gap-5 py-24 text-center px-6">
                <AlertCircle className="w-10 h-10" style={{ color: "rgba(248,113,113,0.7)" }} />
                <div>
                  <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                    Inline embed blocked
                  </p>
                  <p className="text-sm max-w-xs" style={{ color: "var(--muted)" }}>
                    The site can&apos;t be embedded in an iframe. Open it directly to interact with the full RAG system.
                  </p>
                </div>
                <a
                  href={RAG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold rounded-full px-5 py-2.5 text-sm transition-colors"
                  style={{
                    background: "rgba(20,184,166,0.15)",
                    color: "rgb(45,212,191)",
                    border: "1px solid rgba(20,184,166,0.40)",
                  }}
                >
                  Open Course RAG
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <iframe
                src={RAG_URL}
                width="100%"
                height="663"
                frameBorder="0"
                title="Course RAG Pipeline — Live Demo"
                className="block w-full"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            )}
          </div>

          {/* Feature highlights strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HIGHLIGHTS.map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: "rgba(5,15,20,0.5)",
                  border: "1px solid rgba(20,184,166,0.18)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                  style={{ background: "rgb(45,212,191)" }}
                />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
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
