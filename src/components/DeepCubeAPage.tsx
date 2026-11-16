import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MalteseSim3DCard from '@/components/MalteseSim3DCard';
import { LadderTable, SolutionHistogram } from '@/components/MalteseLadderViz';
import { Project } from '@/data/projects';

const SIM_REPO = 'https://github.com/TirthPatel3223/tangram-cube-extreme';

/* ── inline SVG helpers ─────────────────────────────────────────── */
function GithubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{ width: 17, height: 17, flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/* ── shared style objects ───────────────────────────────────────── */
const S = {
  wrap:    { maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' } as const,
  secHdr:  { display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.75rem' } as const,
  secRule: { flex: 1, height: 1, background: 'var(--border)' } as const,
  card: (border: string): React.CSSProperties => ({
    background: 'var(--dca-card)',
    backdropFilter: 'blur(16px)',
    borderRadius: 16,
    border: `1px solid ${border}`,
    transition: 'transform .35s var(--ease-spring), border-color .2s',
  }),
  lead:    { fontSize: '.95rem', lineHeight: 1.8, color: 'var(--muted)', maxWidth: 800, marginBottom: '1.6rem' } as const,
};

const hl = (c: 'p' | 't') => ({ color: c === 'p' ? 'var(--cp)' : 'var(--ct)', fontWeight: 600 }) as const;

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
    <div className="home-card" style={{ display: 'flex', gap: 15, alignItems: 'flex-start', padding: '1.1rem 1.4rem', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--dca-card-soft)', backdropFilter: 'blur(10px)' }}>
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
function FlowNode({ title, sub, subColor, variant }: { title: string; sub?: React.ReactNode; subColor?: string; variant: 'p' | 't' | 'p-hi' | 't-hi' | 'done-p' | 'done-t' }) {
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
      {sub && <div style={{ fontSize: '.66rem', color: subColor ?? 'var(--muted)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

function FlowArrow({ accent }: { accent: 'p' | 't' }) {
  const color = accent === 'p' ? 'var(--cp)' : 'var(--ct)';
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, fontSize: '.95rem', color, opacity: .65 }}>↓</div>;
}

function ArchDiagram() {
  return (
    <div className="home-card" style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--dca-arch)', backdropFilter: 'blur(20px)' }}>
      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: .65, display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: .65, display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', opacity: .65, display: 'inline-block' }} />
        </div>
        <span style={{ fontSize: '.67rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginLeft: 4 }}>
          cube-solving-pipeline · architecture
        </span>
      </div>

      <div className="dca-arch-grid">
        {/* LEFT: build */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '.63rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid var(--cp-bdr)', color: 'var(--cp)' }}>
            Build the ladder (once)
          </div>
          <FlowNode variant="p" title="Verified move tables" sub="U, L, F and inverses · opposite corner held fixed" />
          <FlowArrow accent="p" />
          <FlowNode variant="p" title="Labelled permutation model" sub="216 points: 96 stickers, 24 gear colours, 96 rotation points" subColor="var(--cp)" />
          <FlowArrow accent="p" />
          <FlowNode variant="p" title="Structure discovery + rung order" sub="orbits, pieces, sub-blocks · measured ordering rules" />
          <FlowArrow accent="p" />
          <FlowNode variant="p" title="Macro harvest per rung" sub="meet in the middle (radius 7) + Schreier generators · SymPy proof of generation" />
          <FlowArrow accent="p" />
          <FlowNode variant="p-hi" title="One heuristic per rung" sub={<>3 exact GPU Dijkstra tables<br />2 value networks by coset value iteration</>} subColor="var(--cp)" />
          <FlowArrow accent="p" />
          <FlowNode variant="done-p" title="✓ Ladder cached on disk" sub="about 0.5 GB of tables and weights" />
        </div>

        {/* CENTER bridge */}
        <div className="dca-arch-bridge">
          <div style={{ width: 1, flex: 1, maxHeight: 80, background: 'linear-gradient(to bottom, transparent, var(--cp))' }} />
          <div style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '.58rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cp)', background: 'rgba(124,58,237,.16)', border: '1px solid var(--cp-bdr)', borderRadius: 7, padding: '14px 6px', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(124,58,237,.18)' }}>
            5 rungs
          </div>
          <div style={{ fontSize: '1.1rem', color: 'var(--ct)', margin: '5px 0' }}>→</div>
          <div style={{ width: 1, flex: 1, maxHeight: 80, background: 'linear-gradient(to bottom, var(--ct), transparent)' }} />
        </div>

        {/* RIGHT: solve */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '.63rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid var(--ct-bdr)', color: 'var(--ct)' }}>
            Solve (every scramble)
          </div>
          <FlowNode variant="t" title="Scrambled state" sub="decoded into labels slot by slot" />
          <FlowArrow accent="t" />
          <FlowNode variant="t" title="Rungs 0 to 2: table walk" sub="corners · gear parity · gear rotation" />
          <FlowArrow accent="t" />
          <FlowNode variant="t-hi" title="Rungs 3 and 4: batched beam search" sub="width 4,096 on the GPU · retried at 8× and 64×" subColor="var(--ct)" />
          <FlowArrow accent="t" />
          <FlowNode variant="t" title="Concatenate and merge" sub="adjacent turns of the same face combined" />
          <FlowArrow accent="t" />
          <FlowNode variant="t" title="Replay on the reference simulator" sub="a solution that does not solve is an error, not a result" subColor="var(--ct)" />
          <FlowArrow accent="t" />
          <FlowNode variant="done-t" title="✓ Verified solution" sub="406 quarter turns, 12 s on average" subColor="var(--cg)" />
        </div>
      </div>
    </div>
  );
}

/* ── lesson card ────────────────────────────────────────────────── */
function Lesson({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="home-card" style={{ ...S.card('var(--border)'), padding: '1.3rem 1.4rem' }}>
      <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--cp)', marginBottom: 6 }}>{kicker}</div>
      <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--title)', marginBottom: 8, lineHeight: 1.35 }}>{title}</div>
      <div style={{ fontSize: '.83rem', lineHeight: 1.7, color: 'var(--muted)' }}>{children}</div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────── */
export default function DeepCubeAPage({ project }: { project: Project }) {
  const { detail } = project;
  const githubUrl = detail?.github_url;

  const purplePills = ['Python', 'PyTorch', 'CUDA', 'Deep RL', 'Group Theory', 'SymPy'];
  const tealPills   = ['Beam Search', 'three.js'];

  const metrics = [
    { val: '100 / 100', lbl: 'Deep scrambles solved', sub: '2,000 to 5,000 moves each', accent: 'p' },
    { val: '406',       lbl: 'Mean quarter turns',    sub: '349 face turns',           accent: 'p' },
    { val: '12.0 s',    lbl: 'Mean solve time',        sub: 'laptop GPU',               accent: 't' },
    { val: '4.5×10⁵⁸',  lbl: 'Visible states',         sub: '194.8 bits, 5 rungs',      accent: 't' },
  ];

  const compare = [
    { k: 'Mean solution', a: '349 face turns', b: '135 face turns' },
    { k: 'Time per solve', a: '12 s, laptop GPU', b: '35 s, different hardware' },
    { k: 'Tables on disk', a: 'about 0.5 GB', b: 'about 50 GB' },
    { k: 'Large rungs', a: 'learned value networks', b: 'precomputed tables' },
  ];

  return (
    <main
      className="min-h-screen cube-page cube-body-bg"
      style={{ position: 'relative', zIndex: 10, color: 'var(--foreground)' }}
    >
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="cube-hero-bg" style={{ borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>

        <div style={S.wrap}>
          <div className="dca-hero-grid" style={{ position: 'relative', zIndex: 1 }}>

            {/* left: text */}
            <div>
              <Link
                href="/"
                style={{ display: 'flex', width: 'fit-content', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none', marginBottom: '1.5rem' }}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} />
                Back to Projects
              </Link>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.67rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--cp)', background: 'var(--cp-dim)', border: '1px solid var(--cp-bdr)', borderRadius: 999, padding: '5px 13px', marginBottom: '1.2rem' }}>
                <span className="dca-eyebrow-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cp)', display: 'inline-block', animation: 'cube-blink 2.2s ease-in-out infinite' }} />
                Group Theory · Deep RL · GPU Search
              </div>

              <h1 style={{ fontSize: 'clamp(2rem, 4.2vw, 3.4rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-.025em', color: 'var(--title)', marginBottom: '1.2rem' }}>
                <span style={{ color: 'var(--cp)' }}>Maltese Gear Cube</span><br />
                Solver
              </h1>

              <p style={{ fontSize: '1.025rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 530, marginBottom: '1.7rem' }}>
                A geared twisty puzzle with about 4.5&thinsp;×&thinsp;10<sup>58</sup> visible states, solved
                by splitting it into a <strong style={{ color: 'var(--title)' }}>ladder of five subgroups</strong>:
                exact tables where a rung fits in memory, DeepCubeA-style value networks where it does not.
                It solves <strong style={{ color: 'var(--title)' }}>100 of 100</strong> scrambles of 2,000 to
                5,000 moves in about 12 seconds each, and every solution is replayed and verified.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: '1.7rem' }}>
                {purplePills.map(t => (
                  <span key={t} style={{ fontSize: '.74rem', fontWeight: 500, borderRadius: 999, padding: '4px 13px', border: '1px solid var(--cp-bdr)', color: 'var(--cp)', background: 'var(--cp-dim)' }}>{t}</span>
                ))}
                {tealPills.map(t => (
                  <span key={t} style={{ fontSize: '.74rem', fontWeight: 500, borderRadius: 999, padding: '4px 13px', border: '1px solid var(--ct-bdr)', color: 'var(--ct)', background: 'var(--ct-dim)' }}>{t}</span>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {githubUrl && (
                  <a href={githubUrl} target="_blank" rel="noreferrer" className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '.85rem', fontWeight: 500, textDecoration: 'none', padding: '9px 20px', borderRadius: 999, color: 'var(--foreground)' }}>
                    <GithubIcon />
                    View the solver
                  </a>
                )}
                <a href="#play" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '.85rem', fontWeight: 600, textDecoration: 'none', padding: '9px 20px', borderRadius: 999, color: 'var(--ct)', border: '1px solid var(--ct-bdr)', background: 'var(--ct-dim)' }}>
                  Play with it in 3D ↓
                </a>
              </div>

              <p style={{ fontSize: '.74rem', lineHeight: 1.6, color: 'var(--muted)', marginTop: '1.3rem', maxWidth: 480 }}>
                The cube behind this page is rendered from my 3D simulator. Scroll down and it scrambles,
                one real geared turn at a time.
              </p>
            </div>

            {/* right: left open on purpose. The fixed background cube (MalteseScrollCube) sits
                behind this column on desktop and scrambles as the page scrolls. */}
            <div className="dca-hero-visual" style={{ minHeight: 420 }} />

          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div className="cube-content-bg">
      <div style={S.wrap}>
        <div style={{ padding: '3.5rem 0 4.5rem', display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>

          {/* headline numbers */}
          <div className="dca-metric-grid">
            {metrics.map(m => (
              <div key={m.lbl} className="home-card" style={{ borderRadius: 16, padding: '1.4rem 1rem', border: '1px solid var(--border)', background: 'var(--dca-card-firm)', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.3rem)', fontWeight: 900, letterSpacing: '-.025em', lineHeight: 1, marginBottom: 8, color: m.accent === 'p' ? 'var(--cp)' : 'var(--ct)' }}>{m.val}</div>
                <div style={{ fontSize: '.67rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--title)' }}>{m.lbl}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 3 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Problem Statement */}
          <section>
            <SecLabel accent="p">Problem Statement</SecLabel>
            <div className="home-card" style={{ ...S.card('var(--cp-bdr)'), padding: '2rem 2.25rem' }}>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.88, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Oskar van Deventer&apos;s <span style={hl('p')}>Maltese Gear Cube</span> looks like a Rubik&apos;s
                cube until you turn it. A quarter turn of a face drags the middle layer round 45°, so centres
                and edges trade places, and 24 gears spin and tilt as they go. A face needs eight quarter turns
                to come home. Solving it means finding a path through a graph with about{' '}
                <span style={hl('p')}>4.5&thinsp;×&thinsp;10<sup>58</sup></span> vertices.
              </p>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.88, color: 'var(--foreground)' }}>
                My first attempt was the plain DeepCubeA recipe: one value network for the whole puzzle,
                trained on random walks, guiding a wide GPU beam search. It flattened out. Its predicted
                distance stopped growing near 18, and it solved nothing deeper than{' '}
                <span style={hl('t')}>24 quarter turns</span>. A bigger network would not fix a value function
                that cannot see past its own horizon, so I went back to the group theory and gave the learning
                a much smaller job.
              </p>
            </div>
          </section>

          {/* 3D simulator + replay */}
          <MalteseSim3DCard />

          {/* The idea */}
          <section>
            <SecLabel accent="none">The Idea: A Ladder of Subgroups</SecLabel>
            <p style={S.lead}>
              Instead of one search over the whole puzzle, the solver walks down a chain of nested subgroups,
              G<sub>0</sub>&nbsp;⊃&nbsp;G<sub>1</sub>&nbsp;⊃&nbsp;…&nbsp;⊃&nbsp;{'{e}'}. Each rung only has to fix
              one family of pieces, using macros that leave every earlier rung solved, so each rung is a
              much smaller puzzle on its own. The rule I added to the textbook version:{' '}
              <strong style={{ color: 'var(--title)' }}>a rung gets an exact table whenever its coset space
              fits in memory, and a value network only when it does not.</strong> A table is the exact value
              function, so nothing is lost, and the learning is spent where tables are impossible.
            </p>
            <div className="home-card" style={{ ...S.card('var(--border)'), padding: '1.5rem 1.4rem' }}>
              <LadderTable />
            </div>
          </section>

          {/* Approach */}
          <section>
            <SecLabel accent="none">Approach &amp; Methodology</SecLabel>

            <PhaseRow label="Phase 1: Find the structure" accent="p" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <Step n={1} accent="p" title="Labelled permutation model"
                body={<>The verified move tables become permutations of <strong>216 labelled points</strong>: 96 stickers, 24 gear colours, and 24&nbsp;×&nbsp;4 gear-rotation points that a move shifts cyclically. Labels let the solver tell identical-looking pieces apart internally. Checked against the reference simulator on 200 random words.</>}
                tags={[{ label: '216 points', accent: 'p' }]}
              />
              <Step n={2} accent="p" title="Structure discovery from the moves alone"
                body={<>Orbits, pieces, orientation sub-blocks (Atkinson&apos;s algorithm) and candidate rung features are computed from the six generator permutations, not written by hand. It finds <strong>7 corners × 3, 18 ring pieces × 4</strong> (12 edges and 6 centres sharing one set of slots) and <strong>24 gears</strong> with a colour and a rotation. Every feature is closed under every move, so a rung can run on its feature vector alone.</>}
              />
              <Step n={3} accent="p" title="Rung order by measured rules"
                body={<>Generator periods are 4 on corners and 8 elsewhere, so corners go first. The ring has pure macros of just 12 moves and gears have none within 12, so the ring goes last. Inside the gears, bits resolved per macro length gives parity, then rotation, then colour.</>}
              />
              <Step n={4} accent="p" title="Macro harvesting, with a proof"
                body={<>A rung&apos;s moves must keep every earlier rung solved. They are found exhaustively by <strong>meet in the middle</strong> over all 115,462 words within 7 moves (about a second), and as <strong>Schreier generators</strong> of the previous rung&apos;s table. A SymPy permutation-group membership test then checks they generate the whole stabiliser, so no rung can be silently unsolvable.</>}
                tags={[{ label: 'MITM r = 7', accent: 'p' }, { label: 'Schreier', accent: 'p' }]}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0', padding: '12px 18px', borderRadius: 8, border: '1px dashed var(--ct-bdr)', background: 'var(--ct-dim)' }}>
              <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--ct)' }}>Ladder fixed: five small puzzles instead of one huge one</div>
                <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 1 }}>Each rung now gets the cheapest exact method its size allows</div>
              </div>
            </div>

            <PhaseRow label="Phase 2: Learn and search" accent="t" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Step n={5} accent="t" title="Exact tables for the rungs that fit"
                body={<>Dijkstra from the goal over the rung&apos;s quotient puzzle, with macro lengths as integer costs, on the GPU: <strong>8.4 million cosets × ~700 actions in about a minute</strong>. The table also stores the first action of a cheapest path, so solving a table rung is just a walk.</>}
                tags={[{ label: 'GPU Dijkstra', accent: 't' }]}
              />
              <Step n={6} accent="t" title="Coset value iteration for the rungs that do not"
                body={<>The gear-colour (3.2&thinsp;×&thinsp;10<sup>15</sup> cosets) and ring (5.4&thinsp;×&thinsp;10<sup>22</sup>) rungs get residual value networks trained by deep approximate value iteration, following Forest Agostinelli&apos;s DeepXube. States are short feature vectors, walks use the rung&apos;s own macros, the target is the cheapest macro cost plus a frozen target network&apos;s estimate, and each target is capped by the cost of the walk that produced it. One update over 200,000 states × 376 macros takes about 65 s.</>}
                tags={[{ label: 'DAVI', accent: 't' }, { label: 'ResNet', accent: 't' }]}
              />
              <Step n={7} accent="t" title="Beam search, then verification"
                body={<>Learned rungs use batched beam search on the GPU: expand every beam state under every macro, drop duplicates by 64-bit hash, score by cost so far plus the network&apos;s estimate, keep the best 4,096 (retrying at 8× and 64× if nothing is found). Rung solutions are concatenated, adjacent turns merged, and the result <span style={hl('t')}>replayed on the reference simulator</span>. A solution that does not solve is an error, not a result.</>}
                tags={[{ label: 'W = 4,096', accent: 't' }]}
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
            <p style={S.lead}>
              The benchmark: 100 random scrambles, each 2,000 to 5,000 quarter turns long, solved with a beam
              of 4,096 on an RTX 5070 Ti laptop GPU. All 100 were solved and verified. Scramble depth barely
              matters (correlation with solution length −0.17): past a few hundred moves every scramble is
              effectively a random state, which is the point of testing so deep.
            </p>

            <div className="home-card" style={{ ...S.card('var(--border)'), padding: '1.5rem 1.4rem', marginBottom: '1.5rem' }}>
              <SolutionHistogram />
            </div>

            <div className="dca-lesson-grid">
              <Lesson kicker="The bug that mattered" title="Generating the group is not enough">
                The 132 gear-colour macros of up to 10 moves only carry the gears around as 12 rigid pairs,
                which reaches less than 1/3000 of the colourings. Adding one pair-splitting macro made the rung
                solvable on paper, but random walks barely left that sliver, so the network never saw the
                states the solver hands it. <strong style={{ color: 'var(--title)' }}>8 of the first 9 deep
                scrambles failed there</strong>, each after about six minutes. Keeping all 244 pair-splitting
                macros fixed it: 100 of 100, and that rung now averages 88 quarter turns.
              </Lesson>
              <Lesson kicker="Measured, not assumed" title="The textbook ladder got worse with every split">
                The design I started from split the ring into a chain of smaller rungs (centre/edge
                separation, flush parity, placement, flips). Built with exact tables, the first five cost 31,
                53, 118, 466 and 945 quarter turns on average and kept growing, because every cheap pure ring
                word mixes centres and edges. One learned ring rung using the 12-move macros costs about 247.
              </Lesson>
              <Lesson kicker="Order matters" title="Gear rotation before gear colour">
                Words that fix the corners and every gear rotation still permute the gears as the whole
                alternating group A<sub>24</sub>, with generators of 4 to 12 moves. In the other order, no word
                of 14 moves or fewer fixes the colours while changing a rotation. Splitting colour and spin
                this way keeps every macro short.
              </Lesson>
              <Lesson kicker="Checked against the tables" title="The numbers add up">
                The corner rung reproduces the pocket cube exactly: 3,674,160 positions, diameter 14. The five
                coset counts multiply to 4.5&thinsp;×&thinsp;10<sup>58</sup> visible states, matching an
                independent solver&apos;s count. Everything is covered by a pytest suite, including end-to-end
                checks against a 29,160-state toy puzzle solved by brute force.
              </Lesson>
            </div>
          </section>

          {/* Honest comparison + next steps */}
          <section>
            <SecLabel accent="none">How It Compares &amp; What&apos;s Next</SecLabel>
            <div className="dca-compare-grid">
              <div className="home-card" style={{ ...S.card('var(--border)'), padding: '1.4rem 1.5rem' }}>
                <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--title)', marginBottom: 6 }}>Against a table-based solver</div>
                <p style={{ fontSize: '.8rem', lineHeight: 1.65, color: 'var(--muted)', marginBottom: 12 }}>
                  Bram Cohen&apos;s maltese_scramble is the reference for this puzzle. Its solutions are much
                  shorter; mine are about 2.6× longer. The trade is memory: about a hundredth of the tables.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600 }} />
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--cp)', fontWeight: 700 }}>This solver</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 700 }}>Table-based reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compare.map(r => (
                        <tr key={r.k} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 8px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{r.k}</td>
                          <td style={{ padding: '7px 8px', color: 'var(--title)' }}>{r.a}</td>
                          <td style={{ padding: '7px 8px', color: 'var(--foreground)' }}>{r.b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="home-card" style={{ ...S.card('var(--border)'), padding: '1.4rem 1.5rem' }}>
                <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--title)', marginBottom: 10 }}>Where the length goes, and how to cut it</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.8rem', lineHeight: 1.6, color: 'var(--muted)' }}>
                  <li><strong style={{ color: 'var(--title)' }}>Look ahead between rungs.</strong> Each rung is solved without regard to the next; keeping several landings per rung saves about 10 moves in the reference solver.</li>
                  <li><strong style={{ color: 'var(--title)' }}>One learned gear-rotation rung.</strong> Rotation takes two table rungs and about 76 quarter turns; a single network over its 2<sup>46</sup> states would likely be shorter.</li>
                  <li><strong style={{ color: 'var(--title)' }}>More ring actions.</strong> The ring rung uses 72 of its 304 distinct cheap moves, and it is where about 60% of every solution goes.</li>
                  <li><strong style={{ color: 'var(--title)' }}>Other puzzles.</strong> Nothing in the core is specific to this cube: a new puzzle needs its move tables and a rung list.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* bottom nav */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', paddingTop: '2.5rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none' }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Back to Projects
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none' }}>
                  <GithubIcon />
                  Solver
                </a>
              )}
              <a href={SIM_REPO} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', textDecoration: 'none' }}>
                <GithubIcon />
                3D simulator
              </a>
            </div>
          </div>

        </div>
      </div>
      </div>
    </main>
  );
}
