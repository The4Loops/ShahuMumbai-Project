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
        setLikedBlogs(likesResponse.data?.likedBlogIds || []);
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
        (blog.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.Tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          blog.Excerpt.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter ? blog.Category === categoryFilter : true)
    )
    .sort((a, b) =>
      sortOrder === "Newest First"
        ? new Date(b.PublishAt) - new Date(a.PublishAt)
        : new Date(a.PublishAt) - new Date(b.PublishAt)
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
      if (error.response?.data?.message === "User has already liked this blog") {
        toast.dismiss();
        toast.info("You have already liked this blog.");
      } else {
        toast.dismiss();
        toast.error("Failed to like blog.");
      }
    }
  };

  const getShareUrls = (blog) => {
    const url = `${window.location.origin}/blogs/${blog.BlogId}`;
    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(blog.title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(blog.title)}&summary=${encodeURIComponent(blog.excerpt)}`,
    };
  };

  // SEO data
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

  return (
    <Layout>
      <Helmet>
        {/* Core SEO */}
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

        {/* Canonical + hreflang */}
        <link rel="canonical" href={pageUrl} />
        <link rel="alternate" hrefLang="en-IN" href={pageUrl} />
        <link rel="alternate" hrefLang="x-default" href={pageUrl} />

        {/* Open Graph */}
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
        <meta property="og:image:alt" content="Shahu Mumbai Blog — heritage fashion & artisan stories" />

        {/* Twitter
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@yourhandle" />
        <meta name="twitter:title" content="Stories & Insights — Shahu Mumbai Blog" />
        <meta
          name="twitter:description"
          content="Discover heritage fashion, sustainable luxury, and artisan stories from Shahu Mumbai."
        />
        <meta name="twitter:image" content={`${baseUrl}/og/blog.jpg`} /> */}

        {/* Breadcrumbs for Blog listing */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}/` },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": pageUrl }
            ]
          })}
        </script>

        {/* Your existing structured data (kept, slightly hardened via slice(0,10) upstream) */}
        <script type="application/ld+json">{JSON.stringify(blogListJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>

        {/* Optional: if you later add paginated routes like /blog?page=2, consider:
        <link rel="prev" href={`${pageUrl}?page=${currentPage-1}`} />
        <link rel="next" href={`${pageUrl}?page=${currentPage+1}`} />
        */}
      </Helmet>


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
              {["Announcements", "Guides", "Releases", "Behind the Scenes"].map((cat) => (
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
            const isLiked = likedBlogs.includes(blog.BlogId);

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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-r from-[#8d6e63] to-[#bcaaa4]"></div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2 text-[#5d4037]">
                    {blog.Title}
                  </h2>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2 mb-4">
                    <span>{blog.Category}</span>
                    <span>•</span>
                    <span>{new Date(blog.CreatedAt).toLocaleDateString()}</span>
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
                  <p className="text-gray-700 mb-4">{blog.Excerpt}</p>
                  <Link
                    to={`/blogs/${blog.BlogId}`}
                    state={{ blog }}
                    className="text-[#6d4c41] hover:underline"
                  >
                    Read More
                  </Link>

                  {/* Blog footer */}
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
                      <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer">
                        <FaTwitter className="text-[#1DA1F2] hover:opacity-80" />
                      </a>
                      <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer">
                        <FaFacebook className="text-[#3b5998] hover:opacity-80" />
                      </a>
                      <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer">
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
