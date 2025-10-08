// src/admin/tabs/WaitlistTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../supabase/axios";

function useSearch(rows, query, keys) {
  return useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => keys.some((k) => String(r?.[k] ?? "").toLowerCase().includes(q)));
  }, [rows, query, keys]);
}

export default function WaitlistTable() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const filtered = useSearch(rows, searchQuery, ["UserEmail", "ProductName", "ProductId"]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(limit),
        search: searchQuery.trim(),
      });
      const { data } = await api.get(`/api/admin/waitlist?${params.toString()}`);
      setRows(data?.items || []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = (e) => {
    e?.preventDefault?.();
    if (offset !== 0) setOffset(0);
    else load();
  };

  const onConfirm = async (id) => {
    if (!window.confirm("Mark this entry as notified?")) return;
    try {
      await api.post(`/api/admin/waitlist/${id}/confirm`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to confirm");
    }
  };

  const onDelete = async () => {
    if (!deleteRow) return;
    try {
      await api.delete(`/api/admin/waitlist/${deleteRow.WaitlistId}`);
      setDeleteRow(null);
      setRows((prev) => prev.filter((x) => x.WaitlistId !== deleteRow.WaitlistId));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <form onSubmit={onSearch}>
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <Search size={18} className="text-gray-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="email / product name / product id"
                className="w-full focus:outline-none"
              />
              <button type="submit" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading waitlist…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Table */}
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">User Email</th>
              <th className="px-3 py-2 text-left">Created (UTC)</th>
              <th className="px-3 py-2 text-left">Notified</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No waitlist entries</td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.WaitlistId ?? idx} className="border-t">
                  <td className="px-3 py-2">{(page - 1) * limit + idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">{r.ProductName}</div>
                    <div className="text-xs text-gray-500">#{r.ProductId}</div>
                  </td>
                  <td className="px-3 py-2">{r.UserEmail || <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-2">{r.CreatedUtc ? new Date(r.CreatedUtc).toLocaleString() : "—"}</td>
                  <td className="px-3 py-2">
                    {r.NotifiedUtc ? (
                      <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs bg-green-50 border-green-300 text-green-700">
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      {!r.NotifiedUtc && (
                        <button
                          onClick={() => onConfirm(r.WaitlistId)}
                          className="p-2 rounded hover:bg-green-50 transition"
                          title="Mark as Notified"
                        >
                          <CheckCircle size={18} className="text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteRow(r)}
                        className="p-2 rounded hover:bg-red-50 transition"
                        title="Delete entry"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {rows.length ? offset + 1 : 0}–{Math.min(offset + rows.length, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">Page {page} / {pages}</span>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => { setLimit(+e.target.value); setOffset(0); }}
            className="rounded border px-2 py-1"
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteRow && (
          <motion.div className="fixed inset-0 flex items-end md:items-center justify-center bg-black/50 z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-t-xl md:rounded-xl shadow-xl p-6 w-full md:w-[420px]"
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
              <h3 className="text-lg font-semibold mb-2">Delete Waitlist Entry</h3>
              <p className="text-gray-700 mb-4">
                Delete <strong>{deleteRow.UserEmail || "Unknown"}</strong> for <strong>{deleteRow.ProductName}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteRow(null)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition">
                  Cancel
                </button>
                <button onClick={onDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
