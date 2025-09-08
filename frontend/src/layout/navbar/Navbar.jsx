import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaBars, FaTimes, FaGlobe } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../assets/ShahuLogo.png";
import api from "../../supabase/axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import "../../i18n";

// Reusable Dropdown section
export const DropdownSection = ({ title, links, onLinkClick }) => {
  const { t } = useTranslation();
  return (
    <div className="min-w-[180px] mt-4 first:mt-0">
      {title && (
        <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">
          {t(`navbar.dropdown.${title.toLowerCase().replace(/\s+/g, '_')}`, title).toUpperCase()}
        </h3>
      )}
      <ul className="space-y-1">
        {links?.map(({ label, href }) => (
          <li key={label}>
            <Link
              to={href}
              className="text-gray-700 hover:text-[#D4A5A5]"
              onClick={onLinkClick}
            >
              {label} {/* Backend translates; no client-side t() needed */}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Desktop dropdown wrapper
export const DesktopDropdown = ({ label, isOpen, setOpen, refEl, content }) => {
  const timerRef = React.useRef(null);
  const handleMouseEnter = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <li
      ref={refEl}
      className="relative list-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        className="hover:text-[#D4A5A5] text-[#6B4226] font-medium cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") setOpen(true);
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {label} {/* Backend translates */}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-6 rounded-md border border-[#e6dcd2] shadow-lg z-10 text-sm min-w-[360px]"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

export default function Navbar() {
  const { i18n, t } = useTranslation();

  const LOCALES = [
    { code: "en-US", label: t("navbar.languages.en-US") },
    { code: "en-CA", label: t("navbar.languages.en-CA") },
    { code: "en-AU", label: t("navbar.languages.en-AU") },
    { code: "en-UK", label: t("navbar.languages.en-UK") },
    { code: "es-ES", label: t("navbar.languages.es-ES") },
    { code: "fr-FR", label: t("navbar.languages.fr-FR") },
    { code: "fr-MC", label: t("navbar.languages.fr-MC") },
    { code: "hi-IN", label: t("navbar.languages.hi-IN") },
  ];

  const [lang, setLang] = useState(i18n.language);
  const [menus, setMenus] = useState([]);
  const [dropdown, setDropdown] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const refs = useRef({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let userRole = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role || null;
    } catch {
      localStorage.removeItem("token");
    }
  }

  // Menus
  const fetchMenuData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/navbar/menus?lang=${i18n.language}`);
      let sorted = res.data.menus.sort((a, b) => a.order_index - b.order_index);

      sorted = sorted.map((menu) => ({
        ...menu,
        dropdown_items: userRole
          ? menu.dropdown_items.filter(
              (item) => item.roles.length === 0 || item.roles.includes(userRole)
            )
          : menu.dropdown_items,
      }));

      if (userRole !== "Admin") {
        sorted = sorted.filter((m) => m.label.toLowerCase() !== t("navbar.menus.admin").toLowerCase());
      }

      setMenus(sorted);
      const initDrop = {};
      sorted.forEach((m) => (initDrop[m.id] = false));
      setDropdown({ ...initDrop, account: false, lang: false });
    } catch (err) {
      toast.error(err.response?.data?.message || t("navbar.errors.fetchMenus"));
    } finally {
      setIsLoading(false);
    }
  }, [userRole, i18n.language, t]);

  const fetchCartItemCount = useCallback(async () => {
    if (!token) {
      setCartItemCount(0);
      return;
    }
    try {
      const response = await api.get("/api/cartById");
      setCartItemCount(response.data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.error || t("navbar.errors.fetchCart"));
      setCartItemCount(0);
    }
  }, [token, t]);

  useEffect(() => {
    fetchMenuData();
    setLang(i18n.language);
    fetchCartItemCount();
  }, [fetchMenuData, fetchCartItemCount,i18n.language]);

  const handleClickOutside = useCallback((e) => {
    Object.keys(refs.current).forEach((key) => {
      if (refs.current[key] && !refs.current[key].contains(e.target)) {
        setDropdown((prev) => ({ ...prev, [key]: false }));
      }
    });
  }, []);
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleProtectedClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success(t("navbar.logoutSuccess"));
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-lg shadow-md font-serif">
      {/* Top Bar */}
      <div className="flex items-center justify-between lg:justify-center px-4 sm:px-6 lg:px-8 h-20 w-full relative">
        <Link
          to="/"
          className="absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none"
        >
          <img
            src={Logo}
            alt={t("navbar.logoAlt")}
            className="h-24 object-contain"
          />
        </Link>
        <button
          className="lg:hidden text-[#6B4226] p-2 ml-auto"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={t("navbar.toggleMenu")}
        >
          {mobileMenuOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center py-3 px-20 bg-transparent backdrop-blur-sm border-t border-[#e0d8d1]">
        {/* Search */}
        <div className="flex justify-start bg-transparent backdrop-blur-lg flex-[1]">
          <input
            type="text"
            placeholder={t("navbar.searchPlaceholder")}
            className="w-[300px] px-2 py-1.5 bg-transparent backdrop-blur-sm font-bold rounded-full border border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </div>

        {/* Menus */}
        <ul className="flex items-center gap-8 flex-[1]">
          {menus.map((menu) => {
            const hasDropdown =
              menu.dropdown_items && menu.dropdown_items.length > 0;

            if (hasDropdown) {
              const sortedItems = [...menu.dropdown_items].sort(
                (a, b) => a.order_index - b.order_index
              );

              return (
                <DesktopDropdown
                  key={menu.id}
                  label={menu.label}
                  isOpen={dropdown[menu.id]}
                  setOpen={(state) => {
                    const closedAll = Object.keys(dropdown).reduce(
                      (acc, id) => ({ ...acc, [id]: false }),
                      {}
                    );
                    setDropdown({ ...closedAll, [menu.id]: state });
                  }}
                  refEl={(el) => (refs.current[menu.id] = el)}
                  content={
                    !sortedItems[0].links ? (
                      <DropdownSection
                        title={menu.label}
                        links={sortedItems.map((item) => ({
                          label: item.label,
                          href: item.href,
                        }))}
                        onLinkClick={() =>
                          setDropdown((prev) => ({ ...prev, [menu.id]: false }))
                        }
                      />
                    ) : (
                      sortedItems.map((section) => (
                        <DropdownSection
                          key={section.title}
                          title={section.title}
                          links={section.links}
                          onLinkClick={() =>
                            setDropdown((prev) => ({
                              ...prev,
                              [menu.id]: false,
                            }))
                          }
                        />
                      ))
                    )
                  }
                />
              );
            }

            return (
              <li key={menu.id}>
                <Link
                  to={menu.href || "#"}
                  className="hover:text-[#D4A5A5] text-[#6B4226] font-normal"
                >
                  {menu.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Language + Account + Cart */}
        <ul className="flex items-center gap-6 justify-end flex-[1] relative">
          {/* Language dropdown (desktop) */}
          <li ref={(el) => (refs.current.lang = el)} className="relative">
            <button
              onClick={() =>
                setDropdown((prev) => ({
                  ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {}),
                  lang: !prev.lang,
                }))
              }
              aria-label={t("navbar.selectLanguage")}
              className="flex items-center gap-2 text-[#6B4226] hover:text-[#D4A5A5]"
              title={t("navbar.selectLanguage")}
            >
              <FaGlobe size={18} />
              <span className="text-sm font-medium">{LOCALES.find(l => l.code === lang)?.label || lang}</span>
            </button>

            <AnimatePresence>
              {dropdown.lang && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 bg-white border border-[#e6dcd2] rounded-md shadow p-2 z-20 w-56"
                >
                  <ul className="max-h-72 overflow-auto">
                    {LOCALES.map((l) => {
                      const active = l.code === lang;
                      return (
                        <li key={l.code}>
                          <button
                            onClick={() => {
                              i18n.changeLanguage(l.code);
                              setLang(l.code);
                              localStorage.setItem("lang", l.code);
                              setDropdown((prev) => ({ ...prev, lang: false }));
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-[#F7F0EE] ${
                              active ? "bg-[#F7F0EE] font-semibold text-[#6B4226]" : "text-gray-700"
                            }`}
                          >
                            {l.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          {/* Account */}
          <li ref={(el) => (refs.current.account = el)}>
            <button
              aria-label={t("navbar.account.label")}
              onClick={() =>
                !token
                  ? navigate("/account")
                  : setDropdown((prev) => {
                      const closedAll = Object.keys(prev).reduce(
                        (acc, id) => ({ ...acc, [id]: false }),
                        {}
                      );
                      return { ...closedAll, account: !prev.account };
                    })
              }
              className="text-[#6B4226] hover:text-[#D4A5A5]"
            >
              <FaUser size={20} />
            </button>
            <AnimatePresence>
              {token && dropdown.account && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute mt-2 bg-white border p-4 shadow right-0"
                >
                  <ul className="space-y-2 text-sm">
                    <li>
                      <button onClick={() => handleProtectedClick("/profile")}>
                        {t("navbar.account.profile")}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleProtectedClick("/myorder")}>
                        {t("navbar.account.trackOrder")}
                      </button>
                    </li>
                    <li>
                      <Link
                        to="/wishlist"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t("navbar.account.wishlist")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/waitlist"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t("navbar.account.waitlist")}
                      </Link>
                    </li>
                    <li>
                      <button onClick={handleLogout}>{t("navbar.account.logout")}</button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          {/* Cart */}
          <li className="relative">
            <Link
              to="/cart"
              aria-label={t("navbar.cart")}
              className="text-[#6B4226] hover:text-[#D4A5A5]"
            >
              <FaShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-3 -right-5 bg-red-700 text-white text-xs rounded-full px-2 py-0.5">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#F1E7E5] border-t border-[#e0d8d1] px-4 py-4 space-y-4 overflow-y-auto max-h-[80vh]"
          >
            {/* Language (mobile) */}
            <div className="border-b border-[#d4c4b6] pb-2">
              <button
                className="w-full flex items-center justify-between py-2"
                onClick={() =>
                  setMobileDropdownOpen((prev) =>
                    prev === "lang" ? null : "lang"
                  )
                }
              >
                <span className="flex items-center gap-2">
                  <FaGlobe />
                  <span>{t("navbar.language")}</span>
                </span>
                <span>{mobileDropdownOpen === "lang" ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {mobileDropdownOpen === "lang" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="pl-2 pt-1 space-y-1 overflow-hidden"
                  >
                    {LOCALES.map((l) => {
                      const active = l.code === lang;
                      return (
                        <button
                          key={l.code}
                          onClick={() => {
                            i18n.changeLanguage(l.code);
                            setLang(l.code);
                            localStorage.setItem("lang", l.code);
                            setMobileDropdownOpen(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded ${
                            active
                              ? "bg-white text-[#6B4226] font-semibold"
                              : "text-gray-700 hover:text-[#D4A5A5]"
                          }`}
                        >
                          {l.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menus */}
            {menus.map((menu) => {
              const hasDropdown =
                menu.dropdown_items && menu.dropdown_items.length > 0;
              if (hasDropdown) {
                const sortedItems = [...menu.dropdown_items].sort(
                  (a, b) => a.order_index - b.order_index
                );
                return (
                  <div key={menu.id} className="border-b border-[#d4c4b6] pb-2">
                    <button
                      className="w-full flex justify-between items-center py-2"
                      onClick={() =>
                        setMobileDropdownOpen((prev) =>
                          prev === menu.id ? null : menu.id
                        )
                      }
                    >
                      <span>{menu.label}</span>
                      <span>{mobileDropdownOpen === menu.id ? "−" : "+"}</span>
                    </button>
                    <AnimatePresence>
                      {mobileDropdownOpen === menu.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="pl-4 pt-1 space-y-2 overflow-hidden"
                        >
                          {!sortedItems[0].links
                            ? sortedItems.map(({ label, href }) => (
                                <Link
                                  key={label}
                                  to={href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                                >
                                  {label}
                                </Link>
                              ))
                            : sortedItems.map((section) => (
                                <div key={section.title}>
                                  {section.title && (
                                    <p className="text-sm font-semibold text-[#6B4226] mt-2">
                                      {t(`navbar.dropdown.${section.title.toLowerCase().replace(/\s+/g, '_')}`, section.title)}
                                    </p>
                                  )}
                                  {section.links.map(({ label, href }) => (
                                    <Link
                                      key={label}
                                      to={href}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                                    >
                                      {label}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={menu.id}
                  to={menu.href || "#"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 border-b border-[#d4c4b6]"
                >
                  {menu.label}
                </Link>
              );
            })}

            {/* Account (mobile) */}
            <div className="border-b border-[#d4c4b6] pb-2">
              <button
                className="w-full flex justify-between items-center py-2"
                onClick={() =>
                  !token
                    ? (navigate("/account"), setMobileMenuOpen(false))
                    : setMobileDropdownOpen((prev) =>
                        prev === "account" ? null : "account"
                      )
                }
              >
                <span>{t("navbar.account.label")}</span>
                <span>{mobileDropdownOpen === "account" ? "−" : "+"}</span>
              </button>

              <AnimatePresence>
                {mobileDropdownOpen === "account" && token && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="pl-4 pt-1 space-y-2 overflow-hidden"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                    >
                      {t("navbar.account.profile")}
                    </Link>
                    <Link
                      to="/myorder"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                    >
                      {t("navbar.account.trackOrder")}
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                    >
                      {t("navbar.account.wishlist")}
                    </Link>
                    <Link
                      to="/waitlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                    >
                      {t("navbar.account.waitlist")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1 text-left w-full"
                    >
                      {t("navbar.account.logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart (mobile) */}
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b align-items-center border-[#d4c4b6] relative"
            >
              {t("navbar.cart")}
              {cartItemCount > 0 && (
                <span className="ml-2 bg-red-700 text-white text-xs rounded-full px-2 py-0.5">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
