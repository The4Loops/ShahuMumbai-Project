import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const Loader = ({ isLoading }) => {
  // Animation variants for the orbiting dots
  const dotVariants = {
    pulse: (i) => ({
      scale: [1, 1.3, 1],
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        delay: i * 0.2, // Staggered delay for each dot
        ease: "easeInOut",
      },
    }),
  };

  // Animation for the main spinning circle
  const circleVariants = {
    spin: {
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md"
        >
          <div className="relative w-24 h-24">
            {/* Main spinning circle */}
            <motion.div
              className="absolute inset-0 border-6 border-t-6 border-[#6B4226] border-solid rounded-full border-t-transparent"
              variants={circleVariants}
              animate="spin"
            />
            {/* Orbiting dots */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-[#D4A5A5] rounded-full"
                style={{
                  top: i % 2 === 0 ? "10%" : "70%",
                  left: i < 2 ? "10%" : "70%",
                }}
                variants={dotVariants}
                animate="pulse"
                custom={i}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;