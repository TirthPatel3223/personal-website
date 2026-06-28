import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Project } from '@/data/projects';

/* ── inline SVG helpers ─────────────────────────────────────────── */
function GithubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{ width: 17, height: 17, flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* ── shared style objects ───────────────────────────────────────── */
const S = {
  wrap:    { maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' } as const,
  secHdr:  { display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.75rem' } as const,
  secRule: { flex: 1, height: 1, background: 'var(--border)' } as const,
  card: (border: string): React.CSSProperties => ({
    background: 'rgba(15,10,26,.55)',
    backdropFilter: 'blur(16px)',
    borderRadius: 16,
    border: `1px solid ${border}`,
    transition: 'border-color .2s',
  }),
};

/* ── section label ──────────────────────────────────────────────── */
function SecLabel({ children, accent = 'p' }: { children: React.ReactNode; accent?: 'p' | 't' | 'none' }) {
  const color = accent === 'p' ? 'var(--cp)' : accent === 't' ? 'var(--ct)' : 'var(--title)';
  return (
    <div style={S.secHdr}>
      <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-.01em', whiteSpace: 'nowrap', color }}>
        {children}
      </span>
      <div style={S.secRule} />
    </div>
  );
}

/* ── inline tag pill ────────────────────────────────────────────── */
function Tag({ label, accent }: { label: string; accent: 'p' | 't' }) {
  const border = accent === 'p' ? 'var(--cp-bdr)' : 'var(--ct-bdr)';
  const bg     = accent === 'p' ? 'var(--cp-dim)' : 'var(--ct-dim)';
  const color  = accent === 'p' ? 'var(--cp)'     : 'var(--ct)';
  return (
    <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '.66rem', padding: '2px 7px', borderRadius: 4, border: `1px solid ${border}`, background: bg, color, marginLeft: 5, verticalAlign: 'middle' }}>
      {label}
    </span>
  );
}

/* ── step card ──────────────────────────────────────────────────── */
function Step({
  n, title, body, tags, accent,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
  tags?: { label: string; accent: 'p' | 't' }[];
  accent: 'p' | 't';
}) {
  const color  = accent === 'p' ? 'var(--cp)'     : 'var(--ct)';
  const bg     = accent === 'p' ? 'var(--cp-dim)'  : 'var(--ct-dim)';
  const border = accent === 'p' ? 'var(--cp-bdr)'  : 'var(--ct-bdr)';
  return (
    <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start', padding: '1.1rem 1.4rem', borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(15,10,26,.35)', backdropFilter: 'blur(10px)', transition: 'border-color .2s, background .2s' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'grid', placeItems: 'center', fontSize: '.78rem', fontWeight: 700, border: `1px solid ${border}`, color, background: bg }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--title)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '.72rem', color }}>›</span> {title}
        </div>
        <div style={{ fontSize: '.82rem', lineHeight: 1.65, color: 'var(--muted)' }}>
          {body}
          {tags?.map(t => <Tag key={t.label} label={t.label} accent={t.accent} />)}
        </div>
      </div>
    </div>
  );
}

/* ── phase row label ────────────────────────────────────────────── */
function PhaseRow({ label, accent }: { label: string; accent: 'p' | 't' }) {
  const color  = accent === 'p' ? 'var(--cp)'     : 'var(--ct)';
  const bg     = accent === 'p' ? 'var(--cp-dim)'  : 'var(--ct-dim)';
  const border = accent === 'p' ? 'var(--cp-bdr)'  : 'var(--ct-bdr)';
  const gradient = accent === 'p'
    ? 'linear-gradient(90deg, var(--cp-bdr) 0%, transparent 80%)'
    : 'linear-gradient(90deg, var(--ct-bdr) 0%, transparent 80%)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '3px 12px', borderRadius: 999, border: `1px solid ${border}`, color, background: bg, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: gradient }} />
    </div>
  );
}

