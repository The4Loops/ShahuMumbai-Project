import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaClock,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaCommentDots,
  FaStar,
  FaRegStar,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from 'uuid';
import {jwtDecode} from 'jwt-decode';
import api from "../supabase/axios";
import Layout from "../layout/Layout";

const VintageArticlePage = () => {
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [reviewData, setReviewData] = useState({});
  const [showReviewsSection, setShowReviewsSection] = useState({});
  const [userId, setUserId] = useState(null);
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [fullName, setFullName] = useState(null);

  const categories = ["Announcements", "Guides", "Releases", "Behind the Scenes"];

  // Initialize user ID and decode token for full name
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const name = decoded.user_metadata?.fullname || decoded.fullname || decoded.email || 'Anonymous';
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
      localStorage.setItem('user_id', newUserId);
      setUserId(newUserId);
    } else if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch blogs and user's likes
  useEffect(() => {
    if (!userId) return;

    const fetchBlogsAndLikes = async () => {
      try {
        const blogsResponse = await api.get("/api/blogs");
        setBlogs(blogsResponse.data);

        const likesResponse = await api.get(`/api/user/likes?user_id=${userId}`);
        setLikedBlogs(likesResponse.data.likedBlogIds || []);

        const initialReviewData = {};
        const initialShowReviews = {};
        blogsResponse.data.forEach((blog) => {
          initialReviewData[blog.id] = {
            rating: 0,
            reviewName: fullName || "",
            reviewText: "",
            replyName: fullName || "",
            replyText: "",
            replyToReviewId: null,
          };
          initialShowReviews[blog.id] = true;
        });
        setReviewData(initialReviewData);
        setShowReviewsSection(initialShowReviews);
        toast.success("Blogs loaded successfully.");
      } catch (error) {
        toast.error("Failed to load blogs or likes. Please try again.");
        console.error("Error fetching blogs or likes:", error);
      }
    };
    fetchBlogsAndLikes();
  }, [userId, fullName]);

  const filteredBlogs = blogs
    .filter((blog) =>
      (blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter ? blog.category === categoryFilter : true)
    )
    .sort((a, b) =>
      sortOrder === "Newest First"
        ? new Date(b.publish_at) - new Date(a.publish_at)
        : new Date(a.publish_at) - new Date(b.publish_at)
    );

  const hasUserReviewed = (blogId) => {
    const blog = blogs.find(b => b.id === blogId);
    if (!blog || !blog.reviews) return false;
    return blog.reviews.some(review => review.user_id === userId && review.parent_id === null);
  };

  const handleReviewSubmit = async (blogId) => {
    const { rating, reviewName, reviewText } = reviewData[blogId] || {};
    if (!reviewName.trim() || !reviewText.trim() || rating === 0) {
      toast.error("Please provide a name, review, and rating.");
      return;
    }

    try {
      const newReview = {
        user_id: userId,
        name: reviewName,
        text: reviewText,
        stars: rating,
      };
      const response = await api.post(`/api/blogs/${blogId}/reviews`, newReview);
      const addedReview = response.data;
      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === blogId
            ? { ...blog, reviews: [addedReview, ...(blog.reviews || [])] }
            : blog
        )
      );
      setReviewData((prev) => ({
        ...prev,
        [blogId]: { ...prev[blogId], rating: 0, reviewName: fullName || "", reviewText: "" },
      }));
      toast.success("Review submitted successfully.");
    } catch (error) {
      if (error.response?.data?.message === 'User has already reviewed this blog') {
        toast.info("You have already reviewed this blog.");
      } else {
        toast.error("Failed to submit review. Please try again.");
        console.error("Error submitting review:", error);
      }
    }
  };

  const handleReplySubmit = async (blogId, reviewId) => {
    const { replyName, replyText } = reviewData[blogId] || {};
    if (!replyName.trim() || !replyText.trim()) {
      toast.error("Please provide a name and reply.");
      return;
    }

    try {
      const newReply = {
        user_id: userId,
        name: replyName,
        text: replyText,
      };
      const response = await api.post(`/api/blogs/${blogId}/reviews/${reviewId}/replies`, newReply);
      const addedReply = response.data;
      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === blogId
            ? {
                ...blog,
                reviews: blog.reviews.map((rev) =>
                  rev.id === reviewId
                    ? { ...rev, replies: [...(rev.replies || []), addedReply] }
                    : rev
                ),
              }
            : blog
        )
      );
      setReviewData((prev) => ({
        ...prev,
        [blogId]: { ...prev[blogId], replyName: fullName || "", replyText: "", replyToReviewId: null },
      }));
      toast.success("Reply submitted successfully.");
    } catch (error) {
      toast.error("Failed to submit reply. Please try again.");
      console.error("Error submitting reply:", error);
    }
  };

  const handleLike = async (blogId) => {
    if (!userId) {
      toast.error("User session not initialized.");
      return;
    }

    try {
      const response = await api.post(`/api/blogs/${blogId}/like`, { user_id: userId });
      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === blogId ? { ...blog, likes: response.data.likes } : blog
        )
      );
      setLikedBlogs((prev) => [...prev, blogId]);
      toast.success("Blog liked!");
    } catch (error) {
      if (error.response?.data?.message === "User has already liked this blog") {
        toast.info("You have already liked this blog.");
      } else {
        toast.error("Failed to like blog.");
        console.error("Error liking blog:", error);
      }
    }
  };

  const toggleReviews = async (blogId) => {
    if (!userId) {
      toast.error("User session not initialized.");
      return;
    }

    const isShowing = showReviewsSection[blogId];
    if (!isShowing) {
      try {
        const response = await api.post(`/api/blogs/${blogId}/view`, { user_id: userId });
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) =>
            blog.id === blogId ? { ...blog, views: response.data.views } : blog
          )
        );
      } catch (error) {
        console.error("Error incrementing views:", error);
      }
    }
    setShowReviewsSection((prev) => ({
      ...prev,
      [blogId]: !prev[blogId],
    }));
  };

  const getShareUrls = (blog) => {
    const url = `${window.location.origin}/blog/${blog.slug}`;
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

        {filteredBlogs.length === 0 ? (
          <p className="text-gray-600 text-center">No blogs found.</p>
        ) : (
          filteredBlogs.map((blog) => {
            const totalReviews = (blog.reviews || []).length;
            const ratingsData = [5, 4, 3, 2, 1].map((stars) => ({
              stars,
              count: (blog.reviews || []).filter((r) => r.stars === stars).length,
            }));
            const shareUrls = getShareUrls(blog);
            const isLiked = likedBlogs.includes(blog.id);
            const hasReviewed = hasUserReviewed(blog.id);

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
                    <span>{new Date(blog.publish_at).toLocaleDateString()}</span>
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
                  <a
                    href={`/blog/${blog.slug}`}
                    className="text-[#6d4c41] hover:underline"
                  >
                    Read More
                  </a>

                  <div className="mt-3">
                    <button
                      onClick={() => toggleReviews(blog.id)}
                      className="text-[#8d6e63] text-sm font-medium hover:underline transition"
                    >
                      {showReviewsSection[blog.id] ? "Hide Reviews" : "Show Reviews"}
                    </button>
                  </div>

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

                  <AnimatePresence>
                    {showReviewsSection[blog.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="mt-8 bg-white p-6 rounded-lg shadow">
                          <h3 className="text-xl font-semibold mb-4 text-[#5d4037]">
                            Reviews & Ratings
                          </h3>
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-3xl font-bold">
                              {totalReviews > 0
                                ? (
                                    (blog.reviews || []).reduce((sum, r) => sum + r.stars, 0) /
                                    totalReviews
                                  ).toFixed(1)
                                : "0.0"}
                            </span>
                            <div className="flex text-yellow-500">
                              {[...Array(5)].map((_, i) =>
                                i <
                                Math.round(
                                  (blog.reviews || []).reduce((sum, r) => sum + r.stars, 0) /
                                    totalReviews
                                ) ? (
                                  <FaStar key={i} />
                                ) : (
                                  <FaRegStar key={i} />
                                )
                              )}
                            </div>
                            <span className="text-gray-500">
                              Based on {totalReviews} reviews
                            </span>
                          </div>

                          <div className="space-y-1">
                            {ratingsData.map(({ stars, count }) => {
                              const percentage = totalReviews
                                ? Math.round((count / totalReviews) * 100)
                                : 0;
                              return (
                                <div key={stars} className="flex items-center gap-2 text-sm">
                                  <span className="w-12">{stars} star</span>
                                  <div className="flex-1 bg-gray-200 rounded h-3 overflow-hidden">
                                    <div
                                      className="bg-yellow-500 h-3"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="w-6 text-right text-gray-500">{count}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-6">
                            <h4 className="font-medium text-[#5d4037] mb-2">Add Your Review</h4>
                            {hasReviewed ? (
                              <p className="text-gray-600">You have already reviewed this blog.</p>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  placeholder={fullName ? fullName : "Enter your name"}
                                  value={reviewData[blog.id]?.reviewName || ""}
                                  onChange={(e) =>
                                    !fullName &&
                                    setReviewData((prev) => ({
                                      ...prev,
                                      [blog.id]: { ...prev[blog.id], reviewName: e.target.value },
                                    }))
                                  }
                                  readOnly={!!fullName}
                                  className={`w-full mb-2 p-2 border rounded ${
                                    fullName ? "bg-gray-100 cursor-not-allowed" : ""
                                  }`}
                                />
                                <textarea
                                  placeholder="Your Review"
                                  value={reviewData[blog.id]?.reviewText || ""}
                                  onChange={(e) =>
                                    setReviewData((prev) => ({
                                      ...prev,
                                      [blog.id]: { ...prev[blog.id], reviewText: e.target.value },
                                    }))
                                  }
                                  className="w-full mb-2 p-2 border rounded"
                                  disabled={hasReviewed}
                                />
                                <div className="flex items-center mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      onClick={() =>
                                        !hasReviewed &&
                                        setReviewData((prev) => ({
                                          ...prev,
                                          [blog.id]: { ...prev[blog.id], rating: star },
                                        }))
                                      }
                                      className={`cursor-pointer text-xl ${
                                        (reviewData[blog.id]?.rating || 0) >= star
                                          ? "text-yellow-500"
                                          : "text-gray-300"
                                      } ${hasReviewed ? "cursor-not-allowed" : ""}`}
                                    >
                                      <FaStar />
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleReviewSubmit(blog.id)}
                                  className={`bg-[#8d6e63] text-white px-4 py-2 rounded hover:bg-[#6d4c41] transition ${
                                    hasReviewed ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  disabled={hasReviewed}
                                >
                                  Submit Review
                                </button>
                              </>
                            )}
                          </div>

                          <div className="mt-6 space-y-4">
                            {(blog.reviews || []).map((review) => (
                              <div key={review.id} className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{review.name}</span>
                                  <span className="text-gray-400 text-sm">{review.date}</span>
                                </div>
                                {review.stars && (
                                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                    {[...Array(5)].map((_, i) =>
                                      i < review.stars ? <FaStar key={i} /> : <FaRegStar key={i} />
                                    )}
                                  </div>
                                )}
                                <p className="text-gray-700 mb-2">{review.text}</p>
                                <button
                                  onClick={() =>
                                    setReviewData((prev) => ({
                                      ...prev,
                                      [blog.id]: {
                                        ...prev[blog.id],
                                        replyToReviewId:
                                          prev[blog.id].replyToReviewId === review.id ? null : review.id,
                                      },
                                    }))
                                  }
                                  className="text-sm text-[#8d6e63] hover:underline"
                                >
                                  {reviewData[blog.id]?.replyToReviewId === review.id ? "Cancel Reply" : "Reply"}
                                </button>

                                {reviewData[blog.id]?.replyToReviewId === review.id && (
                                  <div className="mt-2 ml-4 space-y-2">
                                    <input
                                      type="text"
                                      placeholder={fullName ? fullName : "Enter your name"}
                                      value={reviewData[blog.id]?.replyName || ""}
                                      onChange={(e) =>
                                        !fullName &&
                                        setReviewData((prev) => ({
                                          ...prev,
                                          [blog.id]: { ...prev[blog.id], replyName: e.target.value },
                                        }))
                                      }
                                      readOnly={!!fullName}
                                      className={`w-full mb-1 p-2 border rounded ${
                                        fullName ? "bg-gray-100 cursor-not-allowed" : ""
                                      }`}
                                    />
                                    <textarea
                                      placeholder="Your Reply"
                                      value={reviewData[blog.id]?.replyText || ""}
                                      onChange={(e) =>
                                        setReviewData((prev) => ({
                                          ...prev,
                                          [blog.id]: { ...prev[blog.id], replyText: e.target.value },
                                        }))
                                      }
                                      className="w-full mb-1 p-2 border rounded"
                                    />
                                    <button
                                      onClick={() => handleReplySubmit(blog.id, review.id)}
                                      className="bg-[#8d6e63] text-white px-3 py-1 rounded hover:bg-[#6d4c41] transition text-sm"
                                    >
                                      Submit Reply
                                    </button>
                                  </div>
                                )}

                                {(review.replies || []).length > 0 && (
                                  <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-2">
                                    {review.replies.map((reply) => (
                                      <div key={reply.id}>
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="font-medium">{reply.name}</span>
                                          <span className="text-gray-400">{reply.date}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{reply.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Layout>
  );
};

export default VintageArticlePage;