import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import clsx from "clsx";
import { jwtDecode } from "jwt-decode";
import Logo from "../../assets/ShahuLogo.png";
import api from "../../supabase/axios";
import { toast } from "react-toastify";

// Dropdown section reusable
const DropdownSection = ({ title, links, onLinkClick }) => (
  <div className="min-w-[180px] mt-4 first:mt-0">
    {title && (
      <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">
        {title.toUpperCase()}
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
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

// Desktop dropdown component
const DesktopDropdown = ({ label, isOpen, setOpen, refEl, content }) => {
  const timerRef = useRef(null);
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
      >
        {label}
      </span>
      <div
        className={clsx(
          "absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-6 rounded-md border border-[#e6dcd2] shadow-lg z-10 text-sm min-w-[360px] transition-all duration-300 transform",
          isOpen
            ? "opacity-100 translate-y-2 pointer-events-auto"
            : "opacity-0 translate-y-1 pointer-events-none"
        )}
      >
        {content}
      </div>
    </li>
  );
};

export default function Navbar() {
  const [menus, setMenus] = useState([]);
  const [dropdown, setDropdown] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

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

  // Fetch menus
  const fetchMenuData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/navbar/menus");
      let sorted = res.data.menus.sort((a, b) => a.order_index - b.order_index);
      // Filter menus and dropdown items based on user role
      sorted = sorted.map((menu) => ({
        ...menu,
        dropdown_items: userRole
          ? menu.dropdown_items.filter(
              (item) => item.roles.length === 0 || item.roles.includes(userRole)
            )
          : menu.dropdown_items,
      }));
      // Hide Admin menu if not an admin
      if (userRole !== "Admin") {
        sorted = sorted.filter((m) => m.label.toLowerCase() !== "admin");
      }
      setMenus(sorted);
      const initDrop = {};
      sorted.forEach((m) => (initDrop[m.id] = false));
      setDropdown({ ...initDrop, account: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load menus");
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  // Fetch cart item count
  const fetchCartItemCount = useCallback(async () => {
    if (!token) {
      setCartItemCount(0);
      return;
    }
    try {
      const response = await api.get("/api/cartById");
      setCartItemCount(response.data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to fetch cart items");
      setCartItemCount(0);
    }
  }, [token]);

  useEffect(() => {
    fetchMenuData();
    fetchCartItemCount();
  }, [fetchMenuData, fetchCartItemCount]);

  // Close dropdowns on outside click
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
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#EDE1DF] shadow-md font-serif">
      {/* Top Bar */}
      <div className="flex items-center justify-between lg:justify-center px-4 sm:px-6 lg:px-8 h-20 w-full relative">
        <Link
          to="/"
          className="absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none"
        >
          <img
            src={Logo}
            alt="Shahu Mumbai Logo"
            className="h-16 object-contain"
          />
        </Link>
        <button
          className="lg:hidden text-[#6B4226] p-2 ml-auto"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center py-3 px-20 bg-[#F1E7E5] border-t border-[#e0d8d1]">
        {/* Search */}
        <div className="flex justify-start flex-[1]">
          <input
            type="text"
            placeholder="Search"
            className="w-[300px] px-2 py-1.5 rounded-full border border-gray-300"
          />
        </div>
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
                  className="hover:text-[#D4A5A5] text-[#6B4226] font-medium"
                >
                  {menu.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Account & Cart */}
        <ul className="flex items-center gap-6 justify-end flex-[1]">
          <li>
            <button
              onClick={() =>
                !token
                  ? navigate("/account")
                  : setDropdown((prev) => ({ ...prev, account: !prev.account }))
              }
            >
              <FaUser size={20} />
            </button>
            {token && dropdown.account && (
              <div className="absolute mt-2 bg-white border p-4 shadow">
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => handleProtectedClick("/profile")}>
                      My Profile
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleProtectedClick("/myorder")}>
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
                    <button onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="relative">
            <Link to="/cart">
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
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F1E7E5] border-t border-[#e0d8d1] px-4 py-4 space-y-4 overflow-y-auto max-h-[80vh]">
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
                  {mobileDropdownOpen === menu.id && (
                    <div className="pl-4 pt-1 space-y-2">
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
                                  {section.title}
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
                    </div>
                  )}
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

          {/* Account Menu Item */}
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

            {/* Account dropdown in mobile */}
            {mobileDropdownOpen === "account" && token && (
              <div className="pl-4 pt-1 space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1"
                >
                  My Profile
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
                <button
                  onClick={handleLogout}
                  className="block text-sm text-gray-700 hover:text-[#D4A5A5] py-1 text-left w-full"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Cart Menu Item */}
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
        </div>
      )}
    </nav>
  );
}
