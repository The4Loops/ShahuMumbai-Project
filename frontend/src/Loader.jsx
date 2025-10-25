import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vintageVideo from "../src/assets/Loader/ShahuLoading.mp4";

const VintageLoader = ({ onFinish }) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  const handleVideoEnd = () => {
    setIsLoading(false);
    if (onFinish) onFinish();
  };

  useEffect(() => {
    // Video speed (1.5x / 2x)
    if (videoRef.current) {
      videoRef.current.playbackRate = 2; // adjust speed to complete the loading faster
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
        >
          <motion.video
            ref={videoRef}
            src={vintageVideo}
            autoPlay
            muted
            preload="auto"
            onEnded={handleVideoEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full object-contain rounded-lg"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VintageLoader;
