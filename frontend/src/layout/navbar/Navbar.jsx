import React, { useState } from "react";
import { FaUser, FaShoppingCart } from "react-icons/fa";
import Account from "../../pages/Account";
import "./Navbar.css";

const Navbar = () => {
  const [showAccount, setShowAccount] = useState(false);
  const [showLivingDropdown, setShowLivingDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const cartItemCount = 3; // Replace this with dynamic state later

  const toggleAccount = () => setShowAccount((prev) => !prev);
  const closeAccount = () => setShowAccount(false);

  return (
    <>
      <nav className={`navbar-container ${showAccount ? "blur-sm" : ""}`}>
        <div className="navbar-top-section">
          <div className="brand-logo">𝐒𝐇𝐀𝐇𝐔 𝐌𝐔𝐌𝐁𝐀𝐈</div>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
          />
          <div className="nav-links">
            <span onClick={toggleAccount} className="nav-link">
              <FaUser size={20} title="Account" />
            </span>
            <div className="nav-link cart-icon-wrapper">
              <a href="/">
                <FaShoppingCart size={20} title="Cart" />
                <span className="cart-badge">{cartItemCount}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="navbar-bottom-section">
          <ul className="nav-list">
            <li><a href="/" className="nav-link">Home</a></li>

            <li
              className="nav-item"
              onMouseEnter={() => setShowLivingDropdown(true)}
              onMouseLeave={() => setShowLivingDropdown(false)}
            >
              <span className="nav-link">Products</span>
              {showLivingDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-column">
                    <h3 className="dropdown-heading">OUR STORIES</h3>
                    <ul className="dropdown-list">
                      <li><a href="/" className="dropdown-link">Our Products</a></li>
                    </ul>
                  </div>
                  <div className="dropdown-column">
                    <h3 className="dropdown-heading">CATEGORIES</h3>
                    <ul className="dropdown-list">
                      <li><a href="/" className="dropdown-link">Blankets and Pillows</a></li>
                      <li><a href="/" className="dropdown-link">Tableware</a></li>
                      <li><a href="/" className="dropdown-link">Furniture and Lighting</a></li>
                    </ul>
                  </div>
                </div>
              )}
            </li>

            <li><a href="/" className="nav-link">Men</a></li>
            <li><a href="/" className="nav-link">Women</a></li>

            <li
              className="nav-item"
              onMouseEnter={() => setShowAboutDropdown(true)}
              onMouseLeave={() => setShowAboutDropdown(false)}
            >
              <span className="nav-link">About SHAHU</span>
              {showAboutDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-column">
                    <h3 className="dropdown-heading">OUR PHILOSOPHY</h3>
                    <ul className="dropdown-list">
                      <li><a href="/" className="dropdown-link">Our Philosophy</a></li>
                    </ul>
                  </div>
                  <div className="dropdown-column">
                    <h3 className="dropdown-heading">LEGACY</h3>
                    <ul className="dropdown-list">
                      <li><a href="/" className="dropdown-link">Founder's Story</a></li>
                      <li><a href="/" className="dropdown-link">Heritage Timeline</a></li>
                      <li><a href="/" className="dropdown-link">Our Studios</a></li>
                    </ul>
                  </div>
                  <div className="dropdown-column">
                    <h3 className="dropdown-heading">CRAFT</h3>
                    <ul className="dropdown-list">
                      <li><a href="/" className="dropdown-link">Contemporary artisans</a></li>
                      <li><a href="/" className="dropdown-link">Services</a></li>
                      <li><a href="/" className="dropdown-link">Contact us</a></li>
                    </ul>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {showAccount && (
        <div className="modal-overlay" onClick={closeAccount}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeAccount}>
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
