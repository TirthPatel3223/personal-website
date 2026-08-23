/* Three runtimes, because the platform forces it: Databricks Free Edition jobs have no
   outbound internet, so ingestion pushes in from EC2 and serving is pulled out by
   GitHub Actions. Colours come from the --arch-* tokens in globals.css so the diagram
   re-themes with the site. */

type Line = {
  text: string;
  dy: number;
  size?: number;
  weight?: number;
  mono?: boolean;
  opacity?: number;
};

type Node = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lines: Line[];
};

const LANES = [
  { id: 'ec2',  x: 24,  y: 76, w: 232, h: 444, label: 'AWS EC2  ·  HOURLY SYSTEMD TIMER',      color: 'var(--arch-ingest)' },
  { id: 'dbx',  x: 288, y: 76, w: 520, h: 444, label: 'DATABRICKS SERVERLESS  ·  SUN 06:00 UTC', color: 'var(--arch-gold)' },
  { id: 'gha',  x: 840, y: 76, w: 256, h: 444, label: 'GITHUB ACTIONS  ·  SUN 08:00 UTC',        color: 'var(--arch-serve)' },
];

const NODES: Node[] = [
  /* ── Lane A: the source host ─────────────────────────────────────────── */
  {
    id: 'source', x: 44, y: 140, w: 192, h: 72, color: 'var(--arch-src)',
    lines: [
      { text: 'Source Postgres', dy: 26, size: 12.5, weight: 600 },
      { text: 'not our machine', dy: 43, size: 9.5, mono: true },
      { text: 'read-only · loopback', dy: 58, size: 9.5, mono: true },
    ],
  },
  {
    id: 'ingest', x: 44, y: 268, w: 192, h: 72, color: 'var(--arch-ingest)',
    lines: [
      { text: 'ingest.py', dy: 26, size: 12.5, weight: 600 },
      { text: 'watermark from bronze', dy: 43, size: 9.5, mono: true },
      { text: 'land Parquet → MERGE', dy: 58, size: 9.5, mono: true },
    ],
  },

  /* ── Lane B: the medallion ───────────────────────────────────────────── */
  {
    id: 'bronze', x: 344, y: 104, w: 424, h: 56, color: 'var(--arch-bronze)',
    lines: [
      { text: 'bronze.wait_times_raw', dy: 24, size: 12.5, weight: 600, mono: true },
      { text: '842,539 rows  ·  append-only audit trail, never edited', dy: 41, size: 9.5, mono: true },
    ],
  },
  {
    id: 'silver', x: 344, y: 188, w: 424, h: 56, color: 'var(--arch-silver)',
    lines: [
      { text: 'silver.wait_times_current', dy: 24, size: 12.5, weight: 600, mono: true },
      { text: '~390K rows  ·  109 attractions  ·  UTC→local first, then park hours', dy: 41, size: 9.5, mono: true },
    ],
  },
  {
    id: 'gold', x: 344, y: 368, w: 424, h: 56, color: 'var(--arch-gold)',
    lines: [
      { text: 'gold.kpis_current  +  gold.predictions_current', dy: 24, size: 12.5, weight: 600, mono: true },
      { text: '7 KPIs × 4 models  ·  7-day forecast + backtest rows', dy: 41, size: 9.5, mono: true },
    ],
  },
  {
    id: 'gate', x: 344, y: 452, w: 424, h: 56, color: 'var(--arch-gate)',
    lines: [
      { text: '12 quality gates  →  promote _current to _last', dy: 24, size: 12.5, weight: 600 },
      { text: 'atomic DEEP CLONE  ·  serving.json written last', dy: 41, size: 9.5, mono: true },
    ],
  },

  /* ── Lane C: serving ─────────────────────────────────────────────────── */
  {
    id: 'publish', x: 860, y: 130, w: 216, h: 68, color: 'var(--arch-serve)',
    lines: [
      { text: 'publish.py', dy: 25, size: 12.5, weight: 600 },
      { text: 'reads gold _last over the', dy: 42, size: 9.5, mono: true },
      { text: 'Databricks SQL warehouse', dy: 56, size: 9.5, mono: true },
    ],
  },
  {
    id: 'swap', x: 860, y: 228, w: 216, h: 64, color: 'var(--arch-serve)',
    lines: [
      { text: 'publish_serving() RPC', dy: 25, size: 12, weight: 600, mono: true },
      { text: 'staging ⇄ serving rename', dy: 42, size: 9.5, mono: true },
      { text: 'one Postgres transaction', dy: 55, size: 9.5, mono: true },
    ],
  },
  {
    id: 'supabase', x: 860, y: 326, w: 100, h: 76, color: 'var(--arch-serve)',
    lines: [
      { text: 'Supabase', dy: 26, size: 11.5, weight: 600 },
      { text: 'PostgREST', dy: 43, size: 9, mono: true },
      { text: 'read-only API', dy: 57, size: 9, mono: true },
    ],
  },
  {
    id: 'pages', x: 976, y: 326, w: 100, h: 76, color: 'var(--arch-serve)',
    lines: [
      { text: 'GitHub Pages', dy: 26, size: 11.5, weight: 600 },
      { text: 'dashboard.py', dy: 43, size: 9, mono: true },
      { text: 'static, no JS', dy: 57, size: 9, mono: true },
    ],
  },
  {
    id: 'consumer', x: 860, y: 446, w: 216, h: 64, color: 'var(--arch-champ)',
    lines: [
      { text: 'Mapblazer routing solver', dy: 26, size: 12, weight: 600 },
      { text: 'the whole cost surface:', dy: 43, size: 9.5, mono: true },
      { text: 'every ride × every arrival time', dy: 56, size: 9.5, mono: true },
    ],
  },
];

