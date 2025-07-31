import React, { useState } from "react";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import Account from "../../pages/Account";

const Navbar = () => {
  const [showAccount, setShowAccount] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState({ products: false, about: false });
  const [showLivingDropdown, setShowLivingDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);

  const cartItemCount = 3;

  const toggleAccount = () => setShowAccount((prev) => !prev);
  const closeAccount = () => setShowAccount(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const toggleMobileDropdown = (menu) => {
    setMobileDropdown((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 bg-[#f9f5f0] border-b border-[#d6ccc2] shadow-md font-serif ${showAccount ? "blur-sm" : ""}`}>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-[1.5rem] sm:text-[1.8rem] font-bold text-[#6B4226] tracking-wide">
            𝐒𝐇𝐀𝐇𝐔 𝐌𝐔𝐌𝐁𝐀𝐈
          </div>

          {/* Mobile Menu Icon */}
          <div className="lg:hidden text-[#6B4226] text-xl cursor-pointer" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </div>

          {/* Desktop Icons */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <input
              type="text"
              placeholder="Search"
              className="w-full max-w-[400px] px-4 py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#D4A5A5]"
            />
            <div className="flex items-center gap-5 text-[#6B4226]">
              <span onClick={toggleAccount} className="cursor-pointer hover:text-[#D4A5A5]">
                <FaUser size={20} title="Account" />
              </span>
              <div className="relative">
                <a href="/" className="hover:text-[#D4A5A5]">
                  <FaShoppingCart size={20} title="Cart" />
                  <span className="absolute -top-2 -right-2 bg-red-700 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {cartItemCount}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex justify-center gap-8 py-3 px-8 bg-[#f9f5f0] border-t border-[#e0d8d1]">
          <li><a href="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">Home</a></li>

          {/* Desktop Products Dropdown */}
          <li
            className="relative group"
            onMouseEnter={() => setShowLivingDropdown(true)}
            onMouseLeave={() => setShowLivingDropdown(false)}
          >
            <span className="hover:text-[#D4A5A5] text-[#6B4226] font-medium cursor-pointer">
              Products
            </span>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-6 rounded-md border border-[#e6dcd2] shadow-lg z-10 text-sm min-w-[360px] transition-all duration-300 transform ${
              showLivingDropdown ? "opacity-100 translate-y-2 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"
            }`}>
              <div className="min-w-[160px]">
                <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">OUR STORIES</h3>
                <ul className="space-y-1">
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Our Products</a></li>
                </ul>
              </div>
              <div className="min-w-[180px] mt-4">
                <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">CATEGORIES</h3>
                <ul className="space-y-1">
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Blankets and Pillows</a></li>
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Tableware</a></li>
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Furniture and Lighting</a></li>
                </ul>
              </div>
            </div>
          </li>

          <li><a href="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">Men</a></li>
          <li><a href="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">Women</a></li>

          {/* Desktop About Dropdown */}
          <li
            className="relative group"
            onMouseEnter={() => setShowAboutDropdown(true)}
            onMouseLeave={() => setShowAboutDropdown(false)}
          >
            <span className="hover:text-[#D4A5A5] text-[#6B4226] font-medium cursor-pointer">About SHAHU</span>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-6 rounded-md border border-[#e6dcd2] shadow-lg z-10 text-sm min-w-[360px] transition-all duration-300 transform ${
              showAboutDropdown ? "opacity-100 translate-y-2 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"
            }`}>
              <div className="min-w-[180px]">
                <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">OUR PHILOSOPHY</h3>
                <ul className="space-y-1">
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Our Philosophy</a></li>
                </ul>
              </div>
              <div className="min-w-[180px] mt-4">
                <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">LEGACY</h3>
                <ul className="space-y-1">
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Founder's Story</a></li>
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Heritage Timeline</a></li>
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Our Studios</a></li>
                </ul>
              </div>
              <div className="min-w-[180px] mt-4">
                <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">CRAFT</h3>
                <ul className="space-y-1">
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Contemporary artisans</a></li>
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Services</a></li>
                  <li><a href="/" className="text-gray-700 hover:text-[#D4A5A5]">Contact us</a></li>
                </ul>
              </div>
            </div>
          </li>
        </ul>

        {/* Mobile Side Menu */}
        <div className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="p-6">
            <input
              type="text"
              placeholder="Search"
              className="w-full mb-4 px-4 py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#D4A5A5]"
            />
            <ul className="space-y-4 text-[#6B4226] font-medium">
              <li><a href="/" onClick={toggleMobileMenu}>Home</a></li>

              <li>
                <button className="w-full flex justify-between items-center" onClick={() => toggleMobileDropdown('products')}>
                  Products <span>{mobileDropdown.products ? "▲" : "▼"}</span>
                </button>
                {mobileDropdown.products && (
                  <ul className="ml-4 mt-2 text-sm space-y-2">
                    <li><a href="/">Our Products</a></li>
                    <li><a href="/">Blankets and Pillows</a></li>
                    <li><a href="/">Tableware</a></li>
                    <li><a href="/">Furniture and Lighting</a></li>
                  </ul>
                )}
              </li>

              <li><a href="/" onClick={toggleMobileMenu}>Men</a></li>
              <li><a href="/" onClick={toggleMobileMenu}>Women</a></li>

              <li>
                <button className="w-full flex justify-between items-center" onClick={() => toggleMobileDropdown('about')}>
                  About SHAHU <span>{mobileDropdown.about ? "▲" : "▼"}</span>
                </button>
                {mobileDropdown.about && (
                  <ul className="ml-4 mt-2 text-sm space-y-2">
                    <li><a href="/">Our Philosophy</a></li>
                    <li><a href="/">Founder's Story</a></li>
                    <li><a href="/">Heritage Timeline</a></li>
                    <li><a href="/">Our Studios</a></li>
                    <li><a href="/">Contemporary artisans</a></li>
                    <li><a href="/">Services</a></li>
                    <li><a href="/">Contact us</a></li>
                  </ul>
                )}
              </li>

              <li>
                <button onClick={toggleAccount} className="flex items-center gap-2">
                  <FaUser /> Account
                </button>
              </li>
              <li>
                <a href="/" className="flex items-center gap-2">
                  <FaShoppingCart />
                  Cart
                  <span className="ml-1 bg-red-700 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">{cartItemCount}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Backdrop for Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={toggleMobileMenu}></div>
        )}
      </nav>

      {/* Account Modal */}
      {showAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-45 flex justify-center items-center z-50" onClick={closeAccount}>
          <div className="bg-white p-8 rounded-md max-w-md w-11/12 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800" onClick={closeAccount}>
              &times;
            </button>
            <Account />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
