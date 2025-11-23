// src/admin/tabs/HeritageTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit, Trash2, Plus, X } from "lucide-react";
import api from "../../supabase/axios";
import { toast } from "react-toastify";

// (Optional) if you already have a shared hook, swap this inline hook
// to: import useSearch from "./useSearch";
function useSearch(rows, query, keys) {
  return useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      keys.some((k) => String(r?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, keys]);
}

const ICON_OPTIONS = [
  { key: "GiStoneCrafting", label: "Stone Crafting (GiStoneCrafting)" },
  { key: "GiSpinningWheel", label: "Spinning Wheel (GiSpinningWheel)" },
  { key: "MdOutlineDiamond", label: "Diamond (MdOutlineDiamond)" },
];

function HeritageTable() {
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [rowsError, setRowsError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isActive, setIsActive] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Modals
  const [modalItem, setModalItem] = useState(null); // Add/Edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null); // Delete confirmation

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  const filteredRows = useSearch(rows, searchQuery, [
    "year_label",
    "title",
    "description",
  ]);

  const loadRows = async () => {
    try {
      setLoadingRows(true);
      setRowsError(null);

      const params = new URLSearchParams();
      if (isActive !== "") params.set("is_active", String(isActive));
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const { data } = await api.get(`/api/heritage?${params.toString()}`);
      const list = Array.isArray(data?.items) ? data.items : [];
      setRows(list);
      setTotal(Number(data?.total || list.length || 0));
    } catch (e) {
      setRowsError(e?.response?.data?.error || "Failed to load heritage items");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, limit, offset]);

  const openCreate = () => {
    setIsEditing(false);
    setModalItem({
      year_label: "",
      title: "",
      description: "",
      image_url: "",
      icon_key: ICON_OPTIONS[0].key,
      title_color: "text-blue-600",
      dot_color: "bg-blue-600",
      sort_order: 0,
      is_active: true,
    });
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setModalItem({ ...row });
  };

  const handleImageUpload = async (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) throw new Error("Upload JPEG/PNG/WebP only");
    if (file.size > 5 * 1024 * 1024) throw new Error("Max size 5MB");

    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/api/upload/single", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const urls = data?.url || [];
    if (!urls.length) throw new Error("Upload failed");
    return urls;
  };

  const handleSave = async () => {
    if (!modalItem?.year_label || !modalItem?.title || !modalItem?.icon_key) {
      alert("Year, Title and Icon are required!");
      return;
    }
    const payload = {
      year_label: modalItem.year_label.trim(),
      title: modalItem.title.trim(),
      description: modalItem.description || null,
      image_url: modalItem.image_url || null,
      icon_key: modalItem.icon_key,
      title_color: modalItem.title_color || "text-blue-600",
      dot_color: modalItem.dot_color || "bg-blue-600",
      sort_order: Number(modalItem.sort_order || 0),
      is_active: !!modalItem.is_active,
    };

    try {
      if (isEditing && modalItem?.id) {
        await api.put(`/api/heritage/${modalItem.id}`, payload);
      } else {
        await api.post(`/api/heritage`, payload);
        setOffset(0);
      }
      setModalItem(null);
      loadRows();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to save milestone");
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/api/heritage/${deleteItem.id}`);
      setDeleteItem(null);
      loadRows();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to delete milestone");
    }
  };

  return (
    <div className="p-4">
      {/* Search / Toolbar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex flex-1 items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search heritage…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setOffset(0);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Load/Error status */}
      {loadingRows && (
        <div className="mb-3 text-sm text-gray-500">Loading heritage…</div>
      )}
      {rowsError && (
        <div className="mb-3 text-sm text-red-600">{rowsError}</div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium">Order</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Year</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Active</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Updated</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`border-b border-gray-100 transition hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-gray-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-700">{row.sort_order ?? 0}</td>
                    <td className="px-4 py-3 text-gray-700">{row.year_label}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-medium text-gray-800">{row.title}</div>
                      {row.description ? (
                        <div className="text-xs text-gray-500 truncate max-w-[420px]">
                          {row.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.is_active ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="p-2 rounded hover:bg-gray-100 transition"
                        title="Edit"
                      >
                        <Edit size={18} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => setDeleteItem(row)}
                        className="p-2 rounded hover:bg-gray-100 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border p-4 text-center text-gray-500">
                    No heritage items found
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {filteredRows.length > 0 ? (
          filteredRows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-lg shadow p-4 space-y-2 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  {row.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    row.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {row.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                <strong>Year:</strong> {row.year_label}
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Order:</strong> {row.sort_order ?? 0}
              </p>
              {row.description && (
                <p className="text-gray-600 text-sm line-clamp-3">{row.description}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openEdit(row)}
                  className="p-2 rounded hover:bg-gray-100 transition"
                >
                  <Edit size={18} className="text-green-600" />
                </button>
                <button
                  onClick={() => setDeleteItem(row)}
                  className="p-2 rounded hover:bg-gray-100 transition"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No heritage items found</p>
        )}
      </div>

      {/* Pagination (same placement & style as ProductsTab) */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {rows.length ? offset + 1 : 0}–{Math.min(offset + rows.length, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} / {pages}
          </span>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(+e.target.value);
              setOffset(0);
            }}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Milestone Modal */}
      <AnimatePresence>
        {modalItem && (
          <motion.div
            className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-xl md:rounded-lg shadow-xl p-6 w-full md:w-[720px] relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button
                onClick={() => setModalItem(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? "Edit Milestone" : "Add Milestone"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Year Label *
                  </label>
                  <input
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.year_label || ""}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, year_label: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Title *
                  </label>
                  <input
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.title || ""}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.description || ""}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Icon *
                  </label>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.icon_key || ICON_OPTIONS[0].key}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, icon_key: e.target.value }))
                    }
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.sort_order ?? 0}
                    onChange={(e) =>
                      setModalItem((f) => ({
                        ...f,
                        sort_order: parseInt(e.target.value || "0", 10),
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Title Color (Tailwind class)
                  </label>
                  <input
                    placeholder="e.g., text-amber-700"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.title_color || ""}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, title_color: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Dot Color (Tailwind class)
                  </label>
                  <input
                    placeholder="e.g., bg-amber-700"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={modalItem.dot_color || ""}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, dot_color: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Image URL / Upload
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      placeholder="https://…"
                      className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={modalItem.image_url || ""}
                      onChange={(e) =>
                        setModalItem((f) => ({ ...f, image_url: e.target.value }))
                      }
                    />
                    <label className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      Upload…
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const [url] = await handleImageUpload(file);
                            setModalItem((f) => ({ ...f, image_url: url }));
                          } catch (err) {
                            alert(err.message || "Upload failed");
                          }
                        }}
                      />
                    </label>
                  </div>
                  {modalItem.image_url ? (
                    <img
                      src={modalItem.image_url}
                      alt="preview"
                      className="mt-2 w-full max-w-sm h-40 object-cover rounded border"
                    />
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className="text-gray-600 font-medium text-sm mb-1 block">
                    Active
                  </label>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={String(!!modalItem.is_active)}
                    onChange={(e) =>
                      setModalItem((f) => ({ ...f, is_active: e.target.value === "true" }))
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setModalItem(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
                >
                  {isEditing ? "Save Changes" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteItem && (
          <motion.div
            className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-xl md:rounded-xl shadow-xl p-6 w-full md:w-80 relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4">Delete Milestone</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>{deleteItem.title}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteItem(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
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

export default HeritageTable;
