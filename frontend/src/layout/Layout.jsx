import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added for smooth child transitions
import Navbar from './navbar/Navbar';
import Footer from './footer/Footer';

function Layout({ children, location }) { // Added location prop for key-based transitions (pass from router if needed)
  return (
    <div className="flex flex-col min-h-screen bg-[#F1E7E5] text-black font-serif">
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl mt-20 md:mt-32 mx-auto py-10">
        <AnimatePresence mode="wait" key={location?.pathname || 'default'}> {/* Smooth exit/enter for child pages */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;