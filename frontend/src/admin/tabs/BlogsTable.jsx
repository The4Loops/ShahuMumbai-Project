import React, { useState } from "react";
import { Eye, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BlogPage() {
  const [selectedBlog, setSelectedBlog] = useState(null);

  const blogs = [
    {
      id: 1,
      title: "The Future of AI in 2025",
      author: "John Doe",
      category: "Technology",
      status: "Published",
      created: "8/10/2025",
      updated: "8/15/2025",
    },
    {
      id: 2,
      title: "10 Tips for a Healthy Lifestyle",
      author: "Jane Smith",
      category: "Health",
      status: "Draft",
      created: "8/12/2025",
      updated: "8/14/2025",
    },
  ];

  const handleEdit = (blog) => {
    const newTitle = prompt("Edit blog title:", blog.title);
    if (newTitle && newTitle.trim() !== "") {
      console.log("Updated blog title:", newTitle);
    }
  };

  const handleDelete = (blog) => {
    if (window.confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      console.log("Deleted:", blog.title);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Blog Management</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Author</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Category</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Created</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b, index) => (
              <motion.tr
                key={b.id}
                layoutId={b.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index === 0 ? "rounded-t-xl" : ""
                } ${index === blogs.length - 1 ? "rounded-b-xl border-b-0" : ""}`}
              >
                {/* Title */}
                <td className="px-4 py-3 font-medium">{b.title}</td>

                {/* Author */}
                <td className="px-4 py-3">{b.author}</td>

                {/* Category */}
                <td className="px-4 py-3">{b.category}</td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`${
                      b.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    } text-sm px-2 py-1 rounded-full`}
                  >
                    {b.status}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-3 text-sm">
                  <div>{b.created}</div>
                  <div className="text-gray-400">Updated: {b.updated}</div>
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
      </div>

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
              <h2 className="text-lg font-semibold mb-4">Blog Details</h2>
              <p><strong>Title:</strong> {selectedBlog.title}</p>
              <p><strong>Author:</strong> {selectedBlog.author}</p>
              <p><strong>Category:</strong> {selectedBlog.category}</p>
              <p><strong>Status:</strong> {selectedBlog.status}</p>
              <p><strong>Created:</strong> {selectedBlog.created}</p>
              <p><strong>Updated:</strong> {selectedBlog.updated}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
