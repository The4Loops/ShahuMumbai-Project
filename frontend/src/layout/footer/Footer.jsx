import React, { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import FAQPopup from "../FAQ";
import CustomerServicePopup from "../CustomerService";
import PrivacyPopup from "../Privacy";
import TermsPopup from "../Terms";
import ReturnsPopup from "../../pages/Returns";

const Footer = () => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showReturns, setShowReturns] = useState(false);

  return (
    <>
      <footer className="bg-[#EDE1DF] text-black border-t-2 border-black py-12 font-serif">
        <div className="max-full mx-auto px-6 flex flex-col items-center">
          <div className="w-full flex flex-wrap justify-between gap-8 mb-8">
            {/* Services */}
            <div className="flex-1 min-w-[160px]">
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Services
              </h4>
              <button
                onClick={() => setShowCustomerService(true)}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors text-left"
              >
                Customer Service
              </button>
              <button
                onClick={() => setShowFAQ(true)}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors text-left"
              >
                FAQs
              </button>
            </div>

            {/* Orders */}
            <div className="flex-1 min-w-[160px]">
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Orders
              </h4>
              <a
                href="/"
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                Track Order
              </a>
              <button
                onClick={() => setShowReturns(true)}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors text-left"
              >
                Returns
              </button>
            </div>

            {/* Legal */}
            <div className="flex-1 min-w-[160px]">
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Legal
              </h4>
              <button
                onClick={() => setShowPrivacy(true)}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors text-left"
              >
                Privacy
              </button>
              <button
                onClick={() => setShowTerms(true)}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors text-left"
              >
                Terms
              </button>
            </div>

            {/* Follow Us */}
            <div className="flex-1 min-w-[160px]">
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Follow Us
              </h4>
              <div className="flex gap-4 mt-2 justify-start">
                <a
                  href="/"
                  aria-label="Facebook"
                  className="text-xl text-[#000] hover:text-[#1877F2] transition-colors"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="/"
                  aria-label="Instagram"
                  className="text-xl text-[#000] hover:text-[#E1306C] transition-colors"
                >
                  <FaInstagram />
                </a>
                <a
                  href="/"
                  aria-label="YouTube"
                  className="text-xl text-[#000] hover:text-[#FF0000] transition-colors"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="flex-1 min-w-[160px]">
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                Newsletter
              </h4>
              <form className="flex flex-col gap-2 mt-2 items-start">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-black rounded text-sm"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="w-full text-center text-sm border-t border-dashed border-black pt-4 mt-8">
            <p>&copy; Shahu Mumbai 2025. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Popups */}
      {showFAQ && <FAQPopup onClose={() => setShowFAQ(false)} />}
      {showCustomerService && (
        <CustomerServicePopup onClose={() => setShowCustomerService(false)} />
      )}
      {showPrivacy && <PrivacyPopup onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsPopup onClose={() => setShowTerms(false)} />}
      {showReturns && <ReturnsPopup onClose={() => setShowReturns(false)} />}
    </>
  );
};

export default Footer;
