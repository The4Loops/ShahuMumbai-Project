import React from "react";
import { motion } from "framer-motion";
import { AiOutlineHeart, AiOutlineShoppingCart, AiOutlineDelete } from "react-icons/ai";
import { Layer } from "recharts";
import Layout from "../layout/Layout";

const wishlistItems = [
  {
    id: 1,
    title: "Vintage Silk Scarf Collection - Handpicked Premium Quality",
    category: "Accessories",
    price: 89.99,
    originalPrice: 129.99,
    image: "https://via.placeholder.com/200x250?text=Scarf",
    discount: 31,
    inStock: true,
  },
  {
    id: 2,
    title: "Antique Leather Handbag - Genuine Vintage Design",
    category: "Bags",
    price: 149.99,
    originalPrice: 199.99,
    image: "https://via.placeholder.com/200x250?text=Handbag",
    discount: 25,
    inStock: true,
  },
  {
    id: 3,
    title: "Victorian Pearl Brooch - Authentic Antique Jewelry",
    category: "Jewelry",
    price: 75.0,
    image: "https://via.placeholder.com/200x250?text=Brooch",
    inStock: false,
  },
  {
    id: 4,
    title: "Retro Sunglasses - Classic Cat Eye Frame",
    category: "Accessories",
    price: 45.99,
    originalPrice: 65.99,
    image: "https://via.placeholder.com/200x250?text=Sunglasses",
    discount: 30,
    inStock: true,
  },
  {
    id: 5,
    title: "Vintage Wool Coat - 1950s Inspired Tailoring",
    category: "Clothing",
    price: 225.0,
    originalPrice: 299.99,
    image: "https://via.placeholder.com/200x250?text=Wool+Coat",
    discount: 25,
    inStock: true,
  },
];

const Wishlist = () => {
  const inStockItems = wishlistItems.filter((item) => item.inStock);

  return (
    <Layout>
    <div className="p-6">
      <div className="text-2xl font-bold mb-4">Your Favorite Items</div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg w-40 text-center">
          <div className="text-lg font-semibold">{wishlistItems.length}</div>
          <div className="text-sm">Total Items</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg w-40 text-center">
          <div className="text-lg font-semibold">{inStockItems.length}</div>
          <div className="text-sm">In Stock</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg w-40 text-center">
          <div className="text-lg font-semibold">
            $
            {wishlistItems
              .reduce((total, item) => total + item.price, 0)
              .toFixed(2)}
          </div>
          <div className="text-sm">Total Value</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-md overflow-hidden relative"
          >
            {item.discount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                -{item.discount}%
              </div>
            )}
            <img src={item.image} alt={item.title} className="w-full h-56 object-cover" />
            <div className="p-4">
              <div className="text-xs text-gray-500 uppercase mb-1">{item.category}</div>
              <div className="font-semibold text-sm mb-2 line-clamp-2">{item.title}</div>
              <div className="mb-2">
                <span className="text-lg font-bold text-gray-800">${item.price.toFixed(2)}</span>
                {item.originalPrice && (
                  <span className="line-through text-sm text-gray-400 ml-2">
                    ${item.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 text-sm bg-pink-100 text-pink-600 px-3 py-1 rounded flex items-center justify-center gap-1">
                  <AiOutlineDelete size={14} /> Remove
                </button>
                <button
                  className={`flex-1 text-sm px-3 py-1 rounded flex items-center justify-center gap-1 ${
                    item.inStock
                      ? "bg-black text-white"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                  disabled={!item.inStock}
                >
                  {item.inStock ? <AiOutlineShoppingCart size={14} /> : "Out of Stock"}
                  {item.inStock && "Add to Cart"}
                </button>
              </div>
            </div>
            <button className="absolute top-2 right-2">
              <AiOutlineHeart size={18} className="text-pink-500 fill-pink-100" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
    </Layout>
  );
};

export default Wishlist;