import React, { useEffect, useMemo, useState } from "react";
import api from "../supabase/axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine, Cell
} from "recharts";
import { useLoading } from "../context/LoadingContext";
import { toast } from "react-toastify";
import { set } from "date-fns";

function Card({ title, value, sub }) {
  return (
    <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-[#6B4226]">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ---- THEME PALETTE ----
const PALETTE = [
  "#6B4226", // brand brown
  "#C08A5D", // warm tan
  "#E0B084", // light beige
  "#8C5E3C", // mid brown
  "#A97155", // soft clay
  "#D4A373", // muted sand
  "#173F5F", // deep blue accent
  "#3CAEA3", // teal accent
  "#ED553B", // coral accent
];
const colorAt = (i) => PALETTE[i % PALETTE.length];

// % helper
function pct(n, d) {
  if (!d) return "—";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default function Analytics() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 13);
    return d.toISOString().slice(0,10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const { setLoading } = useLoading();
  const [kpis, setKpis] = useState({});
  const [top, setTop] = useState([]);
  const [daily, setDaily] = useState([]);
  const [events, setEvents] = useState([]);
  const [nameFilter, setNameFilter] = useState("");
  const [limit, setLimit] = useState(50);

  // chart controls
  const [selectedEvents, setSelectedEvents] = useState(() => new Set());
  const [showMA, setShowMA] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/analytics/summary", { params: { from, to } });
      setKpis(data.kpis || {});
      setTop(data.topProducts || []);
    }catch (error) {
      toast.error("Failed to load summary data");
    }
     finally {
      setLoading(false);
    }
  };

  const loadDaily = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/analytics/daily", { params: { from, to } });
      setDaily(data.data || []);
    } catch (error) {
      toast.error("Failed to load daily data");
    }finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data } = await api.get("/api/analytics/events", {
        params: { limit, name: nameFilter || undefined },
      });
    setEvents(data.events || []);
    } catch (error) {
      toast.error("Failed to load recent events"); 
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); loadDaily(); }, []);
  useEffect(() => { loadEvents(); }, [nameFilter, limit]);
  const refreshRange = () => { loadSummary(); loadDaily(); };

  // names present in daily series
  const allEventNames = useMemo(
    () => Array.from(new Set(daily.map(d => d.name))).sort(),
    [daily]
  );

  // pivot daily into rows { day, eventA, eventB, ... }
  const dailyPivot = useMemo(() => {
    const days = Array.from(new Set(daily.map(d => d.day.slice(0,10)))).sort();
    const names = allEventNames.filter(n => selectedEvents.size ? selectedEvents.has(n) : true);
    const map = new Map();
    daily.forEach(d => {
      const dayKey = d.day.slice(0,10);
      if (!map.has(dayKey)) map.set(dayKey, { day: dayKey });
      if (!selectedEvents.size || selectedEvents.has(d.name)) {
        map.get(dayKey)[d.name] = d.count;
      }
    });
    const rows = days.map(day => {
      const row = map.get(day) || { day };
      names.forEach(n => { if (!row[n]) row[n] = 0; });
      return row;
    });
    return { rows, names };
  }, [daily, allEventNames, selectedEvents]);

  // totals + 7-day moving average
  const dailyTotalsWithMA = useMemo(() => {
    const rows = dailyPivot.rows.map(r => {
      const total = dailyPivot.names.reduce((s, n) => s + (r[n] || 0), 0);
      return { day: r.day, total };
    });
    if (!showMA) return rows;
    const window = 7;
    return rows.map((r, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = rows.slice(start, i + 1);
      const avg = slice.reduce((s, x) => s + x.total, 0) / slice.length;
      return { ...r, ma7: Math.round(avg * 100) / 100 };
    });
  }, [dailyPivot, showMA]);

  // derived insights from recent events
  const byHour = useMemo(() => {
    const hist = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }));
    events.forEach(ev => {
      const d = new Date(ev.OccurredAt);
      const h = d.getHours();
      hist[h].count += 1;
    });
    return hist;
  }, [events]);

  const trafficSources = useMemo(() => {
    const map = new Map();
    events.forEach(ev => {
      const src = ev.utm?.source || "(none)";
      const med = ev.utm?.medium || "(none)";
      const key = `${src} / ${med}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [events]);

  const topPages = useMemo(() => {
    const map = new Map();
    events.forEach(ev => {
      const isView = ev.name === "view_item" || ev.name === "page_view";
      if (!isView) return;
      const u = ev.url || ev.props?.page_path || "(unknown)";
      map.set(u, (map.get(u) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [events]);

  // funnel
  const funnelSteps = useMemo(() => {
    const view = kpis.view_item || 0;
    const atc = kpis.add_to_cart || 0;
    const checkout = kpis.begin_checkout || 0;
    const purchase = kpis.purchase || 0;
    return [
      { step: "Viewed", value: view, sub: "Views" },
      { step: "Added to Cart", value: atc, sub: pct(atc, view) },
      { step: "Checkout", value: checkout, sub: pct(checkout, atc) },
      { step: "Purchased", value: purchase, sub: pct(purchase, checkout) },
    ];
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <button onClick={refreshRange} className="h-9 px-4 bg-black text-white rounded hover:bg-gray-800">
          Apply
        </button>

        <div className="ml-auto flex items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500">Event filter</label>
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="e.g. add_to_cart"
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Rows</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1">
              {[25,50,100,200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Total Events" value={kpis.total_events ?? 0} />
          <Card title="Unique Sessions" value={kpis.unique_sessions ?? 0} />
          <Card title="Unique Users" value={kpis.unique_users ?? 0} />
          <Card title="Views" value={kpis.view_item ?? 0} />
          <Card title="Add to Cart" value={kpis.add_to_cart ?? 0} />
          <Card title="Begin Checkout" value={kpis.begin_checkout ?? 0} />
          <Card title="Purchases" value={kpis.purchase ?? 0} />
          <Card
            title="ATC → Purchase"
            value={kpis.add_to_cart ? pct((kpis.purchase || 0), kpis.add_to_cart) : "—"}
            sub="Conversion"
          />
        </div>
      }

      {/* Daily chart with colors */}
      <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-[#6B4226]">Events per day</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-gray-500">Show:</div>
            <div className="flex flex-wrap gap-1">
              {allEventNames.map((n, i) => {
                const active = !selectedEvents.size || selectedEvents.has(n);
                return (
                  <button
                    key={n}
                    onClick={() => {
                      setSelectedEvents(prev => {
                        const next = new Set(prev);
                        if (next.has(n)) next.delete(n); else next.add(n);
                        return next;
                      });
                    }}
                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
                      active ? "bg-[#6B4226] text-white border-[#6B4226]" : "bg-white text-gray-700"
                    }`}
                    title={n}
                  >
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colorAt(i) }} />
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedEvents(new Set())}
                className="text-xs px-2 py-1 rounded border bg-white text-gray-700"
                title="Clear selection"
              >
                Clear
              </button>
            </div>
            <label className="flex items-center gap-1 text-xs text-gray-700">
              <input type="checkbox" checked={showMA} onChange={() => setShowMA(v => !v)} />
              7-day average
            </label>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {dailyPivot.names.length > 1 ? (
              <BarChart data={dailyPivot.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                {dailyPivot.names.map((n, i) => (
                  <Bar key={n} dataKey={n} stackId="a" fill={colorAt(i)} />
                ))}
              </BarChart>
            ) : (
              <LineChart data={dailyTotalsWithMA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke={colorAt(0)} strokeWidth={2} dot={false} />
                {showMA && (
                  <Line
                    type="monotone"
                    dataKey="ma7"
                    stroke={colorAt(6)} // deep blue for contrast
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel with colored bars */}
      <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-[#6B4226]">Conversion Funnel</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelSteps} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="step" />
                <Tooltip />
                <Bar dataKey="value">
                  {funnelSteps.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={colorAt(i)} />
                  ))}
                </Bar>
                <ReferenceLine x={0} stroke="#000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:col-span-4 self-center">
            <ul className="text-sm space-y-1">
              <li><span className="font-medium">View → ATC:</span> {pct(kpis.add_to_cart || 0, kpis.view_item || 0)}</li>
              <li><span className="font-medium">ATC → Checkout:</span> {pct(kpis.begin_checkout || 0, kpis.add_to_cart || 0)}</li>
              <li><span className="font-medium">Checkout → Purchase:</span> {pct(kpis.purchase || 0, kpis.begin_checkout || 0)}</li>
              <li><span className="font-medium">View → Purchase:</span> {pct(kpis.purchase || 0, kpis.view_item || 0)}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Activity by hour (colored) */}
      <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
        <div className="font-semibold mb-3 text-[#6B4226]">Activity by Hour (recent events)</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" interval={1} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={colorAt(6)} /> {/* deep blue bars */}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-gray-500 mt-1">Based on the latest {events.length} events fetched.</div>
      </div>

      {/* Traffic sources & Top pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
          <div className="font-semibold mb-3 text-[#6B4226]">Traffic Sources (recent)</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Source / Medium</th>
                  <th className="py-2">Events</th>
                </tr>
              </thead>
              <tbody>
                {trafficSources.map((row, i) => (
                  <tr key={row.key} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <span className="inline-block w-3 h-3 mr-2 align-middle rounded-sm" style={{ background: colorAt(i) }} />
                      {row.key}
                    </td>
                    <td className="py-2">{row.count}</td>
                  </tr>
                ))}
                {!trafficSources.length && (
                  <tr><td colSpan={2} className="py-3 text-gray-500">No UTM data in recent events.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
          <div className="font-semibold mb-3 text-[#6B4226]">Top Pages (recent views)</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">URL / Path</th>
                  <th className="py-2">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 truncate max-w-[360px]" title={row.url}>
                      <span className="inline-block w-3 h-3 mr-2 align-middle rounded-sm" style={{ background: colorAt(i) }} />
                      {row.url}
                    </td>
                    <td className="py-2">{row.count}</td>
                  </tr>
                ))}
                {!topPages.length && (
                  <tr><td colSpan={2} className="py-3 text-gray-500">No recent view events.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
        <div className="font-semibold mb-3 text-[#6B4226]">Top Products (Add to Cart)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2">Adds</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4">{row.product_title}</td>
                  <td className="py-2">{row.add_to_cart_count}</td>
                </tr>
              ))}
              {!top.length && (
                <tr><td colSpan={2} className="py-3 text-gray-500">No data in range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent events */}
      <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
        <div className="font-semibold mb-3 text-[#6B4226]">Recent Events</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Title / Item</th>
                <th className="py-2">Value / Qty</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const title = ev.props?.title || ev.props?.item_name || '';
                const value = ev.props?.price || ev.props?.value || '';
                const qty = ev.props?.quantity || '';
                return (
                  <tr key={ev.AnalyticsEventId} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(ev.OccurredAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{ev.name}</td>
                    <td className="py-2 pr-4">{ev.user_id || (ev.anon_id ? ev.anon_id.slice(0,8) : '')}</td>
                    <td className="py-2 pr-4 truncate max-w-[240px]" title={title}>{title}</td>
                    <td className="py-2">{value ? `₹${value}` : ''}{qty ? `  x${qty}` : ''}</td>
                  </tr>
                );
              })}
              {!events.length && (
                <tr><td colSpan={5} className="py-3 text-gray-500">No events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
