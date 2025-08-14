import React from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";

function OurPhilosophy() {
  return (
    <Layout>
    <section className="bg-[#F1E7E5] py-16 px-6 md:px-20 lg:px-32">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-gray-800 mb-6"
        >
          Our Philosophy
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-gray-600 leading-relaxed mb-12"
        >
          At <span className="font-semibold text-gray-800">[Your Brand]</span>,
          we believe shopping should be more than just a transaction. It’s about
          connection, trust, and bringing quality into your life. We are
          committed to sourcing ethically, reducing waste, and creating
          products that last — because great style should also be kind to the
          planet.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {[
            {
              title: "Quality First",
              desc: "Every product we offer is crafted with care and built to last, so you can buy with confidence.",
              icon: "💎",
            },
            {
              title: "Sustainability",
              desc: "We prioritize eco-friendly materials and responsible production methods to protect our planet.",
              icon: "🌱",
            },
            {
              title: "Customer Connection",
              desc: "Your happiness matters. We strive to create a shopping experience that feels personal and trustworthy.",
              icon: "🤝",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.6 }}
              className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-base">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    </Layout>
  );
}
export default OurPhilosophy;