import React, { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { toast } from "react-toastify";
import FAQPopup from "../FAQ";
import CustomerServicePopup from "../CustomerService";
import PrivacyPopup from "../Privacy";
import TermsPopup from "../Terms";
import ReturnsPopup from "../../pages/Returns";
import { Link } from "react-router-dom";
import api from "../../supabase/axios";

const Footer = () => {
  const [activePopup, setActivePopup] = useState(null);
  const [email, setEmail] = useState("");

  const openPopup = (popupName) => setActivePopup(popupName);
  const closePopup = () => setActivePopup(null);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/sendSubscriberMail", { email });
      setEmail(""); // Clear input on success
      toast.success(response.data.message || "Successfully subscribed to newsletter!");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to subscribe to newsletter";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <footer className="bg-[#EDE1DF] text-black border-t-2 border-black py-12 font-serif">
        <div className="max-w-full mx-auto px-6 flex flex-col items-center">
          {/* Main Footer Content */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 text-center sm:text-left">
            {/* Services */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Services
              </h4>
              <button
                onClick={() => openPopup("customerService")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                Customer Service
              </button>
              <button
                onClick={() => openPopup("faq")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                FAQs
              </button>
            </div>

            {/* Orders */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Orders
              </h4>
              <Link
                to="/myorder"
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                Track Order
              </Link>
              <button
                onClick={() => openPopup("returns")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                Returns
              </button>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Legal
              </h4>
              <button
                onClick={() => openPopup("privacy")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => openPopup("terms")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                Terms & Conditions
              </button>
            </div>

            {/* Follow Us */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Follow Us
              </h4>
              <div className="flex gap-4 mt-2 justify-center sm:justify-start">
                <a
                  href="https://www.facebook.com/yourpage"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-[#000] hover:text-[#1877F2] transition-colors"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://www.instagram.com/shahumumbai?igsh=ZDl1YnN6cTFybmtx"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-[#000] hover:text-[#E1306C] transition-colors"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://youtube.com/@bhumishahu?si=DiWMIpcvxRkBy8kb"
                  aria-label="YouTube"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-[#000] hover:text-[#FF0000] transition-colors"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Newsletter
              </h4>
              <form
                className="flex flex-col gap-2 mt-2 items-center sm:items-start"
                onSubmit={handleNewsletterSubmit}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition-colors w-full sm:w-auto"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Copyright */}
          <div className="w-full text-center text-sm border-t border-dashed border-black pt-4 mt-8">
            <p>&copy; Shahu Mumbai 2025. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Popups */}
      {activePopup === "faq" && <FAQPopup onClose={closePopup} />}
      {activePopup === "customerService" && (
        <CustomerServicePopup onClose={closePopup} />
      )}
      {activePopup === "privacy" && <PrivacyPopup onClose={closePopup} />}
      {activePopup === "terms" && <TermsPopup onClose={closePopup} />}
      {activePopup === "returns" && <ReturnsPopup onClose={closePopup} />}
    </>
  );
};

export default Footer;