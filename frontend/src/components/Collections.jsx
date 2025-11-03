import React, { useState, useEffect } from "react";
import api from "../supabase/axios"; 

import img1 from "../assets/images/product_images/DummyHandbag1.jpeg";
import img2 from "../assets/images/product_images/DummyHandbag2.jpeg";
import img3 from "../assets/images/product_images/DummyHandbag3.jpeg";

function Collections() {
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 3;

  // Detect if Published
  const isPublishedFlag = (v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      return s === "y" || s === "yes" || s === "true" || s === "published";
    }
    return false;
  };

  const getFallbackImage = () => {
    const arr = [img1, img2, img3];
    return arr[Math.floor(Math.random() * arr.length)];
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/collections");
        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : data?.collections || [];

        const processed = list.map((c) => {
          const publishedRaw =
            c.published ??
            c.Published ??
            c.is_published ??
            c.IsPublished ??
            c.status ??
            c.Status;

          return {
            id: c.id || c.collection_id || c.Id,
            title: c.title || c.name || c.Title || c.Name || "Untitled Collection",
            desc: c.description || c.Description || "",
            count:
              c.product_count ||
              c.count ||
              c.ProductCount ||
              "0+",
            img:
              c.cover_image ||
              c.CoverImage ||
              getFallbackImage(),
            status: isPublishedFlag(publishedRaw) ? "Published" : "Draft",
            slug:
              c.slug ||
              c.Slug ||
              c.seo_slug ||
              c.SeoSlug ||
              c.id,
          };
        });

        setCollections(processed);
      } catch (err) {
        setError("Failed to load collections");
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <section className="relative bg-[#F1E7E5] py-16 px-6 text-center">
        <p className="text-[#4A2C2A] text-lg">Loading collections...</p>
      </section>
    );
  }

  if (error && collections.length === 0) {
    return (
      <section className="relative bg-[#F1E7E5] py-16 px-6 text-center">
        <p className="text-red-600 text-lg font-medium">{error}</p>
      </section>
    );
  }

  const publishedData = collections.filter((c) => c.status === "Published");

  const totalPages = Math.ceil(publishedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = publishedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="relative bg-[#F1E7E5] py-16 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#4A2C2A] mb-4">
          Our Collections
        </h2>

        <p className="text-[#4A2C2A]/70 text-lg max-w-2xl mx-auto mb-10">
          Explore our carefully curated collections, each telling a unique story of style and heritage.
        </p>

        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paginated.map((col) => (
              <div
                key={col.id}
                className="relative group rounded-2xl overflow-hidden shadow-lg transform transition duration-500 hover:scale-[1.03]"
              >
                <img
                  src={col.img}
                  alt={col.title}
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = getFallbackImage())}
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/60 transition-all"></div>

                <div className="absolute bottom-6 left-6 text-left text-white">
                  <span className="block text-sm opacity-80 mb-1">
                    {col.count} ITEMS
                  </span>
                  <h3 className="text-2xl font-semibold mb-2">{col.title}</h3>
                  <p className="text-sm opacity-90 mb-4 max-w-xs">{col.desc}</p>

                  <a
                    href={`/collections/${encodeURIComponent(col.slug)}`}
                    className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
                  >
                    Explore →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ✅ No Collections Message
          <div className="py-12 text-center">
            <h3 className="text-2xl font-semibold text-[#4A2C2A]">
              No Collections Available
            </h3>
            <p className="mt-2 text-[#4A2C2A]/70 text-lg">
              More beautiful collections are on the way. Stay tuned ✨
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md border bg-white text-[#4A2C2A] hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-4 py-2 rounded-md border ${
                  currentPage === idx + 1
                    ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                    : "bg-white text-[#4A2C2A] border-gray-300 hover:bg-gray-100"
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md border bg-white text-[#4A2C2A] hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Collections;
