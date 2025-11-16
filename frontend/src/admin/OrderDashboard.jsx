// src/admin/OrderDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../supabase/axios.js";
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";
import { set } from "date-fns";
const STATUS = ["All", "Pending", "Shipped", "Delivered"];
const CARRIERS = ["Other", "FedEx", "UPS", "USPS", "DHL", "BlueDart", "Delhivery"];

function normalizeOrder(row, idx = 0) {
  // id (robust fallbacks)
  const id =
    row?.id ??
    row?.OrderNumber ??
    row?.order_id ??
    (row?.OrderId ? String(row.OrderId) : undefined) ??
    (row?.invoice ?? row?.number) ??                // extra safety
    `ROW-${idx}`;                                   // last resort

  // customer string
  const customerStr =
    typeof row?.customer === "string"
      ? row.customer
      : row?.customer?.name || row?.CustomerName || row?.CustomerEmail || "Guest";

  // status in TitleCase for badge
  const rawStatus = row?.status ?? row?.FulFillmentStatus ?? "pending";
  const status = rawStatus ? rawStatus.replace(/^\w/, (c) => c.toUpperCase()) : "Pending";

  // dates
  const placed_at = row?.placed_at ?? row?.occurred_at ?? row?.PlacedAt ?? null;
  const shipped_at = row?.ShippedAt ?? row?.shipped_at ?? null;
  const delivered_at = row?.DeliveredAt ?? row?.delivered_at ?? null;

  // money
  const subtotal = row?.SubTotal ?? row?.subtotal ?? row?.total ?? 0;

  return {
    id,
    customer: customerStr,
    status,
    placed_at,
    shipped_at,
    delivered_at,
    subtotal,
    shipping: row?.ShippingTotal ?? 0,
    tax: row?.TaxTotal ?? 0,
    currency: row?.Currency ?? "INR",
    TrackingNumber: row?.TrackingNumber ?? null,
    Carrier: row?.Carrier ?? null,
    items: row?.items ?? [],
  };
}


// Helper to ignore intentional cancellations from AbortController/Axios
function isCanceled(e) {
  return e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.message === "canceled";
}

