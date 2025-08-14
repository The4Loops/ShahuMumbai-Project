import React from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid"; // For the 3-dot action menu

const Table = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center p-6">No data available.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {/* User column with avatar */}
              <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-medium">
                  {row.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{row.name}</div>
                  <div className="text-xs text-gray-500">{row.email}</div>
                </div>
              </td>

              {/* Role badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    row.role === "admin"
                      ? "bg-red-100 text-red-600"
                      : row.role === "manager"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {row.role}
                </span>
              </td>

              {/* Status badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                  {row.status}
                </span>
              </td>

              {/* Joined column */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>{row.joined}</div>
                <div className="text-xs text-gray-400">Last: {row.last || "Invalid Date"}</div>
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
