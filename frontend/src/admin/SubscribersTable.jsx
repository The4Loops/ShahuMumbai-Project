// tabs/SubscribersTable.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Download } from "lucide-react";

export default function SubscribersTable() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Dummy data
    setSubscribers([
      { id: 1, email: "john@example.com", subscribed_at: "2025-08-18T10:00:00Z" },
      { id: 2, email: "jane@example.com", subscribed_at: "2025-08-18T11:00:00Z" },
      { id: 3, email: "sam@example.com", subscribed_at: "2025-08-18T12:00:00Z" },
      { id: 4, email: "alex@example.com", subscribed_at: "2025-08-18T13:00:00Z" },
      { id: 5, email: "lisa@example.com", subscribed_at: "2025-08-18T14:00:00Z" },
      { id: 6, email: "mike@example.com", subscribed_at: "2025-08-18T15:00:00Z" },
    ]);
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this subscriber?")) return;
    setSubscribers(subscribers.filter((sub) => sub.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Email", "Subscribed At"];
    const rows = subscribers.map((s) => [
      s.id,
      s.email,
      new Date(s.subscribed_at).toLocaleString(),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "subscribers.csv";
    link.click();
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">📧 Newsletter Subscribers</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 mb-4 border rounded-lg"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Subscribed At</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedSubscribers.map((sub) => (
                <motion.tr
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="px-4 py-2">{sub.id}</td>
                  <td className="px-4 py-2">{sub.email}</td>
                  <td className="px-4 py-2">
                    {new Date(sub.subscribed_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
