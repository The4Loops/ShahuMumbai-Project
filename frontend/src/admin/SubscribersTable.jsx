import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Download, ChevronUp, ChevronDown } from "lucide-react";
import api from "../supabase/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SubscribersTable() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const itemsPerPage = 5;

  // Fetch subscribers on mount
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await api.get("/api/subscriber");
        // Map API response to match expected subscriber structure
        const transformedSubscribers = response.data.users.map((user) => ({
          id: user.id,
          email: user.email,
          subscribed_at: `${user.updated_date} ${user.updated_time}`, // Combine date and time
        }));
        setSubscribers(transformedSubscribers);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to fetch subscribers");
      }
    };

    fetchSubscribers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Unsubscribe this user from the newsletter?")) return;

    try {
      await api.delete(`/api/subscriber/${id}`);
      setSubscribers(subscribers.filter((sub) => sub.id !== id));
      toast.success("User unsubscribed successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to unsubscribe user");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Email", "Date", "Time"];
    const rows = filteredSubscribers.map((s) => {
      const date = new Date(s.subscribed_at);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      const formattedTime = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).toLowerCase();
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
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
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
      const subDate = new Date(sub.subscribed_at);

      const matchesFrom = filterFrom
        ? subDate >= new Date(filterFrom)
        : true;
      const matchesTo = filterTo
        ? subDate <= new Date(filterTo + "T23:59:59")
        : true;

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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
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
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                const formattedTime = date.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                }).toLowerCase();

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