/* ── architecture flowchart ─────────────────────────────────────── */
function FlowNode({ title, sub, subColor, variant }: { title: string; sub?: string; subColor?: string; variant: 'p' | 't' | 'p-hi' | 't-hi' | 'done-p' | 'done-t' }) {
  const styles: Record<string, React.CSSProperties> = {
    'p':      { border: '1px solid var(--cp-bdr)', background: 'var(--cp-dim)' },
    't':      { border: '1px solid var(--ct-bdr)', background: 'var(--ct-dim)' },
    'p-hi':   { border: '1px solid var(--cp)',     background: 'rgba(124,58,237,.16)', boxShadow: '0 0 18px rgba(124,58,237,.18)' },
    't-hi':   { border: '1px solid var(--ct)',     background: 'rgba(45,212,191,.12)', boxShadow: '0 0 16px rgba(45,212,191,.12)' },
    'done-p': { border: '1px solid var(--cp)',     background: 'rgba(124,58,237,.20)', boxShadow: '0 0 22px rgba(124,58,237,.22)' },
    'done-t': { border: '1px solid var(--cg)',     background: 'rgba(74,222,128,.09)',  boxShadow: '0 0 16px rgba(74,222,128,.12)' },
  };
  const titleColors: Record<string, string> = {
    'p': 'var(--title)', 't': 'var(--title)', 'p-hi': 'var(--title)', 't-hi': 'var(--title)',
    'done-p': 'var(--cp)', 'done-t': 'var(--cg)',
  };
  return (
    <div style={{ borderRadius: 9, padding: '9px 13px', textAlign: 'center', position: 'relative', ...styles[variant] }}>
      <div style={{ fontSize: '.78rem', fontWeight: 600, color: titleColors[variant], lineHeight: 1.3 }}>{title}</div>
      {sub && <div style={{ fontSize: '.63rem', color: subColor ?? 'var(--muted)', marginTop: 3, lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: sub }} />}
    </div>
  );
}

function FlowArrow({ accent }: { accent: 'p' | 't' }) {
  const color = accent === 'p' ? 'var(--cp)' : 'var(--ct)';
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, fontSize: '.95rem', color, opacity: .65 }}>↓</div>;
}

