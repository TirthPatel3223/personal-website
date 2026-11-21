'use client';

import { motion, type Variants } from 'framer-motion';
import { Box, ExternalLink, Loader2, Copy, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

/* My three.js simulator of the physical puzzle, hosted on GitHub Pages (repo
   combinatorics-puzzle-simulator). It is cross-origin, so the theme goes in two ways: a ?theme=
   parameter on first load, and a postMessage on every later toggle. Both are ignored
   harmlessly by a build of the simulator that does not read them. */
const SIM_ORIGIN = 'https://tirthpatel3223.github.io';
const SIM_URL = `${SIM_ORIGIN}/combinatorics-puzzle-simulator/?puzzle=maltese-gear-cube`;

/* A real run of the solver (scripts/solve.py, beam 4096). The scramble is 40 random
   turns of U, L and F; the solution was verified on the solver's reference simulator
   and then replayed in this 3D simulator, whose own engine reports "Solved". */
const DEMO = {
  scramble:
    "U2 F L3 F'3 U' L F3 U'3 L3 F U'2 F'2 L'2 U3 F3 L'3 F2 L U F L'3 U L3 F2 L3 U2 F3 L2 F'3 L3 U'2 L'2 U3 L U L' U' F U' F2",
  solution:
    "U F U2 L' U' L2 U' L F' U' L F U4 F' L' U F3 L4 F U' F' U' F' U F U F U F' L F U2 F4 U'2 F' L' U L2 U2 L2 U2 L'2 U F'2 U F4 U' F2 L U2 L2 U'2 L'2 U2 L' U L4 U' L2 F' L4 F U' L' U L U' F4 U L' U' L3 U4 L2 U F' L4 F L' F L'2 U' L4 U L2 F' L U2 L4 U'2 F4 L' U4 L F' U' L F U' F4 U F' L' U F U4 L U4 L' F3 L F L' U' F U F' L' U L U' L' U L U' F' L F L' U' F U F' U' F L F' L' U F L' U' L U F' L F' L' U F L' U' L U F' U' F U F' L' U L U' F' L F L' U' F L' U L F' U' L F L' F' U F U' L U' F' L F L' U' F U F' L' U L' F' U F U' L' U L F' U' L F2 U F' L' U L U' F' L F L' U' F' L' U F L' U' L U F' U' F L2 F' L' U F L' U' L U F' U' F2 U' F' L U F' L' F L U' L' U F' U F U' L' U L F' U' L F L' U' L U L' F' L F U' L' F U F' L' F' U F U' L' U L F' U' L F L' F L F' U' F U L' F' U L U' F U' L' U L F' U' L F L' F' U2 L' U' F L U' F' U F L' F' L2 F' L' F U L' U' L F U' L F' L' U F L' U' L U F' U' F U F' L' U L U' F' L F L'",
  solutionQT: 433,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function initialTheme(): 'dark' | 'light' {
  /* ThemeProvider resolves the stored theme in its own effect, which runs AFTER this
     component's effects, so its context value is still the 'dark' default here. */
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard blocked (insecure context, permissions): nothing else to do. */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy the ${label}`}
      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors cube-accent-text cube-accent-border cube-accent-bg cursor-pointer"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : `Copy ${label}`}
    </button>
  );
}

const NOTES = [
  { label: 'Drag to rotate', desc: 'Spin the whole cube to see it from any side.' },
  { label: 'Click to turn', desc: 'Click a piece to turn its face, and watch the gears spin and the middle layer shift.' },
];

export default function MalteseSim3DCard() {
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);

  /* The frame is server-rendered without a src and pointed at the simulator here, once:
     the URL can then carry the visitor's theme, and the load listener is attached before
     loading starts, so a fast load can never slip past it. Setting the src again later
     would reload the frame and throw away whatever the visitor had done to the cube. */
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const done = () => setLoading(false);
    el.addEventListener('load', done);
    el.src = `${SIM_URL}&theme=${initialTheme()}`;
    const timer = window.setTimeout(done, 6000);
    return () => {
      el.removeEventListener('load', done);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'theme', theme }, SIM_ORIGIN);
    } catch {
      /* Nothing to do: the frame keeps its own theme. */
    }
  }, [theme, loading]);

  /* The simulator turns wheel and trackpad gestures into rotation, which would trap page
     scrolling under the pointer. It stays inert until clicked, and goes inert again when
     the pointer leaves or focus moves elsewhere. */
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setActive(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [active]);

  return (
    /* Wider than the article column: the simulator puts its control panel beside the
       cube and needs room for both. The parent is centred (max-w-5xl mx-auto), so a
       symmetric negative margin re-centres this wider block; the 48px gutter keeps
       100vw (which includes the scrollbar) from making the page scroll sideways. */
    <section
      id="play"
      className="relative"
      style={{
        scrollMarginTop: 90,
        width: 'min(1320px, calc(100vw - 48px))',
        marginLeft: 'calc((100% - min(1320px, 100vw - 48px)) / 2)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <h2 className="section-title text-2xl font-bold tracking-tight" style={{ color: 'var(--title)' }}>
          Play With the Cube in 3D
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full border rounded-2xl p-6 md:p-8 cube-accent-border"
        style={{ background: 'var(--surface)', boxShadow: '0 0 35px rgba(45, 212, 191, 0.07)' }}
      >
        <div className="flex flex-col gap-6">
          {/* ── Header row ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 cube-accent-text" />
              <span className="text-sm font-semibold cube-accent-text uppercase tracking-wider">
                My 3D simulator of the real puzzle
              </span>
            </div>
            <a
              href={SIM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 cube-btn font-bold rounded-full px-5 py-2.5 text-sm transition-colors shadow-lg"
            >
              Open full screen
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* ── Embed window ───────────────────────────────────────── */}
          <div
            ref={wrapRef}
            onMouseLeave={() => setActive(false)}
            className="relative w-full rounded-xl overflow-hidden shadow-2xl cube-accent-border border"
            style={{ background: 'var(--surface-raised)' }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}
            >
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs font-mono truncate" style={{ color: 'var(--muted)' }}>
                tirthpatel3223.github.io · Maltese Gear Cube simulator
              </span>
            </div>

            <div className="relative">
              <iframe
                ref={iframeRef}
                title="Maltese Gear Cube 3D simulator"
                allow="fullscreen; clipboard-write"
                className="block w-full border-0"
                style={{ height: 'clamp(560px, 78vh, 820px)' }}
              />

              {loading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[3] pointer-events-none"
                  style={{ background: 'var(--background)' }}
                >
                  <Loader2 className="w-8 h-8 cube-accent-text animate-spin" />
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Loading the 3D simulator…
                  </p>
                </div>
              )}

              {!active && !loading && (
                <button
                  type="button"
                  onClick={() => setActive(true)}
                  aria-label="Activate the 3D simulator"
                  className="absolute inset-0 z-[2] flex items-end justify-center pb-6 bg-transparent border-0 cursor-pointer"
                >
                  <span
                    className="text-sm font-semibold rounded-full px-4 py-2 border cube-accent-border"
                    style={{
                      color: 'var(--title)',
                      background: 'var(--surface)',
                      boxShadow: '0 4px 18px rgba(0,0,0,.18)',
                    }}
                  >
                    Click to play with the cube
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ── Notes strip ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.4fr] gap-4">
            {NOTES.map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl p-4 border cube-accent-border"
                style={{ background: 'var(--background)' }}
              >
                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 cube-dot" />
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

            <div
              className="flex items-start gap-3 rounded-xl p-4 border cube-accent-border"
              style={{ background: 'var(--background)' }}
            >
              <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 cube-dot" />
              <div className="min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--title)' }}>
                  Replay a real solve
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
                  Paste the scramble into the simulator&apos;s Algorithm box and press Apply, then do the
                  same with the solver&apos;s {DEMO.solutionQT}-move answer. The cube ends up solved.
                </p>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={DEMO.scramble} label="scramble" />
                  <CopyButton text={DEMO.solution} label="solution" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
