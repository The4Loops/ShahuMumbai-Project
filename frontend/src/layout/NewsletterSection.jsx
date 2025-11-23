import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
import { toast } from "react-toastify";
import api from "../supabase/axios";

export default function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("newsletterPopupShown");
    if (hasSeenPopup) return;

    const checkStatus = async () => {
      let shouldShow = true;
        try {
          const response = await api.get("/api/newsletter/status");
          if (response.data.dontShow) shouldShow = false;
        } catch(e) {
          // ignore
        }

      if (!shouldShow) return;
      setTimeout(() => setShow(true), 200);
    };

    checkStatus();
  }, []);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

  const handleClose = () => {
    setShow(false);
    if (dontShowAgain) {
      localStorage.setItem("newsletterPopupShown", "true");

        api.post("/api/newsletter/optout", {}).catch((err) => {
          toast.error("Failed to update newsletter preferences");
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/sendSubscriberMail", { email });
      setSubscribed(true);
      localStorage.setItem("newsletterPopupShown", "true");
      setEmail("");
      toast.success(response.data.message || "Newsletter email sent and subscription enabled!");
      setTimeout(handleClose, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to subscribe to newsletter";
      toast.error(errorMessage);
    }
  };

  // Animation variants for smoother entrance
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94], // Smooth easeOut
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const contentVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0,
      y: 20,
    },
    visible: {
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.1, // Slight delay after overlay
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 newsletter-popup-overlay"
        >
          <motion.div
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#F1E7E5] rounded-2xl shadow-xl p-4 xs:p-6 sm:p-8 w-[90vw] max-w-[350px] xs:max-w-[340px] sm:max-w-md text-center newsletter-popup-content"
          >
            <motion.button
              onClick={handleClose}
              aria-label="Close newsletter popup"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute top-2 xs:top-3 right-2 xs:right-3 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X size={20} />
            </motion.button>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex justify-center mb-3 xs:mb-4"
            >
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="p-3 xs:p-4 bg-pink-100 rounded-full shadow-md cursor-default"
              >
                <Mail className="w-6 h-6 xs:w-8 xs:h-8 text-[#A67B5B]" />
              </motion.div>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-xl xs:text-2xl font-bold text-gray-800 mb-1 xs:mb-2"
            >
              Subscribe to our Newsletter
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-sm xs:text-base text-gray-600 mb-4 xs:mb-6"
            >
              Stay updated with our latest collections, exclusive offers, and vintage finds delivered straight to your inbox.
            </motion.p>

            <AnimatePresence mode="wait">
              {subscribed ? (
                <motion.p 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-green-600 font-semibold text-sm xs:text-base"
                >
                  Thanks for subscribing! 🎉
                </motion.p>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                >
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center bg-gray-100 rounded-full overflow-hidden shadow-sm"
                  >
                    <motion.input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      initial={{ x: -10 }}
                      animate={{ x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      whileFocus={{ scale: 1.02 }}
                      className="flex-1 px-3 xs:px-4 py-1.5 xs:py-2 bg-transparent outline-none text-gray-700 text-sm xs:text-base transition-all duration-200"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="flex-shrink-0 bg-gradient-to-r from-[#A67B5B] to-[#C19A6B] text-white p-2 xs:py-2 font-semibold rounded-full shadow-md text-xs xs:text-sm"
                    >
                      Subscribe
                    </motion.button>
                  </form>

                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.45 }}
                    className="mt-3 xs:mt-4 flex items-center justify-center space-x-2"
                  >
                    <input
                      id="dontShow"
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={() => setDontShowAgain(!dontShowAgain)}
                      className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-pink-500 border-gray-300 rounded cursor-pointer transition-all duration-200"
                    />
                    <label htmlFor="dontShow" className="text-xs xs:text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors duration-200">
                      Don’t show this popup again
                    </label>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}