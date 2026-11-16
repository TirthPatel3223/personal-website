'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MALTESE_BENCHMARK } from '@/data/malteseBenchmark';

/* Mark colours come from --mv-* tokens on .cube-page (globals.css), validated per theme.
   Text never wears them: values and labels stay in --title / --muted. */

type Method = 'table' | 'net';

interface Rung {
  name: string;
  fixes: string;
  cosets: string;
  bits: number;
  method: Method;
  actions: string;
  meanQT: number;
  note: string;
}

/* docs/hierarchical_solver.md §3-4 (cosets, bits, actions) and the benchmark (mean QT). */
const RUNGS: Rung[] = [
  { name: 'Corners', fixes: '7 corners, placed and twisted', cosets: '3,674,160', bits: 21.8, method: 'table', actions: '6 primitive moves', meanQT: 10.5, note: 'The pocket cube: diameter 14, reproduced exactly.' },
  { name: 'Gear parity', fixes: 'gear rotation, mod 2', cosets: '8,388,608', bits: 23.0, method: 'table', actions: '696 macros, 4 to 10 moves', meanQT: 27.2, note: 'Every macro keeps the corners solved.' },
  { name: 'Gear rotation', fixes: 'all 24 gear rotations', cosets: '8,388,608', bits: 23.0, method: 'table', actions: '669 macros, 4 to 12 moves', meanQT: 48.8, note: 'Rotation before colour keeps the macros short.' },
  { name: 'Gear colour', fixes: 'which gear sits in which slot', cosets: '3.2 × 10¹⁵', bits: 51.5, method: 'net', actions: '376 macros, 4 to 18 moves', meanQT: 88.4, note: 'Includes the 244 macros that split rigid gear pairs.' },
  { name: 'Ring', fixes: '12 edges and 6 centres', cosets: '5.4 × 10²²', bits: 75.5, method: 'net', actions: '72 macros of 12 moves', meanQT: 247.4, note: 'Each macro is three 3-cycles of ring pieces.' },
];

const METHOD_LABEL: Record<Method, string> = { table: 'Exact table', net: 'Value network' };
const METHOD_COLOR: Record<Method, string> = { table: 'var(--mv-table)', net: 'var(--mv-net)' };

const BITS_MAX = 80;
const QT_MAX = 260;

function Swatch({ method }: { method: Method }) {
  return <span aria-hidden style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: METHOD_COLOR[method], flexShrink: 0 }} />;
}

function InlineBar({ value, max, method, label }: { value: number; max: number; method: Method; label: string }) {
  const pct = Math.max(1.5, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <div style={{ flex: 1, height: 10, borderRadius: 4, background: 'var(--mv-track)', position: 'relative', minWidth: 60 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: METHOD_COLOR[method], borderRadius: '0 4px 4px 0' }} />
      </div>
      <span style={{ fontSize: '.76rem', fontVariantNumeric: 'tabular-nums', color: 'var(--title)', width: 40, textAlign: 'right' }}>{label}</span>
    </div>
  );
}

