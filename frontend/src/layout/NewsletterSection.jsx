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

    // Check if all images in the page have loaded
    const waitForImages = () => {
      const images = Array.from(document.images);
      if (images.every((img) => img.complete)) {
        setTimeout(() => setShow(true), 1000); // slight delay
      } else {
        // Wait for images to load
        const onLoad = () => {
          if (images.every((img) => img.complete)) {
            setTimeout(() => setShow(true), 1000);
            images.forEach((img) => img.removeEventListener("load", onLoad));
          }
        };
        images.forEach((img) => img.addEventListener("load", onLoad));
      }
    };

    // Wait until React renders the DOM
    requestAnimationFrame(waitForImages);
  }, []);

  const handleClose = () => {
    setShow(false);
    if (dontShowAgain) {
      localStorage.setItem("newsletterPopupShown", "true");
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 newsletter-popup-overlay"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-xl p-4 xs:p-6 sm:p-8 w-[90vw] max-w-[300px] xs:max-w-[340px] sm:max-w-md text-center newsletter-popup-content"
          >
            <button
              onClick={handleClose}
              aria-label="Close newsletter popup"
              className="absolute top-2 xs:top-3 right-2 xs:right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="flex justify-center mb-3 xs:mb-4">
              <div className="p-3 xs:p-4 bg-pink-100 rounded-full shadow-md">
                <Mail className="w-6 h-6 xs:w-8 xs:h-8 text-pink-500" />
              </div>
            </div>

            <h2 className="text-xl xs:text-2xl font-bold text-gray-800 mb-1 xs:mb-2">
              Subscribe to our Newsletter
            </h2>
            <p className="text-sm xs:text-base text-gray-600 mb-4 xs:mb-6">
              Stay updated with our latest collections, exclusive offers, and vintage finds delivered straight to your inbox.
            </p>

            {subscribed ? (
              <p className="text-green-600 font-semibold text-sm xs:text-base">Thanks for subscribing! 🎉</p>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center bg-gray-100 rounded-full overflow-hidden shadow-sm"
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-3 xs:px-4 py-1.5 xs:py-2 bg-transparent outline-none text-gray-700 text-sm xs:text-base"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 xs:px-6 py-1.5 xs:py-2 font-semibold rounded-full shadow-md text-xs xs:text-sm"
                  >
                    Subscribe
                  </motion.button>
                </form>

                <div className="mt-3 xs:mt-4 flex items-center justify-center space-x-2">
                  <input
                    id="dontShow"
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={() => setDontShowAgain(!dontShowAgain)}
                    className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="dontShow" className="text-xs xs:text-sm text-gray-600 cursor-pointer">
                    Don’t show this popup again
                  </label>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
