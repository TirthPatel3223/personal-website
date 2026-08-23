"use client";

import { motion, Variants } from "framer-motion";
import { Bot, ExternalLink, Loader2, AlertCircle, KeyRound, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Attach native load/error listeners — more reliable than React synthetic
  // events for cross-origin iframes
  useEffect(() => {
    if (!active) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    setLoading(true);
    setError(false);

    const handleLoad = () => setLoading(false);
    const handleError = () => { setLoading(false); setError(true); };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);
    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, [active]);

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
        className="w-full flex flex-col gap-6"
      >
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 site-accent-text" />
            <span className="text-sm font-semibold uppercase tracking-wider site-accent-text">
              Live · Interactive RAG System
            </span>
          </div>
          <a
            href={RAG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 glass font-medium rounded-full px-5 py-2.5 text-sm transition-all site-accent-text site-accent-border"
          >
            Open Full Site
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Credentials notice */}
        <div className="glass rounded-2xl px-5 py-4 flex items-start gap-3 site-accent-border">
          <KeyRound className="w-4 h-4 site-accent-text shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            <span className="font-semibold site-accent-text">Demo credentials — </span>
            use{" "}
            <span className="font-mono font-semibold" style={{ color: "var(--title)" }}>viewer</span>
            {" "}/ {" "}
            <span className="font-mono font-semibold" style={{ color: "var(--title)" }}>hi-how-are-you</span>{" "}
            to log in. The viewer account has read-only access to course Q&amp;A and deadline queries.
          </p>
        </div>

        {/* Embed window */}
        <div
          className="glass site-accent-border relative w-full rounded-2xl overflow-hidden"
          style={{ minHeight: "700px" }}
        >
          {/* Fake browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: "1px solid var(--border)", background: "rgba(5,10,15,0.5)" }}
          >
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs font-mono truncate" style={{ color: "var(--muted)" }}>
              tirth-courserag.duckdns.org
            </span>
          </div>

          {/* Pre-load placeholder */}
          {!active && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-5"
              style={{ top: "37px" }}>
              <Bot className="w-12 h-12 site-accent-text opacity-40" />
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: "var(--title)" }}>
                  Course RAG — Live Demo
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Click to load the interactive RAG system
                </p>
              </div>
              <button
                onClick={() => setActive(true)}
                className="inline-flex items-center gap-2 glass site-accent-text site-accent-border font-semibold rounded-full px-6 py-3 text-sm transition-all hover-site-accent-border"
              >
                <Play className="w-4 h-4" />
                Load Demo
              </button>
            </div>
          )}

          {/* Loading overlay — shown only while iframe is fetching */}
          {active && loading && !error && (
            <div
              className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-4 z-10 pointer-events-none"
              style={{ top: "37px", background: "rgba(15,20,26,0.85)" }}
            >
              <Loader2 className="w-8 h-8 site-accent-text animate-spin" />
              <p className="text-sm" style={{ color: "var(--foreground)" }}>
                Loading RAG system…
              </p>
            </div>
          )}

          {/* Error fallback */}
          {active && error && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-5 text-center px-6"
              style={{ top: "37px" }}>
              <AlertCircle className="w-10 h-10" style={{ color: "rgba(248,113,113,0.7)" }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--title)" }}>
                  Inline embed blocked
                </p>
                <p className="text-sm max-w-xs" style={{ color: "var(--foreground)" }}>
                  The site can&apos;t be embedded in an iframe. Open it directly to interact with the full RAG system.
                </p>
              </div>
              <a
                href={RAG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2 site-accent-text site-accent-border font-medium rounded-full px-5 py-2.5 text-sm transition-all"
              >
                Open Course RAG
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Iframe — only mounted after user clicks Load Demo */}
          {active && (
            <iframe
              ref={iframeRef}
              src={RAG_URL}
              width="100%"
              height="663"
              frameBorder="0"
              title="Course Material Q&A Assistant — Live Demo"
              className="block w-full"
            />
          )}
        </div>

        {/* Feature highlights strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HIGHLIGHTS.map(({ label, desc }) => (
            <div
              key={label}
              className="glass site-accent-border rounded-2xl flex items-start gap-3 p-4 hover-site-accent-border transition-colors"
            >
              <span className="w-2 h-2 rounded-full site-accent-bg shrink-0 mt-1.5 border site-accent-border" />
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--title)" }}>
                  {label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
