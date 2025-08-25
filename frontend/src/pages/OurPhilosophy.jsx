import React from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";

function OurPhilosophy() {
  return (
    <Layout>
      <section className="bg-[#F1E7E5] py-16 px-6 md:px-20 lg:px-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-6"
          >
            Our Philosophy
          </motion.h1>

          {/* Intro Paragraph */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-gray-700 leading-relaxed mb-12 max-w-3xl mx-auto"
          >
            At <span className="font-semibold text-gray-800">Shahu</span>, 
            heritage, craftsmanship, and contemporary art inspired by ancient history 
            come together in every creation. We believe fashion is more than what you wear— 
            it is a story that connects the past with the present, a reflection of rarity, 
            meaning, and timelessness. True luxury is not mass-produced but sustainable, 
            made with care, intention, and respect for both tradition and the future. 
            That’s why we follow a pre-order production model, ensuring zero waste and 
            personalized craftsmanship in every piece.
          </motion.p>

          {/* Belief Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 text-left">
            {[
              {
                title: "Fashion as a Story",
                desc: "Fashion should tell a story that connects the past with the present.",
                icon: "📜",
              },
              {
                title: "Rare & Meaningful",
                desc: "Every piece must be rare, meaningful, and enduring.",
                icon: "✨",
              },
              {
                title: "Sustainable Luxury",
                desc: "True luxury is sustainable, not mass-produced.",
                icon: "🌿",
              },
              {
                title: "Zero-Waste Craftsmanship",
                desc: "We follow a pre-order production model, ensuring zero waste and personalized craftsmanship.",
                icon: "🧵",
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
