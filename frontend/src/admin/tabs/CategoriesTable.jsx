import React, { useState, useEffect } from "react";
import { Eye, Edit, Trash2, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../supabase/axios";
import { toast } from "react-toastify";

export default function CategoriesTable() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle Edit Category
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const image = e.target.image.files[0]; // Get the image file

    if (!name) {
      toast.error("Category name is required");
      return;
    }

    try {
      let imageUrl = editCategory.image || ''; // Use existing image URL if no new image is uploaded

      // Handle image upload if a file is selected
      if (image) {
        const formData = new FormData();
        formData.append('image', image);

        const uploadResponse = await api.post('/api/upload/single', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
          imageUrl = uploadResponse.data.url; // Assuming the response contains the URL in data.url
        } else {
          throw new Error('Image upload failed');
        }
      }

      // Prepare payload for category update
      const payload = { name, image: imageUrl || undefined };

      await api.put(`/api/category/${editCategory.categoryid}`, payload);
      fetchCategories();
      setEditCategory(null);
      toast.success("Category updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update category");
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    try {
      await api.delete(`/api/category/${deleteCategory.categoryid}`);
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
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputBase =
    'w-full rounded-lg p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400';

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
                ID
              </th>
              <th className="px-4 py-3 text-gray-600 font-medium text-center">
                Category
              </th>
              <th className="px-4 py-3 text-gray-600 font-medium text-center">
                Products Count
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
                    <td className="px-4 py-5 flex items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                        {c.name[0]}
                      </div>
                      <span className="font-medium">{c.name}</span>
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
                      <button
                        onClick={() => setEditCategory(c)}
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
                  {selectedCategory.name[0]}
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

        {/* Edit Category Modal */}
        {editCategory && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handleSaveEdit}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-6 flex flex-col gap-5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg text-white">
                <Edit size={24} />
              </div>
              <button
                onClick={() => setEditCategory(null)}
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-gray-800 text-center">
                Edit Category
              </h2>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Category Name *
                  </label>
                  <input
                    name="name"
                    id="name"
                    type="text"
                    defaultValue={editCategory.name}
                    placeholder="Category Name"
                    className={`${inputBase} peer`}
                    required
                  />
                </div>
                <div className="relative">
                  <label
                    htmlFor="image"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Category Image (optional)
                  </label>
                  <input
                    name="image"
                    id="image"
                    type="file"
                    accept="image/*"
                    className={inputBase}
                  />
                  {editCategory.image && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current image:{" "}
                      <a
                        href={editCategory.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Upload a new image to replace the current one.
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white rounded-lg py-3 text-lg font-medium hover:bg-green-700 transition"
              >
                Save Changes
              </button>
            </motion.form>
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