export function LadderTable() {
  const [hover, setHover] = useState<number | null>(null);
  const th: React.CSSProperties = { fontSize: '.64rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '0 10px 10px', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px 10px', borderTop: '1px solid var(--border)', verticalAlign: 'middle' };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        {(['table', 'net'] as Method[]).map(m => (
          <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.76rem', color: 'var(--foreground)' }}>
            <Swatch method={m} /> {METHOD_LABEL[m]}
          </span>
        ))}
        <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Rungs are solved top to bottom. Hover a rung for its moves.</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Rung</th>
              <th style={{ ...th, textAlign: 'right' }}>Cosets</th>
              <th style={th}>Heuristic</th>
              <th style={{ ...th, width: '22%' }}>Bits resolved</th>
              <th style={{ ...th, width: '22%' }}>Mean quarter turns</th>
            </tr>
          </thead>
          <tbody>
            {RUNGS.map((r, i) => (
              <tr
                key={r.name}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                style={{ background: hover === i ? 'var(--mv-track)' : 'transparent', transition: 'background .15s', outline: 'none' }}
              >
                <td style={{ ...td, fontSize: '.78rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{i}</td>
                <td style={td}>
                  <div style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--title)' }}>{r.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {hover === i ? `${r.actions}. ${r.note}` : r.fixes}
                  </div>
                </td>
                <td style={{ ...td, textAlign: 'right', fontSize: '.8rem', fontVariantNumeric: 'tabular-nums', color: 'var(--title)', whiteSpace: 'nowrap' }}>{r.cosets}</td>
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.78rem', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                    <Swatch method={r.method} /> {METHOD_LABEL[r.method]}
                  </span>
                </td>
                <td style={td}><InlineBar value={r.bits} max={BITS_MAX} method={r.method} label={r.bits.toFixed(1)} /></td>
                <td style={td}><InlineBar value={r.meanQT} max={QT_MAX} method={r.method} label={r.meanQT.toFixed(1)} /></td>
              </tr>
            ))}
            <tr>
              <td style={td} />
              <td style={{ ...td, fontSize: '.8rem', fontWeight: 600, color: 'var(--title)' }}>Whole puzzle</td>
              <td style={{ ...td, textAlign: 'right', fontSize: '.8rem', fontWeight: 600, color: 'var(--title)', whiteSpace: 'nowrap' }}>4.5 × 10⁵⁸</td>
              <td style={td} />
              <td style={{ ...td, fontSize: '.78rem', color: 'var(--title)' }}>194.8 bits</td>
              <td style={{ ...td, fontSize: '.78rem', color: 'var(--title)' }}>422 summed, 406 after merging</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '.74rem', lineHeight: 1.65, color: 'var(--muted)', marginTop: 12 }}>
        Cosets multiply to the number of visible states. Mean quarter turns are over the 100 benchmark
        solves; adjacent turns of the same face are merged where two rungs meet, which saves about 16.
      </p>
    </div>
  );
}

/* ── solution-length histogram ─────────────────────────────────────────── */

type Metric = 'qt' | 'ft';
const METRIC: Record<Metric, { label: string; short: string; col: 1 | 2; lo: number; hi: number }> = {
  qt: { label: 'Quarter turns', short: 'QT', col: 1, lo: 320, hi: 520 },
  ft: { label: 'Face turns', short: 'FT', col: 2, lo: 260, hi: 460 },
};
const BIN = 20;

function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const median = (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2;
  return { mean, median, min: s[0], max: s[s.length - 1] };
}

