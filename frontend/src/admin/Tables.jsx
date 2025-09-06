// src/admin/Tables.jsx
import React, { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Users,
  Tag,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Layers,
} from "lucide-react";

// Helper to lazy-load with a fallback to a named export
const lazyWithFallback = (importer, named = null) =>
  lazy(async () => {
    const m = await importer();
    const Comp = m.default ?? (named ? m[named] : undefined);
    if (typeof Comp !== "function") {
      const keys = Object.keys(m || {});
      throw new Error(
        `Bad export for ${importer}.\n` +
        `Expected a React component as default${named ? ` or named '${named}'` : ""}.\n` +
        `Got exports: [${keys.join(", ")}]`
      );
    }
    return { default: Comp };
  });

// Lazy load all tab components
const ProductsTable    = lazyWithFallback(() => import("./tabs/ProductsTable"));
const UsersTable       = lazyWithFallback(() => import("./tabs/UsersTable"));
const CategoriesTable  = lazyWithFallback(() => import("./tabs/CategoriesTable"));
const BannersTable     = lazyWithFallback(() => import("./tabs/BannersTable"));
const ReviewsTable     = lazyWithFallback(() => import("./tabs/ReviewsTable"));
const BlogsTable       = lazyWithFallback(() => import("./tabs/BlogsTable"));
const CollectionsTable = lazyWithFallback(() => import("./tabs/CollectionsTable"), "CollectionsTable");
const HeritageTable    = lazyWithFallback(() => import("./tabs/HeritageTable"), "HeritageTable");

const tabs = [
  { name: "Products",    icon: Box },
  { name: "Users",       icon: Users },
  { name: "Categories",  icon: Tag },
  { name: "Collections", icon: Layers },
  { name: "Heritage",    icon: Layers }, // new
  { name: "Banners",     icon: ImageIcon },
  { name: "Reviews",     icon: MessageSquare },
  { name: "Blogs",       icon: FileText },
];

const tabComponents = {
  Products:    ProductsTable,
  Users:       UsersTable,
  Categories:  CategoriesTable,
  Collections: CollectionsTable,
  Heritage:    HeritageTable,
  Banners:     BannersTable,
  Reviews:     ReviewsTable,
  Blogs:       BlogsTable,
};

export default function Tables() {
  const [activeTab, setActiveTab] = useState("Products");
  const [visited, setVisited] = useState(() => new Set(["Products"]));

  const handleTab = (name) => {
    setActiveTab(name);
    setVisited((prev) => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const highlightTransition = { type: "spring", stiffness: 300, damping: 26 };

  return (
    <div className="w-full">
      {/* Tabs header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex gap-3 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => handleTab(tab.name)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 transition font-medium ${
                  isActive ? "text-blue-700" : "text-gray-700 hover:text-blue-700"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTabHighlight"
                    className="absolute inset-0 rounded-full bg-blue-100"
                    transition={highlightTransition}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels: keep-mounted approach */}
      <div className="p-4 relative">
        <div className="min-h-[200px]">
          {tabs.map(({ name }) => {
            if (!visited.has(name)) return null;
            const Comp = tabComponents[name];
            return (
              <div key={name} className={activeTab === name ? "block" : "hidden"}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  <Suspense fallback={<div className="text-gray-500">Loading {name}...</div>}>
                    <Comp />
                  </Suspense>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
