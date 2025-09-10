import React, { useState, useEffect } from "react";
import { Eye, Edit, Trash2, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../supabase/axios";
import { toast } from "react-toastify";
import { useAdminActions } from "../AdminActionsContext"; // ✅ use the shared context

export default function CategoriesTable() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { openCategoryEditor } = useAdminActions(); // ✅ get the opener

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const { data } = await api.get("/api/category");
      setCategories(Array.isArray(data) ? data : data?.categories || []);
    } catch (err) {
      setCategoriesError(
        err?.response?.data?.message || "Failed to fetch categories"
      );
      toast.error(err?.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Delete
  const confirmDelete = async () => {
    try {
      await api.delete(`/api/category/${deleteCategory.categoryid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCategories((prev) =>
        prev.filter((c) => c.categoryid !== deleteCategory.categoryid)
      );
      setDeleteCategory(null);
      toast.success("Category deleted successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputBase =
    "w-full rounded-lg p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400";

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="relative flex-1 flex items-center border border-gray-300 rounded-md px-3 py-2">
          <Search size={18} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full focus:outline-none"
          />
        </div>
      </div>

      {/* Load/Error Status */}
      {loadingCategories && (
        <div className="mb-3 text-sm text-gray-500">Loading categories...</div>
      )}
      {categoriesError && (
        <div className="mb-3 text-sm text-red-600">{categoriesError}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium text-center">
                #
              </th>
              <th className="px-4 py-3 text-gray-600 font-medium">
                Category
              </th>
              <th className="px-4 py-3 text-gray-600 font-medium text-center">
                Products
              </th>
              <th className="px-4 py-3 text-gray-600 font-medium text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredCategories.length ? (
                filteredCategories.map((c, index) => (
                  <motion.tr
                    key={c.categoryid}
                    layoutId={c.categoryid}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-gray-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center align-middle">
                      {index + 1}
                    </td>

                    {/* Category cell with avatar/thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                          {c?.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(c.name || "?")[0]}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">
                            {c.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center align-middle">
                      {c.products_count}
                    </td>

                    <td className="px-4 py-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedCategory(c)}
                        className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>

                      {/* ✅ open AddCategory panel with this ID */}
                      <button
                        onClick={() => openCategoryEditor(c.categoryid)}
                        className="p-2 rounded-full hover:bg-green-100 text-green-600"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => setDeleteCategory(c)}
                        className="p-2 rounded-full hover:bg-red-100 text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* View Modal */}
        {selectedCategory && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative"
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
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  {selectedCategory?.image ? (
                    <img
                      src={selectedCategory.image}
                      alt={selectedCategory.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(selectedCategory.name || "?")[0]}</span>
                  )}
                </div>
                <span className="font-medium text-lg">
                  {selectedCategory.name}
                </span>
              </div>
              <p>
                <strong>ID:</strong> {selectedCategory.categoryid}
              </p>
              <p>
                <strong>Products Count:</strong>{" "}
                {selectedCategory.products_count}
              </p>
              {selectedCategory.image && (
                <p>
                  <strong>Image:</strong>{" "}
                  <a
                    href={selectedCategory.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Image
                  </a>
                </p>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteCategory && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 w-80 relative flex flex-col gap-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                onClick={() => setDeleteCategory(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold">Delete Category</h2>
              <p>Are you sure you want to delete "{deleteCategory.name}"?</p>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setDeleteCategory(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
