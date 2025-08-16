import React, { useState } from "react";
import { Eye, Edit, Trash2, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesTable() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [addCategoryModal, setAddCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [categories, setCategories] = useState([
    { id: 1, name: "Electronics", products: 120, avatar: null },
    { id: 2, name: "Wearables", products: 45, avatar: null },
    { id: 3, name: "Gaming", products: 32, avatar: null },
  ]);

  // Handle Add
  const handleAddCategory = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const products = parseInt(e.target.products.value) || 0;
    const avatarFile = e.target.avatar.files[0];
    if (!name) return;

    const newCategory = {
      id: categories.length ? categories[categories.length - 1].id + 1 : 1,
      name,
      products,
      avatar: avatarFile ? URL.createObjectURL(avatarFile) : null,
    };
    setCategories([...categories, newCategory]);
    setAddCategoryModal(false);
  };

  // Handle Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    const newName = e.target.name.value.trim();
    const products = parseInt(e.target.products.value) || 0;
    const avatarFile = e.target.avatar.files[0];
    if (!newName) return;

    setCategories(
      categories.map((c) =>
        c.id === editCategory.id
          ? {
              ...c,
              name: newName,
              products,
              avatar: avatarFile
                ? URL.createObjectURL(avatarFile)
                : editCategory.avatar,
            }
          : c
      )
    );
    setEditCategory(null);
  };

  // Handle Delete
  const confirmDelete = () => {
    setCategories(categories.filter((c) => c.id !== deleteCategory.id));
    setDeleteCategory(null);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={() => setAddCategoryModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium">ID</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Category</th>
              <th className="px-4 py-3 text-gray-600 font-medium">
                Products Count
              </th>
              <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length ? (
              filteredCategories.map((c, index) => (
                <motion.tr
                  key={c.id}
                  layoutId={c.id}
                  className={`border-b border-gray-100 hover:bg-gray-50`}
                >
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        c.name[0]
                      )}
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </td>
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
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No categories found.
                </td>
              </tr>
            )}
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  {selectedCategory.avatar ? (
                    <img
                      src={selectedCategory.avatar}
                      alt={selectedCategory.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedCategory.name[0]
                  )}
                </div>
                <span className="font-medium text-lg">
                  {selectedCategory.name}
                </span>
              </div>
              <p>
                <strong>ID:</strong> {selectedCategory.id}
              </p>
              <p>
                <strong>Products:</strong> {selectedCategory.products}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Add Category Modal */}
        {addCategoryModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handleAddCategory}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-6 flex flex-col gap-5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white">
                <Plus size={24} />
              </div>
              <button
                onClick={() => setAddCategoryModal(false)}
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-gray-800 text-center">
                Add New Category
              </h2>

              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    placeholder="Category Name"
                    className="peer w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div className="relative">
                  <input
                    name="products"
                    type="number"
                    placeholder="Products Count"
                    min={0}
                    className="peer w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div>
                  <input
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="w-full text-gray-600 file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-2 file:rounded-lg hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg py-3 text-lg font-medium hover:bg-blue-700 transition"
              >
                Add Category
              </button>
            </motion.form>
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
                  <input
                    name="name"
                    type="text"
                    value={editCategory.name}
                    onChange={(e) =>
                      setEditCategory({ ...editCategory, name: e.target.value })
                    }
                    placeholder="Category Name "
                    className="peer w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                    required
                  />
                </div>
                <div className="relative">
                  <input
                    name="products"
                    type="number"
                    value={editCategory.products}
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        products: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Products Count"
                    min={0}
                    className="peer w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-600">
                    Category Image
                  </label>
                  <input
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="w-full text-gray-600 file:border-0 file:bg-green-50 file:text-green-700 file:px-3 file:py-2 file:rounded-lg hover:file:bg-green-100"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditCategory({
                          ...editCategory,
                          avatar: URL.createObjectURL(file),
                        });
                      }
                    }}
                  />
                  {editCategory.avatar && (
                    <img
                      src={editCategory.avatar}
                      alt="Preview"
                      className="mt-2 w-20 h-20 object-cover rounded-md border border-gray-300"
                    />
                  )}
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
