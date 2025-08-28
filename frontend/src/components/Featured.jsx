import { motion } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";

// Example imports (replace with your actual image paths)
import scarfImg from "../assets/products/scarf.jpg";
import coatImg from "../assets/products/coat.jpg";
import watchImg from "../assets/products/watch.jpg";
import bagImg from "../assets/products/bag.jpg";

const items = [
  { title: "Vintage Silk Scarf", price: "$89", oldPrice: "$120", tag: "New", img: scarfImg },
  { title: "Classic Wool Coat", price: "$245", oldPrice: "$320", img: coatImg },
  { title: "Antique Brass Watch", price: "$180", oldPrice: "$230", img: watchImg },
  { title: "Leather Messenger Bag", price: "$165", oldPrice: "$210", tag: "New", img: bagImg },
];

function Featured() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6 bg-[#F1E7E5] text-center relative overflow-hidden">
      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold mb-3 text-[#4B2C20]"
      >
        Featured Treasures
      </motion.h2>
      <p className="text-[#4B2C20]/70 mb-14 max-w-xl mx-auto">
        Handpicked vintage pieces that capture timeless style and craftsmanship.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-2xl border border-[#E4D5C9] p-6 transition"
          >
            {/* Tag */}
            {item.tag && (
              <span className="absolute top-4 left-4 text-xs bg-[#E3BDB4] text-[#4B2C20] px-3 py-1 rounded-full shadow">
                {item.tag}
              </span>
            )}

            {/* Image */}
            <div className="w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#F1E6E1] shadow-inner overflow-hidden">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-[#4B2C20] mb-2">
              {item.title}
            </h3>

            {/* Price */}
            <p className="text-[#4B2C20] font-semibold text-base">
              {item.price}{" "}
              <span className="text-sm text-[#4B2C20]/50 line-through ml-1">
                {item.oldPrice}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/products")}
        className="mt-16 bg-[#4B2C20] text-white px-8 py-3 rounded-full shadow hover:bg-[#6B4226] transition"
      >
        View All Products
      </motion.button>
    </section>
  );
}

export default Featured;
