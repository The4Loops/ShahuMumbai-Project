import React, { useState, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

const currency = (v) =>
  typeof v === "number"
    ? v.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    : v;


const sampleDataInit = {
  Products: [
    {
      id: 1,
      image: "https://via.placeholder.com/64",
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
      image: "https://via.placeholder.com/64",
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
      email: "johnathan-maximilian-doe.super.long.email@example-very-very-long-domain.com",
      avatar: "https://i.pravatar.cc/80?img=1",
      role: "admin",
      status: "active",
      joined: "2024-11-15",
      lastLogin: "2025-08-12 10:17",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@subdomain.reallylongcompanyname.co.in",
      avatar: "https://i.pravatar.cc/80?img=2",
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
      image: "https://via.placeholder.com/300x120",
      position: "Homepage Hero",
      startDate: "2025-04-01",
      endDate: "2025-09-01",
      active: "yes",
    },
    {
      id: 2,
      title: "New Arrivals",
      image: "https://via.placeholder.com/300x120",
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

const ratingStars = (n = 0) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className={`h-4 w-4 ${i < n ? "text-yellow-500" : "text-gray-300"}`} />
    ))}
  </div>
);

const STOCK_COLORS = (v) => (v > 20 ? "bg-green-100 text-green-700" : v > 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700");

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
      // ⬇️ Email truncation fix lives here
      avatar: (_, row) => (
        <div className="px-4 py-2 flex items-center gap-3">
          <img src={row.avatar} alt={row.name} className="w-10 h-10 rounded-full object-cover border" />
          <div className="min-w-0"> {/* allow truncation within */}
            <div className="font-medium text-gray-900">{row.name}</div>
            <div
              className="text-xs text-gray-500 max-w-[200px] truncate"
              title={row.email}
            >
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
      rating: (v) => <div className="px-4 py-2">{ratingStars(Number(v))}</div>,
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


const Tables = () => {
  const [activeTable, setActiveTable] = useState("Products");
  const [data, setData] = useState(sampleDataInit);
  const [modal, setModal] = useState({ type: null, row: null });
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const tableNames = Object.keys(data);
  const cfg = TABLE_CONFIG[activeTable];

  const visibleCols = (rows) => {
    if (cfg?.order?.length) return cfg.order;
    const base = rows.length > 0 ? Object.keys(rows[0]) : [];
    return base.filter((k) => k !== "id");
  };

  // ── CRUD
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

  // Modal Form 
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

  // Delete Modal 
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

  // Cell Renderer 
  const renderCell = (key, value, row) => {
    if (cfg?.render?.[key]) return <td key={key} className="border px-0">{cfg.render[key](value, row)}</td>;
    // fallback
    if (key === "avatar") {
      return (
        <td key={key} className="border px-4 py-2">
          <img src={value} alt={row.name || ""} className="w-10 h-10 rounded-full object-cover border" />
        </td>
      );
    }
    if (key === "rating") {
      return <td key={key} className="border px-4 py-2">{ratingStars(Number(value))}</td>;
    }
    return (
      <td key={key} className="border px-4 py-2 text-sm text-gray-800">
        {typeof value === "number" ? value : String(value ?? "—")}
      </td>
    );
  };

  return (
    <div className="p-4 md:p-6">
      {/* Pills nav */}
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

      {/* Table */}
      <div className="bg-white shadow rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[#f9f5f0] rounded-t-xl">
          <h3 className="font-semibold text-[#6B4226]">{activeTable}</h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md" onClick={() => setModal({ type: "add", row: {} })}>
            Add New
          </button>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {data[activeTable].length > 0 &&
                  visibleCols(data[activeTable]).map((key) => (
                    <th key={key} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      {cfg?.labels?.[key] || key}
                    </th>
                  ))}
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data[activeTable].map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {visibleCols(data[activeTable]).map((key) => renderCell(key, row[key], row))}
                  <td className="border px-4 py-2 relative w-1">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === row.id ? null : row.id)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                    {dropdownOpen === row.id && (
                      <div className="absolute right-2 top-full mt-1 w-36 bg-white border rounded shadow-lg z-20">
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => setModal({ type: "edit", row })}>
                          Edit
                        </button>
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => setModal({ type: "delete", row })}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {data[activeTable].length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={999}>
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalForm />
      <DeleteModal />
    </div>
  );
};

export default Tables;