export default function OrderDashboard() {
  const [active, setActive] = useState("orders");
  const { setLoading } = useLoading();
  // === ORDERS ===
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLimit] = useState(50);
  const [ordersOffset, setOrdersOffset] = useState(0);

  // === WAITLIST ===
  const [wlQuery, setWlQuery] = useState("");
  const [waitlist, setWaitlist] = useState([]);
  const [wlTotal, setWlTotal] = useState(0);
  const [wlPageSize] = useState(50);
  const [wlPage, setWlPage] = useState(1);

  // === TRACKING DRAFTS ===
  const [drafts, setDrafts] = useState({});
  const [savingRow, setSavingRow] = useState(null);

  // === DEBUG ===
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastOrdersURL, setLastOrdersURL] = useState("");
  const [lastResponseStatus, setLastResponseStatus] = useState(null);

  // === ABORT CONTROLLERS ===
  const ordersAbortRef = useRef(null);
  const waitlistAbortRef = useRef(null);

  // === DRAFT HELPERS ===
  const setDraft = (orderId, patch) =>
    setDrafts((d) => ({ ...d, [orderId]: { ...(d[orderId] || {}), ...patch } }));

  const getDraft = (order) =>
    drafts[order.id] ?? {
      trackingNumber: order.TrackingNumber || "",
      carrier: order.Carrier || "Other",
    };

  // === SAVE TRACKING ===
  const saveTracking = async (orderNumber, trackingNumber, carrier) => {
    setLoading(true);
    let res;
    try{
      res = await api.put(`/api/orders/${encodeURIComponent(orderNumber)}/tracking`, {
      trackingNumber,
      carrier: carrier === "Other" ? null : carrier,
    });
    if (!res?.data?.ok) throw new Error(res?.data?.error || "Failed");
    }catch(err){
      toast.error(err?.response?.data?.message || 'Failed to save tracking');
    }finally{
      setLoading(false);
    }
    return res.data.order;
  };

  // === LOAD ORDERS (ONE CALL) ===
  const loadOrders = async () => {
    // cancel prior in-flight request
    if (ordersAbortRef.current) ordersAbortRef.current.abort();
    const controller = new AbortController();
    ordersAbortRef.current = controller;

    const params = new URLSearchParams();
    if (filter && filter !== "All") params.set("status", filter);
    if (query) params.set("q", query);
    params.set("limit", String(ordersLimit));
    params.set("offset", String(ordersOffset));

    const url = `/api/orders/listOrders?${params.toString()}`;

    try {
      setLoading(true);
      setLastOrdersURL(`${api.defaults.baseURL?.replace(/\/$/, "")}${url}`);

      const res = await api.get(url, { signal: controller.signal });
      setLastResponseStatus(res.status);

      const rawOrders = res?.data?.orders ?? [];
      const mapped = rawOrders.map((r, i) => normalizeOrder(r, i));
      const total = (typeof res?.data?.total === "number") ? res.data.total : mapped.length;

      setOrders(mapped);
      setOrdersTotal(total);
    } catch (e) {
      if (isCanceled(e)) return; // ✅ ignore cancellations
      console.error("[Orders] ERROR", e);
      toast.error(e?.response?.data?.error || e?.message || "Failed to load orders");
      setOrders([]);
      setOrdersTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // === LOAD WAITLIST (ONE CALL) ===
  const loadWaitlist = async () => {
    // cancel prior in-flight request
    if (waitlistAbortRef.current) waitlistAbortRef.current.abort();
    const controller = new AbortController();
    waitlistAbortRef.current = controller;

    const params = new URLSearchParams({
      search: wlQuery.trim(),
      page: String(wlPage),
      pageSize: String(wlPageSize),
    });

    const url = `/api/allWaitListData?${params.toString()}`;

    try {
      setLoading(true);
      const res = await api.get(url, { signal: controller.signal });
      const { items = [], total = 0 } = res.data || {};
      setWaitlist(items);
      setWlTotal(total);
    } catch (e) {
      if (isCanceled(e)) return; // ✅ ignore cancellations
      console.error("[Waitlist] ERROR", e);
      toast.error("Failed to load waitlist");
      setWaitlist([]);
      setWlTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // === EFFECTS ===
  // Debounced orders loader (prevents spam while typing)
  useEffect(() => {
    if (active !== "orders") return;
    const t = setTimeout(() => {
      loadOrders();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, filter, query, ordersOffset]);

  // Debounced waitlist loader
  useEffect(() => {
    if (active !== "waitlist") return;
    const t = setTimeout(() => {
      loadWaitlist();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wlQuery, wlPage]);

  // Cleanup pending requests on unmount or tab switch
  useEffect(() => {
    return () => {
      if (ordersAbortRef.current) ordersAbortRef.current.abort();
      if (waitlistAbortRef.current) waitlistAbortRef.current.abort();
    };
  }, []);

  // === PAGINATION ===
  const wlPages = Math.max(1, Math.ceil(wlTotal / wlPageSize));

  return (
    <div className="font-serif">
      {/* TABS */}
      <div className="mb-4 flex items-center gap-3">
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
        {/* <button
          className="ml-auto px-2 py-1 border rounded text-[#6B4226]/80 text-xs"
          onClick={() => setDebugOpen((v) => !v)}
        >
          {debugOpen ? "Hide Debug" : "Show Debug"}
        </button> */}
      </div>

      {/* DEBUG PANEL */}
      {debugOpen && (
        <div className="mb-4 p-3 bg-[#F9F6F5] border border-[#E6DCD2] rounded text-xs">
          <div>URL: <code>{lastOrdersURL}</code></div>
          <div>Status: <b>{lastResponseStatus || "—"}</b></div>
          <div>Orders: {orders.length} / {ordersTotal}</div>
          <button
            onClick={loadOrders}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Reload Orders
          </button>
        </div>
      )}
      {active === "orders" && debugOpen && orders.length > 0 && (
        <div className="mb-2 text-xs text-[#6B4226]">
          <div><b>Preview IDs:</b> {orders.slice(0,5).map(o => o.id).join(", ")}</div>
          <div><b>First row:</b> <code>{JSON.stringify(orders[0])}</code></div>
        </div>
      )}

      {/* <div className="mb-3 p-2 text-xs border rounded bg-[#FFF9F6] text-[#6B4226]">
        <div><b>orders.length:</b> {orders.length}</div>
        {orders.length > 0 && (
          <>
            <div><b>first.id:</b> {String(orders[0].id)}</div>
            <div><b>first.customer:</b> {typeof orders[0].customer === "string" ? orders[0].customer : (orders[0].customer?.name || orders[0].customer?.email || "Guest")}</div>
            <div><b>first.status:</b> {orders[0].status}</div>
            <div><b>first.placed_at:</b> {String(orders[0].placed_at || "—")}</div>
          </>
        )}
      </div> */}
      {/* === ORDERS === */}
      {active === "orders" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-[#6B4226]">Recent Orders</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setOrdersOffset(0);
                }}
                className="rounded-md px-3 py-2 border border-[#E6DCD2] bg-white text-[#6B4226]"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID or name…"
                className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226]"
              />
            </div>
          </div>

          {/* Desktop Table */}
          {/* Desktop Table (md and up) */}
<div className="hidden md:block overflow-x-auto rounded-lg border border-[#E6DCD2] bg-white">
  <table className="w-full table-auto">
    <thead>
      <tr className="bg-[#F1E7E5] text-[#6B4226]">
        <th className="p-3 text-left">Order ID</th>
        <th className="p-3 text-left">Customer</th>
        <th className="p-3 text-left">Tracking / Carrier</th>
        <th className="p-3 text-center">Status</th>
      </tr>
    </thead>
    <tbody>
      {orders.map((order) => {
        const d = getDraft(order);
        const disabled = savingRow === order.id;
        return (
          <tr key={order.id} className="border-t border-[#E6DCD2]">
            <td className="p-3 text-[#6B4226]">{order.id}</td>
            <td className="p-3 text-[#6B4226]">
              {typeof order.customer === "string"
                ? order.customer
                : (order.customer?.name || order.customer?.email || "Guest")}
            </td>
            <td className="p-3 text-[#6B4226]">
              <div className="flex items-center gap-2">
                <input
                  value={d.trackingNumber}
                  onChange={(e) => setDraft(order.id, { trackingNumber: e.target.value })}
                  placeholder="Tracking"
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
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!d.trackingNumber.trim()) return toast.error("Enter tracking number");
                    try {
                      setSavingRow(order.id);
                      const updated = await saveTracking(order.id, d.trackingNumber.trim(), d.carrier);
                      setOrders((list) =>
                        list.map((o) =>
                          o.id === order.id
                            ? {
                                ...o,
                                TrackingNumber: updated.TrackingNumber,
                                Carrier: updated.Carrier,
                                ShippedAt: updated.ShippedAt,
                                status: updated.FulFillmentStatus
                                  ? updated.FulFillmentStatus.charAt(0).toUpperCase() +
                                    updated.FulFillmentStatus.slice(1)
                                  : o.status,
                              }
                            : o
                        )
                      );
                      toast.success("Tracking saved");
                    } catch (e) {
                      if (!isCanceled(e)) toast.error("Failed to save");
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
            </td>
            <td className="p-3 text-center">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  order.status === "Delivered"
                    ? "bg-emerald-100 text-emerald-700"
                    : order.status === "Shipped"
                    ? "bg-[#F3DEDE] text-[#6B4226]"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {order.status}
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>


{/* Mobile Cards (only visible below md) */}
<div className="grid grid-cols-1 gap-3 md:hidden">
  {orders.map((order) => {
    return (
      <div key={order.id} className="p-4 rounded-lg border border-[#E6DCD2] bg-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-[#6B4226]">{order.id}</p>
            <p className="text-sm text-[#6B4226]/70">
              {typeof order.customer === "string"
                ? order.customer
                : (order.customer?.name || order.customer?.email || "Guest")}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              order.status === "Delivered"
                ? "bg-emerald-100 text-emerald-700"
                : order.status === "Shipped"
                ? "bg-[#F3DEDE] text-[#6B4226]"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>
    );
  })}
</div>


          {/* Pagination */}
          <div className="mt-4 flex items-center gap-3 text-sm text-[#6B4226]">
            <button
              onClick={() => setOrdersOffset(Math.max(0, ordersOffset - ordersLimit))}
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

      {/* === WAITLIST === */}
      {active === "waitlist" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-[#6B4226]">Waitlist</h2>
            <input
              type="text"
              value={wlQuery}
              onChange={(e) => setWlQuery(e.target.value)}
              placeholder="Search by email or product…"
              className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226]"
            />
          </div>

          <div className="block overflow-x-auto rounded-lg border border-[#E6DCD2] bg-white">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#F1E7E5] text-[#6B4226]">
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Notified</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((row) => (
                  <tr key={row.WaitlistId || `${row.UserEmail}-${row.ProductId}`} className="border-t">
                    <td className="p-3 text-[#6B4226]">
                      <div className="font-medium">{row.ProductName || "—"}</div>
                      <div className="text-xs text-[#6B4226]/70">#{row.ProductId}</div>
                    </td>
                    <td className="p-3 text-[#6B4226]">{row.UserEmail || "—"}</td>
                    <td className="p-3 text-[#6B4226]">
                      {row.CreatedUtc ? new Date(row.CreatedUtc).toLocaleString() : "—"}
                    </td>
                    <td className="p-3 text-[#6B4226]">{row.NotifiedUtc ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {waitlist.map((row) => (
              <div key={row.WaitlistId || `${row.UserEmail}-${row.ProductId}`} className="p-4 rounded-lg border border-[#E6DCD2] bg-white">
                <div className="font-medium text-[#6B4226]">{row.ProductName || "—"}</div>
                <div className="text-sm text-[#6B4226]/70">{row.UserEmail} · #{row.ProductId}</div>
                <div className="text-xs mt-1">
                  <span className="px-2 py-0.5 rounded-full border bg-[#F1E7E5] text-[#6B4226]">
                    {row.NotifiedUtc ? "Notified" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Pagination */}
          <div className="mt-4 flex items-center gap-3 text-sm text-[#6B4226]">
            <button
              onClick={() => setWlPage(Math.max(1, wlPage - 1))}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              disabled={wlPage <= 1}
            >
              Prev
            </button>
            <span>Page {wlPage} / {wlPages}</span>
            <button
              onClick={() => setWlPage(Math.min(wlPages, wlPage + 1))}
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
