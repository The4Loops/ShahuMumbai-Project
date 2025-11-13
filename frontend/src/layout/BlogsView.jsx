// src/pages/BlogsView.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FaEye, FaClock, FaTag, FaStar, FaReply } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../supabase/axios";
import Layout from "../layout/Layout";
import { jwtDecode } from "jwt-decode";
import { useLoading } from "../context/LoadingContext";   // <-- NEW

/* ------------------------------------------------------------------ */
/*                     SKELETON UI (shown while loading)             */
/* ------------------------------------------------------------------ */
const BlogViewSkeleton = () => (
  <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 animate-pulse">
    {/* Cover image */}
    <div className="h-48 sm:h-64 bg-gray-200 rounded-xl" />

    {/* Title */}
    <div className="h-8 bg-gray-200 rounded w-4/5" />

    {/* Meta */}
    <div className="flex flex-wrap gap-3 text-sm">
      <div className="h-5 bg-gray-200 rounded w-20" />
      <div className="h-5 bg-gray-200 rounded w-24" />
      <div className="h-5 bg-gray-200 rounded w-20" />
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-200 rounded-full w-16" />
      ))}
    </div>

    {/* Content */}
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-11/12" />
      <div className="h-4 bg-gray-200 rounded w-10/12" />
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>

    {/* Reviews header */}
    <div className="h-7 bg-gray-200 rounded w-32" />
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border p-4 rounded bg-gray-50">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, s) => (
              <div key={s} className="h-5 w-5 bg-gray-200 rounded-full" />
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mt-2" />
        </div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
