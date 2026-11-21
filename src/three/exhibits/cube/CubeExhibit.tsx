'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { MALTESE_MEAN_MOVES, MALTESE_STAGES, MALTESE_STAGE_SOLVE } from '@/data/malteseStages';
import { useScenePalette } from '../../core/palette';
import { useReducedMotion } from '../../core/quality';
import ExhibitShell from '../ExhibitShell';
import { PlayButton, Stat } from '../hud';

/* How the solver works, in pictures of one real solve. For each stage the cube is shown
   before and after it, rendered from the puzzle simulator (scripts/3d/render-maltese-stages.py):
   the pieces the stage solves are bright (outlined in teal where they are small), pieces
   solved earlier are dimmed, and pieces the solver ignores for now are grey. Plain images,
   so it needs no WebGL and shows on every device. */

const DIR = '/mgc-stages';
const AUTO_MS = 5500;

type Look = 'now' | 'teal' | 'done' | 'off';

interface Step {
  /** Stepper label. */
  label: string;
  /** Badge in the stepper: the stage number, or a tick for the finish. */
  badge: string;
  before: string;
  after: string;
  alt: [string, string];
  body: string;
  note?: string;
  legend: Look[];
  /** The bright pieces carry a teal outline in the images. */
  outlined?: boolean;
  moves: number;
}

const STAGE_COPY: Array<Omit<Step, 'label' | 'badge' | 'before' | 'after' | 'moves'> & { file: string }> = [
  {
    file: '1-corners',
    body: "Every corner goes back to its spot, turned the right way. On its own this is a 2×2 Rubik's cube: few enough positions to store the best move from every one.",
    legend: ['now', 'off'],
    alt: [
      'The scrambled cube with only the corners in colour, mixed up. Every other piece is grey.',
      'The corners solved: each face shows one colour on its corners. The grey pieces are still scrambled.',
    ],
  },
  {
    file: '2-gear-angles-1',
    body: 'Each of the 24 gears can sit at four angles. This stage leaves every gear flat or exactly a half turn off, using only move sequences that keep the corners in place.',
    note: 'Colour does not matter yet, so the gears are shown in one colour.',
    legend: ['teal', 'done', 'off'],
    alt: [
      'Corners solved and dimmed. The gears, in teal, sit at mixed angles. Edges and centres are grey.',
      'Every gear is now flat or a half turn off. The corners have not moved.',
    ],
  },
  {
    file: '3-gear-angles-2',
    body: 'Now every gear lies flat. Again an exact lookup table, and again only moves that undo none of the earlier work.',
    note: 'Colour does not matter yet, so the gears are shown in one colour.',
    legend: ['teal', 'done', 'off'],
    alt: ['The teal gears, each flat or a half turn off.', 'Every teal gear lies flat.'],
  },
  {
    file: '4-gear-positions',
    body: 'The gears are sorted onto their own faces, four of each colour. Far too many positions to store, so a neural network estimates how far each one is from done and a search follows its best guesses.',
    legend: ['now', 'done', 'off'],
    outlined: true,
    alt: [
      'Gears in their real colours, mixed up across the faces and outlined in teal. Corners dimmed, edges and centres grey.',
      'Each face now has its four gears of its own colour.',
    ],
  },
  {
    file: '5-ring',
    body: 'Last, the 18 small pieces of the middle rings: 12 edges and 6 centres. A second neural network guides the search. Its moves are 12-turn sequences that leave every corner and gear untouched, which is why this stage takes the most moves.',
    legend: ['now', 'done'],
    outlined: true,
    alt: [
      'Corners and gears solved and dimmed. The small edge and centre pieces, outlined in teal, are still scrambled.',
      'The edges and centres are in place: the whole cube is solved.',
    ],
  },
];

const STEPS: Step[] = [
  ...STAGE_COPY.map(({ file, ...c }, i) => ({
    ...c,
    label: MALTESE_STAGES[i].short,
    badge: String(i + 1),
    before: `${DIR}/${file}-before.webp`,
    after: `${DIR}/${file}-after.webp`,
    moves: MALTESE_STAGE_SOLVE.perStage[i],
  })),
  {
    label: 'Solved',
    badge: '✓',
    before: `${DIR}/scrambled.webp`,
    after: `${DIR}/solved.webp`,
    alt: ['The scrambled cube in full colour.', 'The same cube, solved.'],
    body: 'The five stage solutions are joined and back-to-back turns are merged. A solution only counts if the simulator ends up solved: in the benchmark, 100 of 100 did.',
    legend: [],
    moves: MALTESE_STAGE_SOLVE.total,
  },
];
const LAST = STEPS.length - 1;

const LEGEND: Record<Look, string> = {
  now: 'Solving now',
  teal: 'Solving now (angle only)',
  done: 'Solved earlier, kept in place',
  off: 'Ignored for now',
};

const METHOD = {
  table: 'Exact lookup table',
  net: 'Neural network',
} as const;

function useNearView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

type Play = 'auto' | 'playing' | 'paused';

