"use client";

const orderMetrics = [
  {
    label: "São Paulo",
    orders: 14000,
    color: "#5f9ea0",
    note: "Dominant market — 14K+ orders",
  },
  {
    label: "Rio de Janeiro",
    orders: 6800,
    color: "#6fb5b7",
    note: "Second largest — strong e-commerce presence",
  },
  {
    label: "Belo Horizonte",
    orders: 2800,
    color: "#80c8ca",
    note: "Third market — emerging hub",
  },
  {
    label: "Other Cities",
    orders: 5200,
    color: "#92dbdc",
    note: "Long tail — distributed demand",
  },
];

const MAX_ORDERS = 14000;

const kpiCards = [
  { label: "Total Revenue", value: "$2,441,873", color: "#5f9ea0" },
  { label: "Avg Order Value", value: "$340.9", color: "#5f9ea0" },
  { label: "On-Time Delivery", value: "90.34%", color: "#5f9ea0" },
  { label: "Median Cycle Time", value: "10 days", color: "#5f9ea0" },
  { label: "Shipping/Price", value: "22.18%", color: "#5f9ea0" },
  { label: "Total Orders", value: "89,316", color: "#5f9ea0" },
];

export default function OrdersInsights() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#2d6a6f] to-[#5f9ea0] whitespace-nowrap">
          Operational KPIs — Key Findings
        </h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="glass rounded-xl p-3 text-center transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: "rgba(95, 158, 160, 0.15)" }}
          >
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
              {k.label}
            </div>
            <div className="text-lg font-bold" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* City order distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {orderMetrics.map((m) => (
          <div
            key={m.label}
            className="glass rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ borderColor: `${m.color}33` }}
          >
            <div className="text-sm font-bold mb-4" style={{ color: m.color }}>
              {m.label}
            </div>

            {/* Orders bar */}
            <div className="mb-3">
              <div className="flex justify-between mb-1.5">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Orders
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--title)" }}
                >
                  {m.orders.toLocaleString()}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(m.orders / MAX_ORDERS) * 100}%`,
                    background: m.color,
                  }}
                />
              </div>
            </div>

            <p
              className="text-xs leading-relaxed italic"
              style={{ color: "var(--muted)" }}
            >
              {m.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
