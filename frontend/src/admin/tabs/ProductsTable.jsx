import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Trash2, X, Search } from "lucide-react";
import useSearch from "./useSearch";
import api from "../../supabase/axios";
import { useNavigate } from "react-router-dom";
import { useAdminActions } from "../AdminActionsContext";

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const { openProductEditor } = useAdminActions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [collectionsError, setCollectionsError] = useState(null);

  const navigate = useNavigate();

  const filteredProducts = useSearch(products, searchQuery, [
    "name",
    "category",
    "price",
  ]);

  const getStatus = (stock) => {
    if (stock > 20) return { label: "In Stock", color: "bg-green-100 text-green-700" };
    if (stock > 0) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  };

  const handleOpenEdit = (product) => {
    // Removed UUID check since ProductId is a number
    openProductEditor(product.id);
  };

  const handleSave = async () => {
    if (!modalProduct.name) return alert("Product name is required!");

    try {
      if (isEditing) {
        await api.put(`/api/products/${modalProduct.id}`, {
          ...modalProduct,
          collection_id: modalProduct.collection_id ?? null,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === modalProduct.id ? modalProduct : p))
        );
      } else {
        const { data } = await api.post(`/api/products`, {
          ...modalProduct,
          collection_id: modalProduct.collection_id ?? null,
        });
        setProducts((prev) => [data, ...prev]);
      }
      setModalProduct(null);
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save product.");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/products/${deleteProduct.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete product.");
    }
  };

  useEffect(() => {
    let alive = true;

    const fetchProductsAndCollections = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        setLoadingCollections(true);
        setCollectionsError(null);

        // Fetch products
        const { data: productData } = await api.get("/api/products");
        if (!alive) return;

        const productList = Array.isArray(productData)
          ? productData
          : productData?.items || [];
        setProducts(
          productList.map((p) => ({
            id: p.ProductId,
            name: p.Name,
            category: p.categories?.length > 0 ? p.categories[0].Name : "Uncategorized",
            price: `₹${p.Price.toFixed(2)}`,
            stock: p.Stock ?? 0,
            images: p.product_images || [], // Include images for view modal
            description: p.Description || "",
            shortDescription: p.ShortDescription || "",
            brand: p.BrandDesigner || "",
          }))
        );

        // Fetch collections
        const { data: collectionData } = await api.get("/api/collections");
        if (!alive) return;

        const collectionList = Array.isArray(collectionData)
          ? collectionData
          : collectionData?.items || [];
        setCollections(collectionList);
      } catch (e) {
        if (!alive) return;
        console.error("Load failed:", {
          url: (api.defaults?.baseURL || "") + e.response?.config?.url,
          status: e.response?.status,
          payload: e.response?.data,
          message: e.message,
        });
        if (e.response?.config?.url.includes("/api/products")) {
          setProductsError(e.response?.data?.message || "Failed to load products");
        } else if (e.response?.config?.url.includes("/api/collections")) {
          setCollectionsError(
            e.response?.data?.message || "Failed to load collections"
          );
        }
      } finally {
        if (alive) {
          setLoadingProducts(false);
          setLoadingCollections(false);
        }
      }
    };

    fetchProductsAndCollections();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-4">
      {/* Search */}
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
      </div>

      {/* Load/Error status */}
      {loadingProducts && (
        <div className="mb-3 text-sm text-gray-500">Loading products…</div>
      )}
      {productsError && (
        <div className="mb-3 text-sm text-red-600">{productsError}</div>
      )}

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
                          <div className="font-medium text-gray-700">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.price}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`${status.color} text-sm px-3 py-1 rounded-full font-medium shadow-sm`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="p-2 rounded hover:bg-gray-100 transition"
                          title="View"
                        >
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 rounded hover:bg-gray-100 transition"
                          title="Edit"
                        >
                          <Edit size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => setDeleteProduct(product)}
                          className="p-2 rounded hover:bg-gray-100 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="border p-4 text-center text-gray-500"
                  >
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
              <div
                key={product.id}
                className="bg-white rounded-lg shadow p-4 space-y-2 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {product.name}
                  </h3>
                  <span
                    className={`${status.color} text-xs px-2 py-1 rounded-full`}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  <strong>Category:</strong> {product.category}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>Price:</strong> {product.price}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>Stock:</strong> {product.stock}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="p-2 rounded hover:bg-gray-100 transition"
                  >
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="p-2 rounded hover:bg-gray-100 transition"
                  >
                    <Edit size={18} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => setDeleteProduct(product)}
                    className="p-2 rounded hover:bg-gray-100 transition"
                  >
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
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Name:</strong> {selectedProduct.name}
                </p>
                <p>
                  <strong>Brand:</strong> {selectedProduct.brand}
                </p>
                <p>
                  <strong>Category:</strong> {selectedProduct.category}
                </p>
                <p>
                  <strong>Price:</strong> {selectedProduct.price}
                </p>
                <p>
                  <strong>Stock:</strong> {selectedProduct.stock}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {getStatus(selectedProduct.stock).label}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProduct.description}
                </p>
                <p>
                  <strong>Short Description:</strong>{" "}
                  {selectedProduct.shortDescription}
                </p>
                {selectedProduct.images?.length > 0 && (
                  <div>
                    <strong>Images:</strong>
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {selectedProduct.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.image_url}
                          alt={selectedProduct.name}
                          className={`w-24 h-24 object-cover rounded-md ${
                            img.is_hero ? "border-2 border-blue-500" : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
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
              className="bg-white rounded-t-xl md:rounded-lg shadow-xl p-6 w-full md:w-96 relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button
                onClick={() => setModalProduct(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? "Edit Product" : "Add Product"}
              </h2>
              <div className="space-y-4">
                {["name", "brand", "category", "price", "stock", "description", "shortDescription"].map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="text-gray-600 font-medium capitalize mb-1">
                      {field}
                    </label>
                    <input
                      type={field === "stock" || field === "price" ? "number" : "text"}
                      value={modalProduct[field] ?? ""}
                      onChange={(e) =>
                        setModalProduct({
                          ...modalProduct,
                          [field]:
                            field === "stock" || field === "price"
                              ? parseFloat(e.target.value || "0")
                              : e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ))}
                <div className="flex flex-col">
                  <label className="text-gray-600 font-medium mb-1">
                    Collection
                  </label>
                  <select
                    value={modalProduct.collection_id || ""}
                    onChange={(e) =>
                      setModalProduct({
                        ...modalProduct,
                        collection_id: e.target.value || null,
                      })
                    }
                    disabled={loadingCollections}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">— None —</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {loadingCollections && (
                    <span className="text-xs text-gray-500 mt-1">
                      Loading collections…
                    </span>
                  )}
                  {collectionsError && (
                    <span className="text-xs text-red-600 mt-1">
                      {collectionsError}
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setModalProduct(null)}
                    className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
                  >
                    Save Changes
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
                Are you sure you want to delete{" "}
                <strong>{deleteProduct.name}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteProduct(null)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold"
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

export default ProductsTab;