export default function CubeExhibit() {
  const palette = useScenePalette();
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useNearView<HTMLDivElement>();
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState<Play>('auto');
  const playing = step < LAST && (play === 'playing' || (play === 'auto' && inView && !reduced));

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setStep((s) => Math.min(LAST, s + 1)), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [playing, step]);

  // Fetch every "before" image once the exhibit is close, so stepping never waits.
  // (The "after" images are already loading as the stepper's thumbnails.)
  useEffect(() => {
    if (!inView) return;
    STEPS.forEach((s) => {
      const img = new Image();
      img.src = s.before;
    });
  }, [inView]);

  const go = (i: number) => {
    setStep(Math.max(0, Math.min(LAST, i)));
    setPlay('paused');
  };

  const s = STEPS[step];
  const stage = step < MALTESE_STAGES.length ? MALTESE_STAGES[step] : null;

  const strip = (
    <ol className="solve-steps" aria-label="Solver stages">
      {STEPS.map((t, i) => (
        <li key={t.label}>
          <button
            type="button"
            className="solve-step"
            aria-current={i === step ? 'step' : undefined}
            onClick={() => go(i)}
          >
            <span className="solve-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.after} alt="" width={52} height={52} loading="lazy" decoding="async" />
            </span>
            <span className="min-w-0">
              <span className="solve-step-num">{i < LAST ? `Stage ${t.badge}` : 'Finish'}</span>
              <span className="solve-step-name">{t.label}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );

  const view = (
    <div className="solve-view">
      <div className="solve-pair" key={step}>
        <figure className="solve-shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.before} alt={s.alt[0]} width={900} height={900} decoding="async" />
          <figcaption>{step < LAST ? 'Before' : 'Scrambled'}</figcaption>
        </figure>
        <div className="solve-arrow" aria-hidden="true">
          <ArrowRight className="w-5 h-5" />
          <span>{s.moves} moves</span>
        </div>
        <figure className="solve-shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.after} alt={s.alt[1]} width={900} height={900} decoding="async" />
          <figcaption>{step < LAST ? 'After' : 'Solved'}</figcaption>
        </figure>
      </div>
      {s.legend.length > 0 && (
        <ul className="solve-legend" aria-label="Colour key">
          {s.legend.map((l) => (
            <li key={l}>
              <span className="solve-swatch" data-look={l} data-outlined={l === 'now' && s.outlined ? 'true' : undefined} aria-hidden="true" />
              {LEGEND[l]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const side = (
    <div className="space-y-4">
      <div>
        <p className="hud-mini">{stage ? `Stage ${step + 1} of ${MALTESE_STAGES.length}` : 'All five stages'}</p>
        <h3 className="solve-name">{stage ? stage.name : 'Solved and checked'}</h3>
      </div>
      <p className="solve-body">{s.body}</p>
      {s.note && <p className="hud-note">{s.note}</p>}
      {stage && (
        <p className="solve-method" data-method={stage.method}>
          {METHOD[stage.method]}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {stage ? (
          <>
            <Stat label="Positions" value={<span className="solve-positions">{stage.positions}</span>} />
            <Stat label="Moves" value={s.moves} sub={`this solve; ${stage.moves} on average`} />
          </>
        ) : (
          <>
            <Stat label="Moves" value={s.moves} sub={`this solve; about ${MALTESE_MEAN_MOVES} on average`} />
            <Stat label="Solved" value="100 / 100" sub="benchmark scrambles" />
          </>
        )}
      </div>
    </div>
  );

  const hud = (
    <>
      <button type="button" className="hud-btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous stage">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <PlayButton
        playing={playing}
        onToggle={() => {
          if (step === LAST) {
            setStep(0);
            setPlay('playing');
          } else setPlay(playing ? 'paused' : 'playing');
        }}
      />
      <button type="button" className="hud-btn" onClick={() => go(step + 1)} disabled={step === LAST} aria-label="Next stage">
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
      <span className="hud-count" aria-live="polite">
        {stage ? `Stage ${step + 1} of ${MALTESE_STAGES.length}: ${stage.name}` : 'Solved'}
      </span>
    </>
  );

  return (
    <div ref={wrapRef}>
      <ExhibitShell
        kicker="Puzzle Workshop · how the solver works"
        title="Five smaller puzzles instead of one impossible one"
        intro={
          <>
            One search over all 4.5×10⁵⁸ positions is hopeless. So the solver fixes one group of pieces at a time, and each
            stage only uses moves that keep the earlier groups solved.
          </>
        }
        strip={strip}
        accent={palette.accent.teal}
        side={side}
        hud={hud}
        stageHeight="auto"
        caption={
          <>
            One real solve, rendered from the puzzle simulator: a {MALTESE_STAGE_SOLVE.scrambleMoves.toLocaleString('en-US')}-move
            scramble, solved in {MALTESE_STAGE_SOLVE.total} moves, with each stage&apos;s moves replayed and checked. Averages
            come from the 100-scramble benchmark.
          </>
        }
      >
        {view}
      </ExhibitShell>
    </div>
  );
}
