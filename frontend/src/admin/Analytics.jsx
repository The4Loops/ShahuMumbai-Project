import React from "react";

const metrics = [
  { title: "Total Users", value: 134, delta: "+8%", trend: "up", series: [90, 102, 95, 110, 120, 126, 134] },
  { title: "Returning Visitors", value: 27, delta: "+3", trend: "up", series: [20, 18, 19, 22, 24, 25, 27] },
  { title: "Conversion Rate", value: "4.3%", delta: "-0.2%", trend: "down", series: [4.6, 4.8, 4.5, 4.4, 4.2, 4.3, 4.3] },
];

// Tiny inline sparkline (no dependencies)
const Sparkline = ({ data = [], height = 36, strokeWidth = 2, className = "" }) => {
  if (!data.length) return null;

  const w = 120; // fixed width for consistency
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const yRange = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (w - strokeWidth) + strokeWidth / 2;
    const y = h - ((d - min) / yRange) * (h - strokeWidth) - strokeWidth / 2;
    return [x, y];
  });

  const dAttr = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");

  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <path d={dAttr} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx={lastX} cy={lastY} r={strokeWidth + 1} fill="currentColor" />
    </svg>
  );
};

const MetricCard = ({ title, value, delta, trend, series }) => {
  const trendColor =
    trend === "up" ? "text-emerald-700 bg-emerald-100 border-emerald-200" :
    trend === "down" ? "text-rose-700 bg-rose-100 border-rose-200" :
    "text-[#6B4226] bg-[#F7F0EE] border-[#E6DCD2]";

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6DCD2] shadow-sm hover:shadow transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-[#6B4226]/80">{title}</h3>
          <p className="text-3xl font-bold text-[#6B4226] mt-1">{value}</p>
        </div>

        {delta && (
          <span className={`text-xs px-2 py-1 rounded-full border ${trendColor}`}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "•"} {delta}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Sparkline
          data={series}
          className="text-[#D4A5A5]"
          height={36}
          strokeWidth={2}
        />
      </div>
    </div>
  );
};

const Analytics = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {metrics.map((m, idx) => (
        <MetricCard key={idx} {...m} />
      ))}
    </div>
  );
};

export default Analytics;
