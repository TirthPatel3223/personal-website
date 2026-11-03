'use client';

import { useState, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Calculator, Coins, ClipboardList, ShieldCheck, ShieldAlert } from 'lucide-react';

/* Sources: results/tables/table5_cost.csv (matched design: rotations 0-2, seed 0),
   labeling_cost_sensitivity.csv, and Appendix E of the final report for the
   competition labeling costs. Cost assumptions: cloud GPU $0.59/h, expert labels
   8 min/exam x 2 readers x $170.17/h, local LLM measured at 6.9 s/report. */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const C = {
  vit: 'var(--kv-vit, #3987e5)',
  cnx: 'var(--kv-cnx, #d95926)',
  inet: 'var(--kv-inet, #199e70)',
  grid: 'var(--kv-grid, rgba(148,163,184,0.14))',
  expert: 'var(--kv-expert, #a78bfa)',
};

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
      <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{children}</span>
    </div>
  );
}

/* ── 1. What reaching a target costs ───────────────────────────────── */

type Target = '0.75' | '0.80' | '0.85';

type CostRow = {
  model: string;
  regime: 'frozen' | 'fine-tuned';
  color: string;
  exams?: number;
  lo?: number;
  hi?: number;
  extrap?: boolean;
  compute?: string;
  expert?: string;
  expertRange?: string;
  llm?: string;
};

const COSTS: Record<Target, CostRow[]> = {
  '0.75': [
    { model: 'ConvNeXt-B (DINOv3)', regime: 'fine-tuned', color: C.cnx, exams: 313, lo: 195, hi: 619, compute: '$0.40', expert: '$14,201', expertRange: '$3.0k – $78k', llm: '$0.35' },
    { model: 'ConvNeXt-B (ImageNet)', regime: 'frozen', color: C.inet, exams: 555, lo: 218, hi: 2331, compute: '$0.08', expert: '$25,181', expertRange: '$5.3k – $139k', llm: '$0.62' },
    { model: 'ViT-B/16 (DINOv3)', regime: 'fine-tuned', color: C.vit, exams: 671, lo: 412, hi: 994, compute: '$0.33', expert: '$30,469', expertRange: '$6.4k – $168k', llm: '$0.76' },
    { model: 'ViT-B/16 (DINOv3)', regime: 'frozen', color: C.vit, exams: 1404, lo: 369, hi: 9652, compute: '$0.13', expert: '$63,720', expertRange: '$13k – $351k', llm: '$1.58' },
  ],
  '0.80': [
    { model: 'ConvNeXt-B (DINOv3)', regime: 'fine-tuned', color: C.cnx, exams: 1333, lo: 773, hi: 2131, compute: '$0.58', expert: '$60,481', expertRange: '$13k – $333k', llm: '$1.50' },
    { model: 'ViT-B/16 (DINOv3)', regime: 'fine-tuned', color: C.vit, exams: 1652, lo: 1201, hi: 2255, compute: '$0.70', expert: '$74,977', expertRange: '$16k – $413k', llm: '$1.86' },
    { model: 'ConvNeXt-B (ImageNet)', regime: 'frozen', color: C.inet },
    { model: 'ViT-B/16 (DINOv3)', regime: 'frozen', color: C.vit },
  ],
  '0.85': [
    { model: 'ViT-B/16 (DINOv3)', regime: 'fine-tuned', color: C.vit, exams: 3955, lo: 2935, hi: 5646, extrap: true, compute: '$1.38', expert: '$179,478', expertRange: '$38k – $989k', llm: '$4.45' },
    { model: 'ConvNeXt-B (DINOv3)', regime: 'fine-tuned', color: C.cnx, exams: 4882, lo: 3086, hi: 12419, extrap: true, compute: '$1.78', expert: '$221,517', expertRange: '$47k – $1.2M', llm: '$5.49' },
    { model: 'ConvNeXt-B (ImageNet)', regime: 'frozen', color: C.inet },
    { model: 'ViT-B/16 (DINOv3)', regime: 'frozen', color: C.vit },
  ],
};

const XMAX = 6000; // fixed scale across tabs, so switching target shows the growth

