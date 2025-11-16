import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "../supabase/axios";
import { useLoading } from "../context/LoadingContext";

const ThemedTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E6DCD2] bg-white px-3 py-2 text-sm shadow">
      <p className="font-medium text-[#6B4226]">{label}</p>
      <p className="text-[#6B4226]/80">
        Sales: <span className="font-semibold text-[#6B4226]">{payload[0].value}</span>
      </p>
    </div>
  );
};

const SalesReport = () => {
  const [summary, setSummary] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const { setLoading } = useLoading();
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get("/api/analytics/sales-report");
        if (!alive) return;
        setSummary(Array.isArray(data?.summary) ? data.summary : []);
        setTopProducts(Array.isArray(data?.topProducts) ? data.topProducts : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.error || e.message || "Failed to load sales report");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="flex flex-col gap-10 font-serif">
      {/* Chart */}
      <div className="bg-white rounded-xl border border-[#E6DCD2] shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#6B4226]">Sales Overview</h2>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summary} barSize={42}>
            <CartesianGrid stroke="#F1E7E5" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6B4226", fontSize: 12 }}
              axisLine={{ stroke: "#E6DCD2" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6B4226", fontSize: 12 }}
              axisLine={{ stroke: "#E6DCD2" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ThemedTooltip />} cursor={{ fill: "rgba(212,165,165,0.15)" }} />
            <Bar dataKey="sales" fill="#D4A5A5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Sellers */}
      <div>
        <h2 className="text-xl font-bold text-[#6B4226] mb-6">Top Selling Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {topProducts.length === 0 && !err && (
            <div className="text-sm text-gray-500">No data</div>
          )}
          {topProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#E6DCD2] rounded-xl shadow-sm overflow-hidden hover:shadow transition"
            >
              <img
                src={
                  product.image
                }
                alt={product.name}
                className="w-full h-44 object-cover"
                onError={(e) => {
                  e.currentTarget.src = `${process.env.PUBLIC_URL || ""}`;
                }}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#6B4226]">
                  {product.name}
                </h3>
                <p className="text-sm text-[#6B4226]/70 mt-1">
                  <span className="inline-block rounded-full border border-[#E6DCD2] bg-[#F7F0EE] px-2 py-0.5 text-[#6B4226]">
                    {product.sales} sold
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
