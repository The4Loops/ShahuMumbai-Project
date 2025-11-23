import React, { useState, useEffect } from "react";
import { Eye, Trash2, Star, X } from "lucide-react";
import api from "../../supabase/axios";

export default function ReviewsTable() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [search, setSearch] = useState("");
  const [deletePopup, setDeletePopup] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/api/reviews");
        if (data.message) {
          setReviews([]);
        } else {
          setReviews(
            data.map((r) => ({
              id: r.ReviewId,
              product: r.ProductName,
              user: r.FullName,
              rating: r.Rating,
              comment: r.Comment,
              visible: r.IsActive === "Y",
              createdAt: r.CreatedAt,
            }))
          );
        }
      } catch (err) {
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(
    (r) =>
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.user.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeletePopup(null);
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading reviews...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      {/* Search */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by product, user, or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 w-64 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Reviews Table */}
      <table className="min-w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-4 py-2 text-left border-b">ID</th>
            <th className="px-4 py-2 text-left border-b">Product</th>
            <th className="px-4 py-2 text-left border-b">User</th>
            <th className="px-4 py-2 text-left border-b">Rating</th>
            <th className="px-4 py-2 text-left border-b">Visible</th>
            <th className="px-4 py-2 text-left border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredReviews.length > 0 ? (
            filteredReviews.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-4 py-3 border-b">{r.id}</td>
                <td className="px-4 py-3 border-b font-medium">{r.product}</td>
                <td className="px-4 py-3 border-b">{r.user}</td>
                <td className="px-4 py-3 border-b">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="inline text-yellow-400" size={16} fill="currentColor" />
                  ))}
                </td>
                <td className="px-4 py-3 border-b">
                  {r.visible ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-red-500 font-medium">No</span>
                  )}
                </td>
                <td className="px-4 py-3 border-b flex gap-2">
                  {/* View button */}
                  <button
                    onClick={() => setSelectedReview(r)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Eye size={18} />
                  </button>

                  {/* Delete review */}
                  <button
                    onClick={() => setDeletePopup(r)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-3 border-b text-center text-gray-500">
                No reviews found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* View Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={22} />
            </button>

            {/* Review Header */}
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Review Details</h2>

            {/* Review Info */}
            <div className="space-y-2 mb-4">
              <p><span className="font-semibold">Product:</span> {selectedReview.product}</p>
              <p><span className="font-semibold">User:</span> {selectedReview.user}</p>
              <p className="flex items-center gap-1">
                <span className="font-semibold">Rating:</span>
                {Array.from({ length: selectedReview.rating }).map((_, i) => (
                  <Star key={i} className="text-yellow-400" size={16} fill="currentColor" />
                ))}
              </p>
              <p><span className="font-semibold">Visible:</span> {selectedReview.visible ? "Yes" : "No"}</p>
              <p><span className="font-semibold">Comment:</span> {selectedReview.comment}</p>
              <p><span className="font-semibold">Created:</span> {new Date(selectedReview.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Modal */}
      {deletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setDeletePopup(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete the review for <strong>{deletePopup.product}</strong>?</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletePopup(null)}
                className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReview(deletePopup.id)}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}