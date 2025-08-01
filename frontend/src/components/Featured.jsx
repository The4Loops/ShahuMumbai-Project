import { motion } from 'framer-motion';
import React from 'react'

const items = [
  { title: 'Vintage Silk Scarf', price: '$89', oldPrice: '$120', tag: 'New', img: '🧣' },
  { title: 'Classic Wool Coat', price: '$245', oldPrice: '$320', img: '🧥' },
  { title: 'Antique Brass Watch', price: '$180', oldPrice: '$230', img: '⌚' },
  { title: 'Leather Messenger Bag', price: '$165', oldPrice: '$210', tag: 'New', img: '🎒' },
];

function Featured() {
  return (
    <section className="py-16 px-6 text-center">
      <h2 className="text-3xl font-semibold mb-2">Featured Treasures</h2>
      <p className="text-gray-600 mb-8">Handpicked vintage pieces that capture timeless style and craftsmanship.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition"
            whileHover={{ scale: 1.03 }}
          >
            {item.tag && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">{item.tag}</span>}
            <div className="text-6xl my-4">{item.img}</div>
            <h3 className="text-lg font-medium">{item.title}</h3>
            <p className="text-green-700 font-semibold">{item.price} <span className="text-sm text-gray-400 line-through">{item.oldPrice}</span></p>
          </motion.div>
        ))}
      </div>
      <button className="mt-8 bg-green-700 text-white px-6 py-2 rounded-lg">View All Products</button>
    </section>
  );
}
export default Featured;