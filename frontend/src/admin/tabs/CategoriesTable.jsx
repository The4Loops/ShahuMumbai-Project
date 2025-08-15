import React, { useState } from "react";
import { Eye, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesTable() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { id: 1, name: "Electronics", products: 120 },
    { id: 2, name: "Wearables", products: 45 },
    { id: 3, name: "Gaming", products: 32 },
  ];

  const handleEdit = (cat) => {
    const newName = prompt("Edit category name:", cat.name);
    if (newName && newName.trim() !== "") {
      console.log("Updated category name:", newName);
    }
  };

  const handleDelete = (cat) => {
    if (window.confirm(`Are you sure you want to delete "${cat.name}"?`)) {
      console.log("Deleted:", cat.name);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Categories</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium">ID</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Category Name</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Products Count</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, index) => (
              <motion.tr
                key={c.id}
                layoutId={c.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index === 0 ? "rounded-t-xl" : ""
                } ${index === categories.length - 1 ? "rounded-b-xl border-b-0" : ""}`}
              >
                <td className="px-4 py-3">{c.id}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.products}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory(c)}
                    className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-2 rounded-full hover:bg-green-100 text-green-600"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
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
        {selectedCategory && (
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
                onClick={() => setSelectedCategory(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Category Details</h2>
              <p><strong>ID:</strong> {selectedCategory.id}</p>
              <p><strong>Name:</strong> {selectedCategory.name}</p>
              <p><strong>Products:</strong> {selectedCategory.products}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
