import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, Search } from "lucide-react";

const BannerCards = () => {
  const [banners, setBanners] = useState([
    {
      id: 1,
      title: "Summer Sale",
      description: "Up to 50% off on electronics",
      status: "Active",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      title: "New Arrivals",
      description: "Check out the latest products",
      status: "Inactive",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 3,
      title: "Festive Offer",
      description: "Special discounts for Diwali",
      status: "Active",
      image: "https://via.placeholder.com/150",
    },
  ]);

  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Active",
    image: "",
  });
  const [search, setSearch] = useState("");

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData(banner);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: URL.createObjectURL(file),
      });
    }
  };

  const handleSave = () => {
    setBanners((prev) =>
      prev.map((b) => (b.id === editingBanner.id ? formData : b))
    );
    setEditingBanner(null);
  };

  // Filter banners by search text
  const filteredBanners = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Banners</h2>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search banners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.length > 0 ? (
          filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="border rounded-xl shadow-sm hover:shadow-md transition p-4 bg-white flex flex-col"
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="mt-3 flex-1">
                <h3 className="text-lg font-semibold">{banner.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{banner.description}</p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    banner.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {banner.status}
                </span>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleEdit(banner)}
                  className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No banners found
          </p>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingBanner && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Close button */}
              <button
                onClick={() => setEditingBanner(null)}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-semibold mb-4">Edit Banner</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Upload Image
                  </label>
                  <input type="file" onChange={handleImageChange} />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-24 h-24 mt-2 rounded-md object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BannerCards;
