import React, { useEffect, useMemo, useState } from "react";
import Layout from "../layout/Layout";
import SalesReport from "./SalesReport";
import AddProduct from "./AddProduct";
import InventoryTracker from "./InventioryTracker";
import BannerManager from "./BannerManager";
import OrderDashboard from "./OrderDashboard";
import Analytics from "./Analytics";
import AddCategory from "./AddCategory";
import AddBlogPost from "./AddBlogPost";
import EmployeeManagement from "./EmployeeManagement";
import TeamManagement from "./TeamManagement";
import Tables from "./Tables";
import Communications from "./Communications";
import MenuManagement from "./MenuManagement";
import RoleManagement from "./RoleManagement";

import {
  FaBars,
  FaTimes,
  FaStar,
  FaRegStar,
  FaSearch,
  FaHome,
  FaChevronLeft,
  FaChevronRight,
  FaBell,
} from "react-icons/fa";
import { MdOutlineCategory, MdOutlineAnalytics, MdInventory2 } from "react-icons/md";
import { TbReportAnalytics, TbUsersGroup } from "react-icons/tb";
import { FiPackage, FiMenu, FiMail } from "react-icons/fi";
import { AiOutlineTable, AiOutlineTeam } from "react-icons/ai";

// Small dashboard chart
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


const MENU_REGISTRY = [
  { id: "Order Dashboard", label: "Order Dashboard", icon: FiPackage, category: "Orders", component: OrderDashboard },
  { id: "Sales Report", label: "Sales Report", icon: TbReportAnalytics, category: "Reports", component: SalesReport },
  { id: "Add Product", label: "Add Product", icon: FiPackage, category: "Catalog", component: AddProduct },
  { id: "Inventory Tracker", label: "Inventory Tracker", icon: MdInventory2, category: "Operations", component: InventoryTracker },
  { id: "Banner Manager", label: "Banner Manager", icon: FiMenu, category: "Marketing", component: BannerManager },
  { id: "Analytics", label: "Analytics", icon: MdOutlineAnalytics, category: "Reports", component: Analytics },
  { id: "Communications", label: "Communications", icon: FiMail, category: "Ops", component: Communications },
  { id: "Add Category", label: "Add Category", icon: MdOutlineCategory, category: "Catalog", component: AddCategory },
  { id: "Add Blog Post", label: "Add Blog Post", icon: AiOutlineTable, category: "Content", component: AddBlogPost },
  { id: "Employee Management", label: "Employee Management", icon: TbUsersGroup, category: "People", component: EmployeeManagement },
  { id: "Team Management", label: "Team Management", icon: AiOutlineTeam, category: "People", component: TeamManagement },
  { id: "Menu Management", label: "Menu Management", icon: FiMenu, category: "System", component: MenuManagement },
  { id: "Role Management", label: "Role Management", icon: MdOutlineAnalytics, category: "System", component: RoleManagement },
  { id: "Table", label: "Table", icon: AiOutlineTable, category: "Utilities", component: Tables },
];

const getInitialFavorites = () => {
  try {
    const raw = localStorage.getItem("admin.favorites");
    if (raw) return JSON.parse(raw);
  } catch {}
  return ["Order Dashboard", "Sales Report", "Add Product"];
};
const saveFavorites = (list) => localStorage.setItem("admin.favorites", JSON.stringify(list));
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};


