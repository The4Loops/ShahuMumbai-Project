import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Layout from "./Layout";

export default function NewsletterCard() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Subscribed with: ${email}`);
    setEmail("");
  };

  return (
    <Layout>
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center relative overflow-hidden"
      >
        {/* Fun floating background circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-200 rounded-full opacity-30 animate-bounce"></div>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="flex justify-center mb-4"
        >
          <div className="p-4 bg-pink-100 rounded-full shadow-md">
            <Mail className="w-8 h-8 text-pink-500" />
          </div>
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Subscribe to our Newsletter
        </h2>
        <p className="text-gray-600 mb-6">
          Stay updated with our latest collections, exclusive offers, and
          vintage finds delivered straight to your inbox.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-gray-100 rounded-full overflow-hidden shadow-sm"
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-2 bg-transparent outline-none text-gray-700"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 font-semibold rounded-full shadow-md"
          >
            Subscribe
          </motion.button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-xs tracking-widest text-gray-500 uppercase">
          Vintage Collection
        </p>
      </motion.div>
    </div>
    </Layout>
  );
}
