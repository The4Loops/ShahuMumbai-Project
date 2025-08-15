// Tables.js
import React, { useEffect, useMemo, useState } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

// ---------- helpers ----------
const currency = (v) =>
  typeof v === "number"
    ? v.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    : v;

const chip = (text, kind = "gray") => {
  const map = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[kind] || map.gray}`}>{text}</span>;
};

const roleChip = (r) =>
  r === "admin" ? chip("admin", "red") : r === "manager" ? chip("manager", "blue") : chip(r || "user", "gray");

const statusChip = (s) => {
  const x = (s || "").toLowerCase();
  if (["active", "visible", "yes"].includes(x)) return chip(x, "green");
  if (["suspended", "no", "inactive"].includes(x)) return chip(x, "red");
  if (x === "draft") return chip(x, "amber");
  return chip(x || "—", "gray");
};

const STOCK_COLORS = (v) =>
  v > 20 ? "bg-green-100 text-green-700" : v > 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

// ---------- sample data (unchanged) ----------
const sampleDataInit = {
  Products: [
    {
      id: 1,
      image: null,
      name: "Laptop",
      sku: "LP-13-256",
      category: "Electronics",
      price: 89999,
      cost: 68999,
      stock: 10,
      status: "active",
    },
    {
      id: 2,
      image: null,
      name: "Headphones",
      sku: "HP-ANC-BLK",
      category: "Audio",
      price: 6999,
      cost: 3999,
      stock: 25,
      status: "active",
    },
  ],
  Users: [
    {
      id: 1,
      name: "John Doe",
      email:
        "johnathan-maximilian-doe.super.long.email@example-very-very-long-domain.com",
      avatar: null,
      role: "admin",
      status: "active",
      joined: "2024-11-15",
      lastLogin: "2025-08-12 10:17",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@subdomain.reallylongcompanyname.co.in",
      avatar: null,
      role: "manager",
      status: "suspended",
      joined: "2025-02-01",
      lastLogin: "2025-08-10 22:41",
    },
  ],
  Categories: [
    { id: 1, name: "Electronics", slug: "electronics", parent: "-", productCount: 128 },
    { id: 2, name: "Fashion", slug: "fashion", parent: "-", productCount: 93 },
  ],
  Banners: [
    {
      id: 1,
      title: "Summer Sale",
      image: null,
      position: "Homepage Hero",
      startDate: "2025-04-01",
      endDate: "2025-09-01",
      active: "yes",
    },
    {
      id: 2,
      title: "New Arrivals",
      image: null,
      position: "Category Top",
      startDate: "2025-07-01",
      endDate: "2025-08-31",
      active: "yes",
    },
  ],
  Reviews: [
    { id: 1, user: "John Doe", product: "Laptop", rating: 5, comment: "Blazing fast. Great battery.", status: "visible" },
    { id: 2, user: "Jane Smith", product: "Headphones", rating: 4, comment: "Solid ANC. Good value.", status: "visible" },
  ],
  Blogs: [
    { id: 1, title: "React Tips", slug: "react-tips", author: "Admin", tags: "react,frontend", published: "yes", publishedAt: "2025-08-01" },
    { id: 2, title: "Tailwind Tricks", slug: "tailwind-tricks", author: "Admin", tags: "css,tailwind", published: "no", publishedAt: "" },
  ],
};

// ---------- table config (unchanged renderers) ----------
const TABLE_CONFIG = {
  Products: {
    order: ["image", "name", "sku", "category", "price", "cost", "margin", "stock", "status"],
    labels: {
      image: "Image",
      name: "Product",
      sku: "SKU",
      category: "Category",
      price: "Price",
      cost: "Cost",
      margin: "Margin",
      stock: "Stock",
      status: "Status",
    },
    types: {
      image: "image",
      name: "text",
      sku: "text",
      category: "text",
      price: "number",
      cost: "number",
      margin: "computed",
      stock: "number",
      status: { type: "select", options: ["active", "inactive"] },
    },
    render: {
      image: (_, row) => (
        <div className="px-4 py-2">
          <img src={row.image} alt={row.name} className="w-12 h-12 rounded-md object-cover border" />
        </div>
      ),
      name: (v, row) => (
        <div className="px-4 py-2">
          <div className="font-medium text-gray-900">{v}</div>
          <div className="text-xs text-gray-500">{row.category}</div>
        </div>
      ),
      sku: (v) => <div className="px-4 py-2 text-sm text-gray-700">{v}</div>,
      category: (v) => <div className="px-4 py-2 text-sm text-gray-700">{v}</div>,
      price: (v) => <div className="px-4 py-2">{currency(v)}</div>,
      cost: (v) => <div className="px-4 py-2 text-gray-700">{currency(v)}</div>,
      margin: (_, row) => {
        const m = row.price && row.cost ? Math.round(((row.price - row.cost) / row.price) * 100) : 0;
        const color = m >= 40 ? "green" : m >= 20 ? "amber" : "red";
        return (
          <div className="px-4 py-2">
            <span className={`px-2 py-0.5 text-xs rounded-full bg-${color}-100 text-${color}-700`}>{m}%</span>
          </div>
        );
      },
      stock: (v) => (
        <div className="px-4 py-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${STOCK_COLORS(v)}`}>{v}</span>
        </div>
      ),
      status: (v) => <div className="px-4 py-2">{statusChip(v)}</div>,
    },
  },

  Users: {
    order: ["avatar", "name", "email", "role", "status", "joined", "lastLogin"],
    labels: {
      avatar: "User",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      joined: "Joined",
      lastLogin: "Last Login",
    },
    types: {
      avatar: "image",
      name: "text",
      email: "text",
      role: { type: "select", options: ["admin", "manager", "user"] },
      status: { type: "select", options: ["active", "suspended"] },
      joined: "date",
      lastLogin: "text",
    },
    render: {
      avatar: (_, row) => (
        <div className="px-4 py-2 flex items-center gap-3">
          <img src={row.avatar} alt={row.name} className="w-10 h-10 rounded-full object-cover border" />
          <div className="min-w-0">
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500 max-w-[200px] truncate" title={row.email}>
              {row.email}
            </div>
          </div>
        </div>
      ),
      role: (v) => <div className="px-4 py-2">{roleChip(v)}</div>,
      status: (v) => <div className="px-4 py-2">{statusChip(v)}</div>,
      joined: (v) => <div className="px-4 py-2 text-sm text-gray-700">{v}</div>,
      lastLogin: (v) => <div className="px-4 py-2 text-xs text-gray-500">{v}</div>,
    },
  },

  Categories: {
    order: ["name", "slug", "parent", "productCount"],
    labels: { name: "Category", slug: "Slug", parent: "Parent", productCount: "Products" },
    types: { name: "text", slug: "text", parent: "text", productCount: "number" },
    render: {
      name: (v) => <div className="px-4 py-2 font-medium text-gray-900">{v}</div>,
      slug: (v) => <div className="px-4 py-2 text-sm text-gray-700">{v}</div>,
      parent: (v) => <div className="px-4 py-2 text-sm text-gray-500">{v}</div>,
      productCount: (v) => <div className="px-4 py-2 text-sm">{v}</div>,
    },
  },

  Banners: {
    order: ["image", "title", "position", "window", "active"],
    labels: { image: "Banner", title: "Title", position: "Position", window: "Active Window", active: "Status" },
    types: {
      image: "image",
      title: "text",
      position: { type: "select", options: ["Homepage Hero", "Category Top", "Sidebar", "Checkout"] },
      startDate: "date",
      endDate: "date",
      active: { type: "select", options: ["yes", "no"] },
    },
    render: {
      image: (_, row) => (
        <div className="px-4 py-2">
          <img src={row.image} alt={row.title} className="w-24 h-10 rounded object-cover border" />
        </div>
      ),
      title: (v) => <div className="px-4 py-2 font-medium text-gray-900">{v}</div>,
      position: (v) => <div className="px-4 py-2 text-sm text-gray-700">{v}</div>,
      window: (_, row) => (
        <div className="px-4 py-2 text-sm text-gray-700">
          {row.startDate || "—"} <span className="text-gray-400 px-1">→</span> {row.endDate || "—"}
        </div>
      ),
      active: (v) => <div className="px-4 py-2">{statusChip(v)}</div>,
    },
  },

  Reviews: {
    order: ["user", "product", "rating", "comment", "status"],
    labels: { user: "User", product: "Product", rating: "Rating", comment: "Comment", status: "Status" },
    types: {
      user: "text",
      product: "text",
      rating: { type: "select", options: [1, 2, 3, 4, 5] },
      comment: "textarea",
      status: { type: "select", options: ["visible", "hidden"] },
    },
    render: {
      rating: (v) => (
        <div className="px-4 py-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${i < Number(v) ? "text-yellow-500" : "text-gray-300"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.034a1 1 0 00-1.176 0L6.565 16.3c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.93 8.72c-.783-.57-.38-1.81.588-1.81H6.98a1 1 0 00.95-.69l1.12-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      ),
      comment: (v) => <div className="px-4 py-2 text-sm text-gray-700 line-clamp-2">{v}</div>,
      status: (v) => <div className="px-4 py-2">{statusChip(v)}</div>,
    },
  },

  Blogs: {
    order: ["title", "slug", "author", "tags", "published", "publishedAt"],
    labels: {
      title: "Title",
      slug: "Slug",
      author: "Author",
      tags: "Tags",
      published: "Published",
      publishedAt: "Published At",
    },
    types: {
      title: "text",
      slug: "text",
      author: "text",
      tags: "text",
      published: { type: "select", options: ["yes", "no", "draft"] },
      publishedAt: "date",
    },
    render: {
      tags: (v) => (
        <div className="px-4 py-2 flex flex-wrap gap-1">
          {(v || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs">
                {t}
              </span>
            ))}
        </div>
      ),
      published: (v) => <div className="px-4 py-2">{statusChip(v)}</div>,
      publishedAt: (v) => <div className="px-4 py-2 text-sm text-gray-700">{v || "—"}</div>,
    },
  },
};

