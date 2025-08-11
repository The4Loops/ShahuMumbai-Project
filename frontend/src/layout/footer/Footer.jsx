import React from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-#EDE1DF text-black border-t-4 border-black py-12 font-serif">
      <div className="max-full mx-auto px-6 flex flex-col items-center">
        {/* <h3 className="text-2xl font-bold mb-8 text-center">𝐒𝐇𝐀𝐇𝐔 𝐌𝐔𝐌𝐁𝐀𝐈</h3> */}
        <div className="w-full flex flex-wrap justify-between gap-8 mb-8">
          <div className="flex-1 min-w-[160px]">
            <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">Services</h4>
            <a href="/" className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors">Customer Service</a>
            <a href="/" className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors">FAQs</a>
          </div>
          <div className="flex-1 min-w-[160px]">
            <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">Orders</h4>
            <a href="/" className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors">Track Order</a>
            <a href="/" className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors">Returns</a>
          </div>
          <div className="flex-1 min-w-[160px]">
            <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">Legal</h4>
            <a href="/" className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors">Privacy</a>
            <a href="/" className="block text-sm mb-2 hover:text-[#D4A5A5] transition-colors">Terms</a>
          </div>
          <div className="flex-1 min-w-[160px]">
            <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">Follow Us</h4>
           <div className="flex gap-4 mt-2 justify-start">
            <a href="/" aria-label="Facebook" className="text-xl text-[#000] hover:text-[#1877F2] transition-colors">
              <FaFacebookF />
            </a>
            <a href="/" aria-label="Instagram" className="text-xl text-[#000] hover:text-[#E1306C] transition-colors">
              <FaInstagram />
            </a>
            <a href="/" aria-label="YouTube" className="text-xl text-[#000] hover:text-[#FF0000] transition-colors">
              <FaYoutube />
            </a>
          </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <h4 className="text-base font-bold border-b-2 border-dotted border-black pb-1 mb-3">Newsletter</h4>
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
  );
};

export default Footer;
