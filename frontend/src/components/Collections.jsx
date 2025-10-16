import React, { useState, useEffect } from "react";
import api from "../supabase/axios"; // Adjust path as needed

// ✅ Import images properly (for fallback)
import img1 from "../assets/images/product_images/DummyHandbag1.jpeg";
import img2 from "../assets/images/product_images/DummyHandbag2.jpeg";
import img3 from "../assets/images/product_images/DummyHandbag3.jpeg";

function Collections() {
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 3;

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/api/collections");
        const data = response.data;

        const processedCollections = Array.isArray(data)
          ? data.map((collection) => ({
              id: collection.id || collection.collection_id,
              title:
                collection.title || collection.name || "Untitled Collection",
              desc: collection.description || "No description available",
              count: collection.product_count || collection.count || "0+",
              img: collection.cover_image || getFallbackImage(),
              status:
                collection.status || collection.is_published
                  ? "Published"
                  : "Draft",
            }))
          : (data.collections || []).map((collection) => ({
              id: collection.id || collection.collection_id,
              title:
                collection.title || collection.name || "Untitled Collection",
              desc: collection.description || "No description available",
              count: collection.product_count || collection.count || "0+",
              img: collection.cover_image || getFallbackImage(),
              status:
                collection.status || collection.is_published
                  ? "Published"
                  : "Draft",
            }));

        setCollections(processedCollections);
      } catch (err) {
        console.error("Failed to fetch collections:", err);
        setError(err?.response?.data?.message || "Failed to load collections");
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const getFallbackImage = () => {
    const images = [img1, img2, img3];
    return images[Math.floor(Math.random() * images.length)];
  };

  const SkeletonSlide = () => (
    <div className="px-3">
      <div className="relative bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="w-full h-52 bg-[#F1E7E5]/50 rounded-t-xl"></div>
        <div className="p-4">
          <div className="h-6 bg-[#F1E7E5]/50 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-[#F1E7E5]/50 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="relative bg-[#F1E7E5] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonSlide key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && collections.length === 0) {
    return (
      <section className="relative bg-[#F1E7E5] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Error loading collections</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#4A2C2A] text-white rounded-full hover:bg-opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const filteredData =
    filter === "All"
      ? collections
      : collections.filter((item) => item.status === filter);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <section className="relative bg-[#F1E7E5] py-16 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#4A2C2A] mb-4">
          Our Collections
        </h2>

        <p className="text-[#4A2C2A]/70 text-lg max-w-2xl mx-auto mb-8">
          Explore our carefully curated collections, each telling a unique story
          of style and heritage.
        </p>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-10">
          {["All", "Published", "Draft"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setCurrentPage(1);
              }}
              className={`px-5 py-2 rounded-full border transition ${
                filter === status
                  ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                  : "bg-white text-[#4A2C2A] border-gray-300 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Collection Cards */}
        {paginatedData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paginatedData.map((col, i) => (
              <div
                key={col.id || i}
                className="relative group rounded-2xl overflow-hidden shadow-lg transform transition duration-500 hover:scale-[1.03]"
              >
                <img
                  src={col.img}
                  alt={`Collection - ${col.title}`}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = getFallbackImage();
                  }}
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/60 transition-all"></div>

                <div className="absolute bottom-6 left-6 text-left text-white">
                  <span className="block text-sm tracking-wide opacity-80 mb-1">
                    {col.count} ITEMS • {col.status}
                  </span>
                  <h3 className="text-2xl font-semibold mb-2">{col.title}</h3>
                  <p className="text-sm opacity-90 mb-4 max-w-xs">{col.desc}</p>
                  <a
                    href={`/collections/${col.id || ""}`}
                    className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
                  >
                    Explore →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 👇 Show 4 skeleton cards instead of 1
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonSlide key={i} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
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
