import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import clsx from "clsx";

const PRODUCTS = [
  { label: "Our Products", href: "/products" },
  { label: "Blankets and Pillows", href: "/" },
  { label: "Tableware", href: "/" },
  { label: "Furniture and Lighting", href: "/" },
];

const MEN = [
  { label: "Kurtas", href: "/men/kurtas" },
  { label: "Shirts", href: "/men/shirts" },
  { label: "Bottoms", href: "/men/bottoms" },
];

const WOMEN = [
  { label: "Sarees", href: "/women/sarees" },
  { label: "Dresses", href: "/women/dresses" },
  { label: "Accessories", href: "/women/accessories" },
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

const DesktopDropdown = ({ label, isOpen, setOpen, refEl, content }) => {
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
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

const Navbar = () => {
  const [dropdown, setDropdown] = useState({
    products: false,
    about: false,
    men: false,
    women: false,
    account: false,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = token ? { name: "Shahu" } : null;
  const cartItemCount = 3;

  const productsRef = useRef(null);
  const aboutRef = useRef(null);
  const menRef = useRef(null);
  const womenRef = useRef(null);
  const accountRef = useRef({ timer: null });

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
    if (menRef.current && !menRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, men: false }));
    }
    if (womenRef.current && !womenRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, women: false }));
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleProtectedClick = (path) => {
    setDropdown((prev) => ({ ...prev, account: false }));
    navigate(path);
    setMobileMenuOpen(false);
  };

  const renderProductsContent = useMemo(
    () => (
      <>
        <DropdownSection
          title="Our Store"
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

  const renderMenContent = useMemo(
    () => (
      <DropdownSection
        title="Men's Collection"
        links={MEN}
        onLinkClick={() => setDropdown({ men: false })}
      />
    ),
    []
  );

  const renderWomenContent = useMemo(
    () => (
      <DropdownSection
        title="Women's Collection"
        links={WOMEN}
        onLinkClick={() => setDropdown({ women: false })}
      />
    ),
    []
  );

  const handleLogout=()=>{
    localStorage.clear();
    navigate("/");
    setDropdown({ products: false, about: false, account: false});
    setMobileMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f9f5f0] border-b border-[#d6ccc2] shadow-md font-serif">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 w-full">
        <Link
          to="/"
          className="text-[1.5rem] sm:text-[1.8rem] font-bold text-[#6B4226] tracking-wide whitespace-nowrap"
        >
          Shahu Mumbai
        </Link>

        {/* Search Bar (Desktop Only) */}
        <div className="hidden lg:block absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <input
            type="text"
            placeholder="Search"
            className="w-[300px] sm:w-[400px] px-4 py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#D4A5A5]"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-5 text-[#6B4226]">
          {/* Desktop Only */}
          <div className="hidden lg:flex items-center gap-5">
            <li
              ref={accountRef}
              className="relative list-none"
              onMouseEnter={() => {
                clearTimeout(accountRef.current.timer);
                setDropdown({ products: false, about: false, account: true });
              }}
              onMouseLeave={() => {
                accountRef.current.timer = setTimeout(() => {
                  setDropdown((prev) => ({ ...prev, account: false }));
                }, 150);
              }}
            >
              <button
                onClick={() => {
                  if (!token) {
                    navigate("/account");
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
                        onClick={() =>
                          setDropdown((prev) => ({ ...prev, account: false }))
                        }
                        className="hover:text-[#D4A5A5] text-gray-700"
                      >
                        Wishlist
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() =>handleLogout()}
                        className="hover:text-[#D4A5A5] text-gray-700"
                      >
                        Logout
                      </button>
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

          {/* Hamburger Button */}
          <button
            className="lg:hidden text-[#6B4226]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {/* Desktop Nav */}
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
            setDropdown({
              products: state,
              about: false,
              men: false,
              women: false,
              account: false,
            })
          }
          refEl={productsRef}
          content={renderProductsContent}
        />

        <DesktopDropdown
          label="Men"
          isOpen={dropdown.men}
          setOpen={(state) =>
            setDropdown({
              products: false,
              about: false,
              men: state,
              women: false,
              account: false,
            })
          }
          refEl={menRef}
          content={renderMenContent}
        />

        <DesktopDropdown
          label="Women"
          isOpen={dropdown.women}
          setOpen={(state) =>
            setDropdown({
              products: false,
              about: false,
              men: false,
              women: state,
              account: false,
            })
          }
          refEl={womenRef}
          content={renderWomenContent}
        />

        <DesktopDropdown
          label="About Us"
          isOpen={dropdown.about}
          setOpen={(state) =>
            setDropdown({
              products: false,
              about: state,
              men: false,
              women: false,
              account: false,
            })
          }
          refEl={aboutRef}
          content={renderAboutContent}
        />
      </ul>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#f9f5f0] border-t border-[#e0d8d1] px-6 py-4 space-y-4 text-[#6B4226]">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>

          {[["Products", PRODUCTS], ["Men", MEN], ["Women", WOMEN]].map(([label, items]) => (
            <div key={label}>
              <details>
                <summary className="cursor-pointer font-medium hover:text-[#D4A5A5]">{label}</summary>
                <ul className="pl-4 space-y-1 mt-1">
                  {items.map(({ label: l, href }) => (
                    <li key={l}>
                      <Link to={href} onClick={() => setMobileMenuOpen(false)}>{l}</Link>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}

          <details>
            <summary className="cursor-pointer font-medium hover:text-[#D4A5A5]">About SHAHU</summary>
            <ul className="pl-4 space-y-1 mt-1">
              {ABOUT.flatMap(({ items }) => items).map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} onClick={() => setMobileMenuOpen(false)}>{label}</Link>
                </li>
              ))}
            </ul>
          </details>

          <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>Cart ({cartItemCount})</Link>
          <Link to={token ? "/profile" : "/account"} onClick={() => setMobileMenuOpen(false)}>
            {token ? `Welcome, ${user.name}` : "Login"}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
