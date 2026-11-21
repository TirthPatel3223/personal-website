'use client';

import type { CSSProperties, ReactNode } from 'react';

/* The frame every project exhibit sits in: a wide glass panel (wider than the article
   column, using the same scrollbar-safe full-bleed trick as the demo embeds), a 3D
   stage, an optional side panel, a HUD row and a one-line "what you're seeing"
   caption that says what is real data and what is schematic. An exhibit can add a
   short `intro` under the title and a `strip` (e.g. a step picker) above the stage. */
export default function ExhibitShell({
  kicker,
  title,
  accent,
  caption,
  intro,
  strip,
  side,
  hud,
  children,
  stageHeight = 'clamp(420px, 66vh, 700px)',
}: {
  kicker: string;
  title: string;
  accent: string;
  caption: ReactNode;
  intro?: ReactNode;
  strip?: ReactNode;
  side?: ReactNode;
  hud?: ReactNode;
  children: ReactNode;
  stageHeight?: string;
}) {
  return (
    <section
      aria-label={title}
      style={{
        width: 'min(1440px, calc(100vw - 48px))',
        marginLeft: 'calc((100% - min(1440px, 100vw - 48px)) / 2)',
      }}
    >
      <div className="exhibit glass" style={{ ['--ex-accent' as string]: accent } as CSSProperties}>
        <header className="exhibit-head">
          <p className="exhibit-kicker">
            <span className="exhibit-dot" aria-hidden="true" />
            {kicker}
          </p>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--title)' }}>
            {title}
          </h2>
          {intro && <p className="exhibit-intro">{intro}</p>}
        </header>
        {strip}
        <div className={side ? 'exhibit-body exhibit-body-split' : 'exhibit-body'}>
          <div className="exhibit-stage" style={{ height: stageHeight }}>
            {children}
          </div>
          {side && <aside className="exhibit-side">{side}</aside>}
        </div>
        {hud && <div className="exhibit-hud">{hud}</div>}
        <p className="exhibit-caption">
          <strong>What you&apos;re seeing:</strong> {caption}
        </p>
      </div>
    </section>
  );
}

export function ExhibitPlaceholder() {
  return (
    <div
      className="exhibit glass exhibit-placeholder"
      style={{
        width: 'min(1440px, calc(100vw - 48px))',
        marginLeft: 'calc((100% - min(1440px, 100vw - 48px)) / 2)',
        height: 'clamp(520px, 80vh, 860px)',
      }}
      aria-hidden="true"
    />
  );
}
