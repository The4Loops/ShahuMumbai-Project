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

  const ratingsData = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.stars === stars).length,
  }));

  const totalReviews = reviews.length;

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
              {/* Ratings */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-[#5d4037]">
                  Reviews & Ratings
                </h3>
                <div className="flex flex-wrap items-center gap-4 mb-6">
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
                <div className="space-y-2">
                  {ratingsData.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-10">{r.stars}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded">
                        <div
                          className="h-2 bg-yellow-500 rounded"
                          style={{
                            width: `${
                              totalReviews ? (r.count / totalReviews) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="w-6 text-right">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write Review */}
              <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h4 className="font-semibold mb-3 text-[#5d4037]">Write a Review</h4>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                />
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className="hover:scale-110 transition-transform"
                    >
                      {i < rating ? <FaStar /> : <FaRegStar />}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Your Review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                  rows="4"
                ></textarea>
                <button
                  onClick={handleReviewSubmit}
                  className="bg-[#6d4c41] text-white px-4 py-2 rounded hover:bg-[#5d4037] transition"
                >
                  Submit Review
                </button>
              </div>

              {/* Reviews List */}
              <div className="mt-6 space-y-4">
                <AnimatePresence>
                  {reviews.map((rev, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white p-4 rounded shadow"
                    >
                      <h5 className="font-semibold">{rev.name}</h5>
                      <p className="text-gray-500 text-sm">{rev.date}</p>
                      <div className="flex text-yellow-500 mt-1">
                        {[...Array(rev.stars)].map((_, i) => (
                          <FaStar key={i} />
                        ))}
                      </div>
                      <p className="mt-2">{rev.text}</p>
                      <button
                        className="text-sm text-[#6d4c41] hover:underline mt-2"
                        onClick={() =>
                          setReplyToReviewIndex(
                            replyToReviewIndex === index ? null : index
                          )
                        }
                      >
                        {replyToReviewIndex === index
                          ? "Cancel Reply"
                          : "Reply"}
                      </button>
                      {rev.replies?.length > 0 && (
                        <div className="pl-4 mt-3 border-l-2 border-gray-200 space-y-2">
                          {rev.replies.map((rep, i) => (
                            <div key={i}>
                              <h5 className="font-semibold">{rep.name}</h5>
                              <p className="text-gray-500 text-sm">{rep.date}</p>
                              <p className="mt-1">{rep.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <AnimatePresence>
                        {replyToReviewIndex === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 bg-gray-50 p-3 rounded overflow-hidden"
                          >
                            <input
                              type="text"
                              placeholder="Your Name"
                              value={replyName}
                              onChange={(e) => setReplyName(e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                            />
                            <textarea
                              placeholder="Your Reply"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                              rows="3"
                            ></textarea>
                            <button
                              onClick={() => handleReplySubmit(index)}
                              className="bg-[#6d4c41] text-white px-4 py-2 rounded hover:bg-[#5d4037] transition"
                            >
                              Submit Reply
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default VintageArticlePage;
