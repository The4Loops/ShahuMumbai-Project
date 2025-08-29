// src/pages/BlogView.jsx
import React, { useState } from "react";
import { FaStar, FaReply, FaEye, FaClock, FaTag } from "react-icons/fa";
import Layout from "./Layout";

const BlogView = () => {
  // Full Mock Blog
  const blog = {
    id: 1,
    title: "The Future of AI in Everyday Life",
    author: "Jane Doe",
    date: "2025-08-15T10:00:00Z",
    readTime: 7,
    views: 1243,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    tags: ["AI", "Technology", "Future", "Innovation"],
    content: `
      <p>
        Artificial Intelligence (AI) is no longer just a buzzword – it has become
        part of our everyday lives. From personalized recommendations on Netflix
        to AI-powered healthcare, the applications are endless.
      </p>
      <p>
        In the next decade, AI is expected to revolutionize industries like
        education, finance, and transportation. Self-driving cars, AI tutors, and
        smarter personal assistants are only the beginning.
      </p>
      <h2>Challenges Ahead</h2>
      <p>
        Despite the progress, AI also brings challenges, including ethical
        concerns, job displacement, and the need for strict regulations.
      </p>
      <p>
        The future of AI is exciting – but it’s up to us to shape it responsibly.
      </p>
    `,
  };

  // Format date nicely
  const formattedDate = new Date(blog.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Reviews + replies (same as your version)
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
            {
              id: 111,
              user: "Mike",
              text: "Same here!",
              replies: [],
            },
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

  // Recursive function for nested replies
  const renderReplies = (replies, parentId, level = 1) => (
    <div className={`ml-${level * 4} mt-2 space-y-2`}>
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="border-l-2 pl-3 border-gray-300 dark:border-gray-600"
        >
          <p className="text-sm">
            <span className="font-semibold">{reply.user}:</span> {reply.text}
          </p>

          <button
            onClick={() => setReplyingTo(reply.id)}
            className="text-xs text-blue-500 flex items-center gap-1 mt-1"
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
                onClick={() => handleReply(parentId, reply.id)}
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                Post
              </button>
            </div>
          )}

          {reply.replies.length > 0 &&
            renderReplies(reply.replies, reply.id, level + 1)}
        </div>
      ))}
    </div>
  );

  // Add review
  const addReview = () => {
    if (!newReview.trim()) return;
    setReviews([
      ...reviews,
      { id: Date.now(), user: "Guest", rating: 5, text: newReview, replies: [] },
    ]);
    setNewReview("");
  };

  // Handle reply
  const handleReply = (parentId, replyId) => {
    if (!newReply.trim()) return;
    const addReplyRecursive = (items) =>
      items.map((item) =>
        item.id === replyId
          ? {
              ...item,
              replies: [
                ...item.replies,
                { id: Date.now(), user: "Guest", text: newReply, replies: [] },
              ],
            }
          : { ...item, replies: addReplyRecursive(item.replies) }
      );

    setReviews(addReplyRecursive(reviews));
    setNewReply("");
    setReplyingTo(null);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Blog Header */}
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-64 object-cover rounded-xl shadow-md"
        />
        <h1 className="text-2xl md:text-3xl font-bold mt-4">{blog.title}</h1>
        <p className="text-sm text-gray-100 flex gap-4 flex-wrap items-center">
          By {blog.author} • {formattedDate}
          <span className="flex items-center gap-1">
            <FaClock /> {blog.readTime} min read
          </span>
          <span className="flex items-center gap-1">
            <FaEye /> {blog.views} views
          </span>
        </p>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-2">
          {blog.tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-gray-200 dark:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
            >
              <FaTag className="text-gray-500" /> {tag}
            </span>
          ))}
        </div>

        {/* Blog Content */}
        <div
          className="mt-6 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <div className="space-y-4 mt-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border p-3 rounded-md bg-gray-50 dark:bg-gray-100"
              >
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
                  className="text-sm text-blue-500 flex items-center gap-1 mt-1"
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
                      onClick={() => handleReply(null, review.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Post
                    </button>
                  </div>
                )}

                {review.replies.length > 0 &&
                  renderReplies(review.replies, review.id)}
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
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogView;
