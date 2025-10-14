// src/admin/OrderDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../supabase/axios.js";
import { toast } from "react-toastify";

const STATUS = ["All", "Pending", "Shipped", "Delivered"];
const CARRIERS = ["Other", "FedEx", "UPS", "USPS", "DHL", "BlueDart", "Delhivery"];

// Flip this to true ONLY if your backend uses page/pageSize instead of limit/offset
const USE_PAGE_PARAMS = false;

// Hard timeout for any request from this component (ms)
const REQUEST_TIMEOUT_MS = 15000;

const statusBadge = (s) => {
  switch ((s || "").toLowerCase()) {
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "shipped":
      return "bg-[#F3DEDE] text-[#6B4226] border border-[#E6DCD2]";
    default:
      return "bg-rose-100 text-rose-700 border border-rose-200";
  }
};

// PUT /api/orders/:orderNumber/tracking
async function saveTracking(orderNumber, trackingNumber, carrier) {
  const res = await api.put(`/api/orders/${encodeURIComponent(orderNumber)}/tracking`, {
    trackingNumber,
    carrier: carrier || null,
  });
  if (!res?.data?.ok) throw new Error(res?.data?.error || "Failed to save tracking");
  return res.data.order;
}

// Try first URL then fall back (for waitlist)
async function getWithFallback(urls, signal) {
  let lastErr;
  for (const u of urls) {
    try {
      const r = await api.get(u, { signal });
      return r.data || {};
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Failed to fetch");
}

export default function OrderDashboard() {
  const [active, setActive] = useState("orders");

  // Orders state
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLimit] = useState(50);
  const [ordersOffset, setOrdersOffset] = useState(0);

  // Waitlist state
  const [wlQuery, setWlQuery] = useState("");
  const [waitlist, setWaitlist] = useState([]);
  const [wlTotal, setWlTotal] = useState(0);
  const [wlLoading, setWlLoading] = useState(false);
  const [wlPageSize] = useState(50);
  const [wlPage, setWlPage] = useState(1);

  // Tracking edit
  const [savingRow, setSavingRow] = useState(null);
  const [drafts, setDrafts] = useState({}); // { [orderId]: { trackingNumber, carrier } }

  // Debug
  const [debugOpen, setDebugOpen] = useState(false);
  const [lastOrdersPayload, setLastOrdersPayload] = useState(null);
  const [lastOrdersError, setLastOrdersError] = useState(null);
  const [lastOrdersURL, setLastOrdersURL] = useState(null);
  const [lastResponseStatus, setLastResponseStatus] = useState(null);

  // Aborts
  const ordersAbortRef = useRef(null);
  const waitlistAbortRef = useRef(null);

  const setDraft = (orderId, patch) =>
    setDrafts((d) => ({ ...d, [orderId]: { ...(d[orderId] || {}), ...patch } }));

  const getDraft = (order) =>
    drafts[order.id] ?? {
      trackingNumber: order.TrackingNumber || "",
      carrier: order.Carrier || "Other",
    };

  // --- Helpers ---
  const buildOrdersQuery = () => {
    const params = new URLSearchParams();
    if (filter && filter !== "All") params.set("status", filter);
    if (query) params.set("q", query);

    if (USE_PAGE_PARAMS) {
      const page = Math.floor(ordersOffset / ordersLimit) + 1;
      params.set("page", String(page));
      params.set("pageSize", String(ordersLimit));
    } else {
      params.set("limit", String(ordersLimit));
      params.set("offset", String(ordersOffset));
    }
    return params;
  };

  const normalizeOrders = (payload) => {
    const list =
      payload?.orders ??
      payload?.data ??
      payload?.items ??
      (Array.isArray(payload) ? payload : []) ??
      [];

    const total =
      payload?.total ??
      payload?.count ??
      (Array.isArray(payload) ? payload.length : 0);

    const normalized = list.map((o) => {
      const id =
        o.id ??
        o.ID ??
        o.orderId ??
        o.OrderId ??
        o.OrderID ??
        o.OrderNumber ??
        o.number;

      const rawStatus =
        o.status ??
        o.Status ??
        o.fulfillmentStatus ??
        o.FulfillmentStatus ??
        "Pending";

      const status =
        typeof rawStatus === "string"
          ? rawStatus.replace(/^\w/, (c) => c.toUpperCase())
          : rawStatus;

      const customer =
        o.customer ??
        o.Customer ??
        o.customerName ??
        o.CustomerName ??
        {
          name:
            [o.firstName || o.FirstName, o.lastName || o.LastName]
              .filter(Boolean)
              .join(" ") || "Guest",
        };

      return {
        ...o,
        id,
        status,
        customer,
        TrackingNumber: o.TrackingNumber ?? o.trackingNumber ?? o.tracking ?? "",
        Carrier: o.Carrier ?? o.carrier ?? "",
        ShippedAt: o.ShippedAt ?? o.shippedAt ?? o.shipped_at ?? null,
      };
    });

    return { normalized, total: Number.isFinite(total) ? total : normalized.length };
  };

  const runWithTimeout = (promise, ms, controller) =>
    Promise.race([
      promise,
      new Promise((_, reject) => {
        const t = setTimeout(() => {
          controller?.abort?.();
          reject(new Error(`Request timed out after ${ms}ms`));
        }, ms);
        // clear the timer when resolved/rejected
        promise.finally(() => clearTimeout(t));
      }),
    ]);

  // ---- Load Orders (VISIBLE + GUARANTEED) ----
 const loadOrders = async () => {
  // helpers
  const normalize = (payload) => {
    const list =
      payload?.orders ??
      payload?.data ??
      payload?.items ??
      (Array.isArray(payload) ? payload : []) ??
      [];
    const total =
      payload?.total ??
      payload?.count ??
      (Array.isArray(payload) ? payload.length : 0);

    const normalized = list.map((o) => {
      const id =
        o.id ?? o.ID ?? o.orderId ?? o.OrderId ?? o.OrderID ?? o.OrderNumber ?? o.number;
      const rawStatus =
        o.status ?? o.Status ?? o.fulfillmentStatus ?? o.FulfillmentStatus ?? "Pending";
      const status =
        typeof rawStatus === "string" ? rawStatus.replace(/^\w/, (c) => c.toUpperCase()) : rawStatus;
      const customer =
        o.customer ??
        o.Customer ??
        o.customerName ??
        o.CustomerName ??
        {
          name:
            [o.firstName || o.FirstName, o.lastName || o.LastName]
              .filter(Boolean)
              .join(" ") || "Guest",
        };
      return {
        ...o,
        id,
        status,
        customer,
        TrackingNumber: o.TrackingNumber ?? o.trackingNumber ?? o.tracking ?? "",
        Carrier: o.Carrier ?? o.carrier ?? "",
        ShippedAt: o.ShippedAt ?? o.shippedAt ?? o.shipped_at ?? null,
      };
    });

    return { list: normalized, total: Number.isFinite(total) ? total : normalized.length };
  };

  const buildVariants = () => {
    const endpoints = [
      "/api/admin/orders",
      "/api/orders",
      "/api/orders/list",
    ];
    const statusVariants = [
      // Omit status when filter === "All" so we don't over-filter
      ...(filter && filter !== "All" ? [{ status: filter }] : [{}]),
      ...(filter ? [{ status: "All" }, { status: "all" }] : []),
      {}, // also try with no status param at all
    ];

    const page = Math.floor(ordersOffset / ordersLimit) + 1;

    const paramVariants = [
      { limit: ordersLimit, offset: ordersOffset },
      { page, pageSize: ordersLimit },
    ];

    const queries = [];
    for (const ep of endpoints) {
      for (const sv of statusVariants) {
        for (const pv of paramVariants) {
          const p = new URLSearchParams();
          if (query) p.set("q", query);
          if (sv.status !== undefined) p.set("status", sv.status);
          for (const [k, v] of Object.entries(pv)) p.set(k, String(v));
          queries.push(`${ep}?${p.toString()}`);
        }
      }
    }
    return [...new Set(queries)]; // dedupe
  };

  try {
    setOrdersLoading(true);
    setLastOrdersError(null);

    const variants = buildVariants();
    let success = null;

    for (const url of variants) {
      try {
        setLastOrdersURL(`${api.defaults.baseURL?.replace(/\/$/, "")}${url}`);
        console.log("[Orders] TRY", url, "baseURL:", api.defaults.baseURL);
        const res = await api.get(url);
        setLastResponseStatus(res?.status ?? null);
        const { list, total } = normalize(res?.data);

        // if non-empty, use it and stop
        if (list.length > 0 || (typeof total === "number" && total > 0)) {
          success = { url, list, total, raw: res.data };
          break;
        }
        // keep the last payload for debugging
        setLastOrdersPayload(res?.data ?? null);
      } catch (e) {
        // try the next variant
        console.warn("[Orders] variant failed:", url, e?.response?.status || e.message);
      }
    }

    if (success) {
      setOrders(success.list);
      setOrdersTotal(success.total);
      setLastOrdersPayload(success.raw);
      toast.dismiss();
      toast.success(`Loaded orders from: ${success.url}`);
      console.log("[Orders] SUCCESS via", success.url);
    } else {
      // nothing worked or all were empty
      setOrders([]);
      setOrdersTotal(0);
      toast.dismiss();
      toast.info("No orders returned from any known endpoint.");
      console.warn("[Orders] All variants empty. Check endpoint/role/tenant.");
    }
  } catch (e) {
    console.error("[Orders] ERROR", e);
    setLastOrdersError({
      status: e.response?.status,
      data: e.response?.data,
      message: e.message,
    });
    const msg =
      e.response?.data?.error ||
      e.response?.data?.message ||
      e.message ||
      "Failed to load orders";
    toast.error(msg);
    setOrders([]);
    setOrdersTotal(0);
  } finally {
    setOrdersLoading(false);
  }
};


  // ---- Load Waitlist ----
  const loadWaitlist = async () => {
    if (waitlistAbortRef.current) waitlistAbortRef.current.abort();
    const controller = new AbortController();
    waitlistAbortRef.current = controller;

    const qs = new URLSearchParams({
      search: wlQuery.trim(),
      page: String(wlPage),
      pageSize: String(wlPageSize),
    }).toString();

    try {
      setWlLoading(true);
      const data = await runWithTimeout(
        getWithFallback(
          [`/api/admin/waitlist?${qs}`, `/api/allWaitListData?${qs}`],
          controller.signal
        ),
        REQUEST_TIMEOUT_MS,
        controller
      );

      setWaitlist(data.items || []);
      setWlTotal(data.total || 0);
    } catch (e) {
      console.error("[Waitlist] ERROR", e);
      toast.error("Failed to load waitlist");
      setWaitlist([]);
      setWlTotal(0);
    } finally {
      setWlLoading(false);
    }
  };

  // Effects — GUARANTEE first load on mount
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effects — Orders
  useEffect(() => {
    if (active === "orders") loadOrders();
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

  // Effects — Waitlist
  useEffect(() => {
    if (active === "waitlist") loadWaitlist();
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

  const ordersFiltered = useMemo(() => orders, [orders]);
  const wlPages = Math.max(1, Math.ceil(wlTotal / wlPageSize));

  return (
    <div className="font-serif">
      {/* Tabs + Debug toggler */}
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

        <div className="ml-auto text-xs">
          <button
            className="px-2 py-1 border rounded text-[#6B4226]/80"
            onClick={() => setDebugOpen((v) => !v)}
          >
            {debugOpen ? "Hide Debug" : "Show Debug"}
          </button>
        </div>
      </div>

      {/* Connection Debug */}
      {debugOpen && (
        <div className="mb-3 text-xs bg-[#F9F6F5] border border-[#E6DCD2] p-3 rounded overflow-x-auto">
          <div>API baseURL: <b>{String(api.defaults.baseURL || "")}</b></div>
          <div>Orders URL: <b>{String(lastOrdersURL || "")}</b></div>
          <div>Last response status: <b>{String(lastResponseStatus ?? "—")}</b></div>
          <div>Orders fetched: <b>{orders?.length ?? 0}</b> (total: {ordersTotal})</div>

          <div className="mt-2 flex gap-2">
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                setOrdersOffset(0);
                loadOrders();
              }}
            >
              Reload Orders
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={async () => {
                // Minimal smoke test—same query but force limit=1
                const params = new URLSearchParams();
                if (filter && filter !== "All") params.set("status", filter);
                if (query) params.set("q", query);
                if (USE_PAGE_PARAMS) {
                  params.set("page", "1");
                  params.set("pageSize", "1");
                } else {
                  params.set("limit", "1");
                  params.set("offset", "0");
                }
                const testUrl = `/api/orders?${params.toString()}`;
                console.log("[Orders][Test] GET", testUrl);
                try {
                  const controller = new AbortController();
                  const res = await runWithTimeout(
                    api.get(testUrl, { signal: controller.signal }),
                    REQUEST_TIMEOUT_MS,
                    controller
                  );
                  console.log("[Orders][Test] status:", res.status, "payload:", res.data);
                  toast.success(`Test OK (status ${res.status})`);
                  setLastOrdersPayload(res.data);
                  setLastResponseStatus(res.status);
                } catch (e) {
                  console.error("[Orders][Test] ERROR", e);
                  toast.error(e?.response?.data?.error || e.message || "Test failed");
                  setLastOrdersError({
                    status: e.response?.status,
                    data: e.response?.data,
                    message: e.message,
                  });
                }
              }}
            >
              Test Orders Request
            </button>
          </div>

          <pre className="mt-2">Last success payload:
{JSON.stringify(lastOrdersPayload, null, 2)}</pre>
          {lastOrdersError && (
            <pre className="mt-2 text-red-700">Last error:
{JSON.stringify(lastOrdersError, null, 2)}</pre>
          )}
        </div>
      )}

      {/* ================= ORDERS ================= */}
      {active === "orders" && (
        <>
          {/* Head controls */}
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
                className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226]"
                aria-label="Search orders"
              />
            </div>
          </div>

          {/* Loading */}
          {ordersLoading && (
            <div className="p-3 text-sm text-[#6B4226]/70">Loading orders…</div>
          )}

          {/* Empty-state with hints (ONLY when not loading & no error & no rows) */}
          {!ordersLoading &&
            !lastOrdersError &&
            ordersFiltered.length === 0 && (
              <div className="mb-3 p-4 rounded-lg border border-[#E6DCD2] bg-[#FFFBFA] text-[#6B4226] text-sm">
                <div className="font-medium mb-1">No orders returned.</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Check <b>API baseURL</b> and <b>Orders URL</b> in the Connection Debug panel.</li>
                  <li>Open DevTools → Network → the orders request and verify it’s hitting your server.</li>
                  <li>If your API expects different params, switch to <code>page/pageSize</code> by setting <code>USE_PAGE_PARAMS = true</code>.</li>
                  <li>If your API returns a different shape, inspect the payload in Debug and map the right keys in <code>normalizeOrders</code>.</li>
                </ul>
              </div>
            )}

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {ordersFiltered.map((order) => {
              const d = getDraft(order);
              const disabled = savingRow === order.id;
              const customerName =
                typeof order.customer === "string"
                  ? order.customer
                  : order.customer?.name || order.customer || "Guest";

              return (
                <div
                  key={order.id || Math.random()}
                  className="p-4 rounded-lg border border-[#E6DCD2] bg-white space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#6B4226]">{order.id || "—"}</p>
                      <p className="text-sm text-[#6B4226]/70">{customerName}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#6B4226]/70">
                    Current: {order.TrackingNumber || "—"}
                    {order.Carrier ? ` · ${order.Carrier}` : ""}
                    {order.ShippedAt ? ` · ${new Date(order.ShippedAt).toLocaleString()}` : ""}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={d.trackingNumber}
                      onChange={(e) => setDraft(order.id, { trackingNumber: e.target.value })}
                      placeholder="Tracking number"
                      className="rounded-md px-2 py-1 border border-[#E6DCD2] text-sm flex-1"
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
                          const updated = await saveTracking(
                            order.id,
                            d.trackingNumber.trim(),
                            d.carrier
                          );
                          setOrders((list) =>
                            list.map((o) =>
                              o.id === order.id
                                ? {
                                    ...o,
                                    TrackingNumber: updated.TrackingNumber ?? o.TrackingNumber,
                                    Carrier: updated.Carrier ?? o.Carrier,
                                    ShippedAt: updated.ShippedAt ?? o.ShippedAt,
                                    status: (updated.FulFillmentStatus || o.status || "pending")
                                      .toString()
                                      .replace(/^\w/, (c) => c.toUpperCase()),
                                  }
                                : o
                            )
                          );
                          toast.success("Tracking saved");
                        } catch (e) {
                          console.error(e);
                          toast.error("Failed to save tracking");
                        } finally {
                          setSavingRow(null);
                        }
                      }}
                      className="px-3 py-1.5 border rounded text-sm disabled:opacity-50"
                      disabled={disabled}
                    >
                      {disabled ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
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
                  const customerName =
                    typeof order.customer === "string"
                      ? order.customer
                      : order.customer?.name || order.customer || "Guest";

                  return (
                    <tr key={order.id || Math.random()} className="border-t border-[#E6DCD2]">
                      <td className="p-3 text-[#6B4226]">{order.id || "—"}</td>
                      <td className="p-3 text-[#6B4226]">{customerName}</td>
                      <td className="p-3 text-[#6B4226]">
                        <div className="flex items-center gap-2">
                          <input
                            value={d.trackingNumber}
                            onChange={(e) => setDraft(order.id, { trackingNumber: e.target.value })}
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
                                const updated = await saveTracking(
                                  order.id,
                                  d.trackingNumber.trim(),
                                  d.carrier
                                );
                                setOrders((list) =>
                                  list.map((o) =>
                                    o.id === order.id
                                      ? {
                                          ...o,
                                          TrackingNumber: updated.TrackingNumber ?? o.TrackingNumber,
                                          Carrier: updated.Carrier ?? o.Carrier,
                                          ShippedAt: updated.ShippedAt ?? o.ShippedAt,
                                          status: (updated.FulFillmentStatus || o.status || "pending")
                                            .toString()
                                            .replace(/^\w/, (c) => c.toUpperCase()),
                                        }
                                      : o
                                  )
                                );
                                toast.success("Tracking saved");
                              } catch (e) {
                                console.error(e);
                                toast.error("Failed to save tracking");
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

      {/* ================= WAITLIST ================= */}
      {active === "waitlist" && (
        <>
          {/* Head controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-[#6B4226]">Waitlist</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={wlQuery}
                onChange={(e) => setWlQuery(e.target.value)}
                placeholder="Search by email or product…"
                className="rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226]"
              />
            </div>
          </div>

          {/* Loading */}
          {wlLoading && (
            <div className="p-3 text-sm text-[#6B4226]/70">Loading waitlist…</div>
          )}

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
                  <tr key={row.WaitlistId || `${row.UserEmail}-${row.ProductId}`} className="border-t border-[#E6DCD2]">
                    <td className="p-3 text-[#6B4226]">
                      <div className="font-medium">{row.ProductName || row.Product || "—"}</div>
                      <div className="text-xs text-[#6B4226]/70">#{row.ProductId || "—"}</div>
                    </td>
                    <td className="p-3 text-[#6B4226]">{row.UserEmail || row.Email || "—"}</td>
                    <td className="p-3 text-[#6B4226]">
                      {row.CreatedUtc
                        ? new Date(row.CreatedUtc).toLocaleString()
                        : row.CreatedAt
                        ? new Date(row.CreatedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-[#6B4226]">{row.NotifiedUtc ? "Yes" : "No"}</td>
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

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {waitlist.map((row) => (
              <div
                key={row.WaitlistId || `${row.UserEmail}-${row.ProductId}`}
                className="p-4 rounded-lg border border-[#E6DCD2] bg-white"
              >
                <div className="font-medium text-[#6B4226]">
                  {row.ProductName || row.Product || "—"}
                </div>
                <div className="text-sm text-[#6B4226]/70">
                  {row.UserEmail || row.Email || "—"} · #{row.ProductId || "—"}
                </div>
                <div className="text-xs text-[#6B4226]/70 mt-1">
                  {row.CreatedUtc
                    ? new Date(row.CreatedUtc).toLocaleString()
                    : row.CreatedAt
                    ? new Date(row.CreatedAt).toLocaleString()
                    : "—"}
                </div>
                <div className="text-xs mt-1">
                  <span className="px-2 py-0.5 rounded-full border bg-[#F1E7E5] text-[#6B4226]">
                    {row.NotifiedUtc ? "Confirmed" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
            {!wlLoading && waitlist.length === 0 && (
              <p className="text-sm text-[#6B4226]/70">No waitlist entries.</p>
            )}
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
