'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

/* Self-contained single-file explorer, served straight out of /public. Because it is
   same-origin we can reach into its document to keep its theme in step with the site's,
   which a cross-origin embed could not do. */
const EXPLORER_URL = '/mgc-macro-explorer.html';

const NOTES = [
  {
    label: '5 161 macros, four catalogues',
    desc: 'Gear placement (4 761), macro pool (298), action set (75) and gear orientation (27), filterable by move word or effect signature.',
  },
  {
    label: 'Effect signature, not a guess',
    desc: 'Every entry carries its exact footprint: corners and edges moved or twisted, gear cells cycled, gear teeth rotated.',
  },
  {
    label: 'Move-by-move scrub',
    desc: 'Play the word one turn at a time and watch the flat net drift from solved, with a ring on each piece that no longer matches.',
  },
];

export default function CubeMacroExplorerCard() {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  /* The explorer's own theme button flips data-theme AND re-renders its SVG nets, so
     clicking it is the only way to switch it that also repaints the diagrams. */
  const syncTheme = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      const btn = doc?.getElementById('themeBtn') as HTMLButtonElement | null;
      if (!doc || !btn) return;
      const current =
        doc.documentElement.getAttribute('data-theme') ||
        (doc.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      if (current !== theme) btn.click();
    } catch {
      /* Same-origin in practice; swallow anything odd rather than break the page. */
    }
  }, [theme]);

  /* The file is static and often finishes loading before React hydrates, so a JSX
     onLoad would never fire and the opaque overlay would sit on top of it forever.
     Attach imperatively and time out regardless. */
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const done = () => {
      setLoading(false);
      syncTheme();
    };
    el.addEventListener('load', done);
    const timer = window.setTimeout(done, 2500);
    return () => {
      el.removeEventListener('load', done);
      window.clearTimeout(timer);
    };
  }, [syncTheme]);

  useEffect(syncTheme, [syncTheme]);

  /* Wider than the 1080px article column: below ~1080px the explorer drops its two
     nets into one column and the comparison stops being a comparison. The parent wrap
     is margin:0 auto, so a symmetric negative margin re-centres a wider child. The
     48px gutter matters — 100vw includes the scrollbar, and without it the whole page
     scrolls sideways by the scrollbar's width. */
  const bleed = 'min(1320px, calc(100vw - 48px))';

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.75rem' }}>
        <span
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            letterSpacing: '-.01em',
            whiteSpace: 'nowrap',
            color: 'var(--ct)',
          }}
        >
          Interactive Macro Explorer
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <p
        style={{
          fontSize: '.95rem',
          lineHeight: 1.8,
          color: 'var(--muted)',
          maxWidth: 780,
          marginBottom: '1.6rem',
        }}
      >
        Learning a heuristic only works if the move set is understood first. This explorer catalogues{' '}
        <strong style={{ color: 'var(--title)' }}>5 161 macros</strong>, conjugates and commutators
        of the base turns running 1 to 104 moves long, alongside the exact effect each one has on
        the solved cube. Pick a macro on the left, then scrub through it move by move: the right-hand net
        redraws as the cube changes, and a cyan ring marks every piece that no longer matches the
        goal state.
      </p>

      <div
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
        {/* fake window chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            borderBottom: '1px solid var(--ct-bdr)',
            background: 'var(--dca-card)',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(239,68,68,.6)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(245,158,11,.6)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(34,197,94,.6)' }} />
          <span
            style={{
              marginLeft: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: '.7rem',
              color: 'var(--muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            maltese gear cube · macro explorer
          </span>
          <div style={{ flex: 1 }} />
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              flexShrink: 0,
              fontSize: '.7rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--ct)',
              border: '1px solid var(--ct-bdr)',
              background: 'var(--ct-dim)',
              borderRadius: 999,
              padding: '3px 11px',
            }}
          >
            Open full screen ↗
          </a>
        </div>

        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: '39px 0 0 0',
              display: 'grid',
              placeItems: 'center',
              zIndex: 2,
              background: 'var(--dca-arch)',
              pointerEvents: 'none',
              fontSize: '.8rem',
              color: 'var(--muted)',
            }}
          >
            Loading the macro explorer…
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={EXPLORER_URL}
          title="Maltese Gear Cube macro explorer"
          style={{
            display: 'block',
            width: '100%',
            height: 'clamp(600px, 84vh, 920px)',
            border: 0,
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
          marginTop: '1.4rem',
        }}
      >
        {NOTES.map(({ label, desc }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              borderRadius: 12,
              padding: '13px 15px',
              border: '1px solid var(--border)',
              background: 'var(--dca-card-soft)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--ct)',
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <div>
              <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--title)', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: '.72rem', lineHeight: 1.6, color: 'var(--muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
