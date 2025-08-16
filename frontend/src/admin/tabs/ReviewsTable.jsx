// ReviewsTable.jsx
import React, { useState } from "react";
import { Eye, Edit2, Trash2, Star, X, Check } from "lucide-react";

export default function ReviewsTable() {
  const [reviews, setReviews] = useState([
    { id: 1, product: "Wireless Headphones", user: "John Doe", rating: 5, visible: false },
    { id: 2, product: "Smart Watch", user: "Jane Smith", rating: 4, visible: true },
    { id: 3, product: "Gaming Mouse", user: "Alex Carter", rating: 3, visible: false },
  ]);

  const [selectedReview, setSelectedReview] = useState(null);
  const [search, setSearch] = useState("");

  // Popup state
  const [editPopup, setEditPopup] = useState(null);
  const [deletePopup, setDeletePopup] = useState(null);

  const filteredReviews = reviews.filter(
    (r) =>
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.user.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeletePopup(null);
  };

  const handleToggleVisible = (id, value) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, visible: value } : r))
    );
    setEditPopup(null);
  };

  return (
    <div className="overflow-x-auto">
      {/* Search Bar */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by product or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 w-64 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Table */}
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
          {filteredReviews.map((r) => (
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
              <td className="px-4 py-3 border-b">
                {r.visible ? (
                  <span className="text-green-600 font-medium">Yes</span>
                ) : (
                  <span className="text-red-500 font-medium">No</span>
                )}
              </td>
              <td className="px-4 py-3 border-b flex gap-3">
                <button
                  onClick={() => setSelectedReview(r)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => setEditPopup(r)}
                  className="text-green-500 hover:text-green-700"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setDeletePopup(r)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Modal */}
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
            <p>
              <strong>Visible:</strong>{" "}
              {selectedReview.visible ? "Yes" : "No"}
            </p>
          </div>
        </div>
      )}

      {/* Edit Visibility Modal */}
      {editPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={() => setEditPopup(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit Visibility</h2>
            <p className="mb-4">
              Do you want the review for{" "}
              <strong>{editPopup.product}</strong> to be visible on the user panel?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleToggleVisible(editPopup.id, false)}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
              >
                No
              </button>
              <button
                onClick={() => handleToggleVisible(editPopup.id, true)}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
              >
                <Check size={16} /> Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={() => setDeletePopup(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>
              Are you sure you want to delete the review for{" "}
              <strong>{deletePopup.product}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeletePopup(null)}
                className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deletePopup.id)}
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