function ArchDiagram() {
  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(4,2,10,.88)', backdropFilter: 'blur(20px)' }}>
      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: .65, display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: .65, display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', opacity: .65, display: 'inline-block' }} />
        </div>
        <span style={{ fontSize: '.67rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginLeft: 4 }}>
          deepcubea-maltese-gear · architecture-diagram
        </span>
      </div>

      {/* two-column body */}
      <div style={{ padding: '2rem 1.75rem', display: 'grid', gridTemplateColumns: '1fr 56px 1fr', gap: 0 }}>

        {/* LEFT: Training */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '.63rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid var(--cp-bdr)', color: 'var(--cp)' }}>
            Phase 1 — Training
          </div>
          <FlowNode variant="p" title="Maltese Gear Cube State Space" sub="~4.9 × 10<sup>19</sup> configurations" subColor="var(--cp)" />
          <FlowArrow accent="p" />
          <FlowNode variant="p" title="Backward Induction Scrambler" sub="k random moves from solved state · k ∈ [1, k<sub>max</sub>]" />
          <FlowArrow accent="p" />
          <div style={{ position: 'relative' }}>
            <FlowNode variant="p" title="Training Dataset" sub="50M+ (state s, distance d) pairs" />
            <span style={{ position: 'absolute', top: '50%', right: 'calc(100% + 10px)', transform: 'translateY(-50%)', fontSize: '.6rem', color: 'var(--cp)', background: 'var(--cp-dim)', border: '1px dashed var(--cp-bdr)', borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap' }}>
              ⟳ Symmetry Aug ×48
            </span>
          </div>
          <FlowArrow accent="p" />
          <FlowNode variant="p-hi" title="Deep Neural Network" sub="4 × 2048 FC · BN · ReLU<br/>Output: h(s) ∈ ℝ<sup>≥0</sup>" subColor="var(--cp)" />
          <FlowArrow accent="p" />
          <FlowNode variant="p" title="MSE Loss" sub="L = (h(s) − d)<sup>2</sup> · Adam optimiser" />
          <FlowArrow accent="p" />
          <FlowNode variant="done-p" title="✓ Trained Model Weights" sub="Converged heuristic · weights frozen" />
        </div>

        {/* CENTER bridge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
          <div style={{ width: 1, flex: 1, maxHeight: 80, background: 'linear-gradient(to bottom, transparent, var(--cp))' }} />
          <div style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '.58rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cp)', background: 'rgba(124,58,237,.16)', border: '1px solid var(--cp-bdr)', borderRadius: 7, padding: '14px 6px', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(124,58,237,.18)' }}>
            Trained h(s)
          </div>
          <div style={{ fontSize: '1.1rem', color: 'var(--ct)', margin: '5px 0' }}>→</div>
          <div style={{ width: 1, flex: 1, maxHeight: 80, background: 'linear-gradient(to bottom, var(--ct), transparent)' }} />
        </div>

        {/* RIGHT: Inference */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '.63rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid var(--ct-bdr)', color: 'var(--ct)' }}>
            Phase 2 — Inference
          </div>
          <FlowNode variant="t" title="Scrambled Input State" sub="Any arbitrary starting configuration" />
          <FlowArrow accent="t" />
          <FlowNode variant="t-hi" title="Batched Weighted A* (BWAS)" sub="w = 0.6 · batch size B = 1 000 nodes / iter" subColor="var(--ct)" />
          <FlowArrow accent="t" />
          <FlowNode variant="t" title="Priority Queue" sub="f(s) = g(s) + w · h(s)<br/>g(s): moves taken · h(s): NN heuristic" />
          <FlowArrow accent="t" />
          <FlowNode variant="t" title="Move Generator + NN Evaluator" sub="~40 legal moves / state · GPU batch forward pass" />
          <FlowArrow accent="t" />
          <FlowNode variant="t" title="Goal Check" sub="Solved → return path · else → re-insert to queue" subColor="var(--ct)" />
          <FlowArrow accent="t" />
          <FlowNode variant="done-t" title="✓ Optimal Solution Path" sub="100% solve rate · avg 1.08× optimal length" subColor="var(--cg)" />
        </div>

      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────── */
export default function DeepCubeAPage({ project }: { project: Project }) {
  const { detail } = project;
  const githubUrl = detail?.github_url;

  const purplePills = ['Python', 'PyTorch', 'TensorFlow', 'CUDA', 'Deep Learning', 'NumPy', 'Symmetry Groups'];
  const tealPills   = ['Weighted A*', 'NetworkX', 'Matplotlib'];

  const metrics = [
    { val: '100%',  lbl: 'Solve Rate',       accent: 'p' },
    { val: '1.08×', lbl: 'Near-Optimal',     accent: 'p' },
    { val: '50M+',  lbl: 'Training States',  accent: 't' },
    { val: '40%',   lbl: 'Training Speedup', accent: 't' },
  ];

  const achievements = [
    <>
      <strong>100% solve rate</strong> across 100 independently scrambled Maltese Gear Cube instances at
      varying scramble depths — zero unsolved cases in the full evaluation set.
    </>,
    <>
      Solutions average <strong>1.08× the theoretical optimal</strong> move count, verified against BFS
      on a reachable subgraph — well within the weighted A* bound imposed by w&nbsp;=&nbsp;0.6.
    </>,
    <>
      <strong>Symmetry augmentation ×48</strong> reduced training time to convergence by 40% with no
      additional data collection, exploiting all rigid-body symmetries of the Maltese Gear Cube.
    </>,
    <>
      BWAS with GPU batching (B&nbsp;=&nbsp;1&thinsp;000) solved all test instances within a bounded
      node-expansion budget, demonstrating scalability to a{' '}
      <strong>~4.9&thinsp;×&thinsp;10<sup>19</sup> state space</strong> without exhaustive search.
    </>,
  ];

  return (
    <main
      className="min-h-screen cube-page cube-body-bg"
      style={{ position: 'relative', zIndex: 10, color: 'var(--foreground)' }}
    >
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="cube-hero-bg" style={{ borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {/* purple glow overlay */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '58%', pointerEvents: 'none', background: 'radial-gradient(ellipse at 85% 40%, var(--cp-glow) 0%, transparent 58%)' }} />

        <div style={S.wrap}>
          <div className="dca-hero-grid" style={{ position: 'relative', zIndex: 1 }}>

            {/* left: text */}
            <div>
              <Link
                href="/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none', marginBottom: '1.5rem' }}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} />
                Back to Projects
              </Link>

              {/* eyebrow */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.67rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--cp)', background: 'var(--cp-dim)', border: '1px solid var(--cp-bdr)', borderRadius: 999, padding: '5px 13px', marginBottom: '1.2rem' }}>
                <span className="dca-eyebrow-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cp)', display: 'inline-block', animation: 'cube-blink 2.2s ease-in-out infinite' }} />
                Deep Reinforcement Learning · Combinatorial Search
              </div>

              <h1 style={{ fontSize: 'clamp(2rem, 4.2vw, 3.4rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-.025em', color: 'var(--title)', marginBottom: '1.2rem' }}>
                DeepCubeA<br />
                <span style={{ color: 'var(--cp)' }}>Maltese Gear Cube</span><br />
                Solver
              </h1>

              <p style={{ fontSize: '1.025rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 510, marginBottom: '1.7rem' }}>
                Applying the DeepCubeA algorithm to a puzzle with ~4.9&thinsp;×&thinsp;10<sup>19</sup> states
                — using backward induction, a learned neural heuristic, and symmetry-augmented training to achieve a{' '}
                <strong style={{ color: 'var(--title)' }}>100% solve rate</strong> at near-optimal path lengths.
              </p>

              {/* tech pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: '1.7rem' }}>
                {purplePills.map(t => (
                  <span key={t} style={{ fontSize: '.74rem', fontWeight: 500, borderRadius: 999, padding: '4px 13px', border: '1px solid var(--cp-bdr)', color: 'var(--cp)', background: 'var(--cp-dim)', transition: 'all .18s' }}>{t}</span>
                ))}
                {tealPills.map(t => (
                  <span key={t} style={{ fontSize: '.74rem', fontWeight: 500, borderRadius: 999, padding: '4px 13px', border: '1px solid var(--ct-bdr)', color: 'var(--ct)', background: 'var(--ct-dim)', transition: 'all .18s' }}>{t}</span>
                ))}
              </div>

              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noreferrer" className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '.85rem', fontWeight: 500, textDecoration: 'none', padding: '9px 20px', borderRadius: 999, color: 'var(--foreground)' }}>
                  <GithubIcon />
                  View on GitHub
                </a>
              )}
            </div>

            {/* right: floating cube image */}
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <div style={{ position: 'absolute', width: 430, height: 430, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.40) 0%, rgba(45,212,191,.06) 44%, transparent 68%)', filter: 'blur(24px)', animation: 'cube-aura 3.8s ease-in-out infinite' }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cube3.png"
                alt="Maltese Gear Cube"
                style={{ width: 340, height: 340, objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'saturate(1.75) brightness(1.08) drop-shadow(0 0 52px rgba(124,58,237,.45)) drop-shadow(0 0 18px rgba(45,212,191,.20))', animation: 'cube-float 7s ease-in-out infinite' }}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div style={S.wrap}>
        <div style={{ padding: '4.5rem 0', display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>

          {/* Problem Statement */}
          <section>
            <SecLabel accent="p">Problem Statement</SecLabel>
            <div style={{ ...S.card('var(--cp-bdr)'), padding: '2rem 2.25rem' }}>
              <p style={{ fontSize: '1.025rem', lineHeight: 1.88, color: 'var(--foreground)' }}>
                The <span style={{ color: 'var(--cp)', fontWeight: 600 }}>Maltese Gear Cube</span> is a mechanical puzzle with a state space of approximately{' '}
                <span style={{ color: 'var(--cp)', fontWeight: 600 }}>4.9&thinsp;×&thinsp;10<sup>19</sup></span> configurations — orders of magnitude larger than a standard Rubik&apos;s Cube. Classical search algorithms such as BFS and IDA* become computationally intractable at this scale without a highly accurate heuristic to prune the tree. The challenge: learn a{' '}
                <span style={{ color: 'var(--cp)', fontWeight: 600 }}>cost-to-go function h(s)</span> entirely through self-supervised backward induction — no human-designed move sequences, no domain-specific solver — then deploy it inside a{' '}
                <span style={{ color: 'var(--ct)', fontWeight: 600 }}>batched weighted A* search</span> that returns provably near-optimal solutions at 100% solve rate on any scrambled starting configuration.
              </p>
            </div>
          </section>

          {/* Approach */}
          <section>
            <SecLabel accent="none">Approach &amp; Methodology</SecLabel>

            <PhaseRow label="Phase 1 — Training" accent="p" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <Step n={1} accent="p" title="State Representation"
                body={<>Each Maltese Gear Cube configuration is encoded as a concatenated <strong>one-hot vector</strong> spanning all corner positions, corner orientations, edge positions, and gear-tooth orientations. This produces a high-dimensional binary input tensor that fully captures the puzzle state without ambiguity — feeding cleanly into the first linear layer of the network.</>}
              />
              <Step n={2} accent="p" title="Backward Induction Data Generation"
                body={<>Starting from the <strong>solved state</strong>, apply sequences of <em>k</em> random legal moves to produce training pairs (<em>s</em>,&thinsp;<em>d</em>), where <em>d&nbsp;=&nbsp;k</em> is the exact cost-to-go. Sampling <em>k</em> uniformly across all depths guarantees coverage of the full difficulty spectrum without any BFS oracle.</>}
                tags={[{ label: '50M+ samples', accent: 'p' }]}
              />
              <Step n={3} accent="p" title="Neural Network Training"
                body={<>A deep fully-connected network — <strong>4 hidden layers × 2048 units</strong>, batch normalisation after every layer, ReLU activations — outputs a scalar h(<em>s</em>)&thinsp;∈&thinsp;ℝ<sup>≥0</sup>. Trained end-to-end via <strong>MSE loss</strong> L&thinsp;=&thinsp;(h(<em>s</em>)&thinsp;−&thinsp;<em>d</em>)<sup>2</sup> with Adam on uniformly-sampled mini-batches until validation loss converges.</>}
                tags={[{ label: '4 × 2048 FC', accent: 'p' }]}
              />
              <Step n={4} accent="p" title="Symmetry-Based Data Augmentation"
                body={<>The Maltese Gear Cube admits <strong>48 geometric symmetries</strong> — rotations and reflections that map valid states to equivalent valid states with identical cost-to-go. Applying all 48 transforms to every training sample multiplies the effective dataset 48×, yielding a <strong>40% reduction in wall-clock training time</strong> at zero additional data-collection cost.</>}
                tags={[{ label: '×48 aug', accent: 'p' }]}
              />
            </div>

            {/* Phase bridge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0', padding: '12px 18px', borderRadius: 8, border: '1px dashed var(--ct-bdr)', background: 'var(--ct-dim)' }}>
              <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--ct)' }}>Trained weights frozen — switching to inference</div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 1 }}>Neural network deployed as a static heuristic inside the search loop</div>
              </div>
            </div>

            <PhaseRow label="Phase 2 — Inference" accent="t" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Step n={5} accent="t" title="Batched Weighted A* Search"
                body={<>Given any scrambled input state, a <strong>Batched Weighted A* (BWAS)</strong> search runs with priority f(<em>s</em>)&thinsp;=&thinsp;g(<em>s</em>)&thinsp;+&thinsp;w·h(<em>s</em>), where g(<em>s</em>) is moves taken, h(<em>s</em>) is the trained neural heuristic, and weight <strong>w&nbsp;=&nbsp;0.6</strong> governs the optimality–speed tradeoff. Nodes are evaluated in <strong>batches of B&nbsp;=&nbsp;1&thinsp;000</strong> per GPU forward pass, cutting per-step latency by orders of magnitude.</>}
                tags={[{ label: 'w = 0.6', accent: 't' }, { label: 'B = 1 000', accent: 't' }]}
              />
              <Step n={6} accent="t" title="Evaluation"
                body={<>Tested on <strong>100 independently scrambled cubes</strong> across varying scramble depths. Solution length is compared against optimal paths computed via BFS on a reachable subgraph. The solver achieves a <span style={{ color: 'var(--ct)', fontWeight: 600 }}>100% solve rate</span> with paths averaging just <span style={{ color: 'var(--ct)', fontWeight: 600 }}>1.08× the optimal</span> move count — confirming near-optimality well within the theoretical w-bound.</>}
              />
            </div>
          </section>

          {/* Architecture */}
          <section>
            <SecLabel accent="none">Architecture</SecLabel>
            <ArchDiagram />
          </section>

          {/* Results */}
          <section>
            <SecLabel accent="none">Results &amp; Impact</SecLabel>

            {/* 4-up metric grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: '1.5rem' }}>
              {metrics.map(m => (
                <div key={m.lbl} style={{ borderRadius: 16, padding: '1.5rem 1rem', border: '1px solid var(--border)', background: 'rgba(15,10,26,.5)', backdropFilter: 'blur(12px)', textAlign: 'center', transition: 'border-color .2s, transform .2s' }}>
                  <div style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', fontWeight: 900, letterSpacing: '-.025em', lineHeight: 1, marginBottom: 8, color: m.accent === 'p' ? 'var(--cp)' : 'var(--ct)' }}>{m.val}</div>
                  <div style={{ fontSize: '.67rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>{m.lbl}</div>
                </div>
              ))}
            </div>

            {/* achievement list */}
            <div style={{ ...S.card('var(--cp-bdr)'), padding: '1.5rem 1.75rem' }}>
              {achievements.map((ach, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 0', borderBottom: i < achievements.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ flexShrink: 0, marginTop: 2, color: 'var(--cp)' }}><CheckIcon /></span>
                  <span style={{ fontSize: '.855rem', lineHeight: 1.65, color: 'var(--foreground)' }}>{ach}</span>
                </div>
              ))}
            </div>
          </section>

          {/* bottom nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2.5rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none' }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Back to Projects
            </Link>
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none' }}>
                <GithubIcon />
                GitHub
              </a>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
