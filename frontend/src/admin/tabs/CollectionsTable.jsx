import React, { useEffect, useMemo, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Edit } from "lucide-react";
import api from "../../supabase/axios";
import { AdminActionsContext } from "../AdminActionsContext";

function useSearch(rows, query, keys) {
  return useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      keys.some((k) => String(r?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, keys]);
}

const STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function CollectionsTable() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [isActive, setIsActive] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);
  const { openCollectionEditor } = useContext(AdminActionsContext);

  const filtered = useSearch(rows, searchQuery, ["title", "slug", "description"]);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (isActive !== "") params.set("is_active", String(isActive));
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      const { data } = await api.get(`/api/collections?${params.toString()}`);
      setRows(data?.collections || []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status, isActive, limit, offset]);

  const handleCreate = () => {
    openCollectionEditor(null);
  };

  const handleEdit = (r) => {
    openCollectionEditor(r.id);
  };

  const onDelete = async () => {
    if (!deleteRow) return;
    try {
      await api.delete(`/api/collections/${deleteRow.id}`);
      setDeleteRow(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete collection");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
            <Search size={18} className="text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="title / slug / description"
              className="w-full focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border px-3 py-2"
          >
            <option value="">All</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border px-3 py-2"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Load/Error */}
      {loading && <div className="text-sm text-gray-500">Loading collections…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Table */}
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-right">Products</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No collections
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.id ?? idx} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">{r.title}</div>
                    {r.description ? (
                      <div className="text-xs text-gray-500 truncate max-w-[340px]">
                        {r.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{r.slug}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        r.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : r.status === "ARCHIVED"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.is_active ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-right">{r.product_count ?? 0}</td>
                  <td className="px-3 py-2">
                    {r.updated_at ? new Date(r.updated_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(r)}
                        className="p-2 rounded hover:bg-gray-100 transition"
                        title="Edit"
                      >
                        <Edit size={18} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => setDeleteRow(r)}
                        className="p-2 rounded hover:bg-gray-100 transition"
                        title="Delete"
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
          <span className="text-sm">
            Page {page} / {pages}
          </span>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(+e.target.value);
              setOffset(0);
            }}
            className="rounded border px-2 py-1"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteRow && (
          <motion.div
            className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-xl md:rounded-xl shadow-xl p-6 w-full md:w-[420px]"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Collection</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{deleteRow.title}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteRow(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold"
                >
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