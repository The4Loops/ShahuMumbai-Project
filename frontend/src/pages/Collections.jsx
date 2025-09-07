import React, { useState } from "react";

// Category Card Component
function CollectionCard({ collection }) {
  return (
    <div className="rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer border border-[#E5D1C5] bg-[#FFF9F7] relative group">
      {/* Placeholder Color Block */}
      <div
        className="w-full h-48"
        style={{ backgroundColor: collection.color }}
      ></div>

      {/* Info Section */}
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-[#2C1C15]">
          {collection.name}
        </h2>
        <p className="text-[#6D4C41] text-sm">{collection.items} items</p>
      </div>

      {/* Hover Overlay (desktop only) */}
      <div className="absolute inset-0 bg-[#2C1C15]/80 text-white flex items-center justify-center text-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex">
        <p>{collection.description}</p>
      </div>

      {/* Mobile Description (always visible) */}
      <div className="p-3 text-center text-sm text-[#6D4C41] sm:hidden">
        {collection.description}
      </div>
    </div>
  );
}

// Main Page Component
export default function CollectionPage() {
  const [search, setSearch] = useState("");

  const categories = [
    {
      id: 1,
      name: "Shirts",
      items: 45,
      color: "#E0E7FF",
      description: "Explore a wide range of stylish and comfortable shirts.",
    },
    {
      id: 2,
      name: "Trousers",
      items: 30,
      color: "#FDE68A",
      description: "Premium trousers crafted for every occasion.",
    },
    {
      id: 3,
      name: "Jackets",
      items: 20,
      color: "#FECACA",
      description: "Stay warm and fashionable with our trendy jackets.",
    },
    {
      id: 4,
      name: "Shoes",
      items: 25,
      color: "#BBF7D0",
      description: "Step into comfort with our stylish footwear collection.",
    },
  ];

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9F2EF]">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-[#2C1C15]">Shop by Category</h1>
        <p className="text-[#6D4C41]">Find your favorite styles</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-center px-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 border border-[#E5D1C5] rounded-lg px-4 py-2 bg-white text-[#2C1C15] focus:outline-none focus:ring-2 focus:ring-[#A0522D]"
        />
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <CollectionCard key={cat.id} category={cat} />
            ))
          ) : (
            <p className="col-span-full text-center text-[#6D4C41]">
              No categories found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}  