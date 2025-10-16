import React, { useState,useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vintageVideo from "../src/assets/Loader/ShahuLoading.mp4";

const VintageLoader = ({ onFinish }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleVideoEnd = () => {
    setIsLoading(false);
    if (onFinish) onFinish();
  };

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
        >
          {/* Fullscreen responsive video */}
          <motion.video
            src={vintageVideo}
            autoPlay
            muted
            preload="auto"
            onEnded={handleVideoEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="
              w-full h-full max-w-full max-h-full
              sm:max-w-md sm:max-h-md
              md:max-w-lg md:max-h-lg
              lg:max-w-xl lg:max-h-xl
              object-contain rounded-lg
            "
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VintageLoader;