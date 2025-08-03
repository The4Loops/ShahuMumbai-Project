import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart } from "react-icons/fa";
import clsx from "clsx";

const PRODUCTS = [
  { label: "Our Products", href: "/products" },
  { label: "Blankets and Pillows", href: "/" },
  { label: "Tableware", href: "/" },
  { label: "Furniture and Lighting", href: "/" },
];

const ABOUT = [
  { section: "About Us", items: [{ label: "Our Story", href: "/about" }] },
  {
    section: "Legacy",
    items: [
      { label: "Our Philosophy", href: "/ourphilosophy" },
      { label: "Heritage Timeline", href: "/heritagetimeline" },
      { label: "Our Studios", href: "/ourstudios" },
    ],
  },
  {
    section: "Craft",
    items: [
      { label: "Contemporary artisans", href: "/contemporaryartisans" },
      { label: "Services", href: "/service" },
      { label: "Contact us", href: "/contactus" },
    ],
  },
];

const DropdownSection = ({ title, links, onLinkClick }) => (
  <div className="min-w-[180px] mt-4 first:mt-0">
    <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">
      {title.toUpperCase()}
    </h3>
    <ul className="space-y-1">
      {links.map(({ label, href }) => (
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

const DesktopDropdown = ({ label, isOpen, setOpen, refEl, content }) => (
  <li
    ref={refEl}
    className="relative group"
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
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

const Navbar = () => {
  const [dropdown, setDropdown] = useState({
    products: false,
    about: false,
    account: false,
  });

  const navigate = useNavigate();

  const token = localStorage.getItem("token"); // Check token presence
  const user = token ? { name: "Shahu" } : null;
  const cartItemCount = 3;

  const productsRef = useRef(null);
  const aboutRef = useRef(null);
  const accountRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (productsRef.current && !productsRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, products: false }));
    }
    if (aboutRef.current && !aboutRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, about: false }));
    }
    if (accountRef.current && !accountRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, account: false }));
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleProtectedClick = (path) => {
    setDropdown((prev) => ({ ...prev, account: false }));
    navigate(path);
  };

  const renderProductsContent = useMemo(
    () => (
      <>
        <DropdownSection
          title="Our Stories"
          links={[PRODUCTS[0]]}
          onLinkClick={() => setDropdown({ products: false })}
        />
        <DropdownSection
          title="Categories"
          links={PRODUCTS.slice(1)}
          onLinkClick={() => setDropdown({ products: false })}
        />
      </>
    ),
    []
  );

  const renderAboutContent = useMemo(
    () => (
      <>
        {ABOUT.map(({ section, items }) => (
          <DropdownSection
            key={section}
            title={section}
            links={items}
            onLinkClick={() => setDropdown({ about: false })}
          />
        ))}
      </>
    ),
    []
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f9f5f0] border-b border-[#d6ccc2] shadow-md font-serif">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 w-full">
        <Link
          to="/"
          className="text-[1.5rem] sm:text-[1.8rem] font-bold text-[#6B4226] tracking-wide whitespace-nowrap"
        >
          𝐖𝐝𝐎𝐑 𝐜𝐢𝐜𝐫𝐦
        </Link>

        <div className="hidden lg:block absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <input
            type="text"
            placeholder="Search"
            className="w-[300px] sm:w-[400px] px-4 py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#D4A5A5]"
          />
        </div>

        <div className="hidden lg:flex items-center gap-5 text-[#6B4226]">
          {/* Account Dropdown or Redirect */}
          <li ref={accountRef} className="relative list-none">
            <button
              onClick={() => {
                if (!token) {
                  navigate("/account"); // Redirect to /account if not logged in
                } else {
                  setDropdown((prev) => ({
                    products: false,
                    about: false,
                    account: !prev.account,
                  }));
                }
              }}
              className="hover:text-[#D4A5A5] flex items-center"
              aria-haspopup="true"
              aria-expanded={dropdown.account}
            >
              <FaUser size={20} title="Account" />
            </button>

            {token && (
              <div
                className={clsx(
                  "absolute top-full right-0 mt-2 bg-white p-4 rounded-md border border-[#e6dcd2] shadow-lg z-10 text-sm min-w-[180px] transition-all duration-300 transform",
                  dropdown.account
                    ? "opacity-100 translate-y-2 pointer-events-auto"
                    : "opacity-0 translate-y-1 pointer-events-none"
                )}
              >
                <ul className="space-y-2">
                  <li className="text-[#6B4226] font-semibold px-1">
                    Welcome, {user.name}
                  </li>
                  <li>
                    <button
                      onClick={() => handleProtectedClick("/profile")}
                      className="hover:text-[#D4A5A5] text-gray-700"
                    >
                      My Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleProtectedClick("/myorder")}
                      className="hover:text-[#D4A5A5] text-gray-700"
                    >
                      Track Order
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/wishlist"
                      onClick={() => setDropdown({ account: false })}
                    >
                      Wishlist
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </li>

          <div className="relative">
            <Link to="/cart" className="hover:text-[#D4A5A5] relative">
              <FaShoppingCart size={20} title="Cart" />
              <span className="absolute -top-2 -right-2 bg-red-700 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {cartItemCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Nav Links */}
      <ul className="hidden lg:flex justify-center gap-8 py-3 px-8 bg-[#f9f5f0] border-t border-[#e0d8d1]">
        <li>
          <Link to="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">
            Home
          </Link>
        </li>

        <DesktopDropdown
          label="Products"
          isOpen={dropdown.products}
          setOpen={(state) =>
            setDropdown({ products: state, about: false, account: false })
          }
          refEl={productsRef}
          content={renderProductsContent}
        />

        <li>
          <Link to="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">
            Men
          </Link>
        </li>
        <li>
          <Link to="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">
            Women
          </Link>
        </li>

        <DesktopDropdown
          label="About SHAHU"
          isOpen={dropdown.about}
          setOpen={(state) =>
            setDropdown({ products: false, about: state, account: false })
          }
          refEl={aboutRef}
          content={renderAboutContent}
        />
      </ul>
    </nav>
  );
};

export default Navbar;
