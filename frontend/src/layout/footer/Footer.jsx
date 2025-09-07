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
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const [activePopup, setActivePopup] = useState(null);
  const [email, setEmail] = useState("");

  const openPopup = (popupName) => setActivePopup(popupName);
  const closePopup = () => setActivePopup(null);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/sendSubscriberMail", { email });
      setEmail(""); // Clear input on success
      if(response){
        toast.success(t("footer.newsletter.success"));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || t("footer.newsletter.error");
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
                {t("footer.services.title")}
              </h4>
              <button
                onClick={() => openPopup("customerService")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.services.customerService")}
              </button>
              <button
                onClick={() => openPopup("faq")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.services.faq")}
              </button>
            </div>

            {/* Orders */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                {t("footer.orders.title")}
              </h4>
              <Link
                to="/myorder"
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.orders.trackOrder")}
              </Link>
              <button
                onClick={() => openPopup("returns")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.orders.returns")}
              </button>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                {t("footer.legal.title")}
              </h4>
              <button
                onClick={() => openPopup("privacy")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.legal.privacy")}
              </button>
              <button
                onClick={() => openPopup("terms")}
                className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.legal.terms")}
              </button>
            </div>

            {/* Follow Us */}
            <div>
              <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">
                {t("footer.followUs.title")}
              </h4>
              <div className="flex gap-4 mt-2 justify-center sm:justify-start">
                <a
                  href="https://www.facebook.com/yourpage"
                  aria-label={t("footer.followUs.facebook")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-[#000] hover:text-[#1877F2] transition-colors"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://www.instagram.com/shahumumbai?igsh=ZDl1YnN6cTFybmtx"
                  aria-label={t("footer.followUs.instagram")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-[#000] hover:text-[#E1306C] transition-colors"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://youtube.com/@bhumishahu?si=DiWMIpcvxRkBy8kb"
                  aria-label={t("footer.followUs.youtube")}
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
                {t("footer.newsletter.title")}
              </h4>
              <form
                className="flex flex-col gap-2 mt-2 items-center sm:items-start"
                onSubmit={handleNewsletterSubmit}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  {t("footer.newsletter.placeholder")}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder={t("footer.newsletter.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition-colors w-full sm:w-auto"
                >
                  {t("footer.newsletter.subscribe")}
                </button>
              </form>
            </div>
          </div>

          {/* Copyright */}
          <div className="w-full text-center text-sm border-t border-dashed border-black pt-4 mt-8">
            <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
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