"use client";

const covidKPIs = [
  {
    label: "Total Vaccinated",
    value: "140M+",
    color: "#3b6fcc",
    note: "Cumulative vaccinations across India",
  },
  {
    label: "Peak Weekly Cases",
    value: "2.2M+",
    color: "#e07020",
    note: "India's devastating second wave — Feb 2021",
  },
  {
    label: "Death Rate Before",
    value: "3.5",
    color: "#e07020",
    note: "Peak weekly death rate (pre-vaccination era)",
  },
  {
    label: "Death Rate Decline",
    value: "Sharp Drop",
    color: "#3b6fcc",
    note: "Despite sharp increase in cases after vaccination",
  },
];

const demographicContext = [
  { label: "HDI", value: "0.6" },
  { label: "Median Age", value: "28.2" },
  { label: "Pop. Density", value: "450.4" },
  { label: "% Vaccinated", value: "1.929%" },
  { label: "% Dead", value: "0.035%" },
  { label: "% Infected", value: "1.389%" },
];

export default function CovidInsights() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#e07020] to-[#f59e0b] whitespace-nowrap">
          Vaccination Impact — Key Findings
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Demographic context strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {demographicContext.map((d) => (
          <div
            key={d.label}
            className="glass rounded-xl p-3 text-center transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: "rgba(224, 112, 32, 0.15)" }}
          >
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
              {d.label}
            </div>
            <div className="text-lg font-bold" style={{ color: "var(--title)" }}>
              {d.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {covidKPIs.map((k) => (
          <div
            key={k.label}
            className="glass rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: `${k.color}33` }}
          >
            <div className="text-sm font-bold mb-3" style={{ color: k.color }}>
              {k.label}
            </div>

            <div className="text-3xl font-black mb-3" style={{ color: k.color }}>
              {k.value}
            </div>

            {/* Color indicator bar */}
            <div
              className="h-1.5 rounded-full mb-4 overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: k.value === "Sharp Drop" ? "5%" : k.value === "3.5" ? "100%" : k.value === "2.2M+" ? "95%" : "80%",
                  background: k.color,
                  opacity: 0.85,
                }}
              />
            </div>

            <p
              className="text-xs leading-relaxed italic"
              style={{ color: "var(--muted)" }}
            >
              {k.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
