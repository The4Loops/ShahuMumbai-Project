// src/admin/OrderDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";

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

/** ========= AUTH-AWARE FETCH HELPERS =========
 * - If you use JWT in local/session storage, this adds Authorization header.
 * - If you use cookie/session auth, keep credentials: 'include'.
 *   (If you use ONLY JWT and no cookies, you can delete the credentials line.)
 */
function authHeaders() {
  const token =
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function authFetch(url, opts = {}) {
  return fetch(url, {
    credentials: "include", // <-- keep for cookie/session auth; remove if pure JWT and no cookies
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(opts.headers || {}),
    },
    ...opts,
  });
}

// Calls the backend to save tracking
async function saveTracking(orderNumber, trackingNumber, carrier) {
  const r = await authFetch(`/api/orders/${encodeURIComponent(orderNumber)}/tracking`, {
    method: "PUT",
    body: JSON.stringify({ trackingNumber, carrier: carrier || null }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to save tracking");
  return r.json(); // { ok: true, order: {...} }
}

export default function OrderDashboard() {
  // which table to show
  const [active, setActive] = useState("orders"); // 'orders' | 'waitlist'

  // Orders state
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

  // Tracking edit state
  const [savingRow, setSavingRow] = useState(null); // orderNumber currently saving
  const [drafts, setDrafts] = useState({}); // { [orderNumber]: { trackingNumber, carrier } }

  const setDraft = (orderNumber, patch) =>
    setDrafts((d) => ({ ...d, [orderNumber]: { ...(d[orderNumber] || {}), ...patch } }));

  const getDraft = (order) =>
    drafts[order.id] ?? {
      trackingNumber: order.TrackingNumber || "",
      carrier: order.Carrier || "Other",
    };

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
      const r = await authFetch(`/api/orders?${params.toString()}`);
      if (!r.ok) {
        // Helpful console to see why (401, 403, etc.)
        console.error("Orders load failed:", r.status, r.statusText);
        setOrders([]);
        setOrdersTotal(0);
        return;
      }
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
      const r = await authFetch(`/api/admin/waitlist?${params.toString()}`);
      if (!r.ok) {
        console.error("Waitlist load failed:", r.status, r.statusText);
        setWaitlist([]);
        setWlTotal(0);
        return;
      }
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
  useEffect(() => {
    if (active !== "orders") return;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, filter, ordersOffset]);

  useEffect(() => {
    if (active !== "orders") return;
    const t = setTimeout(() => {
      setOrdersOffset(0);
      loadOrders();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [query, active]);

  useEffect(() => {
    if (active !== "waitlist") return;
    loadWaitlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wlPage]);

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
                className="p-4 rounded-lg border border-[#E6DCD2] bg-white space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#6B4226]">{order.id}</p>
                    <p className="text-sm text-[#6B4226]/70">{order.customer}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Tracking (mobile) */}
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-[#6B4226]/70">
                    Tracking: {order.TrackingNumber || "—"}
                    {order.Carrier ? ` · ${order.Carrier}` : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={getDraft(order).trackingNumber}
                      onChange={(e) =>
                        setDraft(order.id, { trackingNumber: e.target.value })
                      }
                      placeholder="Tracking number"
                      className="rounded-md px-2 py-1 border border-[#E6DCD2] text-xs"
                      disabled={savingRow === order.id}
                    />
                    <select
                      value={getDraft(order).carrier}
                      onChange={(e) => setDraft(order.id, { carrier: e.target.value })}
                      className="rounded-md px-2 py-1 border border-[#E6DCD2] text-xs"
                      disabled={savingRow === order.id}
                    >
                      {CARRIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        const d = getDraft(order);
                        if (!d.trackingNumber.trim()) return alert("Enter a tracking number.");
                        try {
                          setSavingRow(order.id);
                          const { order: updated } = await saveTracking(
                            order.id,
                            d.trackingNumber.trim(),
                            d.carrier
                          );
                          setOrders((list) =>
                            list.map((o) => (o.id === order.id ? { ...o, ...updated, status: "Shipped" } : o))
                          );
                        } catch (e) {
                          console.error(e);
                          alert("Failed to save tracking.");
                        } finally {
                          setSavingRow(null);
                        }
                      }}
                      className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                      disabled={savingRow === order.id}
                    >
                      {savingRow === order.id ? "…" : "Save"}
                    </button>
                  </div>
                </div>
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
                      <td className="p-3 text-[#6B4226]">{order.customer}</td>
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
                            aria-label="Carrier"
                          >
                            {CARRIERS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={async () => {
                              if (!d.trackingNumber.trim()) return alert("Enter a tracking number.");
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
                          Current: {order.TrackingNumber || "—"}
                          {order.Carrier ? ` · ${order.Carrier}` : ""}
                          {order.ShippedAt ? ` · ${new Date(order.ShippedAt).toLocaleString()}` : ""}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
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
