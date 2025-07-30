import React, { useState } from "react";
import "./Navbar.css";
import Account from "../../pages/Account";

const Navbar = () => {
  const [showAccount, setShowAccount] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState("");

  const toggleAccount = () => setShowAccount((prev) => !prev);
  const closeAccount = () => setShowAccount(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const toggleProductsDropdown = () => {
    setShowProductsDropdown((prev) => !prev);
    setOpenSubMenu(""); // Close submenus
  };

  const toggleSubMenu = (menu) => {
    setOpenSubMenu((prev) => (prev === menu ? "" : menu));
  };

  return (
    <>
      <nav className={`navbar ${showAccount ? "blurred" : ""}`}>
        <div className="navbar-top">
          <div className="logo">𝐒𝐇𝐀𝐇𝐔 𝐌𝐔𝐌𝐁𝐀𝐈</div>
          <button className="hamburger" onClick={toggleMobileMenu}>
            ☰
          </button>
          <input type="text" placeholder="Search" className="search-bar" />
          <div className="nav-icons">
            <span onClick={toggleAccount}>ACCOUNT</span>
            <a href="/">Cart</a>
          </div>
        </div>

        <div className={`navbar-bottom ${isMobileMenuOpen ? "open" : ""}`}>
          <ul className="nav-menu">
            <li><a href="/">Home</a></li>

            <li className="dropdown">
              <a href="/" onClick={(e) => { e.preventDefault(); toggleProductsDropdown(); }}>
                Products
              </a>

              {showProductsDropdown && (
                <ul className="dropdown-menu show">
                  <li><a href="/">Furniture</a></li>

                  <li className="dropdown-sub">
                    <a href="/" onClick={(e) => { e.preventDefault(); toggleSubMenu("men"); }}>
                      Men
                    </a>
                    {openSubMenu === "men" && (
                      <ul className="dropdown-menu-sub show">
                        <li><a href="/">Shirts</a></li>
                        <li><a href="/">Pants</a></li>
                        <li><a href="/">Shoes</a></li>
                      </ul>
                    )}
                  </li>

                  <li className="dropdown-sub">
                    <a href="/" onClick={(e) => { e.preventDefault(); toggleSubMenu("women"); }}>
                      Women
                    </a>
                    {openSubMenu === "women" && (
                      <ul className="dropdown-menu-sub show">
                        <li><a href="/">Dresses</a></li>
                        <li><a href="/">Tops</a></li>
                        <li><a href="/">Shoes</a></li>
                      </ul>
                    )}
                  </li>

                  <li><a href="/">Jewelry & Watches</a></li>
                  <li><a href="/">Fragrances</a></li>
                </ul>
              )}
            </li>

            <li><a href="/">Special Editions</a></li>
            <li><a href="/">About SHAHU</a></li>
          </ul>
        </div>
      </nav>

      {showAccount && (
        <div className="account-modal-overlay" onClick={closeAccount}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeAccount}>×</button>
            <Account />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
