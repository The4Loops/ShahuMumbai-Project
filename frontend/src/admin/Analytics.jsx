import React, { useEffect, useMemo, useState } from "react";
import api from "../supabase/axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

function Card({ title, value, sub }) {
  return (
    <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-[#6B4226]">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 13);
    return d.toISOString().slice(0,10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({});
  const [top, setTop] = useState([]);
  const [daily, setDaily] = useState([]);
  const [events, setEvents] = useState([]);
  const [nameFilter, setNameFilter] = useState("");
  const [limit, setLimit] = useState(50);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/analytics/summary", { params: { from, to } });
      setKpis(data.kpis || {});
      setTop(data.topProducts || []);
    } finally {
      setLoading(false);
    }
  };

  const loadDaily = async () => {
    const { data } = await api.get("/api/analytics/daily", { params: { from, to } });
    setDaily(data.data || []);
  };

  const loadEvents = async () => {
    const { data } = await api.get("/api/analytics/events", {
      params: { limit, name: nameFilter || undefined },
    });
    setEvents(data.events || []);
  };

  useEffect(() => { loadSummary(); loadDaily(); /* initial */ }, []);
  useEffect(() => { loadEvents(); }, [nameFilter, limit]);
  const refreshRange = () => { loadSummary(); loadDaily(); };

  // Pivot daily into series per event name for a grouped chart
  const dailyPivot = useMemo(() => {
    const days = Array.from(new Set(daily.map(d => d.day.slice(0,10)))).sort();
    const names = Array.from(new Set(daily.map(d => d.name)));
    const map = new Map();
    daily.forEach(d => {
      const key = d.day.slice(0,10);
      if (!map.has(key)) map.set(key, { day: key });
      map.get(key)[d.name] = d.count;
    });
    const rows = days.map(day => {
      const row = map.get(day) || { day };
      names.forEach(n => { if (!row[n]) row[n] = 0; });
      return row;
    });
    return { rows, names };
  }, [daily]);

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
      {loading ? (
        <div className="text-gray-500">Loading summary…</div>
      ) : (
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
            value={
              kpis.add_to_cart
                ? `${(((kpis.purchase || 0) / kpis.add_to_cart) * 100).toFixed(1)}%`
                : "—"
            }
            sub="Conversion"
          />
        </div>
      )}

      {/* Daily chart */}
      <div className="rounded-xl border border-[#EAD8D8] bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#6B4226]">Events per day</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {dailyPivot.names.length <= 1 ? (
              <LineChart data={dailyPivot.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={dailyPivot.names[0] || "view_item"} strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={dailyPivot.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                {dailyPivot.names.map(n => (
                  <Bar key={n} dataKey={n} stackId="a" />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
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
                  <tr key={ev.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(ev.occurred_at).toLocaleString()}</td>
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
