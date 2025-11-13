// src/pages/Blog.jsx
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
import { Helmet } from "react-helmet-async";
import { useLoading } from "../context/LoadingContext";   // <-- NEW

/* ------------------------------------------------------------------ */
/*                     SKELETON CARD (shown while loading)           */
/* ------------------------------------------------------------------ */
const BlogSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-lg shadow overflow-hidden mb-8 animate-pulse"
  >
    <div className="h-60 bg-gray-200" />
    <div className="p-6 space-y-4">
      <div className="h-7 bg-gray-200 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-10 bg-gray-200 rounded w-32" />
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
const Blog = () => {
  const { setLoading } = useLoading();               // <-- NEW
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [loading, setLocalLoading] = useState(true); // <-- NEW (local flag)

  const categories = [
    "Announcements",
    "Guides",
    "Releases",
    "Behind the Scenes",
  ];

  /* ----------------------- USER INIT ----------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const name = decoded.fullname || decoded.email || "Anonymous";
        setFullName(name);
        setUserId(decoded.id);
      } catch (err) {
        console.error("Error decoding token:", err);
        setFullName(null);
      }
    } else {
      setFullName(null);
    }
  }, []);

  /* ----------------------- FETCH BLOGS ----------------------- */
  useEffect(() => {
    const fetchBlogsAndLikes = async () => {
      setLoading(true);               // <-- global spinner ON
      setLocalLoading(true);
      try {
        const blogsResponse = await api.get("/api/blogs");
        setBlogs(blogsResponse.data);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to load blogs. Please try again.");
      } finally {
        setLoading(false);            // <-- global spinner OFF
        setLocalLoading(false);
      }
    };
    fetchBlogsAndLikes();
  }, [userId, setLoading]);

  /* ----------------------- FILTER / SORT ----------------------- */
  const filteredBlogs = blogs
    .filter(
      (blog) =>
        (blog.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (blog.Tags || []).some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          blog.Excerpt?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter ? blog.Category === categoryFilter : true)
    )
    .sort((a, b) =>
      sortOrder === "Newest First"
        ? new Date(b.PublishAt) - new Date(a.PublishAt)
        : new Date(a.PublishAt) - new Date(b.PublishAt)
    );

  /* ----------------------- LIKE HANDLER ----------------------- */
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
      setBlogs((prev) =>
        prev.map((blog) =>
          blog.BlogId === blogId ? { ...blog, Likes: response.data.Likes } : blog
        )
      );
      toast.dismiss();
      toast.success("Blog liked!");
    } catch (error) {
      if (error.response?.data?.message === "User has already liked this blog") {
        toast.dismiss();
        toast.info("You have already liked this blog.");
      } else {
        toast.dismiss();
        toast.error("Failed to like blog.");
      }
    }
  };

  /* ----------------------- SHARE URLS ----------------------- */
  const getShareUrls = (blog) => {
    const url = `${window.location.origin}/blogs/${blog.BlogId}`;
    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(blog.Title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        url
      )}&title=${encodeURIComponent(blog.Title)}&summary=${encodeURIComponent(
        blog.Excerpt
      )}`,
    };
  };

  /* ----------------------- SEO ----------------------- */
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";
  const pageUrl = `${baseUrl}/blog`;

  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": pageUrl,
    url: pageUrl,
    name: "Shahu Mumbai Blog",
    description:
      "Stories & insights on heritage fashion, sustainable luxury, and the artisans behind every piece.",
    blogPost: filteredBlogs.slice(0, 10).map((b, idx) => ({
      "@type": "BlogPosting",
      "@id": `${baseUrl}/blogs/${b.BlogId}`,
      headline: b.Title,
      image: b.CoverImage ? [b.CoverImage] : undefined,
      datePublished: b.PublishAt || b.CreatedAt,
      dateModified: b.UpdatedAt || b.PublishAt || b.CreatedAt,
      author: b.Author ? { "@type": "Person", name: b.Author } : undefined,
      description: b.Excerpt,
      mainEntityOfPage: `${baseUrl}/blogs/${b.BlogId}`,
      position: idx + 1,
    })),
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filteredBlogs.slice(0, 10).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/blogs/${b.BlogId}`,
      name: b.Title,
    })),
  };

  /* ------------------------------------------------------------------ */
  return (
    <Layout>
      <Helmet>
        {/* ----- Core SEO ----- */}
        <title>Stories & Insights — Shahu Mumbai Blog</title>
        <meta
          name="description"
          content="Discover stories & insights on heritage fashion, sustainable luxury, and artisan craftsmanship from Shahu Mumbai."
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta
          name="keywords"
          content="Shahu Mumbai blog, sustainable fashion India, artisan craftsmanship, heritage fashion, ethical luxury, handcrafted sarees, Mumbai fashion house"
        />

        {/* ----- Canonical ----- */}
        <link rel="canonical" href={pageUrl} />
        <link rel="alternate" hrefLang="en-IN" href={pageUrl} />
        <link rel="alternate" hrefLang="x-default" href={pageUrl} />

        {/* ----- Open Graph ----- */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content="Stories & Insights — Shahu Mumbai Blog" />
        <meta
          property="og:description"
          content="Heritage fashion, sustainable luxury, and artisan stories."
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${baseUrl}/og/blog.jpg`} />
        <meta
          property="og:image:alt"
          content="Shahu Mumbai Blog — heritage fashion & artisan stories"
        />

        {/* ----- Structured Data ----- */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl },
            ],
          })}
        </script>
        <script type="application/ld+json">{JSON.stringify(blogListJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 font-sans bg-[#EDE1DF]">
        {/* ----- Header ----- */}
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

        {/* ----- Filters ----- */}
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

        {/* ----- LOADING SKELETON ----- */}
        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlogSkeleton key={i} />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <p className="text-gray-600 text-center">No blogs found.</p>
        ) : (
          /* ----- REAL BLOG CARDS ----- */
          filteredBlogs.map((blog) => {
            const shareUrls = getShareUrls(blog);
            const isLiked = false; // you can keep a liked‑array if you want

            return (
              <motion.div
                key={blog.BlogId}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300 mb-8"
              >
                <div className="h-60">
                  {blog.CoverImage ? (
                    <img
                      src={blog.CoverImage}
                      alt={blog.Title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                      }}
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-r from-[#8d6e63] to-[#bcaaa4]" />
                  )}
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2 text-[#5d4037]">
                    {blog.Title}
                  </h2>

                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2 mb-4">
                    <span>{blog.Category}</span>
                    <span>•</span>
                    <span>
                      {new Date(blog.CreatedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>8 min read</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(blog.Tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-sm bg-[#fbe9e7] text-[#5d4037] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-700 mb-4">{blog.Excerpt}</p>

                  <Link
                    to={`/blogs/${blog.BlogId}`}
                    state={{ blog }}
                    className="text-[#6d4c41] hover:underline"
                  >
                    Read More
                  </Link>

                  {/* Footer */}
                  <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                      <FaEye /> {blog.Views || 0}
                    </div>

                    <div
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleLike(blog.BlogId)}
                    >
                      {isLiked ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart className="text-gray-500" />
                      )}
                      {blog.Likes || 0}
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