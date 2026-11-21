'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { useTheme } from '@/components/ThemeProvider';
import type { Project } from '@/data/projects';
import { DARK, LIGHT } from '../core/palette';
import { useQuality, useReducedMotion } from '../core/quality';
import { ISLANDS, STOPS, STOP_COUNT } from './tourConfig';
import { setTourFrame, useTourActive } from './tourState';

/* The homepage's Projects section. In tour mode it is STOP_COUNT screens tall with a
   pinned stage: scrolling flies the 3D camera (HomeBackdrop) from island to island
   while this component shows the matching project card. List mode is the plain card
   grid, and it is the only mode on devices that get no 3D. */
export default function TourSection({ projects }: { projects: Project[] }) {
  const quality = useQuality();
  const reduced = useReducedMotion();
  const [view, setView] = useState<'tour' | 'list'>('tour');
  const listMode = view === 'list' || quality === 'off';
  const section = useRef<HTMLElement>(null);
  const active = useTourActive();
  const { theme } = useTheme();
  const pal = theme === 'light' ? LIGHT : DARK;
  const byId = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const vh = window.innerHeight;
      const s = window.scrollY;
      const top = el.getBoundingClientRect().top + s;
      if (listMode) {
        setTourFrame(0, -1, s > top - vh * 0.4);
        return;
      }
      // 0 = hero overview, 1..N = stops (one screen each), N + 1 = outro overview.
      let kf = s < top ? (top > 0 ? s / top : 1) : 1 + (s - top) / vh;
      kf = Math.min(kf, STOP_COUNT + 1);
      const next = kf < 0.6 || kf > STOP_COUNT + 0.45 ? -1 : Math.min(STOP_COUNT - 1, Math.max(0, Math.round(kf - 0.1) - 1));
      setTourFrame(kf, next, s > top + STOP_COUNT * vh - vh * 0.1);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [listMode]);

  const goTo = useCallback(
    (k: number) => {
      const el = section.current;
      if (!el) return;
      const i = Math.max(0, Math.min(STOP_COUNT - 1, k));
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + i * window.innerHeight + 2, behavior: reduced ? 'instant' : 'smooth' });
    },
    [reduced],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(Math.max(0, active) + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(Math.max(0, active) - 1);
    }
  };

  const toggle = (
    <div className="tour-toggle glass" role="group" aria-label="Projects view">
      <button type="button" aria-pressed={!listMode} disabled={quality === 'off'} onClick={() => setView('tour')}>
        <Compass className="w-4 h-4" /> Tour
      </button>
      <button type="button" aria-pressed={listMode} onClick={() => setView('list')}>
        <LayoutGrid className="w-4 h-4" /> List
      </button>
    </div>
  );

  if (listMode) {
    return (
      <section id="projects" ref={section} className="relative max-w-7xl mx-auto px-4 py-28">
        <div className="flex flex-col items-center text-center mb-14 gap-6">
          <h2 className="section-title text-3xl md:text-4xl font-bold tracking-tight">Projects</h2>
          <p className="max-w-xl" style={{ color: 'var(--muted)' }}>
            Puzzles, optimization, machine learning and AI agents.
          </p>
          {quality !== 'off' && toggle}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </section>
    );
  }

  const stop = active >= 0 ? STOPS[active] : null;
  const project = stop ? byId.get(stop.project) : undefined;
  const island = stop ? ISLANDS[stop.island] : undefined;
  const accent = island ? pal.accent[island.accent] : pal.accent.blue;
  const achievements = project ? project.card_achievements ?? project.achievements.slice(0, 3) : [];

  return (
    <section
      id="projects"
      ref={section}
      className="relative"
      style={{ height: `${STOP_COUNT * 100}vh` }}
      aria-label="Projects tour"
    >
      {/* Every project, for screen readers and search engines; the cards below are visual. */}
      <ul className="sr-only">
        {projects.map((p) => (
          <li key={p.id}>
            <a href={p.link}>{p.title}</a>: {p.short_description}
          </li>
        ))}
      </ul>

      <div className="tour-stage" onKeyDown={onKeyDown}>
        <div className="tour-topbar">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
              Projects
            </h2>
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }} aria-live="polite">
              {active >= 0 ? `${active + 1} / ${STOP_COUNT}` : `${STOP_COUNT} stops`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#about" className="tour-skip">
              Skip the tour
            </a>
            {toggle}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stop && project && island && (
            <div key={stop.project} className="tour-card-slot" data-side={stop.side}>
              <motion.article
                className="tour-card glass"
                style={{ ['--tour-accent' as string]: accent }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
                transition={{ duration: reduced ? 0.15 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <p className="tour-kicker">
                  <span className="tour-dot" aria-hidden="true" />
                  {island.name}
                </p>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-snug" style={{ color: 'var(--title)' }}>
                  {project.title}
                </h3>
                <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--muted)' }}>
                  {project.short_description}
                </p>
                <ul className="tour-points">
                  {achievements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <div className="tour-pills flex flex-wrap gap-1.5 mt-4">
                  {project.tech_stack.slice(0, 4).map((t) => (
                    <span key={t} className="tour-pill">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 mt-6">
                  <Link href={project.link} className="tour-explore">
                    Explore project <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="tour-step"
                      onClick={() => goTo(active - 1)}
                      disabled={active <= 0}
                      aria-label="Previous project"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="tour-step"
                      onClick={() => goTo(active + 1)}
                      disabled={active >= STOP_COUNT - 1}
                      aria-label="Next project"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            </div>
          )}
        </AnimatePresence>

        <nav className="tour-minimap glass" aria-label="Islands">
          {ISLANDS.map((isl, i) => {
            const first = STOPS.findIndex((s) => s.island === i);
            const here = stop?.island === i;
            return (
              <button
                key={isl.id}
                type="button"
                className="tour-island"
                data-active={here}
                style={{ ['--dot' as string]: pal.accent[isl.accent] }}
                onClick={() => goTo(first)}
                aria-label={isl.name}
                aria-current={here ? 'step' : undefined}
              >
                <span className="tour-island-dot" aria-hidden="true" />
                <span className="tour-island-label">{isl.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
