import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../assets/ShahuLogo.png";
import api from "../../supabase/axios"; // your axios instance (withCredentials enabled)
import { toast } from "react-toastify";
import { FaSearch } from "react-icons/fa";
// import Loader from "../../Loader";

// Reusable Dropdown section
export const DropdownSection = ({ title, links, onLinkClick }) => {
  return (
    <div className="min-w-[180px] mt-4 first:mt-0">
      {title && (
        <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">
          {title.toUpperCase()}
        </h3>
      )}
      <ul className="space-y-1">
        {links?.map(({ Label, Href }) => (
          <li key={Label}>
            <Link
              to={Href}
              className="text-gray-700 hover:text-[#D4A5A5]"
              onClick={onLinkClick}
            >
              {Label}
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
        {label}
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
  const [menus, setMenus] = useState([]);
  const [dropdown, setDropdown] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // This is the badge count
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
      const res = await api.get(`/api/navbar/menus`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });

      let sorted = res.data.menus.sort((a, b) => a.OrderIndex - b.OrderIndex);

      sorted = sorted.map((menu) => {
        const filtered = {
          ...menu,
          DropdownItems: userRole
            ? menu.DropdownItems.filter(
                (item) =>
                  item.Roles.length === 0 ||
                  item.Roles.split(",").includes(userRole)
              )
            : menu.DropdownItems,
        };

        // >>> PRODUCTS: disable dropdown and link directly to /products
        if (String(filtered.Label || "").toLowerCase() === "products") {
          // Commented out: keep incoming categories but don't use them
          // filtered.DropdownItems = filtered.DropdownItems;
          // Instead, force no dropdown by clearing them:
          // filtered.DropdownItems = []; // (Commented: alternative approach)
          filtered.Href = "/products";
        }
        // <<< PRODUCTS

        return filtered;
      });

      if (userRole !== "Admin") {
        sorted = sorted.filter(
          (m) => m.Label.toLowerCase() !== "admin".toLowerCase()
        );
      }

      setMenus(sorted);
      const initDrop = {};
      sorted.forEach((m) => (initDrop[m.Id] = false));
      setDropdown({ ...initDrop, account: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch menus");
    } finally {
      setIsLoading(false);
    }
  }, [userRole, token]);

  // Always fetch count (guest OR logged-in). Guest carts use the signed cookie; no JWT required.
  const fetchCartItemCount = useCallback(async () => {
    try {
      const response = await api.get("/api/cartById");
      setCartItemCount(Array.isArray(response.data) ? response.data.length : 0);
    } catch (_err) {
      // stay quiet to avoid spamming the user with toasts from the navbar
      setCartItemCount(0);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
    fetchCartItemCount();
  }, [fetchMenuData, fetchCartItemCount]);

  // Listen for cart updates from anywhere in the app
  useEffect(() => {
    const onCartUpdated = (e) => {
      const { delta, absolute } = (e && e.detail) || {};
      if (typeof absolute === "number") {
        setCartItemCount(absolute);
      } else if (typeof delta === "number") {
        setCartItemCount((c) => Math.max(0, c + delta));
      } else {
        // fallback: refetch from API
        fetchCartItemCount();
      }
    };
    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, [fetchCartItemCount]);

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
    localStorage.removeItem("token");
    navigate("/");
    setMobileMenuOpen(false);
    // after logout, fetch guest cart count (it may be different now)
    fetchCartItemCount();
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <div>
      {/* <Loader isLoading={isLoading} /> */}
      <nav className="fixed top-0 w-full z-40 bg-transparent backdrop-blur-lg shadow-md font-serif">
        {/* Top Bar */}
        <div className="flex items-center justify-between lg:justify-center px-4 sm:px-6 lg:px-8 h-20 w-full relative">
          <Link
            to="/"
            className="absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none"
          >
            <img src={Logo} alt="Shahu Logo" className="h-24 object-contain" />
          </Link>
          <button
            className="lg:hidden text-[#6B4226] p-2 ml-auto"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between py-3 px-20 bg-transparent backdrop-blur-sm border-t border-[#e0d8d1]">
          {/* Search */}
          <div className="flex flex-[1] justify-start">
    <div className="relative">
      <FaSearch
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaaaaa] cursor-pointer"
        onClick={() => {
          if (searchQuery.trim()) {
            navigate(
              `/products?search=${encodeURIComponent(searchQuery.trim())}`
            );
            setSearchQuery("");
          }
        }}
      />

      <input
        type="text"
        placeholder="Search..."
        className="w-[300px] pl-10 pr-3 py-1.5 bg-white/20 backdrop-blur-sm font-bold rounded-full border border-gray-300 focus:outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearchSubmit}
      />
    </div>
  </div>

          {/* Menus */}
          <ul className="flex items-center justify-center gap-8 flex-[1]">
            {menus.map((menu) => {
              const isProducts =
                String(menu.Label || "").toLowerCase() === "products";
              const hasDropdown =
                menu.DropdownItems && menu.DropdownItems.length > 0;

              // >>> PRODUCTS (DESKTOP): Force simple link, remove dropdown
              if (isProducts) {
                return (
                  <li key={menu.Id}>
                    <Link
                      to={"/products"}
                      className="hover:text-[#D4A5A5] text-[#6B4226] font-normal"
                    >
                      {menu.Label}
                    </Link>
                  </li>
                );
              }
              // <<< PRODUCTS

              if (hasDropdown) {
                const sortedItems = [...menu.DropdownItems].sort(
                  (a, b) => a.OrderIndex - b.OrderIndex
                );

                return (
                  <DesktopDropdown
                    key={menu.Id}
                    label={menu.Label}
                    isOpen={dropdown[menu.Id]}
                    setOpen={(state) => {
                      const closedAll = Object.keys(dropdown).reduce(
                        (acc, id) => ({ ...acc, [id]: false }),
                        {}
                      );
                      setDropdown({ ...closedAll, [menu.Id]: state });
                    }}
                    refEl={(el) => (refs.current[menu.Id] = el)}
                    content={
                      <DropdownSection
                        title={menu.Label}
                        links={sortedItems.map((item) => ({
                          Label: item.Label,
                          Href: item.Href,
                        }))}
                        onLinkClick={() =>
                          setDropdown((prev) => ({ ...prev, [menu.Id]: false }))
                        }
                      />
                    }
                  />
                );
              }

              return (
                <li key={menu.Id}>
                  <Link
                    to={menu.Href || "#"}
                    className="hover:text-[#D4A5A5] text-[#6B4226] font-normal"
                  >
                    {menu.Label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Account + Cart */}
          <ul className="flex items-center gap-6 justify-end flex-[1] relative">
            {/* Account */}
            <li ref={(el) => (refs.current.account = el)}>
              <button
                aria-label="Account"
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
                        <button
                          onClick={() => handleProtectedClick("/profile")}
                        >
                          Profile
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleProtectedClick("/myorder")}
                        >
                          Track Order
                        </button>
                      </li>
                      <li>
                        <Link
                          to="/wishlist"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Wishlist
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/waitlist"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Waitlist
                        </Link>
                      </li>
                      <li>
                        <button onClick={handleLogout}>Logout</button>
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
                aria-label="Cart"
                className="text-[#6B4226] hover:text-[#D4A5A5]"
              >
                <FaShoppingCart size={20} />
                {cartItemCount >= 0 && (
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
              {/* Mobile Menus */}
              {menus.map((menu) => {
                const isProducts =
                  String(menu.Label || "").toLowerCase() === "products";
                const hasDropdown =
                  menu.DropdownItems && menu.DropdownItems.length > 0;

                // >>> PRODUCTS (MOBILE): Force simple link, remove dropdown
                if (isProducts) {
                  return (
                    <Link
                      key={menu.Id}
                      to={"/products"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 border-b border-[#d4c4b6]"
                    >
                      {menu.Label}
                    </Link>
                  );
                }
                // <<< PRODUCTS

                if (hasDropdown) {
                  const sortedItems = [...menu.DropdownItems].sort(
                    (a, b) => a.OrderIndex - b.OrderIndex
                  );
                  return (
                    <div
                      key={menu.Id}
                      className="border-b border-[#d4c4b6] pb-2"
                    >
                      <button
                        className="w-full flex justify-between items-center py-2"
                        onClick={() =>
                          setMobileDropdownOpen((prev) =>
                            prev === menu.Id ? null : menu.Id
                          )
                        }
                      >
                        <span>{menu.Label}</span>
                        <span>
                          {mobileDropdownOpen === menu.Id ? "−" : "+"}
                        </span>
                      </button>
                      <AnimatePresence>
                        {mobileDropdownOpen === menu.Id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="pl-4 pt-1 space-y-2 overflow-hidden"
                          >
                            {/* Commented out since Products dropdown is removed; other menus still work */}
                            {sortedItems.map(({ Label, Href }) => (
                              <Link
                                key={Label}
                                to={Href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                              >
                                {Label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <Link
                    key={menu.Id}
                    to={menu.Href || "#"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 border-b border-[#d4c4b6]"
                  >
                    {menu.Label}
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
                  <span>Account</span>
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
                        Profile
                      </Link>
                      <Link
                        to="/myorder"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                      >
                        Track Order
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                      >
                        Wishlist
                      </Link>
                      <Link
                        to="/waitlist"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                      >
                        Waitlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1 text-left w-full"
                      >
                        Logout
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
                Cart
                {cartItemCount >= 0 && (
                  <span className="ml-2 bg-red-700 text-white text-xs rounded-full px-2 py-0.5">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
