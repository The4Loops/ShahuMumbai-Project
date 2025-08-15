import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";

export default function BannerCards() {
  const [banners, setBanners] = useState([
    {
      id: "1",
      title: "Summer Sale – Up to 50% Off",
      status: "Active",
      created: "8/05/2025",
      updated: "8/14/2025",
      link: "https://example.com/summer",
      image:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "2",
      title: "New Arrivals • Wearables",
      status: "Scheduled",
      created: "8/10/2025",
      updated: "8/15/2025",
      link: "https://example.com/wearables",
      image:
        "https://images.unsplash.com/photo-1518443952249-9d55d73eba0d?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "3",
      title: "Gaming Weekend Deals",
      status: "Inactive",
      created: "7/28/2025",
      updated: "8/01/2025",
      link: "https://example.com/gaming",
      image:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    },
  ]);

  const [viewBanner, setViewBanner] = useState(null);
  const [editBanner, setEditBanner] = useState(null);
  const [form, setForm] = useState({ title: "", status: "", link: "", image: "" });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(banners);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setBanners(reordered);
  };

  const handleEditClick = (banner) => {
    setEditBanner(banner);
    setForm({
      title: banner.title,
      status: banner.status,
      link: banner.link,
      image: banner.image,
    });
  };

  const handleSave = () => {
    setBanners((prev) =>
      prev.map((b) =>
        b.id === editBanner.id
          ? { ...b, ...form, updated: new Date().toLocaleDateString() }
          : b
      )
    );
    setEditBanner(null);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-lg font-bold mb-4">Banners</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="banner-list" direction="horizontal">
          {(provided) => (
            <div
              className="flex gap-4 flex-wrap"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {banners.map((banner, index) => (
                <Draggable key={banner.id} draggableId={banner.id} index={index}>
  {(provided) => (
    <div
      className="bg-white shadow-sm rounded-xl w-64 p-3 flex flex-col relative group hover:shadow-md hover:scale-[1.02] transition-transform duration-200"
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <div className="relative">
        <img
          src={banner.image}
          alt={banner.title}
          className="rounded-lg w-full h-32 object-cover"
        />

        {/* Gradient & Blur Overlay */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-200" />

        {/* Hover Action Buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setViewBanner(banner)}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
          >
            View
          </button>
          <button
            onClick={() => handleEditClick(banner)}
            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-full shadow hover:bg-green-600 transition"
          >
            Edit
          </button>
          <button
            onClick={() =>
              setBanners((prev) => prev.filter((b) => b.id !== banner.id))
            }
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Card Info */}
      <p className="mt-3 font-semibold text-gray-800 line-clamp-2">
        {banner.title}
      </p>
      <span
        className={`text-xs px-2 py-1 mt-1 rounded-full w-fit ${
          banner.status === "Active"
            ? "bg-green-100 text-green-700"
            : banner.status === "Scheduled"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {banner.status}
      </span>
      <p className="text-xs text-gray-500 mt-2">Created: {banner.created}</p>
      <p className="text-xs text-gray-500">Updated: {banner.updated}</p>
      <a
        href={banner.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 text-sm mt-1 hover:underline"
      >
        View Link
      </a>
    </div>
  )}
</Draggable>

              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* View Modal */}
      <AnimatePresence>
        {viewBanner && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-5 max-w-lg w-full shadow-lg relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button
                onClick={() => setViewBanner(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <img
                src={viewBanner.image}
                alt={viewBanner.title}
                className="rounded-lg w-full h-56 object-cover"
              />
              <h3 className="mt-3 text-lg font-bold">{viewBanner.title}</h3>
              <span
                className={`text-xs px-2 py-1 mt-1 rounded-full inline-block ${
                  viewBanner.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : viewBanner.status === "Scheduled"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {viewBanner.status}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                Created: {viewBanner.created}
              </p>
              <p className="text-sm text-gray-500">
                Updated: {viewBanner.updated}
              </p>
              <a
                href={viewBanner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm mt-2 inline-block hover:underline"
              >
                Visit Link
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editBanner && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-5 max-w-lg w-full shadow-lg relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button
                onClick={() => setEditBanner(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold mb-4">Edit Banner</h3>
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded p-2 mb-2"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded p-2 mb-2"
              >
                <option>Active</option>
                <option>Scheduled</option>
                <option>Inactive</option>
              </select>
              <input
                type="text"
                placeholder="Link"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full border rounded p-2 mb-2"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full border rounded p-2 mb-2"
              />
              <button
                onClick={handleSave}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                Save Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
