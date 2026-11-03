'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { LineChart, GitCompareArrows, ScanSearch, Table2 } from 'lucide-react';

/* All numbers on this component come from the project's results tables:
   results/tables/table3_curves.csv (design "matched": rotations 0-2, seed 0, the cells
   fine-tuning was run on), paired_deltas.csv (finding = macro) and prevalence.csv.
   Nothing here is re-estimated or rounded beyond three decimals. */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ── shared chart plumbing ─────────────────────────────────────────── */

type Shape = 'circle' | 'square' | 'triangle' | 'diamond' | 'tridown';

const C = {
  vit: 'var(--kv-vit, #3987e5)',
  cnx: 'var(--kv-cnx, #d95926)',
  inet: 'var(--kv-inet, #199e70)',
  dino2: 'var(--kv-dino2, #c98500)',
  scratch: 'var(--kv-scratch, #d55181)',
  grid: 'var(--kv-grid, rgba(148,163,184,0.14))',
  axis: 'var(--kv-axis, rgba(148,163,184,0.34))',
  surface: 'var(--kv-surface, #12171d)',
  ref: 'var(--kv-ref, rgba(167,139,250,0.55))',
  tip: 'var(--kv-tip, rgba(17,22,29,0.96))',
};

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Marker({
  shape, x, y, r = 4.5, color, hollow,
}: { shape: Shape; x: number; y: number; r?: number; color: string; hollow?: boolean }) {
  const fill = hollow ? C.surface : color;
  const stroke = hollow ? color : C.surface;
  const common = { fill, stroke, strokeWidth: 2 };
  if (shape === 'circle') return <circle cx={x} cy={y} r={r} {...common} />;
  if (shape === 'square') return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={1} {...common} />;
  const pts =
    shape === 'triangle'
      ? [[x, y - r * 1.25], [x - r * 1.2, y + r * 0.85], [x + r * 1.2, y + r * 0.85]]
      : shape === 'tridown'
      ? [[x, y + r * 1.25], [x - r * 1.2, y - r * 0.85], [x + r * 1.2, y - r * 0.85]]
      : [[x, y - r * 1.3], [x + r * 1.3, y], [x, y + r * 1.3], [x - r * 1.3, y]];
  return <polygon points={pts.map((p) => p.join(',')).join(' ')} {...common} />;
}

/* Legend / tooltip key: a short line segment plus the series' marker. */
function Key({ color, shape, dash, hollow }: { color: string; shape: Shape; dash?: string; hollow?: boolean }) {
  return (
    <svg width={26} height={14} className="shrink-0" aria-hidden>
      <line x1={1} y1={7} x2={25} y2={7} stroke={color} strokeWidth={2} strokeDasharray={dash} strokeLinecap="round" />
      <Marker shape={shape} x={13} y={7} r={3.6} color={color} hollow={hollow} />
    </svg>
  );
}

function SecHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2
        className="section-title text-2xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] dark:from-[#a78bfa] dark:to-[#c084fc]"
        style={{ color: 'transparent' }}
      >
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

function CardBar({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      {icon}
      <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
        {children}
      </span>
    </div>
  );
}

