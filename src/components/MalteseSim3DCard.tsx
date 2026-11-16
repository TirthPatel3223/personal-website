'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

/* My three.js simulator of the physical puzzle, hosted on GitHub Pages (repo
   tangram-cube-extreme). It is cross-origin, so the theme goes in two ways: a ?theme=
   parameter on first load, and a postMessage on every later toggle. Both are ignored
   harmlessly by a build of the simulator that does not read them. */
const SIM_ORIGIN = 'https://tirthpatel3223.github.io';
const SIM_URL = `${SIM_ORIGIN}/tangram-cube-extreme/?puzzle=maltese-gear-cube`;

/* A real run of the solver (scripts/solve.py, beam 4096). The scramble is 40 random
   turns of U, L and F; the solution was verified on the solver's reference simulator
   and then replayed in this 3D simulator, whose own engine reports "Solved". */
const DEMO = {
  scramble:
    "U2 F L3 F'3 U' L F3 U'3 L3 F U'2 F'2 L'2 U3 F3 L'3 F2 L U F L'3 U L3 F2 L3 U2 F3 L2 F'3 L3 U'2 L'2 U3 L U L' U' F U' F2",
  solution:
    "U F U2 L' U' L2 U' L F' U' L F U4 F' L' U F3 L4 F U' F' U' F' U F U F U F' L F U2 F4 U'2 F' L' U L2 U2 L2 U2 L'2 U F'2 U F4 U' F2 L U2 L2 U'2 L'2 U2 L' U L4 U' L2 F' L4 F U' L' U L U' F4 U L' U' L3 U4 L2 U F' L4 F L' F L'2 U' L4 U L2 F' L U2 L4 U'2 F4 L' U4 L F' U' L F U' F4 U F' L' U F U4 L U4 L' F3 L F L' U' F U F' L' U L U' L' U L U' F' L F L' U' F U F' U' F L F' L' U F L' U' L U F' L F' L' U F L' U' L U F' U' F U F' L' U L U' F' L F L' U' F L' U L F' U' L F L' F' U F U' L U' F' L F L' U' F U F' L' U L' F' U F U' L' U L F' U' L F2 U F' L' U L U' F' L F L' U' F' L' U F L' U' L U F' U' F L2 F' L' U F L' U' L U F' U' F2 U' F' L U F' L' F L U' L' U F' U F U' L' U L F' U' L F L' U' L U L' F' L F U' L' F U F' L' F' U F U' L' U L F' U' L F L' F L F' U' F U L' F' U L U' F U' L' U L F' U' L F L' F' U2 L' U' F L U' F' U F L' F' L2 F' L' F U L' U' L F U' L F' L' U F L' U' L U F' U' F U F' L' U L U' F' L F L'",
  scrambleQT: 81,
  solutionQT: 433,
  solutionFT: 371,
  seconds: 15.4,
  perRung: [
    ['corners', 11],
    ['gear parity', 28],
    ['gear rotation', 56],
    ['gear colour', 96],
    ['ring', 252],
  ] as const,
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
      /* Clipboard blocked (insecure context, permissions): the text stays selectable. */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy the ${label}`}
      style={{
        flexShrink: 0,
        fontSize: '.7rem',
        fontWeight: 600,
        cursor: 'pointer',
        color: copied ? 'var(--cg)' : 'var(--ct)',
        border: `1px solid ${copied ? 'var(--cg)' : 'var(--ct-bdr)'}`,
        background: 'var(--ct-dim)',
        borderRadius: 999,
        padding: '3px 11px',
        transition: 'color .15s, border-color .15s',
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function MoveBox({ title, meta, text, maxHeight }: { title: string; meta: string; text: string; maxHeight: number }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--dca-card-soft)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--title)' }}>{title}</div>
          <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{meta}</div>
        </div>
        <div style={{ flex: 1 }} />
        <CopyButton text={text} label={title.toLowerCase()} />
      </div>
      <pre
        tabIndex={0}
        style={{
          margin: 0,
          padding: '10px 12px',
          maxHeight,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'normal',
          fontFamily: 'var(--font-mono)',
          fontSize: '.74rem',
          lineHeight: 1.7,
          color: 'var(--foreground)',
          fontVariantLigatures: 'none',
        }}
      >
        {text}
      </pre>
    </div>
  );
}

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

  /* Wider than the 1080px article: the simulator puts its control panel beside the cube
     and needs room for both. The article column is centred, so a symmetric negative
     margin re-centres a wider child; the 48px gutter keeps 100vw (which includes the
     scrollbar) from making the page scroll sideways. */
  const bleed = 'min(1320px, calc(100vw - 48px))';

  return (
    <section id="play" style={{ scrollMarginTop: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-.01em', whiteSpace: 'nowrap', color: 'var(--ct)' }}>
          The Puzzle in 3D
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <p style={{ fontSize: '.95rem', lineHeight: 1.8, color: 'var(--muted)', maxWidth: 800, marginBottom: '1.6rem' }}>
        I built this simulator alongside the solver, from photos and measurements of my own puzzle. A
        90° face turn drives the middle layer 45°, and that layer&apos;s 8 gears each spin three quarters
        of a turn. Centres and edges share one set of slots, so edges stand proud, centres sink and
        gears tilt. Drag to rotate, click a piece to turn its face, or type moves into the Algorithm box.
      </p>

      <div
        ref={wrapRef}
        onMouseLeave={() => setActive(false)}
        style={{
          width: bleed,
          marginLeft: `calc((100% - ${bleed}) / 2)`,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--ct-bdr)',
          background: 'var(--dca-card-firm)',
          boxShadow: '0 0 40px rgba(45,212,191,.07)',
          position: 'relative',
        }}
      >
        {/* window chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderBottom: '1px solid var(--ct-bdr)', background: 'var(--dca-card)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(239,68,68,.6)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(245,158,11,.6)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(34,197,94,.6)' }} />
          <span style={{ marginLeft: 10, fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            maltese gear cube · 3D simulator
          </span>
          <div style={{ flex: 1 }} />
          <a
            href={SIM_URL}
            target="_blank"
            rel="noreferrer"
            style={{ flexShrink: 0, fontSize: '.7rem', fontWeight: 600, textDecoration: 'none', color: 'var(--ct)', border: '1px solid var(--ct-bdr)', background: 'var(--ct-dim)', borderRadius: 999, padding: '3px 11px' }}
          >
            Open full screen ↗
          </a>
        </div>

        <div style={{ position: 'relative' }}>
          <iframe
            ref={iframeRef}
            title="Maltese Gear Cube 3D simulator"
            allow="fullscreen; clipboard-write"
            style={{ display: 'block', width: '100%', height: 'clamp(640px, 82vh, 860px)', border: 0 }}
          />

          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 3,
                background: 'var(--dca-arch)',
                pointerEvents: 'none',
                fontSize: '.8rem',
                color: 'var(--muted)',
              }}
            >
              Loading the 3D simulator…
            </div>
          )}

          {!active && !loading && (
            <button
              type="button"
              onClick={() => setActive(true)}
              aria-label="Activate the 3D simulator"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 22,
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: '.78rem',
                  fontWeight: 600,
                  color: 'var(--title)',
                  background: 'var(--dca-card)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--ct-bdr)',
                  borderRadius: 999,
                  padding: '7px 16px',
                  boxShadow: '0 4px 18px rgba(0,0,0,.18)',
                }}
              >
                Click to play with the cube
              </span>
            </button>
          )}
        </div>
      </div>

      {/* replay a real solve */}
      <div className="home-card" style={{ marginTop: '1.6rem', borderRadius: 16, border: '1px solid var(--ct-bdr)', background: 'var(--dca-card)', backdropFilter: 'blur(16px)', padding: '1.5rem 1.6rem' }}>
        <div className="mgc-replay-grid">
          <div>
            <div style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ct)', marginBottom: 8 }}>
              Replay a real solve
            </div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--title)', marginBottom: 8, lineHeight: 1.35 }}>
              The solver&apos;s output, checked on a second engine
            </h3>
            <p style={{ fontSize: '.84rem', lineHeight: 1.7, color: 'var(--muted)', marginBottom: 14 }}>
              The solver found this solution in {DEMO.seconds} s: {DEMO.solutionQT} quarter turns
              ({DEMO.solutionFT} face turns). Paste the scramble into the simulator&apos;s Algorithm box and
              press Apply, then do the same with the solution. The simulator&apos;s engine was written
              separately from the solver&apos;s, and it reports <strong style={{ color: 'var(--title)' }}>Solved ✓</strong>.
              The solver only turns U, L and F: it holds the opposite corner still, so it never needs the
              other three faces.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <figure style={{ margin: 0, textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mgc-3d-demo-scramble.webp" alt="The cube after the 40-turn demo scramble, rendered in the 3D simulator" width={120} height={117} style={{ width: 120, height: 'auto' }} />
                <figcaption style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 2 }}>after the scramble</figcaption>
              </figure>
              <span aria-hidden style={{ fontSize: '1.2rem', color: 'var(--ct)' }}>→</span>
              <figure style={{ margin: 0, textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mgc-3d-solved.webp" alt="The solved cube, rendered in the 3D simulator" width={120} height={116} style={{ width: 120, height: 'auto' }} />
                <figcaption style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 2 }}>after the solution</figcaption>
              </figure>
            </div>

            <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--title)', marginBottom: 6 }}>Quarter turns spent per rung</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DEMO.perRung.map(([name, qt]) => (
                <span key={name} style={{ fontSize: '.7rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>
                  {name} <span style={{ color: 'var(--title)' }}>{qt}</span>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <MoveBox title="Scramble" meta={`40 turns · ${DEMO.scrambleQT} quarter turns`} text={DEMO.scramble} maxHeight={110} />
            <MoveBox title="Solution" meta={`${DEMO.solutionQT} quarter turns · ${DEMO.solutionFT} face turns`} text={DEMO.solution} maxHeight={190} />
            <div style={{ fontSize: '.7rem', lineHeight: 1.6, color: 'var(--muted)' }}>
              Notation: U, L, F turn a face 90° clockwise, a prime turns it back, and a number repeats it
              (L&apos;3 is three counterclockwise quarter turns). A face needs 8 quarter turns to come back.
              The full solution takes a few minutes to animate.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
