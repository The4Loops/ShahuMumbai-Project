// src/admin/tabs/BlogsTable.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../supabase/axios";
import { toast } from "react-toastify";

// You can replace this with any hosted placeholder image you prefer
const FALLBACK_IMAGE =
  "";

function BlogsTable() {
  const [blogs, setBlogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 6;

  const [selectedBlog, setSelectedBlog] = useState(null);

  const navigate = useNavigate();

  // Fetch blogs
  const fetchBlogs = async () => {
    setLoading(true);
    toast.dismiss();
    try {
      const response = await api.get("/api/blogs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBlogs(response.data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error(error.response?.data?.message || "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Delete blog
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      await api.delete(`/api/admin/blogs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Blog deleted successfully!");
      fetchBlogs();
      setSelectedBlog(null);
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error(error.response?.data?.message || "Failed to delete blog");
    }
  };

  // Filter blogs
  const filteredBlogs =
    statusFilter === "All"
      ? blogs
      : blogs.filter((b) => b.status === statusFilter);

  // Pagination
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  // Helper to build full image URL from backend
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path; // already full URL
    return `${
      process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"
    }/${path}`;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Blogs</h2>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label className="font-medium">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="All">All</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <p>Loading blogs...</p>
      ) : currentBlogs.length === 0 ? (
        <p>No blogs found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentBlogs.map((blog) => {
            const imageUrl = getImageUrl(blog.cover_image);
            return (
              <div
                key={blog.id}
                className="cursor-pointer border rounded-xl shadow-md hover:shadow-lg transition p-5 bg-white flex flex-col"
                onClick={() => setSelectedBlog(blog)}
              >
                {/* Blog Image */}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={blog.title}
                    className="w-full h-40 object-cover rounded-md mb-3"
                  />
                ) : (
                  ""
                )}

                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  By {blog.author || "Unknown"}
                </p>

                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {blog.excerpt || blog.content?.slice(0, 150) + "..."}
                </p>

                <div className="mt-auto flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      blog.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {blog.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedBlog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setSelectedBlog(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image at top */}
            <img
              src={getImageUrl(selectedBlog.cover_image)}
              alt={selectedBlog.title}
              className="w-full h-64 object-cover rounded-t-xl"
            />

            {/* Scrollable content */}
            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="text-2xl font-bold mb-3">{selectedBlog.title}</h2>
              <p className="text-gray-600 mb-2">
                By {selectedBlog.author || "Unknown"} •{" "}
                {new Date(selectedBlog.created_at).toLocaleDateString()}
              </p>
              <div className="text-sm text-gray-800 whitespace-pre-line">
                {selectedBlog.content}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-6 p-6 border-t text-sm font-medium">
              <span
                onClick={() =>
                  navigate(`/admin/addblogpost/${selectedBlog.id}`, {
                    state: { blog: selectedBlog },
                  })
                }
                className="cursor-pointer text-blue-600 hover:underline"
              >
                Edit
              </span>
              <span
                onClick={() => handleDelete(selectedBlog.id)}
                className="cursor-pointer text-red-600 hover:underline"
              >
                Delete
              </span>
              <span
                onClick={() => setSelectedBlog(null)}
                className="cursor-pointer text-gray-600 hover:underline"
              >
                Close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogsTable;