/* The four candidates trained every run. The baseline is the floor, not a candidate. */
const MODELS = [
  { id: 'prophet',  x: 344, label: 'Prophet fleet',  sub: 'per ride',    mae: '7.01', champ: true  },
  { id: 'xgbg',     x: 452, label: 'XGB global',     sub: 'ride as cat', mae: '8.26', champ: false },
  { id: 'xgbl',     x: 560, label: 'XGB local',      sub: 'per ride',    mae: '8.45', champ: false },
  { id: 'baseline', x: 668, label: 'Baseline',       sub: 'ride mean',   mae: '9.51', champ: false },
];

const MODEL_ROW = { y: 272, h: 64, w: 100 };

/* straight vertical/horizontal connectors inside a lane */
const ARROWS = [
  { id: 'a-src-ingest', d: 'M 140 212 V 268',        color: 'var(--arch-ingest)' },
  { id: 'b-bro-sil',    d: 'M 556 160 V 188',        color: 'var(--arch-silver)' },
  { id: 'b-sil-mod',    d: 'M 556 244 V 272',        color: 'var(--arch-champ)' },
  { id: 'b-mod-gold',   d: 'M 556 336 V 368',        color: 'var(--arch-gold)' },
  { id: 'b-gold-gate',  d: 'M 556 424 V 452',        color: 'var(--arch-gate)' },
  { id: 'c-pub-swap',   d: 'M 968 198 V 228',        color: 'var(--arch-serve)' },
  { id: 'c-fanout-l',   d: 'M 910 306 V 326',        color: 'var(--arch-serve)' },
  { id: 'c-fanout-r',   d: 'M 1026 306 V 326',       color: 'var(--arch-serve)' },
  { id: 'c-merge',      d: 'M 968 420 V 446',        color: 'var(--arch-champ)' },
  /* cross-lane: push in, pull out */
  { id: 'x-ec2-dbx',    d: 'M 236 304 H 268 V 132 H 344', color: 'var(--arch-ingest)' },
  { id: 'x-dbx-gha',    d: 'M 768 480 H 812 V 164 H 860', color: 'var(--arch-serve)' },
];

/* plain buses, no arrowhead: they only gather or split flow */
const BUSES = [
  'M 968 292 V 306 M 910 306 H 1026',
  'M 910 402 V 420 M 1026 402 V 420 M 910 420 H 1026',
];

