import React, { useState, useEffect } from "react";
import WebFont from "webfontloader";
import shahu from "../assets/ShahuLogo.png";
import Hero from "../assets/HeImg.jpeg";
import api from "../supabase/axios";
import { toast } from "react-toastify";

function NewsletterEmail() {
  const [editMode, setEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [subject, setSubject] = useState("Our Monthly Newsletter");

  const [newsletter, setNewsletter] = useState({
    logo: "",
    title: "Hello Subscriber 👋",
    content:
      "Welcome to our monthly newsletter! Here’s what we’ve been up to and what’s coming next. We’re excited to share our latest updates, insights, and exclusive offers with you.",
    featuredTitle: "✨ Upcoming Waitlist",
    featuredText:
      "We just launched a brand new feature to make your experience even better. Check it out and let us know your thoughts!",
    heroImage: "",
    aboveHeroText:
      "✨ “Just like devotion creates temples, we create experiences you’ll cherish.” ",
    ctaText: "Explore Now",
    ctaLink: "/",
    ctaBgColor: "#c9a79c",
    ctaTextColor: "#ffffff",
    footerText: "© 2025 Your Brand. All rights reserved.",
    unsubscribeText:
      "You are receiving this email because you subscribed to our newsletter.",
    backgroundColor: "#fdf9f4",
    backgroundImage: "",
    headerColor: "#c9a79c",
    headerImage: "",
    fontFamily: "Inter",
    titleColor: "#222222",
    bodyColor: "#444444",
    featuredColor: "#555555",
    footerColor: "#666666",
    panelMinimized: false,
  });

  useEffect(() => {
  const uploadInitialImages = async () => {
    try {
      // Fetch local images and upload to Cloudinary
      const uploadImage = async (url, filename) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("image", blob, filename);
        const { data } = await api.post("/api/upload/single", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return data.url;
      };

      const logoURL = await uploadImage(shahu, "ShahuLogo.png");
      const heroURL = await uploadImage(Hero, "HeImg.jpeg");

      setNewsletter((prev) => ({
        ...prev,
        logo: logoURL,
        heroImage: heroURL,
      }));
    } catch (err) {
      toast.error("Failed to load initial images.");
    }
  };
  uploadInitialImages();
}, []);

  useEffect(() => {
    WebFont.load({
      google: {
        families: [
          newsletter.fontFamily,
          "Inter",
          "Roboto",
          "Poppins",
          "Merriweather",
          "Lora",
        ],
      },
    });
  }, [newsletter.fontFamily]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewsletter((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e, key) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/api/upload/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let publicURL = response.data.url;
      publicURL = publicURL.replace(
        "/image/upload/",
        "/image/upload/w_800,h_800,q_80/"
      );  
      setNewsletter((prev) => ({ ...prev, [key]: publicURL }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload image");
    }
  }
};

  const handleRemoveImage = (key) => {
    setNewsletter((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSendNewsletter = async () => {
    // Generate HTML content for the newsletter
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: ${newsletter.fontFamily}, sans-serif; margin: 0; padding: 0; }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${newsletter.backgroundImage ? "transparent" : newsletter.backgroundColor};
            ${newsletter.backgroundImage ? `background-image: url(${newsletter.backgroundImage});` : ""}
            background-size: cover;
            background-position: center;
          }
          .header {
            text-align: center;
            padding: 32px 24px;
            background-color: ${newsletter.headerImage ? "transparent" : newsletter.headerColor};
            ${newsletter.headerImage ? `background-image: url(${newsletter.headerImage});` : ""}
            background-size: cover;
            background-position: center;
            color: #ffffff;
          }
          .header img { height: 96px; width: 96px; border-radius: 50%; margin-bottom: 8px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 24px 24px 40px; }
          .content h2 { font-size: 24px; font-weight: bold; margin-bottom: 16px; color: ${newsletter.titleColor}; }
          .content p { font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: ${newsletter.bodyColor}; }
          .featured {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(8px);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            margin-bottom: 32px;
          }
          .featured h3 { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: ${newsletter.featuredColor}; }
          .featured p { font-size: 14px; color: ${newsletter.featuredColor}; }
          .hero img { width: 100%; object-fit: cover; border-radius: 12px; }
          .hero-text { text-align: center; margin: 8px 0; font-size: 16px; color: ${newsletter.bodyColor}; }
          .cta {
            text-align: center;
            padding-bottom: 40px;
          }
          .cta a {
            display: inline-block;
            padding: 12px 32px;
            border-radius: 9999px;
            background-color: ${newsletter.ctaBgColor};
            color: ${newsletter.ctaTextColor};
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s;
          }
          .cta a:hover { transform: scale(1.05); }
          .footer {
            text-align: center;
            padding: 24px;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border-top: 1px solid #e5e7eb;
            color: ${newsletter.footerColor};
          }
          .footer .unsubscribe { font-size: 12px; margin-top: 8px; }
          .footer a { color: ${newsletter.footerColor}; text-decoration: underline; }
          .footer a:hover { opacity: 0.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${newsletter.logo ? `<img src="${newsletter.logo}" alt="Logo">` : ""}
            <p>Stay updated with the latest news</p>
          </div>
          <div class="content">
            <h2>${newsletter.title}</h2>
            <p>${newsletter.content}</p>
            <div class="featured">
              <h3>${newsletter.featuredTitle}</h3>
              <p>${newsletter.featuredText}</p>
            </div>
            ${newsletter.heroImage ? `<div class="hero"><img src="${newsletter.heroImage}" alt="Newsletter Hero"></div>` : ""}
            <div class="hero-text">${newsletter.aboveHeroText}</div>
          </div>
          <div class="cta">
            <a href="${newsletter.ctaLink}">${newsletter.ctaText}</a>
          </div>
          <div class="footer">
            <p>${newsletter.footerText}</p>
            <p class="unsubscribe">${newsletter.unsubscribeText} <a href="${process.env.REACT_APP_BASE_URL || "http://localhost:3000"}/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const response = await api.post("/api/sendNewsletterMail", {
        subject,
        htmlContent,
      });
      toast.success(response.data.message || "Newsletter sent successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send newsletter");
    }
  };

  return (
    <div className="w-full bg-gray-100 py-10 flex gap-6 justify-center">
      {/* SIDEBAR */}
      {showSettings && (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 overflow-y-auto">
          <h2 className="font-semibold mb-4">⚙️ Customize</h2>
          <div className="space-y-3">
            <label className="block text-sm">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter email subject"
            />
            <label className="block text-sm">Font Family</label>
            <select
              name="fontFamily"
              value={newsletter.fontFamily}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option>Inter</option>
              <option>Roboto</option>
              <option>Poppins</option>
              <option>Merriweather</option>
              <option>Lora</option>
            </select>
            <label className="block text-sm">Background Color</label>
            <input
              type="color"
              name="backgroundColor"
              value={newsletter.backgroundColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">Header Color</label>
            <input
              type="color"
              name="headerColor"
              value={newsletter.headerColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">Title Color</label>
            <input
              type="color"
              name="titleColor"
              value={newsletter.titleColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">Body Color</label>
            <input
              type="color"
              name="bodyColor"
              value={newsletter.bodyColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">Featured Color</label>
            <input
              type="color"
              name="featuredColor"
              value={newsletter.featuredColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">CTA Background</label>
            <input
              type="color"
              name="ctaBgColor"
              value={newsletter.ctaBgColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">CTA Text Color</label>
            <input
              type="color"
              name="ctaTextColor"
              value={newsletter.ctaTextColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <label className="block text-sm">Footer Color</label>
            <input
              type="color"
              name="footerColor"
              value={newsletter.footerColor}
              onChange={handleChange}
              className="w-full h-10"
            />
            <div>
              <label className="block text-sm mb-1">Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "backgroundImage")}
              />
              {newsletter.backgroundImage && (
                <button
                  onClick={() => handleRemoveImage("backgroundImage")}
                  className="mt-2 text-xs text-red-500"
                >
                  Remove Background
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1">Header Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "headerImage")}
              />
              {newsletter.headerImage && (
                <button
                  onClick={() => handleRemoveImage("headerImage")}
                  className="mt-2 text-xs text-red-500"
                >
                  Remove Header
                </button>
              )}
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 bg-gray-900 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* NEWSLETTER PREVIEW */}
      <div className="w-full max-w-2xl">
        <div
          className="shadow-lg rounded-2xl overflow-hidden relative"
          style={{
            backgroundColor: newsletter.backgroundImage
              ? "transparent"
              : newsletter.backgroundColor,
            backgroundImage: newsletter.backgroundImage
              ? `url(${newsletter.backgroundImage})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            fontFamily: newsletter.fontFamily,
          }}
        >
          {/* Edit Toggle */}
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => setEditMode(!editMode)}
              className="bg-gray-900 text-white px-4 py-1 text-xs rounded-full shadow hover:bg-gray-700"
            >
              {editMode ? "Save Changes" : "Edit"}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-900 text-white px-4 py-1 text-xs rounded-full shadow hover:bg-gray-700"
            >
              {showSettings ? "Hide Settings" : "Show Settings"}
            </button>
          </div>

          {/* HEADER */}
          <div
            className="text-white text-center py-8 flex flex-col items-center"
            style={{
              backgroundColor: newsletter.headerImage
                ? "transparent"
                : newsletter.headerColor,
              backgroundImage: newsletter.headerImage
                ? `url(${newsletter.headerImage})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {editMode ? (
              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "logo")}
                  className="mb-3 text-xs"
                />
                {newsletter.logo && (
                  <>
                    <img
                      src={newsletter.logo}
                      alt="Logo Preview"
                      className="h-24 w-24 mb-2 rounded-full"
                    />
                    <button
                      onClick={() => handleRemoveImage("logo")}
                      className="text-xs text-red-500"
                    >
                      Remove Logo
                    </button>
                  </>
                )}
              </div>
            ) : (
              newsletter.logo && (
                <img
                  src={newsletter.logo}
                  alt="Logo"
                  className="h-24 w-24 mb-2 rounded-full "
                />
              )
            )}
            <p className="text-sm opacity-90">
              Stay updated with the latest news
            </p>
          </div>

          {/* CONTENT */}
          <div className="px-6 py-10">
            {editMode ? (
              <input
                type="text"
                name="title"
                value={newsletter.title}
                onChange={handleChange}
                className="w-full text-2xl font-semibold mb-4 border p-2 rounded"
              />
            ) : (
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: newsletter.titleColor }}
              >
                {newsletter.title}
              </h2>
            )}

            {editMode ? (
              <textarea
                name="content"
                value={newsletter.content}
                onChange={handleChange}
                className="w-full border p-2 rounded mb-6"
                rows="4"
              />
            ) : (
              <p
                className="mb-6 leading-relaxed"
                style={{ color: newsletter.bodyColor }}
              >
                {newsletter.content}
              </p>
            )}

            {/* FEATURED SECTION */}
            <div className="bg-white/60 backdrop-blur-md p-5 rounded-xl shadow-md border mb-8">
              {editMode ? (
                <>
                  <input
                    type="text"
                    name="featuredTitle"
                    value={newsletter.featuredTitle}
                    onChange={handleChange}
                    className="w-full font-bold mb-2 border p-2 rounded"
                  />
                  <textarea
                    name="featuredText"
                    value={newsletter.featuredText}
                    onChange={handleChange}
                    className="w-full border p-2 rounded text-sm"
                    rows="3"
                  />
                </>
              ) : (
                <>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: newsletter.featuredColor }}
                  >
                    {newsletter.featuredTitle}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: newsletter.featuredColor }}
                  >
                    {newsletter.featuredText}
                  </p>
                </>
              )}
            </div>

            {/* HERO IMAGE */}
            <div className="w-full mb-2">
              {editMode ? (
                <div className="p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "heroImage")}
                    className="mb-2 text-xs"
                  />
                  {newsletter.heroImage && (
                    <>
                      <img
                        src={newsletter.heroImage}
                        alt="Hero Preview"
                        className="w-full object-cover rounded-xl"
                      />
                      <button
                        onClick={() => handleRemoveImage("heroImage")}
                        className="mt-2 text-xs text-red-500"
                      >
                        Remove Hero
                      </button>
                    </>
                  )}
                </div>
              ) : (
                newsletter.heroImage && (
                  <img
                    src={newsletter.heroImage}
                    alt="Newsletter Hero"
                    className="w-full object-cover"
                  />
                )
              )}
            </div>

            {/* TEXT ABOVE HERO */}
            <div className="mb-2 text-center">
              {editMode ? (
                <input
                  type="text"
                  name="aboveHeroText"
                  value={newsletter.aboveHeroText}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  placeholder="Enter text above hero"
                />
              ) : (
                <p style={{ color: newsletter.bodyColor }}>
                  {newsletter.aboveHeroText}
                </p>
              )}
            </div>
          </div>

          {/* CTA BUTTON */}
          <div className="px-6 pb-10 text-center">
            {editMode ? (
              <div className="flex flex-col gap-2 items-center">
                <input
                  type="text"
                  name="ctaText"
                  value={newsletter.ctaText}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded"
                  placeholder="CTA Button Text"
                />
                <input
                  type="text"
                  name="ctaLink"
                  value={newsletter.ctaLink}
                  onChange={handleChange}
                  className="w-1/2 border p-2 rounded"
                  placeholder="CTA Link"
                />
              </div>
            ) : (
              <a
                href={newsletter.ctaLink}
                className="inline-block px-8 py-3 rounded-full shadow-lg font-semibold transition transform hover:scale-105"
                style={{
                  backgroundColor: newsletter.ctaBgColor,
                  color: newsletter.ctaTextColor,
                }}
              >
                {newsletter.ctaText}
              </a>
            )}
          </div>

          {/* FOOTER */}
          <div className="text-center py-6 text-sm bg-white/70 backdrop-blur-md border-t">
            {editMode ? (
              <>
                <input
                  type="text"
                  name="footerText"
                  value={newsletter.footerText}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-2"
                />
                <textarea
                  name="unsubscribeText"
                  value={newsletter.unsubscribeText}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  rows="2"
                />
              </>
            ) : (
              <>
                <p style={{ color: newsletter.footerColor }}>
                  {newsletter.footerText}
                </p>
                <p
                  className="mt-2 text-xs"
                  style={{ color: newsletter.footerColor }}
                >
                  {newsletter.unsubscribeText}{" "}
                  <span className="relative group">
                    <a
                      href="/"
                      className="underline opacity-0 group-hover:opacity-60 ml-1 transition duration-300"
                      style={{ color: newsletter.footerColor }}
                    >
                      Unsubscribe
                    </a>
                    <span className="absolute left-0 -top-6 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] px-2 py-1 rounded transition">
                      Unsubscribe
                    </span>
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* SEND BUTTON */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSendNewsletter}
            className="px-6 py-2 h-12 bg-gray-900 text-white font-semibold rounded-full shadow hover:bg-gray-700 transition"
          >
            Send Newsletter
          </button>
        </div>
      </div>
    </div>
  );
}
export default NewsletterEmail;