// src/admin/OrderDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";

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

export default function OrderDashboard() {
  // which table to show
  const [active, setActive] = useState("orders"); // 'orders' | 'waitlist'

  // Orders state (your original)
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersLimit] = useState(50);
  const [ordersOffset, setOrdersOffset] = useState(0);

  // Waitlist state
  const [wlQuery, setWlQuery] = useState("");
  const [waitlist, setWaitlist] = useState([]);
  const [wlTotal, setWlTotal] = useState(0);
  const [wlLoading, setWlLoading] = useState(true);
  const [wlPageSize] = useState(50);
  const [wlPage, setWlPage] = useState(1);

  // ----- LOADERS -----
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams({
        status: filter,
        q: query,
        limit: String(ordersLimit),
        offset: String(ordersOffset),
      });
      const r = await fetch(`/api/orders?${params.toString()}`);
      const j = await r.json();
      setOrders(j.orders || []);
      setOrdersTotal(j.total || 0);
    } catch (e) {
      console.error(e);
      setOrders([]);
      setOrdersTotal(0);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadWaitlist = async () => {
    try {
      setWlLoading(true);
      const params = new URLSearchParams({
        search: wlQuery.trim(),
        page: String(wlPage),
        pageSize: String(wlPageSize),
      });
      const r = await fetch(`/api/admin/waitlist?${params.toString()}`);
      const j = await r.json();
      setWaitlist(j.items || []);
      setWlTotal(j.total || 0);
    } catch (e) {
      console.error(e);
      setWaitlist([]);
      setWlTotal(0);
    } finally {
      setWlLoading(false);
    }
  };

  // ----- EFFECTS -----
  // Load orders on active, filter, offset
  useEffect(() => {
    if (active !== "orders") return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, filter, ordersOffset]);

  // Debounce orders query
  useEffect(() => {
    if (active !== "orders") return;
    const t = setTimeout(() => {
      setOrdersOffset(0);
      loadOrders();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [query, active]);

  // Load waitlist on active, page
  useEffect(() => {
    if (active !== "waitlist") return;
    loadWaitlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wlPage]);

  // Debounce waitlist query
  useEffect(() => {
    if (active !== "waitlist") return;
    const t = setTimeout(() => {
      setWlPage(1);
      loadWaitlist();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [wlQuery, active]);

  // ----- MEMOS -----
  const ordersFiltered = useMemo(() => orders, [orders]);
  const wlPages = Math.max(1, Math.ceil(wlTotal / wlPageSize));

  // ----- UI -----
  return (
    <div className="font-serif">
      {/* Segment control */}
      <div className="mb-4">
        <div className="inline-flex rounded-full border border-[#E6DCD2] bg-white overflow-hidden">
          <button
            onClick={() => setActive("orders")}
            className={`px-4 py-2 text-sm transition ${
              active === "orders"
                ? "bg-[#F1E7E5] text-[#6B4226] font-semibold"
                : "text-[#6B4226] hover:bg-[#F5EFED]"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActive("waitlist")}
            className={`px-4 py-2 text-sm transition ${
              active === "waitlist"
                ? "bg-[#F1E7E5] text-[#6B4226] font-semibold"
                : "text-[#6B4226] hover:bg-[#F5EFED]"
            }`}
          >
            Waitlist
          </button>
        </div>
      </div>

      {/* HEAD CONTROLS */}
      {active === "orders" ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-[#6B4226]">Recent Orders</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setOrdersOffset(0);
              }}
              className="rounded-md px-3 py-2 border border-[#E6DCD2] bg-white text-[#6B4226] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
              aria-label="Filter by status"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOrdersOffset(0);
              }}
              placeholder="Search by ID or customer…"
              className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-[#6B4226]">Waitlist</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={wlQuery}
              onChange={(e) => setWlQuery(e.target.value)}
              placeholder="Search by email or product…"
              className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
            />
          </div>
        </div>
      )}

      {/* LOADING */}
      {active === "orders" && ordersLoading && (
        <div className="p-3 text-sm text-[#6B4226]/70">Loading orders…</div>
      )}
      {active === "waitlist" && wlLoading && (
        <div className="p-3 text-sm text-[#6B4226]/70">Loading waitlist…</div>
      )}

      {/* ========== ORDERS TABLE ========== */}
      {active === "orders" && (
        <>
          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {ordersFiltered.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border border-[#E6DCD2] bg-white"
              >
                <div>
                  <p className="font-semibold text-[#6B4226]">{order.id}</p>
                  <p className="text-sm text-[#6B4226]/70">{order.customer}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            ))}
            {!ordersLoading && ordersFiltered.length === 0 && (
              <p className="text-sm text-[#6B4226]/70">
                No orders match your filters.
              </p>
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
                {ordersFiltered.map((order) => (
                  <tr key={order.id} className="border-t border-[#E6DCD2]">
                    <td className="p-3 text-[#6B4226]">{order.id}</td>
                    <td className="p-3 text-[#6B4226]">{order.customer}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!ordersLoading && ordersFiltered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-3 text-sm text-[#6B4226]/70">
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          <div className="mt-3 flex items-center gap-3 text-sm text-[#6B4226]">
            <button
              onClick={() => setOrdersOffset(Math.max(ordersOffset - ordersLimit, 0))}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              disabled={ordersOffset === 0}
            >
              Prev
            </button>
            <button
              onClick={() => setOrdersOffset(ordersOffset + ordersLimit)}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              disabled={orders.length < ordersLimit}
            >
              Next
            </button>
            <span className="ml-auto">Total: {ordersTotal}</span>
          </div>
        </>
      )}

      {/* ========== WAITLIST TABLE ========== */}
      {active === "waitlist" && (
        <>
          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {waitlist.map((row) => (
              <div
                key={row.WaitlistId}
                className="flex items-center justify-between p-4 rounded-lg border border-[#E6DCD2] bg-white"
              >
                <div>
                  <p className="font-semibold text-[#6B4226]">{row.ProductName}</p>
                  <p className="text-sm text-[#6B4226]/70">
                    {row.UserEmail || "—"} &middot; #{row.ProductId}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1E7E5] text-[#6B4226] border border-[#E6DCD2]">
                  {row.NotifiedUtc ? "Confirmed" : "Pending"}
                </span>
              </div>
            ))}
            {!wlLoading && waitlist.length === 0 && (
              <p className="text-sm text-[#6B4226]/70">No waitlist entries.</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E6DCD2] bg-white">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-[#F1E7E5] text-[#6B4226]">
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">User Email</th>
                  <th className="p-3 text-left">Created (UTC)</th>
                  <th className="p-3 text-left">Notified</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((row) => (
                  <tr key={row.WaitlistId} className="border-t border-[#E6DCD2]">
                    <td className="p-3 text-[#6B4226]">
                      <div className="font-medium">{row.ProductName}</div>
                      <div className="text-xs text-[#6B4226]/70">#{row.ProductId}</div>
                    </td>
                    <td className="p-3 text-[#6B4226]">{row.UserEmail || "—"}</td>
                    <td className="p-3 text-[#6B4226]">
                      {row.CreatedUtc ? new Date(row.CreatedUtc).toLocaleString() : "—"}
                    </td>
                    <td className="p-3 text-[#6B4226]">
                      {row.NotifiedUtc ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
                {!wlLoading && waitlist.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-sm text-[#6B4226]/70">
                      No waitlist entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          <div className="mt-3 flex items-center gap-3 text-sm text-[#6B4226]">
            <button
              onClick={() => setWlPage(Math.max(wlPage - 1, 1))}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              disabled={wlPage <= 1}
            >
              Prev
            </button>
            <span>
              Page {wlPage} / {wlPages}
            </span>
            <button
              onClick={() => setWlPage(Math.min(wlPage + 1, wlPages))}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              disabled={wlPage >= wlPages}
            >
              Next
            </button>
            <span className="ml-auto">Total: {wlTotal}</span>
          </div>
        </>
      )}
    </div>
  );
}