export default function MapblazerArchDiagram() {
  return (
    <div className="mapblazer-arch p-6 overflow-x-auto">
      <svg viewBox="0 0 1120 600" style={{ width: '100%', minWidth: 900, display: 'block' }}>
        <defs>
          {[...ARROWS, { id: 'fallback', color: 'var(--arch-fail)' }].map((a) => (
            <marker
              key={a.id}
              id={`mb-arw-${a.id}`}
              markerWidth="8"
              markerHeight="6"
              refX="6.5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={a.color} opacity={0.85} />
            </marker>
          ))}
        </defs>

        {/* Runtime lanes */}
        {LANES.map((l) => (
          <g key={l.id}>
            <rect
              x={l.x} y={l.y} width={l.w} height={l.h} rx={14}
              fill={l.color}
              fillOpacity={0.03}
              stroke={l.color}
              strokeOpacity={0.28}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <text
              x={l.x + 14} y={l.y - 10}
              fontSize={10} fill={l.color} fontWeight={600}
              fontFamily="ui-monospace, monospace"
            >
              {l.label}
            </text>
          </g>
        ))}

        {/* Flow buses (no arrowheads) */}
        {BUSES.map((d) => (
          <path
            key={d} d={d} fill="none"
            stroke="var(--arch-serve)" strokeWidth={1.8} strokeOpacity={0.5}
          />
        ))}

        {/* Connectors */}
        {ARROWS.map((a) => (
          <path
            key={a.id}
            d={a.d}
            fill="none"
            stroke={a.color}
            strokeWidth={1.8}
            strokeOpacity={0.55}
            markerEnd={`url(#mb-arw-${a.id})`}
          />
        ))}

        {/* Fallback loop: a failed run drops _current, keeps _last, and re-scores the
            week with the previous serving model rather than going dark. Runs in lane B's
            left gutter (288→344) so it never crosses a box. */}
        <path
          d="M 344 480 H 316 V 396 H 344"
          fill="none"
          stroke="var(--arch-fail)"
          strokeWidth={1.6}
          strokeOpacity={0.65}
          strokeDasharray="5 4"
          markerEnd="url(#mb-arw-fallback)"
        />
        <text
          x={302} y={438}
          fontSize={9} fill="var(--arch-fail)" fillOpacity={0.85}
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
          transform="rotate(-90 302 438)"
        >
          fallback: previous model re-scored
        </text>

        {/* Cross-lane annotations */}
        <text x={252} y={296} fontSize={9} fill="var(--arch-ingest)" fillOpacity={0.8} fontFamily="ui-monospace, monospace">
          push
        </text>
        <text x={786} y={472} fontSize={9} fill="var(--arch-serve)" fillOpacity={0.8} fontFamily="ui-monospace, monospace">
          pull
        </text>

        {/* Footprint on a host that is not ours */}
        {['one SELECT/hour, ~220 rows', 'reads only · never writes', 'outbound HTTPS, nothing inbound'].map((t, i) => (
          <text
            key={t}
            x={140} y={376 + i * 15}
            textAnchor="middle"
            fontSize={9} fill="var(--arch-ingest)" fillOpacity={0.6}
            fontFamily="ui-monospace, monospace"
          >
            {t}
          </text>
        ))}

        {/* Model row */}
        {MODELS.map((m) => {
          const color = m.champ ? 'var(--arch-champ)' : 'var(--arch-chall)';
          const cx = m.x + MODEL_ROW.w / 2;
          return (
            <g key={m.id}>
              <rect
                x={m.x} y={MODEL_ROW.y} width={MODEL_ROW.w} height={MODEL_ROW.h} rx={9}
                fill={color}
                fillOpacity={m.champ ? 0.14 : 0.07}
                stroke={color}
                strokeOpacity={m.champ ? 0.55 : 0.3}
                strokeWidth={m.champ ? 2 : 1.4}
              />
              <text x={cx} y={MODEL_ROW.y + 19} textAnchor="middle" fontSize={11} fontWeight={600} fill={color} fontFamily="ui-sans-serif, sans-serif">
                {m.label}
              </text>
              <text x={cx} y={MODEL_ROW.y + 32} textAnchor="middle" fontSize={8.5} fill={color} fillOpacity={0.7} fontFamily="ui-monospace, monospace">
                {m.sub}
              </text>
              <text x={cx} y={MODEL_ROW.y + 50} textAnchor="middle" fontSize={13} fontWeight={700} fill={color} fontFamily="ui-monospace, monospace">
                {m.mae}
              </text>
              <text x={cx} y={MODEL_ROW.y + 60} textAnchor="middle" fontSize={7.5} fill={color} fillOpacity={0.65} fontFamily="ui-monospace, monospace">
                MAE min
              </text>
            </g>
          );
        })}
        {/* Split left, promotion rule right. The silver-to-models arrow runs at x=556
            between them, so neither annotation can collide with it. */}
        <text x={344} y={MODEL_ROW.y - 9} fontSize={9} fill="var(--arch-champ)" fillOpacity={0.8} fontFamily="ui-monospace, monospace">
          chronological 80/20 split
        </text>
        <text x={768} y={MODEL_ROW.y - 9} textAnchor="end" fontSize={9} fill="var(--arch-champ)" fillOpacity={0.8} fontFamily="ui-monospace, monospace">
          champion ships only if ≥1% better
        </text>

        {/* Boxes */}
        {NODES.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x} y={n.y} width={n.w} height={n.h} rx={10}
              fill={n.color}
              fillOpacity={0.08}
              stroke={n.color}
              strokeOpacity={0.35}
              strokeWidth={1.5}
            />
            {n.lines.map((l, i) => (
              <text
                key={i}
                x={n.x + n.w / 2}
                y={n.y + l.dy}
                textAnchor="middle"
                fontSize={l.size ?? 11}
                fontWeight={l.weight ?? 400}
                fill={n.color}
                fillOpacity={l.opacity ?? (l.weight ? 1 : 0.72)}
                fontFamily={l.mono ? 'ui-monospace, monospace' : 'ui-sans-serif, sans-serif'}
              >
                {l.text}
              </text>
            ))}
          </g>
        ))}

        {/* Legend */}
        {[
          'Every network hop is initiated from outside the training job, because Databricks Free Edition jobs have no outbound internet.',
          'A run writes only _current; Supabase and the dashboard read _last, so a failed run cannot take down a working dashboard.',
          'Red path: on failure _current is dropped and the upcoming week is re-scored with the previous serving model. The job still fails, so it alerts.',
        ].map((t, i) => (
          <text
            key={i}
            x={24} y={548 + i * 17}
            fontSize={9.5} fill="var(--arch-lane)"
            fontFamily="ui-monospace, monospace"
          >
            {t}
          </text>
        ))}
      </svg>
    </div>
  );
}