function Segmented<T extends string>({
  options, value, onChange, label,
}: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 p-1 rounded-xl knee-accent-bg">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${on ? 'knee-accent-text' : ''}`}
            style={{
              background: on ? 'var(--background)' : 'transparent',
              color: on ? undefined : 'var(--muted)',
              boxShadow: on ? '0 1px 3px rgba(0,0,0,0.18)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TableToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="inline-flex items-center gap-1.5 text-xs font-semibold knee-accent-text hover:underline"
    >
      <Table2 className="w-3.5 h-3.5" />
      {open ? 'Hide the data table' : 'Show the data table'}
    </button>
  );
}

const fmt3 = (v: number) => v.toFixed(3);
const fmtD = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`;
const fmtN = (n: number) => n.toLocaleString('en-US');

/* ── data ──────────────────────────────────────────────────────────── */

const NS = [65, 130, 260, 520, 1040, 2080, 2600];

type Series = {
  id: string;
  label: string;
  short: string;
  color: string;
  shape: Shape;
  regime: 'frozen' | 'ft' | 'scratch';
  ns: number[];
  test: number[];
  se?: number[];
  gold: number[];
};

const SERIES: Series[] = [
  {
    id: 'cnx-ft', label: 'ConvNeXt-B (DINOv3), fine-tuned', short: 'ConvNeXt-B FT', color: C.cnx, shape: 'square', regime: 'ft', ns: NS,
    test: [0.678, 0.711, 0.745, 0.764, 0.791, 0.815, 0.828],
    se: [0.016, 0.012, 0.009, 0.011, 0.008, 0.007, 0.008],
    gold: [0.657, 0.702, 0.731, 0.748, 0.791, 0.821, 0.837],
  },
  {
    id: 'vit-ft', label: 'ViT-B/16 (DINOv3), fine-tuned', short: 'ViT-B FT', color: C.vit, shape: 'circle', regime: 'ft', ns: NS,
    test: [0.659, 0.690, 0.715, 0.737, 0.773, 0.813, 0.825],
    se: [0.023, 0.001, 0.012, 0.006, 0.009, 0.008, 0.007],
    gold: [0.641, 0.666, 0.704, 0.730, 0.768, 0.821, 0.840],
  },
  {
    id: 'inet-fr', label: 'ConvNeXt-B (ImageNet), frozen', short: 'ImageNet frozen', color: C.inet, shape: 'triangle', regime: 'frozen', ns: NS,
    test: [0.679, 0.703, 0.727, 0.749, 0.762, 0.767, 0.774],
    se: [0.020, 0.013, 0.018, 0.010, 0.006, 0.018, 0.005],
    gold: [0.642, 0.672, 0.708, 0.739, 0.758, 0.787, 0.793],
  },
  {
    id: 'vit-fr', label: 'ViT-B/16 (DINOv3), frozen', short: 'ViT-B frozen', color: C.vit, shape: 'circle', regime: 'frozen', ns: NS,
    test: [0.677, 0.695, 0.719, 0.730, 0.746, 0.755, 0.757],
    se: [0.021, 0.015, 0.016, 0.012, 0.014, 0.015, 0.011],
    gold: [0.639, 0.658, 0.692, 0.717, 0.737, 0.766, 0.772],
  },
  {
    id: 'dino2-fr', label: 'ViT-B/14 (DINOv2), frozen', short: 'DINOv2 frozen', color: C.dino2, shape: 'diamond', regime: 'frozen', ns: NS,
    test: [0.656, 0.697, 0.709, 0.737, 0.737, 0.743, 0.746],
    se: [0.028, 0.016, 0.021, 0.010, 0.017, 0.010, 0.011],
    gold: [0.630, 0.659, 0.701, 0.715, 0.736, 0.749, 0.758],
  },
  {
    id: 'cnx-fr', label: 'ConvNeXt-B (DINOv3), frozen', short: 'ConvNeXt-B frozen', color: C.cnx, shape: 'square', regime: 'frozen', ns: NS,
    test: [0.642, 0.672, 0.698, 0.706, 0.716, 0.729, 0.741],
    se: [0.038, 0.031, 0.026, 0.015, 0.015, 0.011, 0.007],
    gold: [0.627, 0.667, 0.679, 0.690, 0.705, 0.738, 0.736],
  },
  {
    id: 'scratch', label: 'ResNet-18, from scratch (fold 0)', short: 'ResNet-18 scratch', color: C.scratch, shape: 'tridown', regime: 'scratch',
    ns: [260, 1040, 2600],
    test: [0.644, 0.668, 0.737],
    gold: [0.655, 0.683, 0.742],
  },
];

const dashOf = (s: Series) => (s.regime === 'frozen' ? '6 5' : s.regime === 'scratch' ? '1.5 5' : undefined);

/* ── 1. Learning curves ────────────────────────────────────────────── */

type Ruler = 'test' | 'gold';

function LearningCurves() {
  const [wrapRef, w] = useWidth<HTMLDivElement>();
  const [ruler, setRuler] = useState<Ruler>('test');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const [bands, setBands] = useState(false);
  const [table, setTable] = useState(false);

  const narrow = w < 640;
  const H = narrow ? 330 : 420;
  const m = { t: 18, r: narrow ? 14 : 168, b: 44, l: 46 };
  const iw = Math.max(10, w - m.l - m.r);
  const ih = H - m.t - m.b;

  const lx0 = Math.log2(56), lx1 = Math.log2(3000);
  const x = (n: number) => m.l + ((Math.log2(n) - lx0) / (lx1 - lx0)) * iw;
  const y0 = 0.6, y1 = 0.86;
  const y = (v: number) => m.t + (1 - (v - y0) / (y1 - y0)) * ih;

  const visible = SERIES.filter((s) => !hidden.has(s.id));
  const val = (s: Series) => (ruler === 'test' ? s.test : s.gold);

  /* Direct end labels with leader lines: a simple top-down sweep keeps them 15px
     apart without detaching them from their series. */
  const endLabels = useMemo(() => {
    const items = visible.map((s) => {
      const v = val(s);
      return { s, yEnd: y(v[v.length - 1]), yLab: y(v[v.length - 1]) };
    }).sort((a, b) => a.yEnd - b.yEnd);
    for (let i = 1; i < items.length; i++) {
      if (items[i].yLab - items[i - 1].yLab < 15) items[i].yLab = items[i - 1].yLab + 15;
    }
    const overflow = items.length ? items[items.length - 1].yLab - (m.t + ih) : 0;
    if (overflow > 0) items.forEach((it) => (it.yLab -= overflow));
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((s) => s.id).join(), ruler, w]);

  const pick = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    let best = 0, bd = Infinity;
    NS.forEach((n, i) => {
      const d = Math.abs(x(n) - px);
      if (d < bd) { bd = d; best = i; }
    });
    setIdx(best);
  };
  const onKey = (e: KeyboardEvent<SVGRectElement>) => {
    if (e.key === 'ArrowRight') { setIdx((i) => Math.min(NS.length - 1, (i ?? -1) + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { setIdx((i) => Math.max(0, (i ?? NS.length) - 1)); e.preventDefault(); }
    if (e.key === 'Escape') setIdx(null);
  };

  const tipRows = idx === null ? [] : visible
    .map((s) => {
      const k = s.ns.indexOf(NS[idx]);
      return k < 0 ? null : { s, v: val(s)[k] };
    })
    .filter((r): r is { s: Series; v: number } => r !== null)
    .sort((a, b) => b.v - a.v);

  const tipX = idx === null ? 0 : x(NS[idx]);
  const tipLeft = tipX + 236 > w ? tipX - 236 - 12 : tipX + 14;

  const toggle = (id: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  return (
    <div className="glass knee-accent-border knee-viz rounded-2xl overflow-hidden">
      <CardBar icon={<LineChart className="w-4 h-4 knee-accent-text" />}>
        macro AUC over 12 findings · mean of 3 unseen-site test folds · log-scale N
      </CardBar>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<Ruler>
            label="Which labels to score against"
            value={ruler}
            onChange={setRuler}
            options={[
              { id: 'test', label: 'Unseen-site test fold · report labels' },
              { id: 'gold', label: 'Gold-58 · expert labels' },
            ]}
          />
          <label
            className={`inline-flex items-center gap-2 text-xs ${ruler === 'gold' ? 'opacity-40' : ''}`}
            style={{ color: 'var(--muted)' }}
          >
            <input
              type="checkbox"
              checked={bands && ruler === 'test'}
              disabled={ruler === 'gold'}
              onChange={(e) => setBands(e.target.checked)}
              className="accent-violet-500"
            />
            ±1 SE bands
          </label>
        </div>

        {/* Legend: click to show/hide a series, hover or focus to isolate it */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SERIES.map((s) => {
            const off = hidden.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={!off}
                onClick={() => toggle(s.id)}
                onMouseEnter={() => setFocus(s.id)}
                onMouseLeave={() => setFocus(null)}
                onFocus={() => setFocus(s.id)}
                onBlur={() => setFocus(null)}
                className="inline-flex items-center gap-2 text-xs rounded-md px-1 py-0.5"
                style={{ color: 'var(--foreground)', opacity: off ? 0.38 : 1, textDecoration: off ? 'line-through' : 'none' }}
              >
                <Key color={s.color} shape={s.shape} dash={dashOf(s)} hollow={s.regime === 'frozen'} />
                {s.label}
              </button>
            );
          })}
        </div>

        <div ref={wrapRef} className="relative knee-viz" style={{ height: H }}>
          {w > 0 && (
            <svg width={w} height={H} role="img" aria-label="Line chart of macro AUC against training-set size for seven model and regime combinations. Fine-tuned models climb fastest and are the only ones above 0.80 at 2,600 exams.">
              {/* grid + y axis */}
              {[0.6, 0.65, 0.7, 0.75, 0.8, 0.85].map((t) => (
                <g key={t}>
                  <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke={C.grid} />
                  <text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {t.toFixed(2)}
                  </text>
                </g>
              ))}
              {NS.map((n) => (
                <g key={n}>
                  <line x1={x(n)} x2={x(n)} y1={m.t} y2={m.t + ih} stroke={C.grid} />
                  {(!narrow || n !== 2080) && (
                    <text x={x(n)} y={m.t + ih + 18} textAnchor="middle" fontSize={11} fill="var(--muted)">
                      {fmtN(n)}
                    </text>
                  )}
                </g>
              ))}
              <line x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} stroke={C.axis} />
              <text x={m.l + iw / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">
                Training exams (N, log scale)
              </text>

              {/* AUC 0.80 reference: the triage target the cost table prices */}
              <line x1={m.l} x2={m.l + iw} y1={y(0.8)} y2={y(0.8)} stroke={C.ref} strokeWidth={1.5} />
              <text x={m.l + 6} y={y(0.8) - 6} fontSize={10.5} fill="var(--muted)">
                AUC 0.80 target
              </text>

              {/* SE bands (test ruler only; the gold set is too small for a band to mean much) */}
              {bands && ruler === 'test' && visible.filter((s) => s.se).map((s) => {
                const top = s.ns.map((n, i) => `${x(n)},${y(s.test[i] + s.se![i])}`);
                const bot = s.ns.map((n, i) => `${x(n)},${y(s.test[i] - s.se![i])}`).reverse();
                return (
                  <polygon
                    key={s.id}
                    points={[...top, ...bot].join(' ')}
                    fill={s.color}
                    opacity={focus && focus !== s.id ? 0.03 : 0.1}
                  />
                );
              })}

              {/* series */}
              {visible.map((s) => {
                const v = val(s);
                const dim = focus !== null && focus !== s.id;
                return (
                  <g key={s.id} opacity={dim ? 0.18 : 1} style={{ transition: 'opacity 0.2s' }}>
                    <polyline
                      points={s.ns.map((n, i) => `${x(n)},${y(v[i])}`).join(' ')}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={s.regime === 'ft' ? 2.5 : 2}
                      strokeDasharray={dashOf(s)}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {s.ns.map((n, i) => (
                      <Marker key={n} shape={s.shape} x={x(n)} y={y(v[i])} color={s.color} hollow={s.regime === 'frozen'} />
                    ))}
                  </g>
                );
              })}

              {/* direct end labels (wide screens only) */}
              {!narrow && endLabels.map(({ s, yEnd, yLab }) => {
                const xe = x(s.ns[s.ns.length - 1]);
                const dim = focus !== null && focus !== s.id;
                return (
                  <g key={s.id} opacity={dim ? 0.25 : 1}>
                    <polyline
                      points={`${xe + 7},${yEnd} ${xe + 16},${yEnd} ${xe + 24},${yLab} ${xe + 28},${yLab}`}
                      fill="none"
                      stroke={C.axis}
                    />
                    <text x={xe + 32} y={yLab + 4} fontSize={11} fill="var(--foreground)">
                      {s.short}{' '}
                      <tspan fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt3(val(s)[val(s).length - 1])}
                      </tspan>
                    </text>
                  </g>
                );
              })}

              {/* crosshair */}
              {idx !== null && (
                <line x1={tipX} x2={tipX} y1={m.t} y2={m.t + ih} stroke="var(--muted)" strokeWidth={1} opacity={0.6} />
              )}

              {/* hover / keyboard capture */}
              <rect
                x={m.l - 10}
                y={m.t}
                width={iw + 20}
                height={ih}
                fill="transparent"
                tabIndex={0}
                aria-label="Chart data. Use the left and right arrow keys to step through training-set sizes."
                onMouseMove={(e) => pick(e.clientX, e.currentTarget.ownerSVGElement!.getBoundingClientRect())}
                onMouseLeave={() => setIdx(null)}
                onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget.ownerSVGElement!.getBoundingClientRect())}
                onKeyDown={onKey}
                onBlur={() => setIdx(null)}
                style={{ outline: 'none' }}
              />
            </svg>
          )}

          {idx !== null && tipRows.length > 0 && (
            <div
              className="absolute pointer-events-none rounded-xl px-3 py-2.5 text-xs"
              style={{
                left: Math.max(0, tipLeft),
                top: m.t + 4,
                width: 236,
                background: C.tip,
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
                color: 'var(--foreground)',
              }}
              role="status"
            >
              <div className="font-semibold mb-1.5" style={{ color: 'var(--title)' }}>
                N = {fmtN(NS[idx])} training exams
              </div>
              {tipRows.map(({ s, v }) => (
                <div key={s.id} className="flex items-center gap-2 py-0.5">
                  <Key color={s.color} shape={s.shape} dash={dashOf(s)} hollow={s.regime === 'frozen'} />
                  <span className="flex-1 truncate">{s.short}</span>
                  <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt3(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          Solid lines are fine-tuned, dashed lines frozen, and the dotted line is a ResNet-18 trained
          from scratch on one fold. Every curve keeps climbing in a near-straight line against log N,
          so there is no plateau to report inside 2,600 exams.{' '}
          <strong style={{ color: 'var(--title)' }}>
            The two fine-tuned models climb about 50% faster per doubling than the frozen ones and are
            the only configurations past AUC 0.80.
          </strong>{' '}
          Switch to the expert labels and the ranking holds (Spearman ρ = 0.97 across all 45 model and
          size cells); the gold set only has 58 studies, so treat any single point there as about
          ±0.03.
        </p>

        <TableToggle open={table} onClick={() => setTable((t) => !t)} />
        {table && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 640, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left font-semibold py-2 pr-3" style={{ color: 'var(--muted)' }}>
                    {ruler === 'test' ? 'Test-fold AUC' : 'Gold-58 AUC'}
                  </th>
                  {NS.map((n) => (
                    <th key={n} className="text-right font-semibold py-2 px-2" style={{ color: 'var(--muted)' }}>
                      {fmtN(n)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERIES.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 pr-3" style={{ color: 'var(--foreground)' }}>{s.label}</td>
                    {NS.map((n) => {
                      const k = s.ns.indexOf(n);
                      return (
                        <td key={n} className="text-right py-2 px-2 font-mono" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                          {k < 0 ? '·' : fmt3(val(s)[k])}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 2. Paired differences (the crossover) ─────────────────────────── */

type Delta = { n: number; d: number; lo: number; hi: number };
type Contrast = { id: string; label: string; color: string; shape: Shape; hollow?: boolean; dash?: string; pts: Delta[] };
type TabId = 'ft' | 'arch' | 'pre' | 'best';

const P = (rows: [number, number, number, number][]): Delta[] => rows.map(([n, d, lo, hi]) => ({ n, d, lo, hi }));

const TABS: Record<TabId, { label: string; up: string; note: string; series: Contrast[] }> = {
  ft: {
    label: 'Fine-tune vs. freeze',
    up: 'above zero: fine-tuning wins',
    note: 'For the ViT, freezing is better at 65 exams, the two tie from 130 to 520, and fine-tuning wins from 1,040 on (+0.068 by 2,600). The ConvNeXt never loses by fine-tuning and pulls clear from 260. Below about 500 exams the cheap frozen recipe is enough; above about 1,000, fine-tuning pays.',
    series: [
      { id: 'c1-cnx', label: 'ConvNeXt-B (DINOv3)', color: C.cnx, shape: 'square', pts: P([[65, 0.035, -0.01, 0.086], [130, 0.039, -0.012, 0.104], [260, 0.047, 0.019, 0.081], [520, 0.058, 0.037, 0.075], [1040, 0.075, 0.055, 0.094], [2080, 0.086, 0.068, 0.102], [2600, 0.086, 0.068, 0.104]]) },
      { id: 'c1-vit', label: 'ViT-B/16 (DINOv3)', color: C.vit, shape: 'circle', pts: P([[65, -0.019, -0.032, -0.005], [130, -0.005, -0.027, 0.021], [260, -0.004, -0.028, 0.019], [520, 0.006, -0.014, 0.027], [1040, 0.027, 0.015, 0.04], [2080, 0.058, 0.035, 0.079], [2600, 0.068, 0.055, 0.083]]) },
    ],
  },
  arch: {
    label: 'CNN vs. ViT',
    up: 'above zero: the CNN (ConvNeXt-B) wins',
    note: 'Same DINOv3 pretraining, different architecture, and the answer flips with the regime. Fine-tuned, the CNN is ahead from 260 to 1,040 exams (about +0.03) and the two converge by 2,080. Frozen, the transformer is ahead and the gap widens with data (−0.025 at 2,600). Interaction +0.033, p < 0.001.',
    series: [
      { id: 'c2-ft', label: 'Fine-tuned', color: C.cnx, shape: 'square', pts: P([[65, 0.019, -0.015, 0.05], [130, 0.021, -0.002, 0.043], [260, 0.03, 0.015, 0.044], [520, 0.028, 0.01, 0.043], [1040, 0.019, 0.0, 0.034], [2080, 0.002, -0.007, 0.01], [2600, 0.002, -0.01, 0.015]]) },
      { id: 'c2-fr', label: 'Frozen', color: C.cnx, shape: 'square', hollow: true, dash: '6 5', pts: P([[65, -0.014, -0.03, 0.002], [130, -0.012, -0.025, 0.001], [260, -0.007, -0.021, 0.007], [520, -0.013, -0.023, -0.002], [1040, -0.017, -0.027, -0.006], [2080, -0.022, -0.032, -0.013], [2600, -0.025, -0.037, -0.013]]) },
    ],
  },
  pre: {
    label: 'Pretraining',
    up: 'above zero: the first-named weights win',
    note: 'The surprise of the study. On the same ConvNeXt-B architecture, plain supervised ImageNet weights beat the 2025 self-supervised DINOv3 weights at every size (+0.033 to +0.050) and on all five test sites, the opposite of the pre-registered prediction. DINOv3 and DINOv2 ViTs stay within ±0.011 of each other.',
    series: [
      { id: 'c3', label: 'ImageNet − DINOv3 (ConvNeXt-B, frozen)', color: C.inet, shape: 'triangle', hollow: true, dash: '6 5', pts: P([[65, 0.033, 0.019, 0.046], [130, 0.043, 0.031, 0.056], [260, 0.032, 0.019, 0.044], [520, 0.039, 0.029, 0.048], [1040, 0.045, 0.033, 0.057], [2080, 0.047, 0.038, 0.057], [2600, 0.05, 0.039, 0.06]]) },
      { id: 'c4', label: 'DINOv3 − DINOv2 (ViT-B, frozen)', color: C.vit, shape: 'circle', hollow: true, dash: '6 5', pts: P([[65, 0.003, -0.012, 0.017], [130, -0.011, -0.022, -0.001], [260, -0.005, -0.016, 0.005], [520, -0.005, -0.013, 0.004], [1040, 0.002, -0.007, 0.011], [2080, 0.009, 0.001, 0.016], [2600, 0.01, 0.002, 0.018]]) },
    ],
  },
  best: {
    label: 'vs. best frozen',
    up: 'above zero: the fine-tuned model beats frozen ImageNet ConvNeXt-B',
    note: 'The comparison a hospital actually faces: fine-tuning against the strongest cheap option. Fine-tuned ConvNeXt-B ties frozen ImageNet ConvNeXt-B up to 520 exams and wins from 1,040 (+0.029, rising to +0.053). The fine-tuned ViT starts behind and only overtakes at 2,080.',
    series: [
      { id: 'x-cnx', label: 'Fine-tuned ConvNeXt-B (DINOv3)', color: C.cnx, shape: 'square', pts: P([[65, -0.001, -0.034, 0.025], [130, 0.008, -0.033, 0.044], [260, 0.018, -0.006, 0.042], [520, 0.016, -0.002, 0.033], [1040, 0.029, 0.015, 0.041], [2080, 0.048, 0.026, 0.074], [2600, 0.053, 0.036, 0.072]]) },
      { id: 'x-vit', label: 'Fine-tuned ViT-B/16 (DINOv3)', color: C.vit, shape: 'circle', pts: P([[65, -0.02, -0.034, -0.007], [130, -0.013, -0.033, 0.01], [260, -0.012, -0.044, 0.014], [520, -0.012, -0.035, 0.008], [1040, 0.011, -0.002, 0.023], [2080, 0.046, 0.027, 0.066], [2600, 0.051, 0.039, 0.063]]) },
    ],
  },
};

function Crossover() {
  const [wrapRef, w] = useWidth<HTMLDivElement>();
  const [tab, setTab] = useState<TabId>('ft');
  const [idx, setIdx] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const cfg = TABS[tab];

  const narrow = w < 640;
  const H = narrow ? 290 : 340;
  const m = { t: 16, r: 18, b: 44, l: 52 };
  const iw = Math.max(10, w - m.l - m.r);
  const ih = H - m.t - m.b;
  const lx0 = Math.log2(56), lx1 = Math.log2(3000);
  const x = (n: number) => m.l + ((Math.log2(n) - lx0) / (lx1 - lx0)) * iw;

  const all = cfg.series.flatMap((s) => s.pts.flatMap((p) => [p.lo, p.hi]));
  const lo = Math.min(-0.02, Math.floor(Math.min(...all) * 50) / 50);
  const hi = Math.max(0.02, Math.ceil(Math.max(...all) * 50) / 50);
  const y = (v: number) => m.t + (1 - (v - lo) / (hi - lo)) * ih;
  const ticks: number[] = [];
  const step = hi - lo > 0.1 ? 0.04 : 0.02;
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 1000) / 1000);

  const pick = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    let best = 0, bd = Infinity;
    NS.forEach((n, i) => {
      const d = Math.abs(x(n) - px);
      if (d < bd) { bd = d; best = i; }
    });
    setIdx(best);
  };
  const onKey = (e: KeyboardEvent<SVGRectElement>) => {
    if (e.key === 'ArrowRight') { setIdx((i) => Math.min(NS.length - 1, (i ?? -1) + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { setIdx((i) => Math.max(0, (i ?? NS.length) - 1)); e.preventDefault(); }
    if (e.key === 'Escape') setIdx(null);
  };
  const tipX = idx === null ? 0 : x(NS[idx]);
  const tipW = 260;
  const tipLeft = tipX + tipW + 14 > w ? tipX - tipW - 12 : tipX + 14;

  return (
    <div className="glass knee-accent-border knee-viz rounded-2xl overflow-hidden">
      <CardBar icon={<GitCompareArrows className="w-4 h-4 knee-accent-text" />}>
        paired Δ macro AUC · same training exams, same test studies · 95% bootstrap CI
      </CardBar>
      <div className="p-5 space-y-4">
        <Segmented<TabId>
          label="Which comparison to show"
          value={tab}
          onChange={(t) => { setTab(t); setIdx(null); }}
          options={(Object.keys(TABS) as TabId[]).map((k) => ({ id: k, label: TABS[k].label }))}
        />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {cfg.series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--foreground)' }}>
              <Key color={s.color} shape={s.shape} dash={s.dash} hollow={s.hollow} />
              {s.label}
            </span>
          ))}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>({cfg.up})</span>
        </div>

        <div ref={wrapRef} className="relative knee-viz" style={{ height: H }}>
          {w > 0 && (
            <svg width={w} height={H} role="img" aria-label={`Paired difference chart, ${cfg.label}. ${cfg.note}`}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? C.axis : C.grid} strokeWidth={t === 0 ? 1.5 : 1} />
                  <text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {t === 0 ? '0' : `${t > 0 ? '+' : '−'}${Math.abs(t).toFixed(2)}`}
                  </text>
                </g>
              ))}
              {NS.map((n) => (
                <g key={n}>
                  <line x1={x(n)} x2={x(n)} y1={m.t} y2={m.t + ih} stroke={C.grid} />
                  {(!narrow || n !== 2080) && (
                    <text x={x(n)} y={m.t + ih + 18} textAnchor="middle" fontSize={11} fill="var(--muted)">{fmtN(n)}</text>
                  )}
                </g>
              ))}
              <text x={m.l + iw / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">Training exams (N, log scale)</text>

              {cfg.series.map((s) => (
                <polygon
                  key={`b-${s.id}`}
                  points={[...s.pts.map((p) => `${x(p.n)},${y(p.hi)}`), ...s.pts.map((p) => `${x(p.n)},${y(p.lo)}`).reverse()].join(' ')}
                  fill={s.color}
                  opacity={0.1}
                />
              ))}
              {cfg.series.map((s) => (
                <g key={s.id}>
                  <polyline
                    points={s.pts.map((p) => `${x(p.n)},${y(p.d)}`).join(' ')}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.25}
                    strokeDasharray={s.dash}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {s.pts.map((p) => (
                    <Marker key={p.n} shape={s.shape} x={x(p.n)} y={y(p.d)} color={s.color} hollow={s.hollow} />
                  ))}
                </g>
              ))}

              {idx !== null && <line x1={tipX} x2={tipX} y1={m.t} y2={m.t + ih} stroke="var(--muted)" opacity={0.6} />}
              <rect
                x={m.l - 10}
                y={m.t}
                width={iw + 20}
                height={ih}
                fill="transparent"
                tabIndex={0}
                aria-label="Chart data. Use the left and right arrow keys to step through training-set sizes."
                onMouseMove={(e) => pick(e.clientX, e.currentTarget.ownerSVGElement!.getBoundingClientRect())}
                onMouseLeave={() => setIdx(null)}
                onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget.ownerSVGElement!.getBoundingClientRect())}
                onKeyDown={onKey}
                onBlur={() => setIdx(null)}
                style={{ outline: 'none' }}
              />
            </svg>
          )}
          {idx !== null && (
            <div
              className="absolute pointer-events-none rounded-xl px-3 py-2.5 text-xs"
              style={{ left: Math.max(0, tipLeft), top: m.t + 4, width: tipW, background: C.tip, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.28)', color: 'var(--foreground)' }}
              role="status"
            >
              <div className="font-semibold mb-1.5" style={{ color: 'var(--title)' }}>N = {fmtN(NS[idx])} training exams</div>
              {cfg.series.map((s) => {
                const p = s.pts[idx];
                const sig = p.lo > 0 || p.hi < 0;
                return (
                  <div key={s.id} className="py-1">
                    <div className="flex items-center gap-2">
                      <Key color={s.color} shape={s.shape} dash={s.dash} hollow={s.hollow} />
                      <span className="flex-1 truncate">{s.label}</span>
                      <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtD(p.d)}</span>
                    </div>
                    <div className="pl-8 font-mono" style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                      [{fmtD(p.lo)}, {fmtD(p.hi)}] · {sig ? 'CI excludes 0' : 'tie'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{cfg.note}</p>

        <TableToggle open={table} onClick={() => setTable((t) => !t)} />
        {table && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 560, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left font-semibold py-2 pr-3" style={{ color: 'var(--muted)' }}>N</th>
                  {cfg.series.map((s) => (
                    <th key={s.id} className="text-right font-semibold py-2 px-2" style={{ color: 'var(--muted)' }}>{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NS.map((n, i) => (
                  <tr key={n} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 pr-3 font-mono" style={{ color: 'var(--foreground)' }}>{fmtN(n)}</td>
                    {cfg.series.map((s) => (
                      <td key={s.id} className="text-right py-2 px-2 font-mono whitespace-nowrap" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtD(s.pts[i].d)} <span style={{ color: 'var(--muted)' }}>[{fmtD(s.pts[i].lo)}, {fmtD(s.pts[i].hi)}]</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 3. Reports vs. expert image reads on the same 58 knees ────────── */

const GAP = [
  { group: 'Focal structural', rows: [['ACL', 22, 24], ['MCL', 6, 9], ['Medial meniscus', 26, 26], ['Lateral meniscus', 17, 23], ['Fracture', 9, 18]] },
  { group: 'Cartilage / OA', rows: [['Medial OA', 11, 15], ['Lateral OA', 13, 11], ['Patellofemoral OA', 7, 21]] },
  { group: 'Fluid / marrow / soft tissue', rows: [['Effusion', 20, 35], ['Synovitis', 13, 27], ["Baker's cyst", 11, 12], ['Bone contusion', 27, 19]] },
] as const;

/* Row positions do not depend on the chart width, so they are laid out once here. */
const GAP_TOP = 8, GAP_ROW_H = 30, GAP_GROUP_H = 26;
const GAP_LAYOUT = (() => {
  let cursor = GAP_TOP;
  return GAP.map((g) => {
    const gy = cursor + 17;
    cursor += GAP_GROUP_H;
    const rows = g.rows.map(([name, rep, exp]) => {
      const ry = cursor + GAP_ROW_H / 2;
      cursor += GAP_ROW_H;
      return { name, rep, exp, ry };
    });
    return { group: g.group, gy, rows };
  });
})();

const REPORT_C = 'var(--muted)';
const EXPERT_C = 'var(--kv-expert, #a78bfa)';

function LabelGap() {
  const [wrapRef, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);

  const narrow = w < 560;
  const rowH = GAP_ROW_H;
  const m = { t: GAP_TOP, r: 18, b: 40, l: narrow ? 118 : 150 };
  const iw = Math.max(10, w - m.l - m.r);
  const nRows = GAP.reduce((a, g) => a + g.rows.length, 0);
  const H = m.t + GAP.length * GAP_GROUP_H + nRows * rowH + m.b;
  const x = (pct: number) => m.l + (pct / 70) * iw;

  const layout = GAP_LAYOUT;

  const pct = (k: number) => (k / 58) * 100;

  return (
    <div className="glass knee-accent-border knee-viz rounded-2xl overflow-hidden">
      <CardBar icon={<ScanSearch className="w-4 h-4 knee-accent-text" />}>
        the same 58 knees, labeled twice · % of studies called positive
      </CardBar>
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: 'var(--foreground)' }}>
          <span className="inline-flex items-center gap-2">
            <svg width={14} height={14} aria-hidden><circle cx={7} cy={7} r={4.5} fill={REPORT_C} stroke="var(--kv-surface, #12171d)" strokeWidth={2} /></svg>
            The radiology report says positive (read by the local LLM)
          </span>
          <span className="inline-flex items-center gap-2">
            <svg width={16} height={16} aria-hidden><polygon points="8,1.5 14.5,8 8,14.5 1.5,8" fill={EXPERT_C} stroke="var(--kv-surface, #12171d)" strokeWidth={2} /></svg>
            Expert radiologists, reading the images
          </span>
        </div>

        <div ref={wrapRef} className="relative knee-viz" style={{ height: H }}>
          {w > 0 && (
            <svg width={w} height={H} role="img" aria-label="Dumbbell chart comparing how often reports and expert image reads call each of 12 findings positive on the same 58 knees. Reports under-call patellofemoral OA, effusion, synovitis and fracture, and over-call bone contusion.">
              {[0, 10, 20, 30, 40, 50, 60, 70].map((t) => (
                <g key={t}>
                  <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke={C.grid} />
                  {(!narrow || t % 20 === 0) && (
                    <text x={x(t)} y={H - m.b + 18} textAnchor="middle" fontSize={11} fill="var(--muted)">{t}%</text>
                  )}
                </g>
              ))}
              <text x={m.l + iw / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">Share of the 58 gold-standard studies called positive</text>

              {layout.map((g) => (
                <g key={g.group}>
                  <text x={4} y={g.gy} fontSize={10.5} fontWeight={700} fill="var(--muted)" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {g.group}
                  </text>
                  {g.rows.map((r) => {
                    const a = x(pct(r.rep)), b = x(pct(r.exp));
                    const on = hover === r.name;
                    const dim = hover !== null && !on;
                    return (
                      <g
                        key={r.name}
                        opacity={dim ? 0.35 : 1}
                        onMouseEnter={() => setHover(r.name)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(r.name)}
                        onBlur={() => setHover(null)}
                        tabIndex={0}
                        aria-label={`${r.name}: report ${r.rep} of 58, experts ${r.exp} of 58`}
                        style={{ outline: 'none' }}
                      >
                        <rect x={0} y={r.ry - rowH / 2} width={w} height={rowH} fill="transparent" />
                        <text x={m.l - 10} y={r.ry + 4} textAnchor="end" fontSize={12} fill="var(--foreground)">{r.name}</text>
                        <line x1={a} x2={b} y1={r.ry} y2={r.ry} stroke={C.axis} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
                        <circle cx={a} cy={r.ry} r={5} fill={REPORT_C} stroke={C.surface} strokeWidth={2} />
                        <polygon points={`${b},${r.ry - 6.5} ${b + 6.5},${r.ry} ${b},${r.ry + 6.5} ${b - 6.5},${r.ry}`} fill={EXPERT_C} stroke={C.surface} strokeWidth={2} />
                        {on && (
                          <text
                            x={Math.max(a, b) + 12 > m.l + iw - 120 ? Math.min(a, b) - 12 : Math.max(a, b) + 12}
                            y={r.ry + 4}
                            textAnchor={Math.max(a, b) + 12 > m.l + iw - 120 ? 'end' : 'start'}
                            fontSize={11}
                            fill="var(--title)"
                            fontWeight={600}
                          >
                            report {r.rep} · experts {r.exp}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              ))}
            </svg>
          )}
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          Reports are written to answer a referring doctor&apos;s question, not to grade every
          structure, so they leave secondary findings out: patellofemoral OA (7 vs. 21 of 58),
          effusion (20 vs. 35), synovitis (13 vs. 27) and fracture (9 vs. 18), while over-calling bone
          contusion (27 vs. 19).{' '}
          <strong style={{ color: 'var(--title)' }}>
            A text-only labeler cannot recover a finding the radiologist never wrote down.
          </strong>{' '}
          That puts a ceiling on everything trained from report labels: the labels themselves score
          0.866 against the experts, and the best fine-tuned models already reach 0.837 to 0.840,
          which is why the study points a hospital toward better labels before bigger models.
        </p>
      </div>
    </div>
  );
}

/* ── page section ──────────────────────────────────────────────────── */

export default function KneeMRIResults() {
  return (
    <>
      <section>
        <SecHead>Learning Curves</SecHead>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col gap-6">
          <LearningCurves />
        </motion.div>
      </section>

      <section>
        <SecHead>Where Fine-Tuning Starts to Pay</SecHead>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col gap-6">
          <Crossover />
        </motion.div>
      </section>

      <section>
        <SecHead>Why Labels Are the Ceiling</SecHead>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col gap-6">
          <LabelGap />
        </motion.div>
      </section>
    </>
  );
}
