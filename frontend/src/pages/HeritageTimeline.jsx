// src/pages/HeritageTimeline.jsx
import React, { useState, useMemo } from "react";
import Layout from "../layout/Layout";
import { GiStoneCrafting, GiSpinningWheel } from "react-icons/gi";
import { MdOutlineDiamond } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";

// Images (keep your assets)
import inspirationImg from "../assets/Heritage/inspiration.png";
import celebratingImg from "../assets/Heritage/Celebrating.png";
import modernImg from "../assets/Heritage/modern.png";

const iconMap = [GiStoneCrafting, GiSpinningWheel, MdOutlineDiamond];
const colorMap = [
  { titleColor: "text-amber-700", dotColor: "bg-amber-700" },
  { titleColor: "text-red-600", dotColor: "bg-red-600" },
  { titleColor: "text-blue-600", dotColor: "bg-blue-600" }
];
const imageMap = [inspirationImg, celebratingImg, modernImg];

export default function HeritageTimeline() {
  const { t } = useTranslation();

  // milestones come from i18n array: heritage.milestones
  const milestones = useMemo(() => {
    const data = t("heritage.milestones", { returnObjects: true }) || [];
    return data.map((item, idx) => ({
      year: item.year,
      title: item.title,
      description: item.description,
      Icon: iconMap[idx % iconMap.length],
      image: imageMap[idx % imageMap.length],
      ...colorMap[idx % colorMap.length]
    }));
  }, [t]);

  const [activeIndex, setActiveIndex] = useState(null);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % milestones.length);
  };
  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? milestones.length - 1 : prev - 1));
  };

  return (
    <Layout>
      <section className="bg-[#F1E7E5] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800 tracking-wide">
            {t("heritage.title")}
          </h2>

          {/* Desktop Timeline */}
          <div className="relative hidden md:block">
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gray-300" />
            {milestones.map((item, index) => {
              const Icon = item.Icon;
              return (
                <div
                  key={index}
                  className={`relative mb-20 flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  } animate-fadeUp`}
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  <button
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Open ${item.title} modal`}
                    className={`absolute left-1/2 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 ${item.dotColor} w-12 h-12 rounded-full ring-4 ring-[#F1E7E5] flex items-center justify-center text-white text-2xl shadow-md z-20 hover:scale-110 transition-transform`}
                  >
                    <Icon />
                  </button>

                  <div className="w-full md:w-1/2 flex justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full max-w-sm rounded-xl shadow-lg"
                    />
                  </div>

                  <div className="w-full md:w-1/2 px-6">
                    <time className="block text-sm text-gray-500 mb-1">
                      {item.year}
                    </time>
                    <h3 className={`text-2xl font-bold ${item.titleColor}`}>
                      {item.title}
                    </h3>
                    <p className="text-gray-700 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden overflow-x-auto py-4">
            <div className="flex gap-8 px-4">
              {milestones.map((item, index) => {
                const Icon = item.Icon;
                return (
                  <div key={index} className="flex-shrink-0 w-32 text-center">
                    <button
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Open ${item.title} modal`}
                      className={`mb-2 ${item.dotColor} w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-md mx-auto hover:scale-110 transition-transform`}
                    >
                      <Icon />
                    </button>
                    <time className="block text-sm text-gray-500">
                      {item.year}
                    </time>
                    <h3 className={`text-base font-bold ${item.titleColor}`}>
                      {item.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {activeIndex !== null && milestones[activeIndex] && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative animate-modalScale"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveIndex(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 sm:top-3 sm:right-3 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors text-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <IoMdClose />
            </button>

            <button
              className="absolute top-1/2 left-2 sm:left-0 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-full shadow"
              aria-label="Previous milestone"
              onClick={handlePrev}
            >
              <FaChevronLeft />
            </button>

            <button
              className="absolute top-1/2 right-2 sm:right-0 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-full shadow"
              aria-label="Next milestone"
              onClick={handleNext}
            >
              <FaChevronRight />
            </button>

            <img
              src={milestones[activeIndex].image}
              alt={milestones[activeIndex].title}
              className="w-full rounded-lg mb-4 shadow-md"
            />
            <time className="block text-sm text-gray-500 mb-1">
              {milestones[activeIndex].year}
            </time>
            <h3
              className={`text-2xl font-bold ${milestones[activeIndex].titleColor} mb-2`}
            >
              {milestones[activeIndex].title}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {milestones[activeIndex].description}
            </p>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>
        {`
          @keyframes fadeUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeUp {
            animation: fadeUp 0.8s forwards;
          }
          @keyframes modalScale {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-modalScale {
            animation: modalScale 0.4s ease-out forwards;
          }
        `}
      </style>
    </Layout>
  );
}
