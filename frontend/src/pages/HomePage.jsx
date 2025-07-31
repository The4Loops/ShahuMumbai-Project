import React from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";

function HomePage() {
  return (
    <Layout>
      <main className="bg-[#f9f5f0] w-full text-[#3b2f2f] font-sans">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col md:flex-row items-center justify-between my-2 px-6 md:px-16 py-10 bg-[#f6ede4]">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="w-full md:w-1/2 mb-10 md:mb-0"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight text-[#4a2d2e]">
              Discover Your Style
            </h1>
            <p className="text-lg md:text-xl mb-6 text-[#5e4b3c]">
              Shop the latest trends in fashion, electronics, home & more.
            </p>
            <button className="px-6 py-3 text-lg rounded-2xl shadow-md bg-[#c9a79c] text-white hover:bg-[#b88c85] transition">
              Shop Now
            </button>
          </motion.div>

          <motion.img
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            src='/assets/images/product_images/dummyShoes.jpg'
            alt="Ecommerce Hero"
            className="w-full md:w-1/2 max-w-md mx-auto rounded-xl shadow-lg"
          />
        </section>

        {/* Featured Categories */}
        <section className=" bg-transparent  px-6 md:px-16 my-8 py-16">
          <h2 className="text-3xl font-serif font-semibold text-center mb-12 text-[#4a2d2e]">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["Fashion", "Furniture", "Home", "Beauty"].map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-transparent p-6 rounded-2xl shadow hover:shadow-xl cursor-pointer text-center border "
              >
                <h3 className="text-lg font-medium text-[#3b2f2f]">{category}</h3>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="px-6 md:px-16 py-20 bg-gradient-to-r from-[#f1e4dc] to-[#f6ede4] text-center">
          <h2 className="text-2xl md:text-4xl font-serif font-bold mb-4 text-[#4a2d2e]">Stay in the Loop</h2>
          <p className="text-md md:text-lg mb-6 text-[#5e4b3c]">Get updates on sales, new products & more.</p>
          <form className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full md:w-auto px-6 py-3 rounded-full border border-[#d8c2b0] focus:outline-none focus:ring-2 focus:ring-[#c9a79c]"
            />
            <button className="px-6 py-3 rounded-full text-white bg-[#b88c85] hover:bg-[#a5776e] transition">
              Subscribe
            </button>
          </form>
        </section>
      </main>
    </Layout>
  );
}

export default HomePage;