// ---------- per-table filter config (to match EmployeeManagement UX) ----------
/**
 * Each table can expose up to TWO dropdowns (so the UI always matches your screenshot).
 * If a dropdown isn't relevant for a table, we still show "All" and keep it disabled.
 */
const getFilterMeta = (table, rows) => {
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

  switch (table) {
    case "Products":
      return {
        searchPlaceholder: "Search products…",
        a: { key: "category", label: "All", options: ["All", ...uniq(rows.map((r) => r.category))] },
        b: { key: "status", label: "All", options: ["All", "active", "inactive"] },
      };
    case "Users":
      return {
        searchPlaceholder: "Search by name or email…",
        a: { key: "role", label: "All", options: ["All", "admin", "manager", "user"] },
        b: { key: "status", label: "All", options: ["All", "active", "suspended"] },
      };
    case "Categories":
      return {
        searchPlaceholder: "Search categories…",
        a: { key: "parent", label: "All", options: ["All", ...uniq(rows.map((r) => r.parent))] },
        b: { key: null, label: "All", options: ["All"], disabled: true },
      };
    case "Banners":
      return {
        searchPlaceholder: "Search banners…",
        a: { key: "position", label: "All", options: ["All", ...uniq(rows.map((r) => r.position))] },
        b: { key: "active", label: "All", options: ["All", "yes", "no"] },
      };
    case "Reviews":
      return {
        searchPlaceholder: "Search reviews…",
        a: { key: "status", label: "All", options: ["All", "visible", "hidden"] },
        b: { key: "rating", label: "All", options: ["All", 1, 2, 3, 4, 5] },
      };
    case "Blogs":
      return {
        searchPlaceholder: "Search blogs…",
        a: { key: "author", label: "All", options: ["All", ...uniq(rows.map((r) => r.author))] },
        b: { key: "published", label: "All", options: ["All", "yes", "no", "draft"] },
      };
    default:
      return {
        searchPlaceholder: "Search…",
        a: { key: null, label: "All", options: ["All"], disabled: true },
        b: { key: null, label: "All", options: ["All"], disabled: true },
      };
  }
};

