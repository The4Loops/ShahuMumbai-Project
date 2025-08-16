import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Trash2, X, Search, Plus } from "lucide-react";
import useSearch from "./useSearch";

function ProductsTab() {
  const [products, setProducts] = useState([
    { id: 1, name: "Smartphone X200", category: "Electronics", price: "$699", stock: 42 },
    { id: 2, name: "Gaming Laptop Pro", category: "Computers", price: "$1,299", stock: 15 },
    { id: 3, name: "Wireless Earbuds", category: "Audio", price: "$129", stock: 87 },
    { id: 4, name: "4K Ultra HD TV", category: "Home Entertainment", price: "$999", stock: 0 },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalProduct, setModalProduct] = useState(null); // Add/Edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null); // Delete confirmation

  const filteredProducts = useSearch(products, searchQuery, ["name", "category", "price"]);

  const getStatus = (stock) => {
    if (stock > 20) return { label: "In Stock", color: "bg-green-100 text-green-700" };
    if (stock > 0) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  };

  const handleOpenAdd = () => {
    setModalProduct({ name: "", category: "", price: "", stock: 0 });
    setIsEditing(false);
  };

  const handleOpenEdit = (product) => {
    setModalProduct({ ...product });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!modalProduct.name) return alert("Product name is required!");
    if (isEditing) {
      setProducts((prev) =>
        prev.map((p) => (p.id === modalProduct.id ? modalProduct : p))
      );
    } else {
      const newProduct = {
        ...modalProduct,
        id: products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setModalProduct(null);
  };

  const confirmDelete = () => {
    setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
    setDeleteProduct(null);
  };

  return (
    <div className="p-4">
      {/* Search + Add */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex flex-1 items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full focus:outline-none"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-semibold"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium">Product</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Category</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Price</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Stock</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const status = getStatus(product.stock);
                  return (
                    <motion.tr
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`border-b border-gray-100 transition hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-400 text-white font-semibold shadow">
                          {product.name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.category}</td>
                      <td className="px-4 py-3 text-gray-600">{product.price}</td>
                      <td className="px-4 py-3 text-gray-600">{product.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`${status.color} text-sm px-3 py-1 rounded-full font-medium shadow-sm`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button onClick={() => setSelectedProduct(product)} className="p-2 rounded hover:bg-gray-100 transition" title="View">
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button onClick={() => handleOpenEdit(product)} className="p-2 rounded hover:bg-gray-100 transition" title="Edit">
                          <Edit size={18} className="text-green-600" />
                        </button>
                        <button onClick={() => setDeleteProduct(product)} className="p-2 rounded hover:bg-gray-100 transition" title="Delete">
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="border p-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const status = getStatus(product.stock);
            return (
              <div key={product.id} className="bg-white rounded-lg shadow p-4 space-y-2 border border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <span className={`${status.color} text-xs px-2 py-1 rounded-full`}>{status.label}</span>
                </div>
                <p className="text-gray-600 text-sm"><strong>Category:</strong> {product.category}</p>
                <p className="text-gray-600 text-sm"><strong>Price:</strong> {product.price}</p>
                <p className="text-gray-600 text-sm"><strong>Stock:</strong> {product.stock}</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setSelectedProduct(product)} className="p-2 rounded hover:bg-gray-100 transition">
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  <button onClick={() => handleOpenEdit(product)} className="p-2 rounded hover:bg-gray-100 transition">
                    <Edit size={18} className="text-green-600" />
                  </button>
                  <button onClick={() => setDeleteProduct(product)} className="p-2 rounded hover:bg-gray-100 transition">
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No products found</p>
        )}
      </div>

      {/* View Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-xl md:rounded-lg shadow-xl p-6 w-full md:w-96 relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Name:</strong> {selectedProduct.name}</p>
                <p><strong>Category:</strong> {selectedProduct.category}</p>
                <p><strong>Price:</strong> {selectedProduct.price}</p>
                <p><strong>Stock:</strong> {selectedProduct.stock}</p>
                <p><strong>Status:</strong> {getStatus(selectedProduct.stock).label}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {modalProduct && (
          <motion.div
            className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-xl md:rounded-xl shadow-xl p-6 w-full md:w-96 relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button onClick={() => setModalProduct(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Product" : "Add Product"}</h2>
              <div className="space-y-4">
                {["name", "category", "price", "stock"].map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-gray-600 font-medium capitalize mb-1">{field}</label>
                    <input
                      type={field === "stock" ? "number" : "text"}
                      value={modalProduct[field]}
                      onChange={(e) =>
                        setModalProduct({
                          ...modalProduct,
                          [field]: field === "stock" ? parseInt(e.target.value) : e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setModalProduct(null)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold">
                    {isEditing ? "Save Changes" : "Add Product"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteProduct && (
          <motion.div
            className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-xl md:rounded-xl shadow-xl p-6 w-full md:w-80 relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4">Delete Product</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{deleteProduct.name}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteProduct(null)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold">
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

export default ProductsTab;
