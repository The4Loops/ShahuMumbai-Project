import React, { useState, useEffect } from "react";
import WebFont from "webfontloader";
import shahu from "../assets/ShahuLogo.png";
import Hero from "../assets/HeImg.jpeg";

export default function NewsletterEmail() {
  const [editMode, setEditMode] = useState(false);

  const [newsletter, setNewsletter] = useState({
    logo: shahu,
    title: "Hello Subscriber 👋",
    content:
      "Welcome to our monthly newsletter! Here’s what we’ve been up to and what’s coming next. We’re excited to share our latest updates, insights, and exclusive offers with you.",
    featuredTitle: "✨ Upcoming Waitlist",
    featuredText:
      "We just launched a brand new feature to make your experience even better. Check it out and let us know your thoughts!",
    heroImage: Hero,
    aboveHeroText: "✨ “Just like devotion creates temples, we create experiences you’ll cherish.” ", // new field for text above hero
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

    // 🎨 New color controls
    titleColor: "#222222",
    bodyColor: "#444444",
    featuredColor: "#555555",
    footerColor: "#666666",

    // New panel state
    panelMinimized: false,
  });

  // Load fonts dynamically when fontFamily changes
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

  // Handle text changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewsletter((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image uploads
  const handleImageUpload = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsletter((prev) => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full bg-gray-100 py-10 flex justify-center">
      <div
        className="w-full max-w-2xl shadow-lg rounded-2xl overflow-hidden relative"
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
        <button
          onClick={() => setEditMode(!editMode)}
          className="absolute top-4 right-4 bg-gray-900 text-white px-4 py-1 text-xs rounded-full shadow hover:bg-gray-700"
        >
          {editMode ? "Save Changes" : "Edit"}
        </button>

        {/* Customization Panel */}
        {editMode && (
          <div className="absolute top-4 left-4 bg-white/95 rounded-lg shadow-lg w-52 text-xs flex flex-col max-h-[65vh] overflow-hidden">
            {/* Panel Header with Minimize Button */}
            <div className="flex justify-between items-center bg-gray-100 px-2 py-1 border-b">
              <span className="font-semibold text-gray-700">Customization</span>
              <button
                onClick={() =>
                  setNewsletter((prev) => ({
                    ...prev,
                    panelMinimized: !prev.panelMinimized,
                  }))
                }
                className="text-xs px-2 py-0.5 bg-gray-300 rounded hover:bg-gray-400"
              >
                {newsletter.panelMinimized ? "+" : "–"}
              </button>
            </div>

            {/* Panel Content (Hidden if minimized) */}
            {!newsletter.panelMinimized && (
              <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                {/* Page Background */}
                <div>
                  <label className="font-semibold block mb-1">
                    Page Background
                  </label>
                  <input
                    type="color"
                    name="backgroundColor"
                    value={newsletter.backgroundColor}
                    onChange={handleChange}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "backgroundImage")}
                    className="mt-2 block text-xs"
                  />
                  {newsletter.backgroundImage && (
                    <button
                      onClick={() =>
                        setNewsletter((prev) => ({
                          ...prev,
                          backgroundImage: "",
                        }))
                      }
                      className="text-red-600 underline mt-1"
                    >
                      Remove BG Image
                    </button>
                  )}
                </div>

                {/* Header Background */}
                <div>
                  <label className="font-semibold block mb-1">Header</label>
                  <input
                    type="color"
                    name="headerColor"
                    value={newsletter.headerColor}
                    onChange={handleChange}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "headerImage")}
                    className="mt-2 block text-xs"
                  />
                  {newsletter.headerImage && (
                    <button
                      onClick={() =>
                        setNewsletter((prev) => ({ ...prev, headerImage: "" }))
                      }
                      className="text-red-600 underline mt-1"
                    >
                      Remove Header Image
                    </button>
                  )}
                </div>

                {/* CTA Button */}
                <div>
                  <label className="font-semibold block mb-1">CTA Button</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="ctaBgColor"
                      value={newsletter.ctaBgColor}
                      onChange={handleChange}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="color"
                      name="ctaTextColor"
                      value={newsletter.ctaTextColor}
                      onChange={handleChange}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Font Selector */}
                <div>
                  <label className="font-semibold block mb-1">
                    Font Family
                  </label>
                  <select
                    name="fontFamily"
                    value={newsletter.fontFamily}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="Lora">Lora</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
                </div>

                {/* Title Color */}
                <div>
                  <label className="font-semibold block mb-1">
                    Title Color
                  </label>
                  <input
                    type="color"
                    name="titleColor"
                    value={newsletter.titleColor}
                    onChange={handleChange}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                </div>

                {/* Body Text Color */}
                <div>
                  <label className="font-semibold block mb-1">
                    Body Text Color
                  </label>
                  <input
                    type="color"
                    name="bodyColor"
                    value={newsletter.bodyColor}
                    onChange={handleChange}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                </div>

                {/* Featured Text Color */}
                <div>
                  <label className="font-semibold block mb-1">
                    Featured Text Color
                  </label>
                  <input
                    type="color"
                    name="featuredColor"
                    value={newsletter.featuredColor}
                    onChange={handleChange}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                </div>

                {/* Footer Text Color */}
                <div>
                  <label className="font-semibold block mb-1">
                    Footer Text Color
                  </label>
                  <input
                    type="color"
                    name="footerColor"
                    value={newsletter.footerColor}
                    onChange={handleChange}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                </div>

                {/* Above Hero Text Control */}
                <div>
                  <label className="font-semibold block mb-1">
                    Text Above Hero
                  </label>
                  <input
                    type="text"
                    name="aboveHeroText"
                    value={newsletter.aboveHeroText}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Enter text above hero"
                  />
                </div>
              </div>
            )}
          </div>
        )}

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
              <img
                src={newsletter.logo}
                alt="Logo Preview"
                className="h-24 w-24 mb-2 rounded-full"
              />
            </div>
          ) : (
            <img
              src={newsletter.logo}
              alt="Logo"
              className="h-24 w-24 mb-2 rounded-full "
            />
          )}
          <p className="text-sm opacity-90">
            Stay updated with the latest news
          </p>
        </div>

        {/* CONTENT ABOVE HERO */}
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
          <div className="w-full mb-2" >
            {editMode ? (
              <div className="p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "heroImage")}
                  className="mb-2 text-xs"
                />
                <img
                  src={newsletter.heroImage}
                  alt="Hero Preview"
                  className="w-full object-cover rounded-xl"
                />
              </div>
            ) : (
              <img
                src={newsletter.heroImage}
                alt="Newsletter Hero"
                className="w-full object-cover"
              />
            )}
          </div>
          {/* Extra Text Above Hero */}
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

        {/* CTA BUTTON BELOW HERO */}
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
              <p className="mt-2" style={{ color: newsletter.footerColor }}>
                {newsletter.unsubscribeText}
              </p>
              <a href="/" className="text-indigo-600 underline mt-2 block">
                Unsubscribe
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
