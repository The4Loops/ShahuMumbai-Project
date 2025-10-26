import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vintageVideo from "../src/assets/Loader/ShahuLoading.mp4";

const VintageLoader = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="loader"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
      >
        <motion.video
          ref={videoRef}
          src={vintageVideo}
          autoPlay
          muted
          preload="auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-[60%] max-w-[500px] h-auto object-contain rounded-lg"
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default VintageLoader;
