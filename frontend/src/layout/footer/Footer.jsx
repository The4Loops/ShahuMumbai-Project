import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div>
          <h4>Services</h4>
          <ul>
            <li><a href="/">Customer Service</a></li>
            <li><a href="/">FAQs</a></li>
          </ul>
        </div>
        <div>
          <h4>Orders</h4>
          <ul>
            <li><a href="/">Track Order</a></li>
            <li><a href="/">Returns</a></li>
          </ul>
        </div>
        <div>
          <h4>𝔖𝔥𝔞𝔥𝔲 𝔐𝔲𝔪𝔟𝔞𝔦</h4>
          <ul>
            <li><a href="/">About Us</a></li>
            <li><a href="/">Careers</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="/">Privacy</a></li>
            <li><a href="/">Terms</a></li>
          </ul>
        </div>
        <div>
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="/">FB</a>
            <a href="/">IG</a>
            <a href="/">YT</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; Shahu Mumbai 2025. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
