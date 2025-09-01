import React from "react";
import Layout from "../layout/Layout";

function OurPhilosophy() {
  const beliefs = [
    {
      title: "Commitment to Craftsmanship",
      desc: "Each creation is made with precision, passion, and respect for tradition while embracing modern design.",
      icon: "🪡",
    },
    {
      title: "Sustainable Values",
      desc: "We believe true luxury is sustainable, built with intention, and never mass-produced.",
      icon: "🌱",
    },
    {
      title: "Timeless Stories",
      desc: "Our pieces are not just garments, but stories that connect the past with the present.",
      icon: "📖",
    },
    {
      title: "Ethical Production",
      desc: "Through our pre-order model, we ensure zero waste and mindful craftsmanship.",
      icon: "♻️",
    },
  ];

  return (
    <Layout>
      <section className="bg-[#F1E7E5] py-16 px-6 md:px-20 lg:px-32">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center animate-fade-in">
            Our Philosophy
          </h1>

          {/* Intro */}
          <p className="text-lg text-gray-700 leading-relaxed mb-16 text-center animate-fade-in delay-200 max-w-3xl mx-auto">
            At <span className="font-semibold text-gray-800">Shahu</span>, 
            heritage, craftsmanship, and contemporary art inspired by ancient history 
            come together in every creation. Fashion, for us, is more than just attire— 
            it is a story of rarity, meaning, and timelessness. We believe true luxury 
            is not mass-produced but intentional, sustainable, and crafted with care. 
            With our pre-order production model, every piece is created with zero waste 
            and personalized detail.
          </p>

          {/* Horizontal Stepper */}
          <div className="relative flex flex-col md:flex-row items-center justify-between md:space-x-12 space-y-12 md:space-y-0">
            {beliefs.map((item, idx) => (
              <div
                key={idx}
                className="flex-1 text-center animate-fade-in"
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-white border border-gray-300 shadow mb-4">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                {/* Description */}
                <p className="text-gray-600 text-sm max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default OurPhilosophy;
