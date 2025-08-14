import React from "react";
import Layout from "../layout/Layout";
import { motion } from "framer-motion";

const HeritageTimeline = () => {
  const milestones = [
    {
      year: "1995",
      title: "Our Beginning",
      description: "Started as a small local store selling handcrafted goods.",
    },
    {
      year: "2005",
      title: "First Online Store",
      description: "Launched our e-commerce website to reach customers nationwide.",
    },
    {
      year: "2015",
      title: "Global Expansion",
      description: "Opened warehouses in Europe and Asia for faster delivery.",
    },
    {
      year: "2023",
      title: "Sustainability Focus",
      description: "Transitioned to eco-friendly packaging and carbon-neutral shipping.",
    },
  ];

  return (
    <Layout>
      <section className="bg-[#F1E7E5] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Heritage</h2>
          <div className="relative">
            {/* Vertical line in the middle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-300 h-full"></div>

            {milestones.map((item, index) => (
              <motion.div
                key={index}
                className={`mb-12 flex w-full flex-col md:flex-row items-center ${
                  index % 2 === 0 ? "md:justify-start" : "md:justify-end"
                }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-full md:w-1/2 px-6">
                  <div className="bg-white p-6 rounded-lg shadow-lg relative">
                    {/* Dot */}
                    <div
                      className={`absolute top-6 w-4 h-4 bg-blue-500 rounded-full border-4 border-[#F1E7E5] ${
                        index % 2 === 0 ? "md:-right-8 left-1/2 transform -translate-x-1/2 md:translate-x-0" : "md:-left-8 left-1/2 transform -translate-x-1/2 md:translate-x-0"
                      }`}
                    ></div>

                    <time className="block text-sm text-gray-500">
                      {item.year}
                    </time>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-base text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HeritageTimeline;
