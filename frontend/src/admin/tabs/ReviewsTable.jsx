// ReviewsTable.jsx
import React, { useState } from "react";
import { Eye, Edit2, Trash2, Star, X } from "lucide-react";

export default function ReviewsTable() {
  const [reviews, setReviews] = useState([
    { id: 1, product: "Wireless Headphones", user: "John Doe", rating: 5 },
    { id: 2, product: "Smart Watch", user: "Jane Smith", rating: 4 },
    { id: 3, product: "Gaming Mouse", user: "Alex Carter", rating: 3 },
  ]);

  const [selectedReview, setSelectedReview] = useState(null);

  const handleView = (review) => {
    setSelectedReview(review);
  };

  const handleEdit = (review) => {
    alert(`Editing review ID ${review.id}`);
  };

  const handleDelete = (review) => {
    if (window.confirm(`Delete review for ${review.product}?`)) {
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Table */}
      <table className="min-w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-4 py-2 text-left border-b">ID</th>
            <th className="px-4 py-2 text-left border-b">Product</th>
            <th className="px-4 py-2 text-left border-b">User</th>
            <th className="px-4 py-2 text-left border-b">Rating</th>
            <th className="px-4 py-2 text-left border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr
              key={r.id}
              className="hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="px-4 py-3 border-b">{r.id}</td>
              <td className="px-4 py-3 border-b font-medium">{r.product}</td>
              <td className="px-4 py-3 border-b">{r.user}</td>
              <td className="px-4 py-3 border-b">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="inline text-yellow-400"
                    size={16}
                    fill="currentColor"
                  />
                ))}
              </td>
              <td className="px-4 py-3 border-b flex gap-3">
                <button
                  onClick={() => handleView(r)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleEdit(r)}
                  className="text-green-500 hover:text-green-700"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Review Details</h2>
            <p><strong>Product:</strong> {selectedReview.product}</p>
            <p><strong>User:</strong> {selectedReview.user}</p>
            <p className="flex items-center gap-1">
              <strong>Rating:</strong>
              {Array.from({ length: selectedReview.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="text-yellow-400"
                  size={16}
                  fill="currentColor"
                />
              ))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
