import React, { useState, lazy, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import { Box, Users, Tag, Image as ImageIcon, MessageSquare, FileText } from "lucide-react";

// Lazy load all tab components
const ProductsTable = lazy(() => import("./tabs/ProductsTable"));
const UsersTable = lazy(() => import("./tabs/UsersTable"));
const CategoriesTable = lazy(() => import("./tabs/CategoriesTable"));
const BannersTable = lazy(() => import("./tabs/BannersTable"));
const ReviewsTable = lazy(() => import("./tabs/ReviewsTable"));
const BlogsTable = lazy(() => import("./tabs/BlogsTable"));

const tabs = [
  { name: "Products", icon: Box },
  { name: "Users", icon: Users },
  { name: "Categories", icon: Tag },
  { name: "Banners", icon: ImageIcon },
  { name: "Reviews", icon: MessageSquare },
  { name: "Blogs", icon: FileText },
];

const tabComponents = {
  Products: ProductsTable,
  Users: UsersTable,
  Categories: CategoriesTable,
  Banners: BannersTable,
  Reviews: ReviewsTable,
  Blogs: BlogsTable,
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

  // For the animated pill highlight (doesn't change header height)
  const highlightTransition = { type: "spring", stiffness: 300, damping: 26 };

  return (
    <div className="w-full">
      {/* Tabs header (sticky optional) */}
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
        {/* optional min-height so fallback doesn't jiggle */}
        <div className="min-h-[200px]">
          {tabs.map(({ name }) => {
            if (!visited.has(name)) return null; // mount only after first visit
            const Comp = tabComponents[name];

            return (
              <div
                key={name}
                // Hide inactive panels without unmounting
                className={activeTab === name ? "block" : "hidden"}
              >
                {/* Gentle fade-in for new tab first mount only */}
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
