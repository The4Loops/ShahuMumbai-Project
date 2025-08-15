import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Trash2, X } from "lucide-react";

function ProductsTab() {
  const [products, setProducts] = useState([
    { id: 1, name: "Smartphone X200", category: "Electronics", price: "$699", stock: 42 },
    { id: 2, name: "Gaming Laptop Pro", category: "Computers", price: "$1,299", stock: 15 },
    { id: 3, name: "Wireless Earbuds", category: "Audio", price: "$129", stock: 87 },
    { id: 4, name: "4K Ultra HD TV", category: "Home Entertainment", price: "$999", stock: 0 },
  ]);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const getStatus = (stock) => {
    if (stock > 20) return { label: "In Stock", color: "bg-green-100 text-green-700" };
    if (stock > 0) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  };

  const handleEdit = (product) => {
    const newName = prompt("Edit product name:", product.name);
    if (newName && newName.trim() !== "") {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, name: newName } : p))
      );
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
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
          {products.map((product, index) => {
            const status = getStatus(product.stock);
            return (
              <motion.tr
                key={product.id}
                layoutId={product.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index === 0 ? "rounded-t-xl" : ""
                } ${index === products.length - 1 ? "rounded-b-xl border-b-0" : ""}`}
              >
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-400 text-white font-semibold">
                    {product.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="font-medium">{product.name || "Unknown"}</div>
                  </div>
                </td>

                <td className="px-4 py-3">{product.category || "—"}</td>
                <td className="px-4 py-3">{product.price || "—"}</td>
                <td className="px-4 py-3">{product.stock ?? "—"}</td>

                <td className="px-4 py-3">
                  <span className={`${status.color} text-sm px-2 py-1 rounded-full`}>
                    {status.label}
                  </span>
                </td>

                <td className="px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="p-1 rounded hover:bg-gray-100"
                    title="View"
                  >
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit size={18} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* View Modal */}
      <AnimatePresence>
        {selectedProduct && (
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
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Product Details</h2>
              <p><strong>Name:</strong> {selectedProduct.name}</p>
              <p><strong>Category:</strong> {selectedProduct.category}</p>
              <p><strong>Price:</strong> {selectedProduct.price}</p>
              <p><strong>Stock:</strong> {selectedProduct.stock}</p>
              <p><strong>Status:</strong> {getStatus(selectedProduct.stock).label}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default ProductsTab;