// src/components/WaitlistLayout.jsx
import React, { useState } from "react";
import Layout from "../layout/Layout";

const dummyWaitlist = [
  { id: 1, email: "alex@example.com", product: "PlayStation 5" },
  { id: 2, email: "sara@example.com", product: "Xbox Series X" },
  { id: 3, email: "john@example.com", product: "Nintendo Switch" },
  { id: 4, email: "mia@example.com", product: "Nvidia RTX 4090" },
  { id: 5, email: "david@example.com", product: "PlayStation 5" },
  { id: 6, email: "lisa@example.com", product: "Xbox Series X" },
];

const WaitlistLayout = () => {
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("All");

  // Get unique product names for the filter dropdown
  const products = ["All", ...new Set(dummyWaitlist.map((w) => w.product))];

  // Filtered waitlist based on search and product filter
  const filteredWaitlist = dummyWaitlist.filter((entry) => {
    const matchesSearch = entry.email
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesProduct =
      filterProduct === "All" || entry.product === filterProduct;
    return matchesSearch && matchesProduct;
  });

  return (
    <Layout>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
        Product Waitlist
      </h1>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center items-center">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full sm:w-64"
        />
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-black w-full sm:w-48"
        >
          {products.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </div>

      {/* Total Count */}
      <p className="text-center mb-6 text-gray-700  font-medium">
        Total waitlist entries: {filteredWaitlist.length}
      </p>

      {/* Waitlist Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredWaitlist.length > 0 ? (
          filteredWaitlist.map((entry, index) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl shadow-md bg-white dark:bg-gray-800 flex flex-col gap-3 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  #{index + 1}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100">
                  {entry.product}
                </span>
              </div>

              <p className="text-gray-900 dark:text-white font-semibold">
                {entry.email}
              </p>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
            No waitlist entries found.
          </p>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default WaitlistLayout;
