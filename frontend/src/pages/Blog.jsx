import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaClock,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { jwtDecode } from "jwt-decode";
import api from "../supabase/axios";
import Layout from "../layout/Layout";
import { Link } from "react-router-dom";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [userId, setUserId] = useState(null);
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [fullName, setFullName] = useState(null);

  const categories = [
    "Announcements",
    "Guides",
    "Releases",
    "Behind the Scenes",
  ];

  // Initialize user
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const name =
          decoded.user_metadata?.fullname ||
          decoded.fullname ||
          decoded.email ||
          "Anonymous";
        setFullName(name);
        setUserId(decoded.sub || storedUserId || uuidv4());
      } catch (err) {
        console.error("Error decoding token:", err);
        setFullName(null);
      }
    } else {
      setFullName(null);
    }

    if (!storedUserId && !token) {
      const newUserId = uuidv4();
      localStorage.setItem("user_id", newUserId);
      setUserId(newUserId);
    } else if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch blogs and likes
  useEffect(() => {
    if (!userId) return;
    const fetchBlogsAndLikes = async () => {
      try {
        const blogsResponse = await api.get("/api/blogs");
        setBlogs(blogsResponse.data);

        const likesResponse = await api.get(
          `/api/user/likes?user_id=${userId}`
        );
        setLikedBlogs(likesResponse.data.likedBlogIds || []);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to load blogs or likes. Please try again.");
      }
    };
    fetchBlogsAndLikes();
  }, [userId]);

  const filteredBlogs = blogs
    .filter(
      (blog) =>
        (blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter ? blog.category === categoryFilter : true)
    )
    .sort((a, b) =>
      sortOrder === "Newest First"
        ? new Date(b.publish_at) - new Date(a.publish_at)
        : new Date(a.publish_at) - new Date(b.publish_at)
    );

  const handleLike = async (blogId) => {
    if (!userId) {
      toast.dismiss();
      toast.error("User session not initialized.");
      return;
    }
    try {
      const response = await api.post(`/api/blogs/${blogId}/like`, {
        user_id: userId,
      });
      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === blogId ? { ...blog, likes: response.data.likes } : blog
        )
      );
      setLikedBlogs((prev) => [...prev, blogId]);
      toast.dismiss();
      toast.success("Blog liked!");
    } catch (error) {
      if (
        error.response?.data?.message === "User has already liked this blog"
      ) {
        toast.dismiss();
        toast.info("You have already liked this blog.");
      } else {
        toast.dismiss();
        toast.error("Failed to like blog.");
      }
    }
  };

  const getShareUrls = (blog) => {
  const url = `${window.location.origin}/blogs/${blog.id}`; // use id route
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(blog.title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(blog.title)}&summary=${encodeURIComponent(blog.excerpt)}`,
  };
};

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 font-sans bg-[#EDE1DF]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#5d4037]">
            Stories & Insights
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Discover the fascinating world of Luxury collection, fashion, and
            preservation through expert insights and community stories.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col md:flex-row items-center gap-4 border border-gray-200 p-4 rounded-2xl shadow-sm mb-10 bg-[#EDE1DF]"
        >
          <div className="flex items-center w-full md:flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search articles, tags, or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            />
          </div>
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-full md:w-auto">
            <FaFilter className="text-gray-400 mr-2" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 w-full"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-full md:w-auto">
            <FaClock className="text-gray-400 mr-2" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 w-full"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
            </select>
          </div>
        </motion.div>

        {/* Blog Cards */}
        {filteredBlogs.length === 0 ? (
          <p className="text-gray-600 text-center">No blogs found.</p>
        ) : (
          filteredBlogs.map((blog) => {
            const shareUrls = getShareUrls(blog);
            const isLiked = likedBlogs.includes(blog.id);

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300 mb-8"
              >
                <div className="h-60">
                  {blog.cover_image ? (
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-r from-[#8d6e63] to-[#bcaaa4]"></div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2 text-[#5d4037]">
                    {blog.title}
                  </h2>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2 mb-4">
                    <span>{blog.category}</span>
                    <span>•</span>
                    <span>
                      {new Date(blog.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>8 min read</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(blog.tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-sm bg-[#fbe9e7] text-[#5d4037] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">{blog.excerpt}</p>
                  <Link
                      to={`/blogs/${blog.id}`}
                      state={{ blog }} // optional: gives BlogView immediate data while it fetches
                      className="text-[#6d4c41] hover:underline"
                      >
                      Read More
                  </Link>


                  {/* Blog footer */}
                  <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                      <FaEye /> {blog.views || 0}
                    </div>
                    <div
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleLike(blog.id)}
                    >
                      {isLiked ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart className="text-gray-500" />
                      )}
                      {blog.likes || 0}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={shareUrls.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaTwitter className="text-[#1DA1F2] hover:opacity-80" />
                      </a>
                      <a
                        href={shareUrls.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaFacebook className="text-[#3b5998] hover:opacity-80" />
                      </a>
                      <a
                        href={shareUrls.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaLinkedin className="text-[#0077b5] hover:opacity-80" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Layout>
  );
};

export default Blog;
