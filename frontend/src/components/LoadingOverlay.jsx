import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import vintageVideo from '../assets/Loader/ShahuLoading.mp4';

const LoadingOverlay = ({ isLoading }) => {
  
  const videoRef = useRef(null);
  
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = 1;
      }
    }, []);
    
if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-lg">
      <div className="relative">
        {/* <div className="w-16 h-16 border-4 border-gray-300 rounded-full animate-spin border-t-transparent border-t-gray-800"></div> */}
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-800 rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;