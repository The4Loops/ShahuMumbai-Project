import React from "react";
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
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center p-6">No data available.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {/* User column with avatar + truncating email */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {row.avatar ? (
                    <img className="w-10 h-10 rounded-full object-cover border" src={row.avatar} alt={row.name} />
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

              {/* Role badge */}
              <td className="px-6 py-4 whitespace-nowrap">{roleChip(row.role)}</td>

              {/* Status badge */}
              <td className="px-6 py-4 whitespace-nowrap">{statusChip(row.status)}</td>

              {/* Joined column */}
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
    </div>
  );
};

export default Table;
