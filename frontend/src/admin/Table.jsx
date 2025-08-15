import React, { useState } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

const chip = (text, color) => (
  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${color}`}>{text}</span>
);

const roleChip = (role) =>
  role === "admin"
    ? chip("admin", "bg-red-100 text-red-600")
    : role === "manager"
    ? chip("manager", "bg-blue-100 text-blue-600")
    : chip(role || "user", "bg-gray-100 text-gray-600");

const statusChip = (status) =>
  status === "active"
    ? chip("active", "bg-green-100 text-green-600")
    : chip(status || "—", "bg-gray-100 text-gray-600");

const Table = ({ data }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center p-6">No data available.</div>;
  }

  // Apply filter
  const filteredData = data.filter((row) => {
    const matchesFilter = filter === "all" || row.status === filter;
    const matchesSearch =
      row.name?.toLowerCase().includes(search.toLowerCase()) ||
      row.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or email..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Toggle Filter */}
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {/* User */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {row.avatar ? (
                      <img
                        className="w-10 h-10 rounded-full object-cover border"
                        src={row.avatar}
                        alt={row.name}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-medium">
                        {row.name?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{row.name}</div>
                      <div
                        className="text-xs text-gray-500 max-w-[200px] truncate"
                        title={row.email}
                      >
                        {row.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">{roleChip(row.role)}</td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">{statusChip(row.status)}</td>

                {/* Joined */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div>{row.joined}</div>
                  <div className="text-xs text-gray-400">Last: {row.last || "—"}</div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400 cursor-pointer">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="p-6 text-center text-gray-500">No matching results.</div>
        )}
      </div>
    </div>
  );
};

export default Table;
