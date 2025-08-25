import React from "react";
import Layout from "../layout/Layout";

const HeritageTimeline = () => {
  const milestones = [
    {
      year: "5,000 – 10,000 years ago",
      title: "Inspiration",
      description: "Rooted in lost Indian art and history.",
      titleColor: "text-amber-700",
      dotColor: "bg-amber-700",
    },
    {
      year: "Textile Traditions",
      title: "Celebrating Heritage",
      description:
        "The Indian Subcontinent, home to the richest textile legacies.",
      titleColor: "text-red-600",
      dotColor: "bg-red-600",
    },
    {
      year: "Today",
      title: "Modern Elegance",
      description:
        "Bridging ancient techniques with modern aesthetics, Shahu continues India’s story of elegance.",
      titleColor: "text-blue-600",
      dotColor: "bg-blue-600",
    },
  ];

  return (
    <Layout>
      <section className="bg-[#F1E7E5] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Heritage</h2>

          <div className="relative">
            {/* Timeline vertical line */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gray-300 z-0 hidden md:block" />

            {milestones.map((item, index) => (
              <div
                key={index}
                className={`relative mb-12 flex flex-col md:flex-row items-center 
                  ${index % 2 === 0 ? "md:justify-start" : "md:justify-end"} 
                  animate-fadeUp`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Dot */}
                <span
                  className={`absolute left-1/2 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 ${item.dotColor} w-4 h-4 rounded-full ring-4 ring-[#F1E7E5] z-20`}
                />

                {/* Card */}
                <div
                  className={`w-full md:w-1/2 px-6 mt-6 md:mt-0 ${
                    index % 2 === 0 ? "md:pr-12" : "md:pl-12"
                  }`}
                >
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <time className="block text-sm text-gray-500">
                      {item.year}
                    </time>
                    <h3 className={`text-lg font-semibold ${item.titleColor}`}>
                      {item.title}
                    </h3>
                    <p className="text-base text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HeritageTimeline;
