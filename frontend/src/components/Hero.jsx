import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import video from "../assets/ComingSoon.mp4";

function Hero() {
  const contentRef = useRef(null);
  const inView = useInView(contentRef, { once: true, margin: "-100px" });

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  const [canAutoplay, setCanAutoplay] = useState(true);

  useEffect(() => {
    const testVideo = document.createElement("video");
    testVideo.muted = true;
    testVideo.playsInline = true;
    testVideo
      .play()
      .then(() => setCanAutoplay(true))
      .catch(() => setCanAutoplay(false));
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#EDE1DF]">
      {/* Parallax Video Background */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-0 w-full h-full z-0"
      >
        <video
          autoPlay={canAutoplay}
          loop
          muted
          playsInline
          aria-hidden="true"
          className="w-full h-full object-cover sm:object-center filter grayscale sepia"
        >
          <source src={video} type="video/mp4" />
        </video>
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-snug">
            Timeless <span className="text-pink-400">Elegance</span> <br />
            <span className="text-green-300">Redefined</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-100">
            Discover curated vintage pieces that tell stories of bygone eras.
            Each item is carefully selected for its unique character and
            enduring style.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
            <button className="bg-white text-gray-800 px-4 sm:px-5 py-2 rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">
              Shop Collection
            </button>
            <button className="border border-white text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-white hover:text-black transition text-sm sm:text-base">
              Learn Our Story
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
