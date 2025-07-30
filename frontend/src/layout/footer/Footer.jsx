import React from "react";
import "./Footer.css";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="retro-footer">
      <div className="footer-content">
        <h3 className="footer-logo">𝐒𝐇𝐀𝐇𝐔 𝐌𝐔𝐌𝐁𝐀𝐈</h3>
        <div className="footer-columns">
          <div className="footer-column">
            <h4>Services</h4>
            <a href="/">Customer Service</a>
            <a href="/">FAQs</a>
          </div>
          <div className="footer-column">
            <h4>Orders</h4>
            <a href="/">Track Order</a>
            <a href="/">Returns</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="/">Privacy</a>
            <a href="/">Terms</a>
          </div>
          <div className="footer-column">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="/" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="/" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="/" aria-label="YouTube">
                <FaYoutube />
              </a>
            </div>
          </div>
          <div className="footer-column">
            <h4>Newsletter</h4>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; Shahu Mumbai 2025. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
