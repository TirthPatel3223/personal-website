"use client";

const weatherFindings = [
  {
    label: "Extreme Heat",
    volume: 30,
    sentiment: 0.65,
    color: "#f97316",
    note: "Major deterrent — lowest volume AND sentiment",
  },
  {
    label: "Pleasant",
    volume: 305,
    sentiment: 0.69,
    color: "#34d399",
    note: "Baseline — highest volume, average sentiment",
  },
  {
    label: "Rainy / Snowy",
    volume: 143,
    sentiment: 0.69,
    color: "#7dd3fc",
    note: "Volume halved but sentiment holds identical to pleasant",
  },
  {
    label: "Freezing",
    volume: 101,
    sentiment: 0.71,
    color: "#4e9bb9",
    note: "Cold Weather Paradox — lowest volume, highest sentiment",
  },
];

const MAX_VOL = 305;

export default function WeatherPipelineInsights() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#1f77b4] to-[#4e9bb9] whitespace-nowrap">
          The Weather Paradox — Key Findings
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {weatherFindings.map((w) => (
          <div
            key={w.label}
            className="glass rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: `${w.color}33` }}
          >
            <div className="text-sm font-bold mb-4" style={{ color: w.color }}>
              {w.label}
            </div>

            {/* Volume bar */}
            <div className="mb-3">
              <div className="flex justify-between mb-1.5">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Volume
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--title)" }}
                >
                  {w.volume}/day
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(w.volume / MAX_VOL) * 100}%`,
                    background: w.color,
                  }}
                />
              </div>
            </div>

            {/* Sentiment bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Sentiment
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--title)" }}
                >
                  {w.sentiment}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((w.sentiment - 0.6) / 0.15) * 100}%`,
                    background: w.color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>

            <p
              className="text-xs leading-relaxed italic"
              style={{ color: "var(--muted)" }}
            >
              {w.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
