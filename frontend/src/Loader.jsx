import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vintageVideo from "../src/assets/Loader/ShahuLoading.mp4";

const VintageLoader = ({ onFinish }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleVideoEnd = () => {
    setIsLoading(false);
    if (onFinish) onFinish();
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          {/* Fullscreen responsive video */}
          <video
            src={vintageVideo}
            autoPlay
            muted
            onEnded={handleVideoEnd}
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