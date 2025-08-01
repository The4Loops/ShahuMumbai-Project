import { motion } from 'framer-motion';
import video from '../assets/ComingSoon.mp4';
import React from 'react'

 function Hero() {
  return (
    <section className="min-h-screen flex flex-col-reverse md:flex-row items-center justify-center px-6 py-12 gap-10 bg-[#fdf6e9]">
      <div className="md:w-1/2 text-center md:text-left space-y-6">
        <motion.h1 
          className="text-5xl font-semibold leading-snug"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Timeless <span className="text-pink-600">Elegance</span> <br />
          <span className="text-green-700">Redefined</span>
        </motion.h1>
        <p className="text-gray-600">
          Discover curated vintage pieces that tell stories of bygone eras. Each item is carefully selected for its unique character and enduring style.
        </p>
        <div className="flex gap-4 justify-center md:justify-start">
          <button className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition">Shop Collection</button>
          <button className="border border-gray-600 px-5 py-2 rounded-lg hover:bg-gray-100 transition">Learn Our Story</button>
        </div>
      </div>

      <div className="md:w-1/2 max-w-md shadow-xl rounded-2xl overflow-hidden">
        <video autoPlay loop muted className="rounded-2xl w-full h-full object-cover">
          <source src={video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
export default Hero;