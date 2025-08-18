// tabs/SubscribersTable.jsx
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Download, ChevronUp, ChevronDown } from "lucide-react";

export default function SubscribersTable() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const itemsPerPage = 5;

  useEffect(() => { setSubscribers([
  { id: 1, email: "john@example.com", subscribed_at: "2025-08-18T10:00:00Z" },
  { id: 2, email: "jane@example.com", subscribed_at: "2025-08-18T11:00:00Z" },
  { id: 3, email: "sam@example.com", subscribed_at: "2025-08-18T12:00:00Z" },
  { id: 4, email: "alex@example.com", subscribed_at: "2025-08-18T13:00:00Z" },
  { id: 5, email: "lisa@example.com", subscribed_at: "2025-08-18T14:00:00Z" },
  { id: 6, email: "mike@example.com", subscribed_at: "2025-08-18T15:00:00Z" },
  { id: 7, email: "emma@example.com", subscribed_at: "2025-08-19T09:30:00Z" },
  { id: 8, email: "oliver@example.com", subscribed_at: "2025-08-19T10:45:00Z" },
  { id: 9, email: "ava@example.com", subscribed_at: "2025-08-20T08:15:00Z" },
  { id: 10, email: "liam@example.com", subscribed_at: "2025-08-20T12:00:00Z" },
  { id: 11, email: "sophia@example.com", subscribed_at: "2025-08-21T14:20:00Z" },
  { id: 12, email: "noah@example.com", subscribed_at: "2025-08-21T16:40:00Z" },
  { id: 13, email: "mia@example.com", subscribed_at: "2025-08-22T11:00:00Z" },
  { id: 14, email: "lucas@example.com", subscribed_at: "2025-08-22T13:15:00Z" },
  { id: 15, email: "isabella@example.com", subscribed_at: "2025-08-23T09:50:00Z" },
  { id: 16, email: "ethan@example.com", subscribed_at: "2025-08-23T15:30:00Z" },
  { id: 17, email: "charlotte@example.com", subscribed_at: "2025-08-24T10:10:00Z" },
  { id: 18, email: "mason@example.com", subscribed_at: "2025-08-24T12:45:00Z" },
  { id: 19, email: "amelia@example.com", subscribed_at: "2025-08-25T08:25:00Z" },
  { id: 20, email: "logan@example.com", subscribed_at: "2025-08-25T14:55:00Z" }
]);}, []);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this subscriber?")) return;
    setSubscribers(subscribers.filter((sub) => sub.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Email", "Date", "Time"];
    const rows = filteredSubscribers.map((s) => {
      const date = new Date(s.subscribed_at);
      const formattedDate = `${String(date.getDate()).padStart(
        2,
        "0"
      )}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
      const formattedTime = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return [s.id, s.email, formattedDate, formattedTime];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "subscribers.csv";
    link.click();
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedSubscribers = useMemo(() => {
    let sortableSubs = [...subscribers];
    if (sortConfig.key) {
      sortableSubs.sort((a, b) => {
        const dateA = new Date(a.subscribed_at);
        const dateB = new Date(b.subscribed_at);

        if (sortConfig.key === "date") {
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        } else if (sortConfig.key === "time") {
          const minutesA = dateA.getHours() * 60 + dateA.getMinutes();
          const minutesB = dateB.getHours() * 60 + dateB.getMinutes();
          return sortConfig.direction === "asc"
            ? minutesA - minutesB
            : minutesB - minutesA;
        }
        return 0;
      });
    }
    return sortableSubs;
  }, [subscribers, sortConfig]);

  const filteredSubscribers = useMemo(() => {
    const filtered = sortedSubscribers.filter((sub) => {
      const matchesEmail = sub.email
        .toLowerCase()
        .includes(search.toLowerCase());
      const subDate = new Date(sub.subscribed_at).toISOString().split("T")[0];

      const matchesFrom = filterFrom ? subDate >= filterFrom : true;
      const matchesTo = filterTo ? subDate <= filterTo : true;

      return matchesEmail && matchesFrom && matchesTo;
    });

    setCurrentPage(1);
    return filtered;
  }, [search, sortedSubscribers, filterFrom, filterTo]);

  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  const clearFilters = () => {
    setSearch("");
    setFilterFrom("");
    setFilterTo("");
  };

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

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <div className="flex gap-1">
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <span className="flex items-center px-1 text-gray-500">to</span>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={clearFilters}
          className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort("date")}
              >
                Date <SortIcon column="date" />
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => requestSort("time")}
              >
                Time <SortIcon column="time" />
              </th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedSubscribers.map((sub) => {
                const date = new Date(sub.subscribed_at);
                const formattedDate = `${String(date.getDate()).padStart(
                  2,
                  "0"
                )}-${String(date.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${date.getFullYear()}`;
                const formattedTime = date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="px-4 py-2">{sub.id}</td>
                    <td className="px-4 py-2">{sub.email}</td>
                    <td className="px-4 py-2">{formattedDate}</td>
                    <td className="px-4 py-2">{formattedTime}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

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