const BlogsView = () => {
  const { setLoading } = useLoading();                 // <-- NEW
  const { id } = useParams();
  const { state } = useLocation();
  const optimisticBlog = state?.blog;

  const [blog, setBlog] = useState(optimisticBlog || null);
  const [loading, setLocalLoading] = useState(!optimisticBlog); // <-- local flag
  const [error, setError] = useState(null);

  // --- Reviews state ---
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [user, setUser] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);

  /* ----------------------- USER INIT ----------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = jwtDecode(token);
        setUser({
          id: payload.id,
          name: payload.fullname,
        });
      } catch (err) {
        console.error("Failed to decode token:", err);
        setUser(null);
      }
    }
  }, []);

  /* ----------------------- FETCH BLOG ----------------------- */
  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;

    const fetchBlog = async () => {
      setLoading(true);                // global spinner ON
      setLocalLoading(true);
      try {
        const { data } = await api.get(`/api/admin/blogs/${id}`);
        if (!cancelled) {
          setBlog(data);
          setReviews(data.reviews || []);
        }
      } catch (e) {
        const msg = e?.response?.data?.error || "Failed to load blog";
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);          // global spinner OFF
          setLocalLoading(false);
        }
      }
    };

    if (!optimisticBlog || optimisticBlog.id !== id) {
      fetchBlog();
    } else {
      setReviews(optimisticBlog.reviews || []);
      setLoading(false);
      setLocalLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id, optimisticBlog, setLoading]);

  /* ----------------------- INCREMENT VIEWS ----------------------- */
  useEffect(() => {
    if (!blog?.BlogId) return;
    const user_id = user?.id;
    if (user_id) {
      api.post(`/api/blogs/${blog.BlogId}/view`, { user_id }).catch(() => {});
    }
  }, [blog?.BlogId, user?.id]);

  /* ----------------------- FETCH UPDATED REVIEWS ----------------------- */
  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/api/admin/blogs/${id}`);
      setReviews(data.reviews || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to fetch reviews");
    }
  };

  /* ----------------------- ADD REVIEW ----------------------- */
  const addReview = async () => {
    if (!newReview.trim() || !user?.id) {
      toast.error("Please log in to add a review");
      return;
    }
    try {
      await api.post(`/api/blogs/${id}/reviews`, {
        blogId: id,
        user_id: user.id,
        name: user.name,
        text: newReview.trim(),
        stars: selectedStars,
      });
      setNewReview("");
      setSelectedStars(5);
      await fetchReviews();
      toast.success("Review added successfully!");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to add review");
    }
  };

  /* ----------------------- REPLY ----------------------- */
  const handleReply = async (parentId) => {
    if (!newReply.trim() || !user?.id) {
      toast.error("Please log in to reply");
      return;
    }
    try {
      await api.post(`/api/blogs/${id}/reviews/${parentId}/replies`, {
        parentId,
        user_id: user.id,
        name: user.name,
        text: newReply.trim(),
      });
      setNewReply("");
      setReplyingTo(null);
      await fetchReviews();
      toast.success("Reply added successfully!");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to add reply");
    }
  };

  /* ----------------------- RENDER REPLIES ----------------------- */
  const renderReplies = (replies, level = 1) => (
    <div className="mt-2 space-y-2">
      {replies.map((reply) => (
        <div
          key={reply.BlogReviewId}
          className="border-l-2 pl-3 border-gray-300"
          style={{ marginLeft: level * 12 }}
        >
          <p className="text-sm">
            <span className="font-semibold">{reply.Name}:</span> {reply.Text}
          </p>

          <button
            onClick={() => setReplyingTo(reply.BlogReviewId)}
            className="text-xs text-blue-600 flex items-center gap-1 mt-1"
          >
            <FaReply /> Reply
          </button>

          {replyingTo === reply.BlogReviewId && (
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => handleReply(reply.BlogReviewId)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Post
              </button>
            </div>
          )}

          {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, level + 1)}
        </div>
      ))}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* ----------------------- RENDER ----------------------- */
  /* ------------------------------------------------------------------ */
  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-center text-red-600">
          {error}
        </div>
      </Layout>
    );
  }

  // Show skeleton while loading (global spinner is already on)
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F1E7E5]">
          <BlogViewSkeleton />
        </div>
      </Layout>
    );
  }

  if (!blog) return null;

  const displayDate = blog.PublishAt || blog.CreatedAt;

  return (
    <Layout>
      <div className="min-h-screen bg-[#F1E7E5] max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Cover Image */}
        {blog.CoverImage && (
          <img
            src={blog.CoverImage}
            alt={blog.Title}
            className="w-full h-48 sm:h-64 object-contain rounded-xl shadow-md"
            onError={(e) => {
              e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
            }}
          />
        )}

        {/* Title */}
        <h1 className="text-xl sm:text-3xl font-bold mt-4">{blog.Title}</h1>

        {/* Meta */}
        <p className="text-xs sm:text-sm text-gray-500 flex flex-wrap gap-3 items-center mt-2">
          <span>{blog.Category}</span>
          <span className="flex items-center gap-1">
            <FaClock className="hidden sm:inline" />
            {displayDate ? new Date(displayDate).toLocaleDateString() : "—"}
          </span>
          <span className="flex items-center gap-1">
            <FaEye className="hidden sm:inline" /> {blog.Views ?? 0} views
          </span>
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {blog.Tags?.map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
            >
              <FaTag className="hidden sm:inline" /> {tag}
            </span>
          ))}
        </div>

        {/* Content */}
        <div
          className="mt-6 prose prose-sm sm:prose lg:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.Content }}
        />

        {/* ---------- REVIEWS ---------- */}
        <div className="mt-10">
          <h2 className="text-lg sm:text-xl font-semibold">Reviews</h2>

          <div className="space-y-4 mt-4">
            {reviews.map((review) => (
              <div
                key={review.BlogReviewId}
                className="border p-3 sm:p-4 rounded-md bg-gray-50"
              >
                <p className="font-semibold">{review.Name}</p>

                {review.Stars && (
                  <p className="text-yellow-500 flex text-sm sm:text-base">
                    {Array(review.Stars)
                      .fill(0)
                      .map((_, i) => (
                        <FaStar key={i} />
                      ))}
                  </p>
                )}

                <p className="text-sm sm:text-base">{review.Text}</p>

                <button
                  onClick={() => setReplyingTo(review.BlogReviewId)}
                  className="text-xs sm:text-sm text-blue-600 flex items-center gap-1 mt-1"
                >
                  <FaReply /> Reply
                </button>

                {replyingTo === review.BlogReviewId && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleReply(review.BlogReviewId)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Post
                    </button>
                  </div>
                )}

                {review.replies && review.replies.length > 0 && renderReplies(review.replies)}
              </div>
            ))}
          </div>

          {/* Add Review */}
          <div className="mt-6">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`cursor-pointer text-lg ${
                    i < selectedStars ? "text-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => setSelectedStars(i + 1)}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Write a review..."
                className="flex-1 border rounded px-3 py-2 text-sm sm:text-base"
              />
              <button
                onClick={addReview}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogsView;