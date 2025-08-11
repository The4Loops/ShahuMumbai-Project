import React, { useMemo, useState } from "react";

const STATUS = ["All", "Pending", "Shipped", "Delivered"];

const statusBadge = (s) => {
  switch (s) {
    case "Delivered":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Shipped":
      return "bg-[#F3DEDE] text-[#6B4226] border border-[#E6DCD2]";
    default:
      return "bg-rose-100 text-rose-700 border border-rose-200";
  }
};

const OrderDashboard = () => {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const orders = [
    { id: "ORD123", customer: "Riya",  status: "Pending"   },
    { id: "ORD124", customer: "Aarav", status: "Shipped"   },
    { id: "ORD125", customer: "Kunal", status: "Delivered" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = filter === "All" || o.status === filter;
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, filter, query]);

  return (
    <div className="font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-[#6B4226]">Recent Orders</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md px-3 py-2 border border-[#E6DCD2] bg-white text-[#6B4226] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
            aria-label="Filter by status"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID or customer…"
            className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 rounded-lg border border-[#E6DCD2] bg-white"
          >
            <div>
              <p className="font-semibold text-[#6B4226]">{order.id}</p>
              <p className="text-sm text-[#6B4226]/70">{order.customer}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[#6B4226]/70">No orders match your filters.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E6DCD2] bg-white">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-[#F1E7E5] text-[#6B4226]">
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-t border-[#E6DCD2]">
                <td className="p-3 text-[#6B4226]">{order.id}</td>
                <td className="p-3 text-[#6B4226]">{order.customer}</td>
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-sm text-[#6B4226]/70">
                  No orders match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDashboard;
