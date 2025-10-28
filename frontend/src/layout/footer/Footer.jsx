import React, { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { toast } from "react-toastify";
import FAQPopup from "../FAQ";
import CustomerServicePopup from "../CustomerService";
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
      setEmail("");
      if (response) {
        toast.success(t("footer.newsletter.success"));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || t("footer.newsletter.error");
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <footer className="bg-[#EDE1DF] text-black border-t-2 border-black py-8 xs:py-10 sm:py-12 font-serif footer-container">
        <div className="max-w-full mx-auto px-4 xs:px-6 flex flex-col items-center">
          <div className="w-full grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xs:gap-6 mb-6 xs:mb-8 text-center xs:text-left footer-grid">
            {/* Services */}
            <div className="lg:col-span-1">
              <h4 className="text-sm xs:text-base font-bold border-b-2 border-dotted border-black pb-1 mb-2 xs:mb-3">
                {t("footer.services.title")}
              </h4>
              <button
                onClick={() => openPopup("customerService")}
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.services.customerService")}
              </button><br />
              <button
                onClick={() => openPopup("faq")}
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.services.faq")}
              </button>
            </div>

            {/* Orders */}
            <div className="lg:col-span-1 text-center">
              <h4 className="text-sm xs:text-base font-bold border-b-2 border-dotted border-black pb-1 mb-2 xs:mb-3">
                {t("footer.orders.title")}
              </h4>
              <Link
                to="/myorder"
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.orders.trackOrder")}
              </Link><br/>
              <Link
                to="/shipping-policy"
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.orders.shipping")}
              </Link><br />
              <Link
                to="/cancellation-refund-policy"
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.orders.refund")}
              </Link>
            </div>

            {/* Legal */}
            <div className="lg:col-span-1">
              <h4 className="text-sm xs:text-base font-bold border-b-2 border-dotted border-black pb-1 mb-2 xs:mb-3">
                {t("footer.legal.title")}
              </h4>
              <Link
                to="/privacy-policy"
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.legal.privacy")}
              </Link><br/>
              <Link
                to="/terms-and-conditions"
                className="text-xs xs:text-sm mb-1 xs:mb-2 hover:text-[#D4A5A5] transition-colors"
              >
                {t("footer.legal.terms")}
              </Link>
            </div>

            {/* Follow Us */}
            <div className="lg:col-span-1">
              <h4 className="text-sm xs:text-base font-bold border-b-2 border-dotted border-black pb-1 mb-2 xs:mb-3">
                {t("footer.followUs.title")}
              </h4>
              <div className="flex gap-3 xs:gap-4 mt-1 xs:mt-2 justify-center xs:justify-start social-icons">
                {/* <a
                  href="https://www.facebook.com/yourpage"
                  aria-label={t("footer.followUs.facebook")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg xs:text-xl text-[#000] hover:text-[#1877F2] transition-colors"
                >
                  <FaFacebookF />
                </a> */}
                <a
                  href="https://www.instagram.com/shahumumbai?igsh=ZDl1YnN6cTFybmtx"
                  aria-label={t("footer.followUs.instagram")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg xs:text-xl text-[#000] hover:text-[#E1306C] transition-colors"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://youtube.com/@bhumishahu?si=DiWMIpcvxRkBy8kb"
                  aria-label={t("footer.followUs.youtube")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg xs:text-xl text-[#000] hover:text-[#FF0000] transition-colors"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="col-span-2 xs:col-span-1 lg:col-span-1">
              <h4 className="text-sm xs:text-base font-bold border-b-2 border-dotted border-black pb-1 mb-2 xs:mb-3">
                {t("footer.newsletter.title")}
              </h4>
              <form
                className="flex flex-col gap-2 mt-2 items-center xs:items-start newsletter-form"
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
                  className="w-full px-2 xs:px-3 py-1.5 xs:py-2 border border-black rounded text-xs xs:text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-black text-white px-3 xs:px-4 py-1.5 xs:py-2 rounded font-bold hover:bg-gray-800 transition-colors w-full xs:w-auto text-xs xs:text-sm"
                >
                  {t("footer.newsletter.subscribe")}
                </button>
              </form>
            </div>
          </div>

          <div className="w-full text-center text-xs xs:text-sm border-t border-dashed border-black pt-3 xs:pt-4 mt-6 xs:mt-8 footer-copyright">
            <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>

      {activePopup === "faq" && <FAQPopup onClose={closePopup} />}
      {activePopup === "customerService" && <CustomerServicePopup onClose={closePopup} />}
    </>
  );
};

export default Footer;