import React, { useState } from "react";
import { Eye, Edit, Trash2, X, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BlogPage() {
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [editBlog, setEditBlog] = useState(null);
  const [deleteBlog, setDeleteBlog] = useState(null);
  const [addingBlog, setAddingBlog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    content: "",
    image: "",
  });
  const [search, setSearch] = useState("");

  const [blogs, setBlogs] = useState([
    {
      id: 1,
      title: "The Future of AI in 2025",
      author: "John Doe",
      content:
        "AI is shaping the world rapidly with advancements in machine learning, robotics, and automation...",
      image: "",
    },
    {
      id: 2,
      title: "Top 10 Web Development Trends",
      author: "Jane Smith",
      content:
        "From AI-driven design to Web3, here are the top trends developers should watch out for...",
      image: "",
    },
  ]);

  const handleSaveBlog = () => {
    if (editBlog) {
      setBlogs(
        blogs.map((b) =>
          b.id === editBlog.id ? { ...b, ...formData } : b
        )
      );
      setEditBlog(null);
    } else {
      setBlogs([
        ...blogs,
        { ...formData, id: blogs.length + 1 },
      ]);
      setAddingBlog(false);
    }
    setFormData({ title: "", author: "", content: "", image: "" });
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Blog Management</h1>
        <button
          onClick={() => setAddingBlog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Blog
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center border rounded-lg px-3 py-2 w-80 mb-6 bg-white shadow-sm">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search blogs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-2 w-full outline-none"
        />
      </div>

      {/* Blog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map((blog) => (
          <motion.div
            key={blog.id}
            layout
            className="bg-white rounded-xl shadow-md p-4 flex flex-col"
          >
            <img
              src={
                blog.image ||
                "https://via.placeholder.com/400x200?text=No+Image"
              }
              alt={blog.title}
              className="rounded-lg h-40 object-cover w-full"
            />
            <h2 className="mt-3 text-lg font-semibold">{blog.title}</h2>
            <p className="text-sm text-gray-500">by {blog.author}</p>
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {blog.content}
            </p>

            <div className="flex justify-between mt-4 text-gray-500">
              <button
                onClick={() => setSelectedBlog(blog)}
                className="hover:text-blue-600"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => {
                  setEditBlog(blog);
                  setFormData(blog);
                }}
                className="hover:text-green-600"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => setDeleteBlog(blog)}
                className="hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ---------------- ADD / EDIT BLOG MODAL ---------------- */}
      <AnimatePresence>
        {(editBlog || addingBlog) && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button
                onClick={() => {
                  setEditBlog(null);
                  setAddingBlog(false);
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>

              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {editBlog ? "Edit Blog" : "Add Blog"}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveBlog();
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  placeholder="Blog Title"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Author"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                />
                <textarea
                  placeholder="Content"
                  className="w-full border rounded-lg px-3 py-2"
                  rows="4"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />

                {/* Image Upload */}
                <div>
                  <label className="block mb-2 text-gray-600">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full border rounded-lg px-3 py-2"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {/* Preview */}
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="mt-3 rounded-lg h-32 object-cover w-full"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setEditBlog(null);
                      setAddingBlog(false);
                    }}
                    className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- VIEW BLOG MODAL ---------------- */}
      <AnimatePresence>
        {selectedBlog && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-lg w-full relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button
                onClick={() => setSelectedBlog(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>

              <img
                src={
                  selectedBlog.image ||
                  "https://via.placeholder.com/400x200?text=No+Image"
                }
                alt={selectedBlog.title}
                className="rounded-lg w-full h-48 object-cover"
              />
              <h2 className="mt-4 text-xl font-bold">{selectedBlog.title}</h2>
              <p className="text-sm text-gray-500">by {selectedBlog.author}</p>
              <p className="mt-3 text-gray-700">{selectedBlog.content}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- DELETE CONFIRM MODAL ---------------- */}
      <AnimatePresence>
        {deleteBlog && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Blog</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteBlog.title}</span>?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setDeleteBlog(null)}
                  className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setBlogs(blogs.filter((b) => b.id !== deleteBlog.id));
                    setDeleteBlog(null);
                  }}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow"
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
