const nodes = [
  { id: "yelp",      label: "Yelp Dataset",    sub: "6M reviews",      color: "#f59e0b", x: 40,  y: 60,  w: 150, h: 70 },
  { id: "weather",   label: "OpenWeatherMap",  sub: "Historical API",  color: "#f59e0b", x: 40,  y: 160, w: 150, h: 70 },
  { id: "pyspark",   label: "PySpark ETL",     sub: "Distributed",     color: "#60a5fa", x: 250, y: 105, w: 150, h: 70 },
  { id: "vader",     label: "VADER NLP",       sub: "Sentiment Score", color: "#2dd4bf", x: 460, y: 105, w: 150, h: 70 },
  { id: "snowflake", label: "Snowflake DW",    sub: "Star Schema",     color: "#7dd3fc", x: 670, y: 105, w: 150, h: 70 },
  { id: "tableau",   label: "Tableau",         sub: "Executive Dash",  color: "#34d399", x: 880, y: 105, w: 150, h: 70 },
];

const arrows = [
  { x1: 190, y1: 95,  x2: 250, y2: 130, color: "#f59e0b", markerId: "yw-arrow-amber1" },
  { x1: 190, y1: 195, x2: 250, y2: 150, color: "#f59e0b", markerId: "yw-arrow-amber2" },
  { x1: 400, y1: 140, x2: 460, y2: 140, color: "#60a5fa", markerId: "yw-arrow-blue"   },
  { x1: 610, y1: 140, x2: 670, y2: 140, color: "#2dd4bf", markerId: "yw-arrow-nlp"    },
  { x1: 820, y1: 140, x2: 880, y2: 140, color: "#7dd3fc", markerId: "yw-arrow-sky"    },
];

export default function WeatherPipelineArchDiagram() {
  return (
    <div className="p-6 overflow-x-auto">
      <svg
        viewBox="0 0 1080 300"
        style={{ width: "100%", minWidth: 720, display: "block" }}
      >
        {/* Airflow orchestration bounding box */}
        <rect
          x={235} y={80} width={810} height={120} rx={14}
          fill="rgba(251,146,60,0.04)"
          stroke="rgba(251,146,60,0.2)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <text
          x={248} y={72}
          fontSize={10} fill="#fb923c"
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
        >
          AIRFLOW ORCHESTRATION
        </text>

        {/* Arrow marker definitions */}
        <defs>
          {arrows.map((a) => (
            <marker
              key={a.markerId}
              id={a.markerId}
              markerWidth="8" markerHeight="6"
              refX="6" refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={a.color} opacity={0.7} />
            </marker>
          ))}
        </defs>

        {/* Arrows */}
        {arrows.map((a) => (
          <line
            key={a.markerId}
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={a.color}
            strokeWidth={1.8}
            strokeOpacity={0.55}
            markerEnd={`url(#${a.markerId})`}
          />
        ))}

        {/* Pipeline nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x} y={n.y} width={n.w} height={n.h} rx={10}
              fill={`${n.color}14`}
              stroke={`${n.color}40`}
              strokeWidth={1.5}
            />
            <text
              x={n.x + n.w / 2} y={n.y + 28}
              textAnchor="middle"
              fontSize={13}
              fill={n.color}
              fontFamily="ui-sans-serif, sans-serif"
              fontWeight={600}
            >
              {n.label}
            </text>
            <text
              x={n.x + n.w / 2} y={n.y + 46}
              textAnchor="middle"
              fontSize={10.5}
              fill={n.color}
              fontFamily="ui-monospace, monospace"
              opacity={0.7}
            >
              {n.sub}
            </text>
          </g>
        ))}

        {/* Annotations: stacked legend (kept on separate lines to avoid overlap) */}
        <text x={40} y={246} fontSize={10} fill="rgba(245,158,11,0.7)" fontFamily="ui-monospace, monospace">
          2M+ reviews · historical weather aligned by geo + timestamp
        </text>
        <text x={40} y={266} fontSize={10} fill="rgba(45,212,191,0.7)" fontFamily="ui-monospace, monospace">
          VADER compound score → Positive / Neutral / Negative
        </text>
        <text x={40} y={286} fontSize={10} fill="rgba(125,211,252,0.7)" fontFamily="ui-monospace, monospace">
          Snowflake clustered on date_key + weather_category
        </text>
      </svg>
    </div>
  );
}
