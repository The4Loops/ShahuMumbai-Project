import React, { useState } from "react";
import { Eye, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

 function UserTab() {
  const [selectedBlog, setSelectedBlog] = useState(null);

  const Users = [
    {
      id: 1,
      name: "4 Loops",
      email: "4loops2025@gmail.com",
      role: "Admin",
      status: "Active",
      joined: "8/15/2025",
      last: "8/16/2025",
    },
    {
      id: 2,
      name: "Aman Gupta",
      email: "gaman0324@gmail.com",
      role: "User",
      status: "Active",
      joined: "8/15/2025",
      last: "8/15/2025",
    },
  ];

  const handleEdit = (blog) => {
    const newName = prompt("Edit user name:", blog.name);
    if (newName && newName.trim() !== "") {
      console.log("Updated blog name:", newName);
    }
  };

  const handleDelete = (blog) => {
    if (window.confirm(`Are you sure you want to delete "${blog.name}"?`)) {
      console.log("Deleted:", blog.name);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr className="text-left border-b border-gray-200">
            <th className="px-4 py-3 text-gray-600 font-medium">Users</th>
            <th className="px-4 py-3 text-gray-600 font-medium">Role</th>
            <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
            <th className="px-4 py-3 text-gray-600 font-medium">Joined</th>
            <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Users.map((b, index) => (
            <motion.tr
              key={b.id}
              layoutId={b.id}
              className={`border-b border-gray-100 hover:bg-gray-50 ${
                index === 0 ? "rounded-t-xl" : ""
              } ${index === Users.length - 1 ? "rounded-b-xl border-b-0" : ""}`}
            >
              {/* User */}
              <td className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-400 text-white font-semibold">
                  {b.name?.[0] || "?"}
                </div>
                <div>
                  <div className="font-medium">{b.name || "Unknown"}</div>
                  <div className="text-gray-500 text-sm">
                    {b.email || "No email"}
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="px-4 py-3">
                <span className="font-medium">{b.role || "N/A"}</span>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`${
                    b.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  } text-sm px-2 py-1 rounded-full`}
                >
                  {b.status || "Unknown"}
                </span>
              </td>

              {/* Joined */}
              <td className="px-4 py-3 text-sm">
                <div>{b.joined || "—"}</div>
                <div className="text-gray-400">Last: {b.last || "—"}</div>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => setSelectedBlog(b)}
                  className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
                  title="View"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleEdit(b)}
                  className="p-2 rounded-full hover:bg-green-100 text-green-600"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  className="p-2 rounded-full hover:bg-red-100 text-red-600"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* View Modal */}
      <AnimatePresence>
        {selectedBlog && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 w-96 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                onClick={() => setSelectedBlog(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold mb-4">User Details</h2>
              <p><strong>Name:</strong> {selectedBlog.name}</p>
              <p><strong>Email:</strong> {selectedBlog.email}</p>
              <p><strong>Role:</strong> {selectedBlog.role}</p>
              <p><strong>Status:</strong> {selectedBlog.status}</p>
              <p><strong>Joined:</strong> {selectedBlog.joined}</p>
              <p><strong>Last Active:</strong> {selectedBlog.last}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default UserTab;