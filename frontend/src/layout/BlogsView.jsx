// src/pages/BlogsView.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FaEye, FaClock, FaTag, FaStar, FaReply } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../supabase/axios";
import Layout from "../layout/Layout";
import {jwtDecode} from 'jwt-decode';

const BlogsView = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const optimisticBlog = state?.blog;

  const [blog, setBlog] = useState(optimisticBlog || null);
  const [loading, setLoading] = useState(!optimisticBlog);
  const [error, setError] = useState(null);

  // --- Reviews state ---
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [user, setUser] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);

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

  // fetch the blog by ID
  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;

    const fetchBlog = async () => {
      try {
        setLoading(true);
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
        if (!cancelled) setLoading(false);
      }
    };

    if (!optimisticBlog || optimisticBlog.id !== id) {
      fetchBlog();
    } else {
      setReviews(optimisticBlog.reviews || []);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  // increment views
  useEffect(() => {
    if (!blog?.BlogId) return;
    const user_id = user?.id;
    if (user_id) {
      api.post(`/api/blogs/${blog.BlogId}/view`, { user_id }).catch(() => {});
    }
  }, [blog?.BlogId, user?.id]);

  // Fetch updated reviews
  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/api/admin/blogs/${id}`);
      setReviews(data.reviews || []);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to fetch reviews");
    }
  };

  // --- Reviews helpers ---
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

  const renderReplies = (replies, level = 1) => (
    <div className="mt-2 space-y-2">
      {replies.map((reply) => (
        <div
          key={reply.BlogReviewId}
          className="border-l-2 pl-3 border-gray-300"
          style={{ marginLeft: level * 12 }} // slightly smaller indent for mobile
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

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-600">
          Loading…
        </div>
      </Layout>
    );
  }
  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-center text-red-600">
          {error}
        </div>
      </Layout>
    );
  }
  if (!blog) return null;

  const displayDate = blog.PublishAt || blog.CreatedAt;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Cover Image */}
        {blog.CoverImage && (
          <img
            src={blog.CoverImage}
            alt={blog.Title}
            className="w-full h-48 sm:h-64 object-cover rounded-xl shadow-md"
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
          {blog.Tags.map((tag, i) => (
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

        {/* Reviews */}
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
                  className={`cursor-pointer text-lg ${i < selectedStars ? 'text-yellow-500' : 'text-gray-300'}`}
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