const AdminPanel = () => {
  const isMobile = useIsMobile();

  // null = show Dashboard; otherwise show page by id
  const [activeId, setActiveId] = useState(null);
  const [favorites, setFavorites] = useState(getInitialFavorites);
  const [sidebarOpen, setSidebarOpen] = useState(true); // collapsible menu
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isFavorite = (id) => favorites.includes(id);
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = isFavorite(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  useEffect(() => {
    const onK = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onK);
    return () => window.removeEventListener("keydown", onK);
  }, []);

  const activeItem = useMemo(
    () => MENU_REGISTRY.find((x) => x.id === activeId) ?? null,
    [activeId]
  );
  const ActiveComponent = activeItem?.component;

  // Group menu by category for shorter menu (accordion-style)
  const grouped = useMemo(() => {
    const map = new Map();
    MENU_REGISTRY.forEach((it) => {
      const k = it.category || "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f7f5f2]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-[#EAD8D8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            {/* Collapser / Drawer */}
            <button
              className="text-[#6B4226] text-xl p-2 border border-[#EAD8D8] rounded-lg"
              onClick={() => (isMobile ? setDrawerOpen(true) : setSidebarOpen((v) => !v))}
              aria-label="Toggle Navigation"
            >
              {isMobile ? <FaBars /> : sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </button>

            {/* Brand */}
            <button
              className="flex items-center gap-2"
              onClick={() => setActiveId(null)}
              title="Go to Dashboard"
            >
              <FaHome className="text-[#6B4226]" />
              <div className="font-semibold text-[#6B4226]">Admin</div>
              <span className="text-gray-400">/</span>
              <div className="text-gray-700">
                {activeItem ? activeItem.label : "Dashboard"}
              </div>
            </button>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                title="Search tools"
              >
                <FaSearch />
                <span className="text-sm">Search</span>
              </button>
              <button
                onClick={() => setPaletteOpen(true)}
                className="sm:hidden p-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                aria-label="Search"
              >
                <FaSearch />
              </button>
              <button className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50" title="Notifications">
                <FaBell />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="flex gap-6">
            {/* Collapsible Sidebar / Drawer */}
            {!isMobile ? (
              <Sidebar
                open={sidebarOpen}
                favorites={favorites}
                grouped={grouped}
                activeId={activeId}
                onOpen={(id) => setActiveId(id)}
                toggleFavorite={toggleFavorite}
              />
            ) : (
              drawerOpen && (
                <>
                  <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
                  <div className="fixed z-50 top-0 left-0 h-full w-80 max-w-[85vw] bg-white p-6 shadow-2xl border-r border-[#EAD8D8] rounded-r-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-[#6B4226]">Menu</h2>
                      <button
                        className="text-[#6B4226] text-xl border border-[#EAD8D8] px-2 py-1 rounded-md"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close Sidebar"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <Sidebar
                      open={true}
                      favorites={favorites}
                      grouped={grouped}
                      activeId={activeId}
                      onOpen={(id) => {
                        setActiveId(id);
                        setDrawerOpen(false);
                      }}
                      toggleFavorite={toggleFavorite}
                      asDrawer
                    />
                  </div>
                </>
              )
            )}

            {/* Content */}
            <main className="flex-1">
              {!activeItem ? (
                <Dashboard
                  onOpen={(id) => setActiveId(id)}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              ) : (
                <section className="bg-white border border-[#EAD8D8] rounded-2xl shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-[#6B4226]">
                      {activeItem.label}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(activeItem.id)}
                      className="flex items-center gap-2 text-[#6B4226]"
                      title={favorites.includes(activeItem.id) ? "Unpin" : "Pin"}
                    >
                      {favorites.includes(activeItem.id) ? <FaStar /> : <FaRegStar />}
                      <span className="text-sm">
                        {favorites.includes(activeItem.id) ? "Pinned" : "Pin"}
                      </span>
                    </button>
                  </div>
                  <ActiveComponent />
                </section>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Simple, minimal Command Palette */}
      {paletteOpen && (
        <Palette
          items={MENU_REGISTRY}
          onClose={() => setPaletteOpen(false)}
          onSelect={(id) => {
            setActiveId(id);
            setPaletteOpen(false);
          }}
        />
      )}
    </Layout>
  );
};

export default AdminPanel;


const Sidebar = ({ open, favorites, grouped, activeId, onOpen, toggleFavorite, asDrawer }) => {
  // Accordion open/close per category (keep short to reduce scroll)
  const defaultOpen = new Set(grouped.slice(0, 2).map(([k]) => k)); // first 2 categories open
  const [openCats, setOpenCats] = useState(defaultOpen);

  const toggleCat = (c) => {
    const next = new Set(openCats);
    next.has(c) ? next.delete(c) : next.add(c);
    setOpenCats(next);
  };

  return (
    <aside
      className={`${
        asDrawer ? "" : "sticky top-24"
      } ${open ? "w-64" : "w-16"} transition-all duration-200`}
    >
      <div className="bg-white border border-[#EAD8D8] rounded-2xl shadow p-3">
        {/* Favorites (small) */}
        <div className="mb-2">
          <div className={`text-xs uppercase tracking-wide text-gray-400 ${open ? "px-1" : "text-center"}`}>
            Favorites
          </div>
          <div className={`mt-2 flex ${open ? "flex-col gap-1" : "flex-col items-center gap-2"}`}>
            {favorites.slice(0, 5).map((id) => {
              const it = MENU_REGISTRY.find((x) => x.id === id);
              if (!it) return null;
              const Icon = it.icon;
              return open ? (
                <button
                  key={id}
                  onClick={() => onOpen(id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm border ${
                    activeId === id ? "bg-[#fff7f7] border-[#D4A5A5]" : "bg-white border-gray-200"
                  }`}
                  title={it.label}
                >
                  <Icon className="text-[#6B4226]" />
                  <span className="truncate">{it.label}</span>
                </button>
              ) : (
                <button
                  key={id}
                  onClick={() => onOpen(id)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    activeId === id ? "bg-[#fff7f7] border-[#D4A5A5]" : "bg-white border-gray-200"
                  }`}
                  title={it.label}
                >
                  <Icon className="text-[#6B4226]" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-gray-200 my-2" />

        {/* Categories (accordion) */}
        <div className={`space-y-2 ${open ? "" : "flex flex-col items-center"}`}>
          {grouped.map(([cat, items]) => (
            <div key={cat} className="w-full">
              {open ? (
                <>
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-semibold text-gray-500"
                  >
                    <span>{cat}</span>
                    <span className="text-gray-400">{openCats.has(cat) ? "−" : "+"}</span>
                  </button>
                  {openCats.has(cat) && (
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 6).map((it) => {
                        const Icon = it.icon;
                        return (
                          <button
                            key={it.id}
                            onClick={() => onOpen(it.id)}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm border ${
                              activeId === it.id ? "bg-[#fff7f7] border-[#D4A5A5]" : "bg-white border-gray-200"
                            }`}
                            title={it.label}
                          >
                            <Icon className="text-[#6B4226]" />
                            <span className="truncate">{it.label}</span>
                          </button>
                        );
                      })}
                      {/* “More…” opens palette to avoid long lists */}
                      {items.length > 6 && (
                        <div className="px-2 text-xs text-gray-500">+ {items.length - 6} more (use Search)</div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <span className="text-[10px] text-gray-400 rotate-180 writing-mode-vertical-rl">
                    {cat}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};


const Dashboard = ({ onOpen, favorites, toggleFavorite }) => {
  // mock data (replace with real API later)
  const kpis = [
    { label: "Revenue (30d)", value: "₹12.4L", diff: "+8.2%" },
    { label: "Orders (30d)", value: "1,083", diff: "+3.1%" },
    { label: "Avg. Order", value: "₹1,145", diff: "+1.4%" },
    { label: "Refunds", value: "1.6%", diff: "-0.3%" },
  ];
  const sales = [
    { d: "Aug 1", v: 310 }, { d: "Aug 3", v: 420 }, { d: "Aug 5", v: 390 },
    { d: "Aug 7", v: 520 }, { d: "Aug 9", v: 480 }, { d: "Aug 11", v: 560 },
    { d: "Aug 13", v: 610 },
  ];
  const topProducts = [
    { id: 1, name: "Modern Tote", sales: 54 },
    { id: 2, name: "Vintage Bag", sales: 39 },
    { id: 3, name: "Ethnic Clutch", sales: 29 },
    { id: 4, name: "Silk Scarf", sales: 22 },
    { id: 5, name: "Handloom Shirt", sales: 19 },
  ];
  const recentOrders = [
    { id: "INV-10214", customer: "A. Sharma", total: "₹2,990", status: "Paid" },
    { id: "INV-10213", customer: "R. Mehta", total: "₹1,245", status: "Pending" },
    { id: "INV-10212", customer: "K. Patel", total: "₹3,780", status: "Paid" },
    { id: "INV-10211", customer: "S. Gupta", total: "₹1,090", status: "Paid" },
    { id: "INV-10210", customer: "N. Iyer", total: "₹2,150", status: "Refunded" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#EAD8D8] bg-white p-4">
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[#6B4226]">{k.value}</div>
            <div className={`text-xs mt-1 ${k.diff.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
              {k.diff} vs last 30d
            </div>
          </div>
        ))}
      </div>

      {/* Middle: Sales + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales Chart (span 2) */}
        <div className="xl:col-span-2 rounded-2xl border border-[#EAD8D8] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#6B4226]">Sales (Last 2 Weeks)</h3>
            <button
              className="text-sm px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => onOpen("Sales Report")}
            >
              Open Report
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="v" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products (compact list) */}
        <div className="rounded-2xl border border-[#EAD8D8] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#6B4226]">Top Products</h3>
            <button
              className="text-sm px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => onOpen("Add Product")}
            >
              Add Product
            </button>
          </div>
          <ul className="space-y-2 max-h-56 overflow-auto pr-1">
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-[#fff7f7] text-[#6B4226] flex items-center justify-center text-xs">
                    #{i + 1}
                  </div>
                  <div className="text-sm text-[#6B4226]">{p.name}</div>
                </div>
                <div className="text-sm text-gray-600">{p.sales}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Orders (small table) */}
      <div className="rounded-2xl border border-[#EAD8D8] bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#6B4226]">Recent Orders</h3>
          <button
            className="text-sm px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={() => onOpen("Order Dashboard")}
          >
            View All
          </button>
        </div>
        <div className="max-h-60 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="py-2 pr-3 text-[#6B4226]">{o.id}</td>
                  <td className="py-2 pr-3">{o.customer}</td>
                  <td className="py-2 pr-3">{o.total}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        o.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : o.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Launch (just a few, to avoid scroll) */}
      <div className="rounded-2xl border border-[#EAD8D8] bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#6B4226]">Quick Launch</h3>
          <div className="text-xs text-gray-500">Pin/unpin to customize</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {favorites.slice(0, 8).map((id) => {
            const it = MENU_REGISTRY.find((x) => x.id === id);
            if (!it) return null;
            const Icon = it.icon;
            return (
              <button
                key={id}
                onClick={() => onOpen(id)}
                className="group flex items-center gap-3 rounded-xl border bg-white p-3 hover:shadow transition"
              >
                <span className="rounded-lg p-2 border bg-white">
                  <Icon className="text-[#6B4226]" />
                </span>
                <div className="text-left">
                  <div className="text-sm font-medium text-[#6B4226]">{it.label}</div>
                  <div className="text-[11px] text-gray-500">{it.category}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


const Palette = ({ items, onClose, onSelect }) => {
  const [q, setQ] = useState("");
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = (q
    ? items.filter(
        (x) =>
          x.label.toLowerCase().includes(q.toLowerCase()) ||
          (x.category || "").toLowerCase().includes(q.toLowerCase())
      )
    : items
  ).slice(0, 30);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[92vw] max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <FaSearch className="text-gray-500" />
          <input
            autoFocus
            placeholder="Search tools…"
            className="w-full outline-none py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="text-xs text-gray-400">Esc</span>
        </div>
        <div className="max-h-[55vh] overflow-auto">
          {filtered.length === 0 && <div className="p-6 text-center text-gray-500">No results</div>}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
            >
              <item.icon className="text-[#6B4226]" />
              <div>
                <div className="font-medium text-[#6B4226]">{item.label}</div>
                <div className="text-xs text-gray-500">{item.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