export function SolutionHistogram() {
  const [metric, setMetric] = useState<Metric>('qt');
  const [hover, setHover] = useState<number | null>(null);
  const m = METRIC[metric];

  const { bins, st, yMax } = useMemo(() => {
    const xs = MALTESE_BENCHMARK.map(r => r[m.col]);
    const n = (m.hi - m.lo) / BIN;
    const counts = Array.from({ length: n }, () => 0);
    xs.forEach(x => {
      counts[Math.min(n - 1, Math.max(0, Math.floor((x - m.lo) / BIN)))] += 1;
    });
    return { bins: counts, st: stats(xs), yMax: Math.max(10, Math.ceil(Math.max(...counts) / 10) * 10) };
  }, [m]);

  /* The viewBox tracks the container's real width, so 11px axis text stays 11px on a phone
     instead of shrinking with a fixed-width drawing. */
  const plotRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(860);
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 520 ? 200 : 240, L = 36, R = 12, T = 18, B = 34;
  const pw = W - L - R, ph = H - T - B;
  const bw = pw / bins.length;
  const x = (v: number) => L + ((v - m.lo) / (m.hi - m.lo)) * pw;
  const y = (c: number) => T + ph - (c / yMax) * ph;
  const ticks = [0, yMax / 2, yMax];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--title)' }}>Solution length, 100 deep scrambles</div>
        <div style={{ flex: 1 }} />
        <div role="group" aria-label="Length metric" style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 999, padding: 2 }}>
          {(Object.keys(METRIC) as Metric[]).map(k => (
            <button
              key={k}
              type="button"
              aria-pressed={metric === k}
              onClick={() => { setMetric(k); setHover(null); }}
              style={{
                fontSize: '.72rem',
                fontWeight: 600,
                border: 0,
                cursor: 'pointer',
                borderRadius: 999,
                padding: '4px 12px',
                color: metric === k ? 'var(--title)' : 'var(--muted)',
                background: metric === k ? 'var(--cp-dim-h)' : 'transparent',
              }}
            >
              {METRIC[k].label}
            </button>
          ))}
        </div>
      </div>

      <div ref={plotRef} style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Histogram of solution lengths in ${m.label.toLowerCase()}: mean ${st.mean.toFixed(1)}, median ${st.median}, range ${st.min} to ${st.max}.`} style={{ display: 'block', overflow: 'visible' }}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--mv-grid)" strokeWidth={1} />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
            </g>
          ))}
          {bins.map((c, i) => {
            const x0 = L + i * bw + 1, w = bw - 2, top = y(c), h = T + ph - top;
            const r = Math.min(4, h, w / 2);
            const d = h <= 0 ? '' : `M${x0},${T + ph} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + w - r} Q${x0 + w},${top} ${x0 + w},${top + r} V${T + ph} Z`;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={L + i * bw} y={T} width={bw} height={ph} fill="transparent" />
                {d && <path d={d} fill="var(--mv-net)" opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: 'opacity .15s' }} />}
              </g>
            );
          })}
          <line x1={x(st.mean)} x2={x(st.mean)} y1={T - 6} y2={T + ph} stroke="var(--title)" strokeWidth={1} />
          <text x={x(st.mean) + 6} y={T + 4} fontSize={11} fill="var(--title)">mean {st.mean.toFixed(0)}</text>
          {bins.map((_, i) => (i % 2 === 0 ? (
            <text key={i} x={L + i * bw} y={H - B + 18} textAnchor="middle" fontSize={11} fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.lo + i * BIN}</text>
          ) : null))}
          <text x={W - R} y={H - B + 18} textAnchor="end" fontSize={11} fill="var(--muted)">{m.hi}</text>
          <line x1={L} x2={W - R} y1={T + ph} y2={T + ph} stroke="var(--mv-grid)" strokeWidth={1} />
        </svg>

        {hover !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${((L + (hover + 0.5) * bw) / W) * 100}%`,
              top: 0,
              transform: 'translate(-50%, -6px)',
              pointerEvents: 'none',
              background: 'var(--dca-arch)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: '.72rem',
              color: 'var(--title)',
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 20px rgba(0,0,0,.18)',
            }}
          >
            {m.lo + hover * BIN} to {m.lo + (hover + 1) * BIN - 1} {m.short}: <strong>{bins[hover]}</strong> solve{bins[hover] === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: '.74rem', color: 'var(--muted)', marginTop: 6 }}>
        <span>mean <strong style={{ color: 'var(--title)' }}>{st.mean.toFixed(1)}</strong></span>
        <span>median <strong style={{ color: 'var(--title)' }}>{st.median}</strong></span>
        <span>shortest <strong style={{ color: 'var(--title)' }}>{st.min}</strong></span>
        <span>longest <strong style={{ color: 'var(--title)' }}>{st.max}</strong></span>
        <span>{m.label.toLowerCase()} per solution</span>
      </div>

      <details style={{ marginTop: 14 }}>
        <summary style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--ct)', cursor: 'pointer' }}>Show all 100 solves</summary>
        <div style={{ maxHeight: 320, overflow: 'auto', marginTop: 10, border: '1px solid var(--border)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem', fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr>
                {['#', 'Scramble depth', 'QT', 'FT', 'Seconds', 'Corners', 'Gear parity', 'Gear rot.', 'Gear colour', 'Ring'].map(h => (
                  <th key={h} style={{ position: 'sticky', top: 0, background: 'var(--dca-arch)', textAlign: 'right', padding: '7px 10px', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MALTESE_BENCHMARK.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {[i + 1, r[0].toLocaleString('en-US'), r[1], r[2], r[3].toFixed(1), ...r[4]].map((v, j) => (
                    <td key={j} style={{ textAlign: 'right', padding: '5px 10px', color: j === 0 ? 'var(--muted)' : 'var(--foreground)' }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
