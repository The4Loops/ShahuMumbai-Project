import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import video from '../assets/ComingSoon.mp4';

function Hero() {
  const contentRef = useRef(null);
  const inView = useInView(contentRef, { once: true, margin: '-100px' });

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  const [canAutoplay, setCanAutoplay] = useState(true);

  useEffect(() => {
    // Feature-detect autoplay support
    const testVideo = document.createElement("video");
    testVideo.muted = true;
    testVideo.playsInline = true;

    testVideo
      .play()
      .then(() => setCanAutoplay(true))
      .catch(() => setCanAutoplay(false));
  }, []);

  return (
    <section className="relative min-h-screen w-auto h-auto overflow-hidden bg-[#fdf6e9]">
      
      {/* Parallax Video Background */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-0 w-full h-auto z-0"
      >
        <video
          autoPlay={canAutoplay}
          loop
          muted
          playsInline
          aria-hidden="true"
          className="w-full h-full object-cover filter grayscale sepia"
        >
          <source src={video} type="video/mp4" />
        </video>
      </motion.div>

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10" />

      {/* Text Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          ref={contentRef}
          className="w-full max-w-3xl text-white text-center md:text-left"
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <h1 className="text-5xl md:text-6xl font-semibold leading-snug">
            Timeless <span className="text-pink-400">Elegance</span> <br />
            <span className="text-green-300">Redefined</span>
          </h1>
          <p className="mt-6 text-lg text-gray-100">
            Discover curated vintage pieces that tell stories of bygone eras. Each item is carefully selected for its unique character and enduring style.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
            <button className="bg-white text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-200 transition">
              Shop Collection
            </button>
            <button className="border border-white text-white px-5 py-2 rounded-lg hover:bg-white hover:text-black transition">
              Learn Our Story
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
