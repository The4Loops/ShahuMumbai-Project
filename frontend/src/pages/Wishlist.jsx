import React from "react";
import { motion } from "framer-motion";
import { AiOutlineShoppingCart, AiOutlineDelete } from "react-icons/ai";
import Layout from "../layout/Layout";
import { Ecom, UX } from "../analytics"; // ✅ added

const wishlistItems = [
  {
    id: 1,
    title: "Vintage Silk Scarf Collection - Handpicked Premium Quality",
    category: "Accessories",
    price: 89.99,
    originalPrice: 129.99,
    color: "#fde2e4",
    discount: 31,
    inStock: true,
  },
  {
    id: 2,
    title: "Antique Leather Handbag - Genuine Vintage Design",
    category: "Bags",
    price: 149.99,
    originalPrice: 199.99,
    color: "#c5dedd",
    discount: 25,
    inStock: true,
  },
  {
    id: 3,
    title: "Victorian Pearl Brooch - Authentic Antique Jewelry",
    category: "Jewelry",
    price: 75.0,
    color: "#dbe7e4",
    inStock: false,
  },
  {
    id: 4,
    title: "Retro Sunglasses - Classic Cat Eye Frame",
    category: "Accessories",
    price: 45.99,
    originalPrice: 65.99,
    color: "#f6dfeb",
    discount: 30,
    inStock: true,
  },
  {
    id: 5,
    title: "Vintage Wool Coat - 1950s Inspired Tailoring",
    category: "Clothing",
    price: 225.0,
    originalPrice: 299.99,
    color: "#f4f1de",
    discount: 25,
    inStock: true,
  },
];

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

const Wishlist = () => {
  const inStockItems = wishlistItems.filter((item) => item.inStock);
  const totalValue = wishlistItems
    .reduce((total, item) => total + item.price, 0)
    .toFixed(2);

  return (
    <Layout>
      <div className="p-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Favorite Items</h1>
            <p className="text-gray-500 text-sm">
              {wishlistItems.length} items saved for later
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              className="flex items-center gap-2 border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50 text-sm font-medium"
              onClick={() => {
                // ✅ GA4: clear wishlist (track as multiple removes)
                try {
                  wishlistItems.forEach((it) =>
                    UX.removeFromWishlist({
                      id: it.id,
                      item_id: it.id,
                      item_name: it.title,
                      category: it.category,
                      price: it.price,
                    })
                  );
                } catch {}
              }}
            >
              <AiOutlineDelete size={16} /> Clear All
            </button>
            <button
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm font-medium"
              onClick={() => {
                // ✅ GA4: add all in-stock to cart (analytics only)
                try {
                  inStockItems.forEach((it) =>
                    Ecom.addToCart({
                      id: it.id,
                      title: it.title,
                      category: it.category,
                      price: it.price,
                      quantity: 1,
                    })
                  );
                } catch {}
              }}
            >
              <AiOutlineShoppingCart size={16} /> Add All to Cart (
              {inStockItems.length})
            </button>
          </div>
        </div>

        {/* Stats Row with animation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Items", value: wishlistItems.length },
            { label: "In Stock", value: inStockItems.length },
            { label: "Total Value", value: `$${totalValue}` },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="border rounded-lg p-6 text-center"
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Wishlist Grid with animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              custom={index + 3} // delay starts after stats
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-md overflow-hidden relative"
            >
              {item.discount && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  -{item.discount}%
                </div>
              )}
              <div
                className="w-full h-56"
                style={{ backgroundColor: item.color }}
              />
              <div className="p-4">
                <div className="text-xs text-gray-500 uppercase mb-1">
                  {item.category}
                </div>
                <div className="font-semibold text-sm mb-2 line-clamp-2">
                  {item.title}
                </div>
                <div className="mb-2">
                  <span className="text-lg font-bold text-gray-800">
                    ${item.price.toFixed(2)}
                  </span>
                  {item.originalPrice && (
                    <span className="line-through text-sm text-gray-400 ml-2">
                      ${item.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 text-sm bg-pink-100 text-pink-600 px-3 py-1 rounded flex items-center justify-center gap-1"
                    onClick={() => {
                      // ✅ GA4: remove_from_wishlist
                      try {
                        UX.removeFromWishlist({
                          id: item.id,
                          item_id: item.id,
                          item_name: item.title,
                          category: item.category,
                          price: item.price,
                        });
                      } catch {}
                    }}
                  >
                    <AiOutlineDelete size={14} /> Remove
                  </button>
                  <button
                    className={`flex-1 text-sm px-3 py-1 rounded flex items-center justify-center gap-1 ${
                      item.inStock
                        ? "bg-black text-white"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                    disabled={!item.inStock}
                    onClick={() => {
                      if (!item.inStock) return;
                      // ✅ GA4: add_to_cart (from wishlist)
                      try {
                        Ecom.addToCart({
                          id: item.id,
                          title: item.title,
                          category: item.category,
                          price: item.price,
                          quantity: 1,
                        });
                      } catch {}
                    }}
                  >
                    {item.inStock ? (
                      <AiOutlineShoppingCart size={14} />
                    ) : (
                      "Out of Stock"
                    )}
                    {item.inStock && "Add to Cart"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
