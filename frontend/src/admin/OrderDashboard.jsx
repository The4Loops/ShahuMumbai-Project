// src/admin/OrderDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../supabase/axios.js";
import { toast } from "react-toastify";

const STATUS = ["All", "Pending", "Shipped", "Delivered"];
const CARRIERS = ["Other", "FedEx", "UPS", "USPS", "DHL", "BlueDart", "Delhivery"];

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

// ✅ Corrected axios PUT request
async function saveTracking(orderNumber, trackingNumber, carrier) {
  const response = await api.put(`/api/orders/${encodeURIComponent(orderNumber)}/tracking`, {
    trackingNumber,
    carrier: carrier || null,
  });
  return response.data; // expect { ok: true, order: {...} }
}

export default function OrderDashboard() {
  const [active, setActive] = useState("orders");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersLimit] = useState(50);
  const [ordersOffset, setOrdersOffset] = useState(0);

  // waitlist placeholders (not changed)
  const [wlQuery, setWlQuery] = useState("");
  const [waitlist, setWaitlist] = useState([]);
  const [wlTotal, setWlTotal] = useState(0);
  const [wlLoading, setWlLoading] = useState(true);
  const [wlPageSize] = useState(50);
  const [wlPage, setWlPage] = useState(1);

  const [savingRow, setSavingRow] = useState(null);
  const [drafts, setDrafts] = useState({});

  const setDraft = (orderNumber, patch) =>
    setDrafts((d) => ({ ...d, [orderNumber]: { ...(d[orderNumber] || {}), ...patch } }));

  const getDraft = (order) =>
    drafts[order.id] ?? {
      trackingNumber: order.tracking_number || "",
      carrier: order.carrier || "Other",
    };

  // ✅ FIXED - axios usage + response shape
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams({
        status: filter,
        q: query,
        limit: String(ordersLimit),
        offset: String(ordersOffset),
      });
      const response = await api.get(`/api/orders?${params.toString()}`);
      const data = response.data || {};

      setOrders(data.orders || []);
      setOrdersTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load orders");
      setOrders([]);
      setOrdersTotal(0);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Keep waitlist logic as placeholder
  const loadWaitlist = async () => {
    try {
      setWlLoading(true);
      const params = new URLSearchParams({
        search: wlQuery.trim(),
        page: String(wlPage),
        pageSize: String(wlPageSize),
      });
      const response = await api.get(`/api/allWaitListData?${params.toString()}`);
      const data = response.data || {};
      setWaitlist(data.items || []);
      setWlTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      setWaitlist([]);
      setWlTotal(0);
    } finally {
      setWlLoading(false);
    }
  };

  // ----- EFFECTS -----
  useEffect(() => {
    if (active === "orders") loadOrders();
  }, [active, filter, ordersOffset]);

  useEffect(() => {
    if (active !== "orders") return;
    const t = setTimeout(() => {
      setOrdersOffset(0);
      loadOrders();
    }, 300);
    return () => clearTimeout(t);
  }, [query, active]);

  useEffect(() => {
    if (active === "waitlist") loadWaitlist();
  }, [active, wlPage]);

  useEffect(() => {
    if (active !== "waitlist") return;
    const t = setTimeout(() => {
      setWlPage(1);
      loadWaitlist();
    }, 300);
    return () => clearTimeout(t);
  }, [wlQuery, active]);

  const ordersFiltered = useMemo(() => orders, [orders]);
  const wlPages = Math.max(1, Math.ceil(wlTotal / wlPageSize));

  // ---------- UI ----------
  return (
    <div className="font-serif">
      {/* Tabs */}
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

      {active === "orders" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-[#6B4226]">Recent Orders</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setOrdersOffset(0);
                }}
                className="rounded-md px-3 py-2 border border-[#E6DCD2] bg-white text-[#6B4226]"
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
                className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226]"
              />
            </div>
          </div>

          {ordersLoading && (
            <div className="p-3 text-sm text-[#6B4226]/70">Loading orders…</div>
          )}

          <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E6DCD2] bg-white">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-[#F1E7E5] text-[#6B4226]">
                  <th className="p-3 text-left">Order ID</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Tracking</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersFiltered.map((order) => {
                  const d = getDraft(order);
                  const disabled = savingRow === order.id;
                  return (
                    <tr key={order.id} className="border-t border-[#E6DCD2]">
                      <td className="p-3 text-[#6B4226]">{order.id}</td>
                      <td className="p-3 text-[#6B4226]">
                        {order.customer?.name}
                        <div className="text-xs text-[#6B4226]/70">
                          {order.customer?.email}
                        </div>
                      </td>
                      <td className="p-3 text-[#6B4226]">
                        <div className="flex items-center gap-2">
                          <input
                            value={d.trackingNumber}
                            onChange={(e) =>
                              setDraft(order.id, { trackingNumber: e.target.value })
                            }
                            placeholder="Tracking number"
                            className="rounded-md px-2 py-1 border border-[#E6DCD2] text-sm w-40"
                            disabled={disabled}
                          />
                          <select
                            value={d.carrier}
                            onChange={(e) => setDraft(order.id, { carrier: e.target.value })}
                            className="rounded-md px-2 py-1 border border-[#E6DCD2] text-sm"
                            disabled={disabled}
                          >
                            {CARRIERS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={async () => {
                              if (!d.trackingNumber.trim())
                                return alert("Enter a tracking number.");
                              try {
                                setSavingRow(order.id);
                                const { order: updated } = await saveTracking(
                                  order.id,
                                  d.trackingNumber.trim(),
                                  d.carrier
                                );
                                setOrders((list) =>
                                  list.map((o) =>
                                    o.id === order.id ? { ...o, ...updated, status: "Shipped" } : o
                                  )
                                );
                              } catch (e) {
                                console.error(e);
                                alert("Failed to save tracking.");
                              } finally {
                                setSavingRow(null);
                              }
                            }}
                            className="px-3 py-1.5 border rounded text-sm hover:bg-[#F5EFED] disabled:opacity-50"
                            disabled={disabled}
                          >
                            {disabled ? "Saving…" : "Save"}
                          </button>
                        </div>
                        <div className="text-xs text-[#6B4226]/70 mt-1">
                          Current: {order.tracking_number || "—"}
                          {order.carrier ? ` · ${order.carrier}` : ""}
                          {order.shipped_at
                            ? ` · ${new Date(order.shipped_at).toLocaleString()}`
                            : ""}
                        </div>
                      </td>
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
                  );
                })}
                {!ordersLoading && ordersFiltered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-sm text-[#6B4226]/70">
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
    </div>
  );
}
