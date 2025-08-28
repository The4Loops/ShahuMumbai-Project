import React, { useState } from "react";

// ✅ Import images properly
import img1 from "../assets/images/product_images/DummyHandbag1.jpeg";
import img2 from "../assets/images/product_images/DummyHandbag2.jpeg";
import img3 from "../assets/images/product_images/DummyHandbag3.jpeg";

const collections = [
  {
    title: "Vintage Apparel",
    desc: "Timeless clothing pieces from the golden age of fashion",
    count: "120+",
    img: img1,
    status: "Published",
  },
  {
    title: "Home Decor",
    desc: "Antique furnishings and decorative pieces for your space",
    count: "85+",
    img: img2,
    status: "Draft",
  },
  {
    title: "Accessories",
    desc: "Vintage jewelry, bags, and timeless accessories",
    count: "200+",
    img: img3,
    status: "Published",
  },
  {
    title: "Retro Jewelry",
    desc: "Classic jewelry designs with vintage charm",
    count: "40+",
    img: img1,
    status: "Draft",
  },
  {
    title: "Antique Art",
    desc: "Paintings and sculptures with timeless value",
    count: "70+",
    img: img2,
    status: "Published",
  },
  {
    title: "Classic Furniture",
    desc: "Furniture pieces with elegant history",
    count: "95+",
    img: img3,
    status: "Published",
  },
];

function Collections() {
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 3;

  // ✅ Apply filter
  const filteredData =
    filter === "All"
      ? collections
      : collections.filter((item) => item.status === filter);

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <section className="relative bg-[#F1E7E5] py-16 px-6">
      <div className="max-w-7xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#4A2C2A] mb-4">
          Our Collections
        </h2>

        <p className="text-[#4A2C2A]/70 text-lg max-w-2xl mx-auto mb-8">
          Explore our carefully curated collections, each telling a unique story
          of style and heritage.
        </p>

        {/* ✅ Filter Buttons */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {paginatedData.map((col, i) => (
            <div
              key={i}
              className="relative group rounded-2xl overflow-hidden shadow-lg transform transition duration-500 hover:scale-[1.03]"
            >
              {/* Image */}
              <img
                src={col.img}
                alt={`Collection - ${col.title}`}
                loading="lazy"
                className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Softer Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/60 transition-all"></div>

              {/* Text */}
              <div className="absolute bottom-6 left-6 text-left text-white">
                <span className="block text-sm tracking-wide opacity-80 mb-1">
                  {col.count} ITEMS • {col.status}
                </span>
                <h3 className="text-2xl font-semibold mb-2">{col.title}</h3>
                <p className="text-sm opacity-90 mb-4 max-w-xs">{col.desc}</p>
                <a
                  href="/"
                  className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
                >
                  Explore →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Pagination Controls */}
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
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md border bg-white text-[#4A2C2A] hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default Collections;
