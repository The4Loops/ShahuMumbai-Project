import React, { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import { GiStoneCrafting, GiSpinningWheel } from "react-icons/gi";
import { MdOutlineDiamond } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import { useLoading } from "../context/LoadingContext";

import inspirationImg from "../assets/Heritage/inspiration.png";
import celebratingImg from "../assets/Heritage/Celebrating.png";
import modernImg from "../assets/Heritage/modern.png";

const milestones = [
  {
    year: "1800s",
    title: "Roots in Craft",
    description:
      "The tradition of handweaving in India traces back centuries, with artisans perfecting techniques passed down through generations.",
    Icon: GiStoneCrafting,
    image: inspirationImg,
    titleColor: "text-amber-700",
    dotColor: "bg-amber-700",
  },
  {
    year: "1950s",
    title: "Revival of the Loom",
    description:
      "Post-independence, master weavers revived ancient patterns, blending heritage with renewed pride in Indian textiles.",
    Icon: GiSpinningWheel,
    image: celebratingImg,
    titleColor: "text-red-600",
    dotColor: "bg-red-600",
  },
  {
    year: "2020s",
    title: "Modern Legacy",
    description:
      "Shahu Mumbai brings timeless craftsmanship into contemporary wardrobes — sustainable, ethical, and proudly handwoven.",
    Icon: MdOutlineDiamond,
    image: modernImg,
    titleColor: "text-blue-600",
    dotColor: "bg-blue-600",
  },
];

export default function HeritageTimeline() {
  const { setLoading } = useLoading();
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLoading]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % milestones.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? milestones.length - 1 : prev - 1));
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/heritagetimeline`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Heritage Timeline",
        item: canonical,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: milestones.length,
    itemListElement: milestones.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: `${m.year} — ${m.title}`,
        url: `${canonical}#${encodeURIComponent(m.title)}`,
        description: m.description,
        startDate: m.year,
        image: m.image ? `${baseUrl}${m.image}` : undefined,
      },
    })),
  };

  return (
    <Layout>
      <Helmet>
        <title>Heritage Timeline — Shahu Mumbai</title>
        <meta
          name="description"
          content="Explore Shahu Mumbai’s heritage timeline—key inspirations, craftsmanship milestones, and modern evolutions across the years."
        />
        <meta
          name="robots"
          content={
            Array.isArray(milestones) && milestones.length === 0
              ? "noindex,follow"
              : "index,follow,max-image-preview:large"
          }
        />
        <meta
          name="keywords"
          content="Shahu Mumbai heritage, heritage timeline, Indian craftsmanship history, artisanal fashion, brand story, sustainable luxury India"
        />

        {/* Canonical + hreflang */}
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en-IN" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content="Heritage Timeline — Shahu Mumbai" />
        <meta
          property="og:description"
          content="A journey through our inspirations and craftsmanship milestones."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${baseUrl}/og/heritage.jpg`} />
        <meta
          property="og:image:alt"
          content="Shahu Mumbai — Heritage Timeline milestones"
        />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(itemListJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Heritage Timeline — Shahu Mumbai",
            url: canonical,
            description:
              "Explore Shahu Mumbai’s heritage timeline—key inspirations, craftsmanship milestones, and modern evolutions across the years.",
            isPartOf: {
              "@type": "WebSite",
              name: "Shahu Mumbai",
              url: baseUrl,
            },
            mainEntity: itemListJsonLd,
          })}
        </script>
      </Helmet>

      <section className="bg-[#F1E7E5] py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800 tracking-wide">
            Our Heritage Timeline
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
          <div className="md:hidden bg-[#F1E7E5] py-8">
            <div className="overflow-x-auto px-4 snap-x snap-mandatory flex gap-6 scrollbar-hide">
              {milestones.map((item, index) => {
                const Icon = item.Icon;
                return (
                  <div
                    key={index}
                    className="snap-center flex-shrink-0 w-64 bg-white rounded-2xl shadow-md p-4 transition-transform hover:scale-[1.02] duration-300"
                  >
                    <button
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Open ${item.title} modal`}
                      className={`mb-4 mx-auto ${item.dotColor} w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl shadow-lg hover:brightness-110 active:scale-95 transition`}
                    >
                      <Icon />
                    </button>

                    <div className="relative mb-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-40 object-cover rounded-xl"
                      />
                    </div>

                    <time className="block text-sm text-gray-500 mb-1">
                      {item.year}
                    </time>
                    <h3 className={`text-lg font-bold ${item.titleColor} mb-1`}>
                      {item.title}
                    </h3>
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {item.description}
                    </p>
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-96 p-5 sm:p-6 relative animate-modalScale overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveIndex(null)}
              aria-label="Close modal"
              className="absolute top-2 left-60 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition text-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <IoMdClose />
            </button>

            <div className="flex items-center justify-between mb-3">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full shadow transition"
                aria-label="Previous milestone"
                onClick={handlePrev}
              >
                <FaChevronLeft />
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full shadow transition"
                aria-label="Next milestone"
                onClick={handleNext}
              >
                <FaChevronRight />
              </button>
            </div>

            <img
              src={milestones[activeIndex].image}
              alt={milestones[activeIndex].title}
              className="w-full h-48 object-cover rounded-lg mb-4 shadow"
            />

            <time className="block text-sm text-gray-500 mb-1">
              {milestones[activeIndex].year}
            </time>
            <h3
              className={`text-xl font-bold ${milestones[activeIndex].titleColor} mb-2`}
            >
              {milestones[activeIndex].title}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {milestones[activeIndex].description}
            </p>
          </div>
        </div>
      )}

      {/* Animations + Utility */}
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
          /* Hide scrollbars for mobile horizontal scroll */
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
    </Layout>
  );
}
