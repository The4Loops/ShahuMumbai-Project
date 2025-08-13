import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../supabase/axios";

const BannerManager = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle image upload to /api/upload/single
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataToUpload = new FormData();
    formDataToUpload.append("image", file);

    try {
      const response = await api.post("/api/upload/single", formDataToUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrls }));
    } catch (error) {
      toast.dismiss();
      toast.error("Image upload failed "+error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      image_url: formData.imageUrl || null,
    };

    try {
      const response = await api.post("/api/banners", payload);
      toast.success(response.data.message);
      setFormData({ title: "", description: "", imageUrl: "", image: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto grid grid-cols-1 gap-4 sm:gap-6">
      {/* Banner Title */}
      <div>
        <label className="block text-sm font-medium text-[#6B4226] mb-1">
          Banner Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter banner title"
          className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]"
          required
        />
      </div>

      {/* Banner Message */}
      <div>
        <label className="block text-sm font-medium text-[#6B4226] mb-1">
          Message / Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Write a short description for the banner"
          className="w-full rounded-md px-4 py-2 border border-gray-300 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-[#D4A5A5]"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-[#6B4226] mb-1">
          Banner Image
        </label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D4A5A5] file:text-white hover:file:bg-[#C39898]"
        />
        {formData.imageUrl && (
          <p className="mt-2 text-sm text-[#6B4226]">
            Image uploaded: <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer">{formData.imageUrl}</a>
          </p>
        )}
      </div>

      {/* Save Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || !formData.imageUrl}
          className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Banner"}
        </button>
      </div>
    </form>
  );
};

export default BannerManager;