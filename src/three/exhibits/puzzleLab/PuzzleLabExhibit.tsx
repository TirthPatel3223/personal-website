'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useScenePalette } from '../../core/palette';
import ExhibitShell from '../ExhibitShell';

/* Puzzle Lab: the live simulator itself, at full width (it has its own puzzle tabs and
   control panel, and needs the room). It is my three.js app on GitHub Pages
   (cross-origin), so it follows the cube page's embed rules: the theme goes in through
   the URL and later by postMessage, the load listener is attached before the src is
   set, and the frame stays inert until clicked so it never traps page scrolling. It
   opens on the Tangram Cube Extreme; the cube page already features the Maltese. */

const SIM_ORIGIN = 'https://tirthpatel3223.github.io';
const SIM_BASE = `${SIM_ORIGIN}/combinatorics-puzzle-simulator/`;

function storedTheme(): 'dark' | 'light' {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export default function PuzzleLabExhibit() {
  const palette = useScenePalette();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const done = () => setLoading(false);
    el.addEventListener('load', done);
    el.src = `${SIM_BASE}?theme=${storedTheme()}`;
    const timer = window.setTimeout(done, 6000);
    return () => {
      el.removeEventListener('load', done);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      frame.current?.contentWindow?.postMessage({ type: 'theme', theme }, SIM_ORIGIN);
    } catch {
      /* The frame keeps its own theme. */
    }
  }, [theme, loading]);

  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setActive(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [active]);

  const hud = (
    <>
      <span className="hud-count">
        Pick a puzzle from the tabs. Drag to rotate; click a piece to turn it, and Shift-click to turn it the other way.
      </span>
      <a className="hud-btn hud-btn-primary ml-auto" href={`${SIM_BASE}?theme=${theme}`} target="_blank" rel="noopener noreferrer">
        Open full screen <ExternalLink className="w-4 h-4" />
      </a>
    </>
  );

  return (
    <ExhibitShell
      kicker="Puzzle Workshop · the live simulator"
      title="Six real puzzles, in your browser"
      accent={palette.accent.teal}
      hud={hud}
      stageHeight="clamp(560px, 78vh, 820px)"
      caption="The simulator itself, running live. Every piece comes from the real puzzle's cuts, and only the moves the real puzzle allows are possible."
    >
      <div ref={wrap} className="absolute inset-0" onMouseLeave={() => setActive(false)}>
        <iframe ref={frame} title="Twisty puzzle 3D simulator" allow="fullscreen; clipboard-write" className="block w-full h-full border-0" />
        {loading && (
          <div
            className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: 'var(--background)' }}
          >
            <Loader2 className="w-8 h-8 cube-accent-text animate-spin" />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Loading the simulator...
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
            <span className="lab-activate">Click to play with the puzzles</span>
          </button>
        )}
      </div>
    </ExhibitShell>
  );
}