// ---------- component ----------
const Tables = () => {
  const [activeTable, setActiveTable] = useState("Products");
  const [data, setData] = useState(sampleDataInit);

  // EmployeeManagement-style controls
  const [view, setView] = useState("table"); // 'table' | 'cards'
  const [search, setSearch] = useState("");
  const [filterA, setFilterA] = useState("All");
  const [filterB, setFilterB] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modal, setModal] = useState({ type: null, row: null });

  const tableNames = Object.keys(data);
  const cfg = TABLE_CONFIG[activeTable];

  // Reset controls when switching tabs to mirror your pill toggle behavior
  useEffect(() => {
    setSearch("");
    setFilterA("All");
    setFilterB("All");
    setView("table");
    setDropdownOpen(null);
  }, [activeTable]);

  const visibleCols = (rows) => {
    if (cfg?.order?.length) return cfg.order;
    const base = rows.length > 0 ? Object.keys(rows[0]) : [];
    return base.filter((k) => k !== "id");
  };

  // ---------- filtering (search + two dropdowns) ----------
  const meta = useMemo(() => getFilterMeta(activeTable, data[activeTable] || []), [activeTable, data]);
  const originalRows = data[activeTable] || [];

  const filteredRows = useMemo(() => {
    const rows = [...originalRows];

    // search across string-ish fields
    const q = search.trim().toLowerCase();
    let out = rows;
    if (q) {
      out = out.filter((row) =>
        Object.entries(row).some(([k, v]) => {
          if (k === "id" || v == null) return false;
          const t = typeof v;
          if (t === "string") return v.toLowerCase().includes(q);
          if (t === "number") return String(v).includes(q);
          return false;
        })
      );
    }

    // filter A
    if (meta.a?.key && filterA !== "All") {
      out = out.filter((r) => String(r[meta.a.key]) === String(filterA));
    }
    // filter B
    if (meta.b?.key && filterB !== "All") {
      out = out.filter((r) => String(r[meta.b.key]) === String(filterB));
    }

    return out;
  }, [originalRows, search, filterA, filterB, meta]);

  // ---------- CRUD ----------
  const handleAdd = (newRow) => {
    const updated = [...data[activeTable], { id: Date.now(), ...newRow }];
    setData({ ...data, [activeTable]: updated });
    setModal({ type: null, row: null });
  };

  const handleEdit = (updatedRow) => {
    const updated = data[activeTable].map((row) => (row.id === updatedRow.id ? updatedRow : row));
    setData({ ...data, [activeTable]: updated });
    setModal({ type: null, row: null });
  };

  const handleDelete = (rowId) => {
    const updated = data[activeTable].filter((row) => row.id !== rowId);
    setData({ ...data, [activeTable]: updated });
    setModal({ type: null, row: null });
  };

  // ---------- modals ----------
  const ModalForm = () => {
    const isEdit = modal.type === "edit";
    const row = modal.row || {};
    const [formData, setFormData] = useState({});

    useEffect(() => {
      const fields = visibleCols(data[activeTable]).filter((k) => k !== "margin" && k !== "window");
      const initialData = fields.reduce((acc, key) => {
        acc[key] = isEdit ? row[key] ?? "" : "";
        return acc;
      }, {});
      setFormData(initialData);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTable, modal.type]);

    if (!modal.type || modal.type === "delete") return null;

    const parseVal = (key, raw) => {
      const t = cfg?.types?.[key];
      if (t === "number") return Number(raw || 0);
      return raw;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const payload = Object.keys(formData).reduce((acc, k) => {
        acc[k] = parseVal(k, formData[k]);
        return acc;
      }, {});
      if (isEdit) handleEdit({ ...row, ...payload });
      else handleAdd(payload);
    };

    const formFields = Object.keys(formData);

    const renderInput = (key) => {
      const t = cfg?.types?.[key];
      if (t?.type === "select") {
        return (
          <select
            name={key}
            value={formData[key]}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Select…</option>
            {t.options.map((opt) => (
              <option key={String(opt)} value={opt}>
                {String(opt)}
              </option>
            ))}
          </select>
        );
      }
      if (t === "textarea") {
        return (
          <textarea
            rows={4}
            name={key}
            value={formData[key]}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        );
      }
      if (t === "number") {
        return (
          <input
            type="number"
            name={key}
            value={formData[key]}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        );
      }
      if (t === "date") {
        return (
          <input
            type="date"
            name={key}
            value={formData[key]}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        );
      }
      // image/url or default text
      return (
        <input
          type="text"
          name={key}
          value={formData[key]}
          onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      );
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-xl shadow-2xl">
          <h2 className="text-lg font-semibold mb-4 text-[#6B4226]">
            {isEdit ? "Edit" : "Add"} {activeTable}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
            {formFields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700">
                  {cfg?.labels?.[field] || field}
                </label>
                {renderInput(field)}
              </div>
            ))}
            {activeTable === "Banners" && (
              <p className="text-xs text-gray-500 -mt-1">Tip: set Start/End dates to define the active window.</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 border rounded-md text-gray-700"
                onClick={() => setModal({ type: null, row: null })}
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#6B4226] text-white rounded-md hover:bg-[#55321f]">
                {isEdit ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (modal.type !== "delete") return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
          <h2 className="text-lg font-semibold mb-2 text-[#6B4226]">Delete {activeTable}?</h2>
          <p className="mb-4 text-gray-600">Are you sure you want to delete this entry?</p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 border rounded-md text-gray-700"
              onClick={() => setModal({ type: null, row: null })}
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md" onClick={() => handleDelete(modal.row.id)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------- rendering helpers ----------
  const renderCell = (key, value, row) => {
    if (cfg?.render?.[key]) return <td key={key} className="border px-0">{cfg.render[key](value, row)}</td>;
    if (key === "avatar") {
      return (
        <td key={key} className="border px-4 py-2">
          <img src={value} alt={row.name || ""} className="w-10 h-10 rounded-full object-cover border" />
        </td>
      );
    }
    if (key === "rating") {
      const n = Number(value);
      return (
        <td key={key} className="border px-4 py-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${i < n ? "text-yellow-500" : "text-gray-300"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.034a1 1 0 00-1.176 0L6.565 16.3c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.93 8.72c-.783-.57-.38-1.81.588-1.81H6.98a1 1 0 00.95-.69l1.12-3.292z" />
              </svg>
            ))}
          </div>
        </td>
      );
    }
    return (
      <td key={key} className="border px-4 py-2 text-sm text-gray-800">
        {typeof value === "number" ? value : String(value ?? "—")}
      </td>
    );
  };

  // ---------- UI ----------
  return (
    <div className="p-4 md:p-6">
      {/* ===== Pink pill toggle (unchanged colors & behavior) ===== */}
      <div className="relative flex overflow-x-auto rounded-full border border-[#D4A5A5] w-full md:w-auto mb-4 bg-white">
        <div
          className="absolute top-0 left-0 h-full bg-[#D4A5A5] rounded-full transition-all duration-300"
          style={{
            width: `${100 / tableNames.length}%`,
            transform: `translateX(${tableNames.indexOf(activeTable) * 100}%)`,
          }}
        />
        {tableNames.map((table) => (
          <button
            key={table}
            onClick={() => setActiveTable(table)}
            className={`relative flex-1 text-sm md:text-base py-2 px-4 whitespace-nowrap rounded-full z-10 transition-colors duration-300 ${
              activeTable === table ? "text-white font-semibold" : "text-[#6B4226] hover:text-[#4c2f1d]"
            }`}
          >
            {table}
          </button>
        ))}
      </div>

      {/* ===== EmployeeManagement-style Filter & Search + Add button ===== */}
      <div className="mt-2 p-2 border rounded-lg bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <span className="text-gray-500">🔍 Filter & Search {activeTable}</span>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={meta.searchPlaceholder}
              className="border rounded-lg px-3 py-2 w-full sm:w-64 focus:ring focus:ring-blue-200 outline-none"
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={filterA}
              onChange={(e) => setFilterA(e.target.value)}
              disabled={meta.a?.disabled}
            >
              {meta.a.options.map((opt) => (
                <option key={String(opt)} value={opt}>
                  {String(opt)}
                </option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={filterB}
              onChange={(e) => setFilterB(e.target.value)}
              disabled={meta.b?.disabled}
            >
              {meta.b.options.map((opt) => (
                <option key={String(opt)} value={opt}>
                  {String(opt)}
                </option>
              ))}
            </select>

            <button
              onClick={() => setModal({ type: "add", row: {} })}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + Add New
            </button>
          </div>
        </div>
      </div>

      {/* ===== count + black Table/Cards toggle (exact EM style) ===== */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {filteredRows.length} of {originalRows.length} {activeTable.toLowerCase()}
        </p>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded flex items-center gap-1 ${
              view === "table" ? "bg-black text-white" : "bg-gray-100"
            }`}
            onClick={() => setView("table")}
          >
            <span className="inline-block w-4 text-center">≣</span> Table
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center gap-1 ${
              view === "cards" ? "bg-black text-white" : "bg-gray-100"
            }`}
            onClick={() => setView("cards")}
          >
            <span className="inline-block w-4 text-center">▦</span> Cards
          </button>
        </div>
      </div>

      {/* ===== data view ===== */}
      {filteredRows.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No {activeTable.toLowerCase()} found.</div>
      ) : view === "table" ? (
        <div className="mt-4 bg-white shadow rounded-xl border border-gray-200 overflow-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {filteredRows.length > 0 &&
                  visibleCols(filteredRows).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b"
                    >
                      {cfg?.labels?.[key] || key}
                    </th>
                  ))}
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {visibleCols(filteredRows).map((key) => renderCell(key, row[key], row))}
                  <td className="border px-4 py-2 relative w-1">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === row.id ? null : row.id)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                    {dropdownOpen === row.id && (
                      <div className="absolute right-2 top-full mt-1 w-36 bg-white border rounded shadow-lg z-20">
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => setModal({ type: "edit", row })}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => setModal({ type: "delete", row })}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // simple responsive cards view (keeps colors neutral, content unchanged)
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRows.map((row) => (
            <div key={row.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {JSON.stringify(row, null, 2)}
              </pre>
              <div className="mt-3 flex justify-end">
                <button
                  className="text-sm px-3 py-1 border rounded mr-2"
                  onClick={() => setModal({ type: "edit", row })}
                >
                  Edit
                </button>
                <button
                  className="text-sm px-3 py-1 border rounded text-red-600"
                  onClick={() => setModal({ type: "delete", row })}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalForm />
      <DeleteModal />
    </div>
  );
};

export default Tables;
