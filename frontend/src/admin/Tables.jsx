import React, { useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  { name: "Blogs", icon: FileText }
];

const tabComponents = {
  Products: ProductsTable,
  Users: UsersTable,
  Categories: CategoriesTable,
  Banners: BannersTable,
  Reviews: ReviewsTable,
  Blogs: BlogsTable
};

export default function Tables() {
  const [activeTab, setActiveTab] = useState("Products");
  const ActiveComponent = tabComponents[activeTab] || ProductsTable;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 p-4 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full border transition font-medium ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-100 border border-blue-300 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <Icon size={18} />
              <span className="relative z-10">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Table with Fade Animation */}
      <div className="p-4">
        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Suspense fallback={<div className="text-gray-500">Loading {activeTab}...</div>}>
              <ActiveComponent />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
