// src/pages/BlogsView.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FaEye, FaClock, FaTag, FaStar, FaReply } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../supabase/axios";
import Layout from "../layout/Layout";

const BlogsView = () => {
  const { id } = useParams();                // /blogs/:id
  const { state } = useLocation();           // state?.blog from <Link state={{ blog }}>
  const optimisticBlog = state?.blog;

  const [blog, setBlog] = useState(optimisticBlog || null);
  const [loading, setLoading] = useState(!optimisticBlog);
  const [error, setError] = useState(null);

  // --- Reviews state (client-only demo, same as your old page) ---
  const [reviews, setReviews] = useState([
    {
      id: 1,
      user: "John",
      rating: 5,
      text: "Amazing insights!",
      replies: [
        {
          id: 11,
          user: "Alice",
          text: "Totally agree!",
          replies: [
            { id: 111, user: "Mike", text: "Same here!", replies: [] },
          ],
        },
      ],
    },
    {
      id: 2,
      user: "Sarah",
      rating: 4,
      text: "Great read but needs more examples.",
      replies: [],
    },
  ]);
  const [newReview, setNewReview] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState("");

  // fetch the blog by ID
  useEffect(() => {
    window.scrollTo(0, 0);

    let cancelled = false;
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/admin/blogs/${id}`);
        if (!cancelled) setBlog(data);
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

    // only fetch if we don't already have this blog (or it's a different id)
    if (!optimisticBlog || optimisticBlog.id !== id) {
      fetchBlog();
    } else {
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [id]);

  // increment views (fire-and-forget)
  useEffect(() => {
    if (!blog?.id) return;
    const user_id = localStorage.getItem("user_id");
    if (user_id) {
      api.post(`/api/blogs/${blog.id}/view`, { user_id }).catch(() => {});
    }
  }, [blog?.id]);

  // --- Reviews helpers ---
  const addReview = () => {
    if (!newReview.trim()) return;
    setReviews((prev) => [
      ...prev,
      { id: Date.now(), user: "Guest", rating: 5, text: newReview.trim(), replies: [] },
    ]);
    setNewReview("");
  };

  const handleReply = (replyId) => {
    if (!newReply.trim()) return;

    const addReplyRecursive = (items) =>
      items.map((item) =>
        item.id === replyId
          ? {
              ...item,
              replies: [
                ...item.replies,
                { id: Date.now(), user: "Guest", text: newReply.trim(), replies: [] },
              ],
            }
          : { ...item, replies: addReplyRecursive(item.replies) }
      );

    setReviews(addReplyRecursive(reviews));
    setNewReply("");
    setReplyingTo(null);
  };

  const renderReplies = (replies, level = 1) => (
    <div className="mt-2 space-y-2">
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="border-l-2 pl-3 border-gray-300"
          style={{ marginLeft: level * 16 }} // 16px per level
        >
          <p className="text-sm">
            <span className="font-semibold">{reply.user}:</span> {reply.text}
          </p>

          <button
            onClick={() => setReplyingTo(reply.id)}
            className="text-xs text-blue-600 flex items-center gap-1 mt-1"
          >
            <FaReply /> Reply
          </button>

          {replyingTo === reply.id && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                onClick={() => handleReply(reply.id)}
                className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
              >
                Post
              </button>
            </div>
          )}

          {reply.replies.length > 0 && renderReplies(reply.replies, level + 1)}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10">Loading…</div>
      </Layout>
    );
  }
  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-red-600">{error}</div>
      </Layout>
    );
  }
  if (!blog) return null;

  const displayDate = blog.publish_at || blog.created_at;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {blog.cover_image && (
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="w-full h-64 object-cover rounded-xl shadow-md"
          />
        )}

        <h1 className="text-2xl md:text-3xl font-bold mt-4">{blog.title}</h1>

        <p className="text-sm text-gray-500 flex gap-4 flex-wrap items-center">
          <span>{blog.category}</span>
          <span className="flex items-center gap-1">
            <FaClock />
            {displayDate ? new Date(displayDate).toLocaleDateString() : "—"}
          </span>
          <span className="flex items-center gap-1">
            <FaEye /> {blog.views ?? 0} views
          </span>
        </p>

        {/* tags */}
        <div className="mt-2 flex flex-wrap gap-2">
          {(blog.tags || []).map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
            >
              <FaTag /> {tag}
            </span>
          ))}
        </div>

        {/* content (HTML) */}
        <div
          className="mt-6 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Reviews */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Reviews</h2>

          <div className="space-y-4 mt-4">
            {reviews.map((review) => (
              <div key={review.id} className="border p-3 rounded-md bg-gray-50">
                <p className="font-semibold">{review.user}</p>
                <p className="text-yellow-500 flex">
                  {Array(review.rating)
                    .fill(0)
                    .map((_, i) => (
                      <FaStar key={i} />
                    ))}
                </p>
                <p>{review.text}</p>

                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="text-sm text-blue-600 flex items-center gap-1 mt-1"
                >
                  <FaReply /> Reply
                </button>

                {replyingTo === review.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleReply(review.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Post
                    </button>
                  </div>
                )}

                {review.replies.length > 0 && renderReplies(review.replies)}
              </div>
            ))}
          </div>

          {/* Add Review */}
          <div className="mt-6 flex gap-2">
            <input
              type="text"
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Write a review..."
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={addReview}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogsView;
