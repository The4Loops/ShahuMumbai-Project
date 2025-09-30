import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {useNavigate} from 'react-router-dom';
import api from "../supabase/axios";

function Hero() {
  const navigate=useNavigate();
  const contentRef = useRef(null);
  const inView = useInView(contentRef, { once: true, margin: "-100px" });

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  const [canAutoplay, setCanAutoplay] = useState(true);
  const [banner, setBanner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch banner data
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await api.get("/api/banners");
        const banners = response.data;
        if (banners && banners.length > 0) {
          setBanner(banners[0]); // Use the first banner
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching banner:", err);
        setError("Failed to load banner");
        setIsLoading(false);
      }
    };
    fetchBanner();
  }, []);

  // Test video autoplay capability
  useEffect(() => {
    const testVideo = document.createElement("video");
    testVideo.muted = true;
    testVideo.playsInline = true;
    testVideo
      .play()
      .then(() => setCanAutoplay(true))
      .catch(() => setCanAutoplay(false));
  }, []);

  // Transform title to include styled spans
  const formatTitle = (title) => {
    if (!title) {
      return 'Timeless <span className="text-pink-400">Elegance</span> <br /><span className="text-green-300">Redefined</span>';
    }
    // Split title and wrap "Elegance" and "Redefined" in spans
    const parts = title.split(" ");
    if (parts.length >= 3 && parts[1] === "Elegance" && parts[2] === "Redefined") {
      return `Timeless <span className="text-pink-400">Elegance</span> <br /><span className="text-green-300">Redefined</span>`;
    }
    return title; // Fallback to plain title if it doesn't match expected format
  };

  // Fallback content
  const title = formatTitle(banner?.Title);
  const description = banner?.Description ;
  const mediaUrl = banner?.ImageUrl;

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#F1E7E5]">
      {/* Parallax Video Background */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-0 w-full h-full z-0"
      >
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-r from-[#8d6e63] to-[#bcaaa4]" />
        ) : (
          <video
            autoPlay={canAutoplay}
            loop
            muted
            playsInline
            aria-hidden="true"
            className="w-full h-full object-cover sm:object-center filter grayscale sepia"
          >
            <source src={mediaUrl} type="video/mp4" />
          </video>
        )}
      </motion.div>

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-auto bg-black/40 z-10" />

      {/* Text Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          ref={contentRef}
          className="w-full max-w-3xl text-white text-center md:text-left"
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-snug"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-100">
            {description}
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
            <button onClick={()=>navigate("/products")} className="bg-white text-gray-800 px-4 sm:px-5 py-2 rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">
              Shop Collection
            </button>
            <button onClick={()=>navigate("/about")} className="border border-white text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-white hover:text-black transition text-sm sm:text-base">
              Learn Our Story
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;