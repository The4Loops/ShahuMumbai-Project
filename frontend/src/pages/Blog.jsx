import React, { useState } from "react";
import {
  FaSearch,
  FaFilter,
  FaClock,
  FaEye,
  FaRegHeart,
  FaCommentDots,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../layout/Layout";

const VintageArticlePage = () => {
  const [rating, setRating] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [replyName, setReplyName] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyToReviewIndex, setReplyToReviewIndex] = useState(null);
  const [showReviewsSection, setShowReviewsSection] = useState(true);

  const [reviews, setReviews] = useState([
    {
      name: "Sarah Mitchell",
      date: "Jan 16, 2024",
      text: "This guide was incredibly helpful! I've just started collecting vintage jewelry...",
      stars: 5,
      replies: [
        {
          name: "Eleanor Whitfield",
          date: "Jan 17, 2024",
          text: "Thanks Sarah! Glad it helped.",
        },
      ],
    },
    {
      name: "James Parker",
      date: "Jan 17, 2024",
      text: "Great introduction to vintage collecting...",
      stars: 4,
      replies: [],
    },
  ]);

  const totalReviews = reviews.length;
  const ratingsData = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.stars === stars).length,
  }));

  const handleReviewSubmit = () => {
    if (!reviewName.trim() || !reviewText.trim() || rating === 0) return;
    const newReview = {
      name: reviewName,
      date: new Date().toLocaleDateString(),
      text: reviewText,
      stars: rating,
      replies: [],
    };
    setReviews([newReview, ...reviews]);
    setReviewName("");
    setReviewText("");
    setRating(0);
  };

  const handleReplySubmit = (reviewIndex) => {
    if (!replyName.trim() || !replyText.trim()) return;
    const newReviews = [...reviews];
    newReviews[reviewIndex].replies.push({
      name: replyName,
      date: new Date().toLocaleDateString(),
      text: replyText,
    });
    setReviews(newReviews);
    setReplyName("");
    setReplyText("");
    setReplyToReviewIndex(null);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 font-sans bg-[#EDE1DF]">
        {/* Header */}
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

        {/* Search & Filters */}
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
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
            />
          </div>
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-full md:w-auto">
            <FaFilter className="text-gray-400 mr-2" />
            <select className="bg-transparent outline-none text-sm text-gray-700 w-full">
              <option>All Categories</option>
            </select>
          </div>
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 w-full md:w-auto">
            <FaClock className="text-gray-400 mr-2" />
            <select className="bg-transparent outline-none text-sm text-gray-700 w-full">
              <option>Newest First</option>
            </select>
          </div>
        </motion.div>

        {/* Article */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="h-60 bg-gradient-to-r from-[#8d6e63] to-[#bcaaa4]"></div>
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-2 text-[#5d4037]">
              The Art of Vintage Collecting: A Beginner's Guide
            </h2>
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2 mb-4">
              <span>Eleanor Whitfield</span>
              <span>•</span>
              <span>January 15, 2024</span>
              <span>•</span>
              <span>8 min read</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {["vintage", "collecting", "antiques", "beginner guide"].map(
                (tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm bg-[#fbe9e7] text-[#5d4037] rounded-full"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
            <p className="text-gray-700 mb-4">
              Vintage collecting is more than just acquiring old items—it's about
              preserving history and finding beauty in the craftsmanship of
              yesteryear...
            </p>
            <button className="text-[#6d4c41] hover:underline">
              Read More
            </button>

            {/* Toggle Reviews Link */}
            <div className="mt-3">
              <button
                onClick={() => setShowReviewsSection(!showReviewsSection)}
                className="text-[#8d6e63] text-sm font-medium hover:underline transition"
              >
                {showReviewsSection ? "Hide Reviews" : "Show Reviews"}
              </button>
            </div>

            <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm">
              <div className="flex items-center gap-1">
                <FaEye /> 2,450
              </div>
              <div className="flex items-center gap-1">
                <FaRegHeart /> 89
              </div>
              <div className="flex items-center gap-1">
                <FaCommentDots /> Share
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <AnimatePresence>
          {showReviewsSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Ratings Summary */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-[#5d4037]">
                  Reviews & Ratings
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold">
                    {totalReviews > 0
                      ? (
                          reviews.reduce((sum, r) => sum + r.stars, 0) /
                          totalReviews
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) =>
                      i <
                      Math.round(
                        reviews.reduce((sum, r) => sum + r.stars, 0) /
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

                {/* Star Breakdown */}
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

                {/* Review Form */}
                <div className="mt-6">
                  <h4 className="font-medium text-[#5d4037] mb-2">Add Your Review</h4>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full mb-2 p-2 border rounded"
                  />
                  <textarea
                    placeholder="Your Review"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full mb-2 p-2 border rounded"
                  />
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        className={`cursor-pointer text-xl ${
                          rating >= star ? "text-yellow-500" : "text-gray-300"
                        }`}
                      >
                        <FaStar />
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleReviewSubmit}
                    className="bg-[#8d6e63] text-white px-4 py-2 rounded hover:bg-[#6d4c41] transition"
                  >
                    Submit Review
                  </button>
                </div>

                {/* Display Reviews */}
                <div className="mt-6 space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.name}</span>
                        <span className="text-gray-400 text-sm">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        {[...Array(5)].map((_, i) =>
                          i < review.stars ? <FaStar key={i} /> : <FaRegStar key={i} />
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{review.text}</p>
                      <button
                        onClick={() =>
                          setReplyToReviewIndex(
                            replyToReviewIndex === index ? null : index
                          )
                        }
                        className="text-sm text-[#8d6e63] hover:underline"
                      >
                        {replyToReviewIndex === index ? "Cancel Reply" : "Reply"}
                      </button>

                      {/* Reply Form */}
                      {replyToReviewIndex === index && (
                        <div className="mt-2 ml-4 space-y-2">
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={replyName}
                            onChange={(e) => setReplyName(e.target.value)}
                            className="w-full mb-1 p-2 border rounded"
                          />
                          <textarea
                            placeholder="Your Reply"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full mb-1 p-2 border rounded"
                          />
                          <button
                            onClick={() => handleReplySubmit(index)}
                            className="bg-[#8d6e63] text-white px-3 py-1 rounded hover:bg-[#6d4c41] transition text-sm"
                          >
                            Submit Reply
                          </button>
                        </div>
                      )}

                      {/* Display Replies */}
                      {review.replies.length > 0 && (
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-2">
                          {review.replies.map((reply, rIndex) => (
                            <div key={rIndex}>
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
    </Layout>
  );
};

export default VintageArticlePage;