function CostTable() {
  const [target, setTarget] = useState<Target>('0.80');
  const rows = COSTS[target];
  const pos = (n: number) => `${Math.min(100, (n / XMAX) * 100)}%`;

  return (
    <div className="glass knee-accent-border knee-viz rounded-2xl overflow-hidden">
      <CardBar icon={<Calculator className="w-4 h-4 knee-accent-text" />}>
        exams to reach a target AUC at an unseen site · and what they cost
      </CardBar>
      <div className="p-5 space-y-4">
        <div role="radiogroup" aria-label="Target AUC" className="inline-flex gap-1 p-1 rounded-xl knee-accent-bg">
          {(['0.75', '0.80', '0.85'] as Target[]).map((t) => {
            const on = t === target;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTarget(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${on ? 'knee-accent-text' : ''}`}
                style={{ background: on ? 'var(--background)' : 'transparent', color: on ? undefined : 'var(--muted)', boxShadow: on ? '0 1px 3px rgba(0,0,0,0.18)' : 'none' }}
              >
                Target AUC {t}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto knee-viz">
          <table className="w-full text-sm" style={{ minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Backbone', 'Training exams needed', 'Compute', 'Expert labels', 'Local LLM labels'].map((h, i) => (
                  <th
                    key={h}
                    className={`font-semibold pb-3 text-xs uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'text-left pr-4' : i === 1 ? 'text-left px-3' : 'text-right px-3'}`}
                    style={{ color: 'var(--muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model + r.regime} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 pr-4 align-middle">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} aria-hidden />
                      <span>
                        <span className="font-semibold block" style={{ color: 'var(--title)' }}>{r.model}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{r.regime}</span>
                      </span>
                    </span>
                  </td>
                  {r.exams ? (
                    <>
                      <td className="py-3 px-3 align-middle" style={{ width: '42%' }}>
                        <div className="flex items-center gap-3">
                          {/* bar from the baseline, with the 95% CI as a whisker */}
                          <div className="relative flex-1 h-5" aria-hidden>
                            <div className="absolute inset-y-0 left-0 right-0" style={{ borderLeft: `1px solid ${C.grid}` }} />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-px"
                              style={{ left: pos(r.lo!), width: `calc(${pos(r.hi!)} - ${pos(r.lo!)})`, background: 'var(--muted)', opacity: 0.7 }}
                            />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-2.5"
                              style={{
                                left: 0,
                                width: pos(r.exams),
                                background: r.color,
                                borderRadius: '0 4px 4px 0',
                                opacity: r.extrap ? 0.45 : 1,
                              }}
                            />
                            {r.hi! > XMAX && (
                              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--muted)' }}>›</span>
                            )}
                          </div>
                          <span className="font-mono text-sm whitespace-nowrap text-right" style={{ color: 'var(--foreground)', minWidth: 58, fontVariantNumeric: 'tabular-nums' }}>
                            {r.exams.toLocaleString('en-US')}{r.extrap ? '†' : ''}
                          </span>
                        </div>
                        <div className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                          95% CI {r.lo!.toLocaleString('en-US')} – {r.hi!.toLocaleString('en-US')}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono align-middle" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{r.compute}</td>
                      <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                        <span className="font-mono font-semibold block" style={{ color: 'var(--title)', fontVariantNumeric: 'tabular-nums' }}>{r.expert}</span>
                        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{r.expertRange}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono align-middle" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{r.llm}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="py-3 px-3 text-sm align-middle" style={{ color: 'var(--muted)' }}>
                      Not reached within 26,000 exams, ten times the largest training pool, on the
                      log-linear trend.
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--title)' }}>
            Compute is a rounding error next to the labels: under $2 per model, against tens of
            thousands of dollars of radiologist time for the same exams.
          </strong>{' '}
          That is the whole management case in one line, and it is why frozen backbones lose the
          argument above 0.75 even though they are cheaper to train: they need so many more labeled
          exams that the compute saving is irrelevant. Exam counts are read off the observed curves
          (fine-tuned rows on 3 test folds, matched with the frozen rows); † marks an extrapolation past
          2,600 exams, so the AUC 0.85 figures are order-of-magnitude guides, not prescriptions. A
          hospital also needs a validation set of about 870 exams on top of these.
        </p>
      </div>
    </div>
  );
}

/* ── 2. Labeling the same 4,407 studies, four ways ─────────────────── */

const LADDER = [
  { name: 'Local 14B LLM reading report text (this study)', cost: 5, lo: 2.9, hi: 7.5, label: '≈ $5', onPrem: true, quality: 'labels score 0.866 vs. experts' },
  { name: 'Hosted frontier LLM, one pass over images + report', cost: 48.49, label: '$48.49', onPrem: false, quality: 'a bronze-level challenge entry, 0.942' },
  { name: 'Frontier LLM agents on images + reports (challenge winner)', cost: 750, lo: 500, hi: 1000, label: '~$500 – $1,000 (est.)', onPrem: false, quality: 'winning entry, 0.960' },
  { name: 'Two expert radiologists per exam', cost: 200000, lo: 42000, hi: 1100000, label: '≈ $200,000', onPrem: true, quality: 'the reference standard' },
];

function LabelLadder() {
  const lmin = Math.log10(1), lmax = Math.log10(2_000_000);
  const pos = (v: number) => `${((Math.log10(v) - lmin) / (lmax - lmin)) * 100}%`;
  const ticks = [1, 10, 100, 1000, 10000, 100000, 1000000];
  const tickLabel = (t: number) => (t >= 1_000_000 ? '$1M' : t >= 1000 ? `$${t / 1000}k` : `$${t}`);

  return (
    <div className="glass knee-accent-border knee-viz rounded-2xl overflow-hidden">
      <CardBar icon={<Coins className="w-4 h-4 knee-accent-text" />}>
        labeling all 4,407 studies · log scale · whiskers show the plausible range
      </CardBar>
      <div className="p-5 space-y-5 knee-viz">
        {LADDER.map((r) => (
          <div key={r.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-1.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--title)' }}>{r.name}</span>
              <span className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>{r.label}</span>
            </div>
            <div className="relative h-3" aria-hidden>
              {ticks.map((t) => (
                <div key={t} className="absolute inset-y-0" style={{ left: pos(t), borderLeft: `1px solid ${C.grid}` }} />
              ))}
              {r.lo && r.hi && (
                <div className="absolute top-1/2 -translate-y-1/2 h-px" style={{ left: pos(r.lo), width: `calc(${pos(r.hi)} - ${pos(r.lo)})`, background: 'var(--muted)' }} />
              )}
              <div className="absolute top-0 bottom-0 left-0" style={{ width: pos(r.cost), background: C.expert, borderRadius: '0 4px 4px 0', opacity: r.onPrem ? 1 : 0.55 }} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
              <span className="inline-flex items-center gap-1">
                {r.onPrem ? <ShieldCheck className="w-3.5 h-3.5 knee-accent-text" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {r.onPrem ? 'data stays in the hospital' : 'data goes to a hosted API'}
              </span>
              <span>· {r.quality}</span>
            </div>
          </div>
        ))}
        <div className="relative h-4 text-[10px] font-mono" style={{ color: 'var(--muted)' }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>{tickLabel(t)}</span>
          ))}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          The challenge allowed hosted APIs because its data was already de-identified. A hospital&apos;s
          own reports and images are protected health information, so the hosted rows usually need
          de-identification, a business associate agreement and a governance review before they are
          even an option, which is why this study ran entirely on one workstation. The local labels
          cost about 200 to 400 times less than the winner&apos;s agentic labels; those in turn cost 100
          to 200 times less than expert reads. The 0.942 and 0.960 figures are leaderboard scores on
          about 1,300 hidden studies, a different and much larger ruler than our 58-study gold set
          (best model 0.840), so the comparison is approximate.
        </p>
      </div>
    </div>
  );
}

/* ── 3. Decision guide ─────────────────────────────────────────────── */

const RULES = [
  { when: 'No GPU, or a fixed pool of 500 exams or fewer', then: 'Use a frozen ImageNet ConvNeXt-B, not DINOv3. Expect up to about 0.75 AUC for $0.08 of compute.' },
  { when: 'A 12 GB GPU, any number of exams', then: 'Fine-tune DINOv3 ConvNeXt-B. It costs $0.32 more than frozen and is never significantly worse.' },
  { when: 'AUC 0.80 for worklist triage', then: 'Budget about 1,300 to 1,700 report-labeled training exams, plus about 870 validation exams from another scanner.' },
  { when: '0.90 AUC or better (diagnostic grade)', then: 'Local report labels will not get there. Fund image-level labels (radiologists, or an on-premise multimodal model), or buy a cleared commercial tool.' },
  { when: 'Ligament and meniscal tears or fractures matter most', then: 'Over-sample focal positives: they trail by 0.040 AUC at equal positive counts, and each doubling of positives adds 0.018.' },
  { when: 'Deploying to a new scanner or site', then: 'Re-validate locally before go-live. Macro AUC moves by roughly ±0.02 to 0.04 between sites, even though model rankings hold (W = 0.94).' },
];

function DecisionGuide() {
  return (
    <div className="glass knee-accent-border knee-viz rounded-2xl overflow-hidden">
      <CardBar icon={<ClipboardList className="w-4 h-4 knee-accent-text" />}>
        what the results mean for a hospital analytics team
      </CardBar>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {RULES.map((r, i) => (
          <div key={i} className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-6 gap-y-1 px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--title)' }}>
              <span className="knee-accent-text mr-2 font-mono">If</span>
              {r.when}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{r.then}</p>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 pt-1">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--title)' }}>Build or buy:</strong> build locally for a 0.75 to
          0.80 triage aid (about $5 of local LLM labels, $2.6k to $4.5k for a 60 to 100 exam expert
          audit set, and under $2 of compute), and buy a cleared product or join a multi-site labeling
          consortium when the target is 0.90 or better, because that takes image-level supervision.
        </p>
      </div>
    </div>
  );
}

export default function KneeMRICostGuide() {
  return (
    <section>
      <SecHead>What It Costs a Hospital</SecHead>
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col gap-6">
        <CostTable />
        <LabelLadder />
        <DecisionGuide />
      </motion.div>
    </section>
  );
}
