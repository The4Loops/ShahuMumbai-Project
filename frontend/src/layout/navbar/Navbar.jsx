import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import clsx from "clsx";
import { jwtDecode } from "jwt-decode";
import Logo from "../../assets/ShahuLogo.png";

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
    { section: "Blogs", items: [{ label: "Our Blog", href: "/blog" }] },
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
        onKeyDown={(e) => e.key === "Enter" && setOpen(!isOpen)}
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
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null); // only one open at a time

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

  const cartItemCount = 3;

  const productsRef = useRef(null);
  const aboutRef = useRef(null);
  const menRef = useRef(null);
  const womenRef = useRef(null);
  const accountRef = useRef({ timer: null });

  const refs = useMemo(
    () => ({
      products: productsRef,
      about: aboutRef,
      men: menRef,
      women: womenRef,
      account: accountRef,
    }),
    []
  );

  const handleClickOutside = useCallback(
    (e) => {
      Object.entries(refs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setDropdown((prev) => ({ ...prev, [key]: false }));
        }
      });
    },
    [refs]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleProtectedClick = (path) => {
    setDropdown((prev) => ({ ...prev, account: false }));
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    setDropdown({
      products: false,
      about: false,
      men: false,
      women: false,
      account: false,
    });
    setMobileMenuOpen(false);
  };

  const renderProductsContent = useMemo(
    () => (
      <>
        <DropdownSection
          title="Our Store"
          links={[PRODUCTS[0]]}
          onLinkClick={() =>
            setDropdown((prev) => ({ ...prev, products: false }))
          }
        />
        <DropdownSection
          title="Categories"
          links={PRODUCTS.slice(1)}
          onLinkClick={() =>
            setDropdown((prev) => ({ ...prev, products: false }))
          }
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
            onLinkClick={() =>
              setDropdown((prev) => ({ ...prev, about: false }))
            }
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
        onLinkClick={() => setDropdown((prev) => ({ ...prev, men: false }))}
      />
    ),
    []
  );

  const renderWomenContent = useMemo(
    () => (
      <DropdownSection
        title="Women's Collection"
        links={WOMEN}
        onLinkClick={() => setDropdown((prev) => ({ ...prev, women: false }))}
      />
    ),
    []
  );

  const dropdownConfigs = [
    { key: "products", label: "Products", content: renderProductsContent },
    { key: "men", label: "Men", content: renderMenContent },
    { key: "women", label: "Women", content: renderWomenContent },
    { key: "about", label: "About Us", content: renderAboutContent },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#EDE1DF] border-b border-[#EDE1DF] shadow-md font-serif">
      {/* Top Bar */}
<div className="flex items-center justify-between lg:justify-center px-4 sm:px-6 lg:px-8 h-20 w-full relative">
  {/* Logo - Centered on mobile */}
  <Link
    to="/"
    className="absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none flex items-center"
  >
    <img
      src={Logo}
      alt="Shahu Mumbai Logo"
      className="h-16 object-contain"
    />
  </Link>

  {/* Hamburger Menu - Only visible on mobile */}
  <button
    className="lg:hidden text-[#6B4226] p-2 ml-auto"
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    aria-label="Toggle menu"
  >
    {mobileMenuOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
  </button>
</div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center py-3 px-20 bg-[#F1E7E5] border-t border-[#e0d8d1] w-full">
      
      {/* LEFT: Menu */}
      <ul className="flex items-center gap-8 flex-[1]">
        <li>
          <Link
            to="/"
            className="hover:text-[#D4A5A5] text-[#6B4226] font-medium"
          >
            Home
          </Link>
        </li>
        {dropdownConfigs.map(({ key, label, content }) => (
          <DesktopDropdown
            key={key}
            label={label}
            isOpen={dropdown[key]}
            setOpen={(state) =>
              setDropdown({
                products: false,
                about: false,
                men: false,
                women: false,
                account: false,
                [key]: state,
              })
            }
            refEl={refs[key]}
            content={content}
          />
        ))}
        {userRole === "admin" && (
          <li>
            <Link
              to="/admin"
              className="hover:text-[#D4A5A5] text-[#6B4226] font-medium"
            >
              Admin
            </Link>
          </li>
        )}
      </ul>

      {/* CENTER: Search */}
      <div className="flex justify-center flex-[1]">
        <input
          type="text"
          placeholder="Search"
          aria-label="Search products"
          className="w-[250px] px-3 py-1.5 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#D4A5A5]"
        />
      </div>

      {/* RIGHT: Icons */}
      <ul className="flex items-center gap-6 justify-end flex-[1]">
        <li
          ref={refs.account}
          className="relative list-none"
          onMouseEnter={() => {
            clearTimeout(refs.account.current.timer);
            setDropdown({
              products: false,
              about: false,
              men: false,
              women: false,
              account: true,
            });
          }}
          onMouseLeave={() => {
            refs.account.current.timer = setTimeout(() => {
              setDropdown((prev) => ({ ...prev, account: false }));
            }, 150);
          }}
        >
          <button
            onClick={() => {
              if (!token) {
                navigate("/account");
              } else {
                setDropdown((prev) => ({ ...prev, account: !prev.account }));
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
                      onClick={handleLogout}
                      className="hover:text-[#D4A5A5] text-gray-700"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </li>

          <li className="relative">
            <Link to="/cart" className="hover:text-[#D4A5A5] relative">
              <FaShoppingCart size={20} title="Cart" />
              <span className="absolute -top-2 -right-2 bg-red-700 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {cartItemCount}
              </span>
            </Link>
          </li>
        </ul>
      </div>

          {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F1E7E5] border-t border-[#e0d8d1] px-4 py-4 space-y-4 text-[#6B4226] font-medium text-base overflow-y-auto max-h-[calc(100vh-96px)]">
          {/* Home */}
          <Link
            to="/"
            className="block py-2 border-b border-[#d4c4b6]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>

          {/* Menu Sections */}
          {dropdownConfigs.map(({ key, label, content }) => (
            <div key={key} className="border-b border-[#d4c4b6] pb-2">
              <button
                onClick={() =>
                  setMobileDropdownOpen((prev) => (prev === key ? null : key))
                }
                className="w-full flex justify-between items-center py-2"
              >
                <span>{label}</span>
                <span>{mobileDropdownOpen === key ? "−" : "+"}</span>
              </button>
              {mobileDropdownOpen === key && (
                <div className="pl-4 pt-1 space-y-2">
                  {React.Children.map(content.props.children, (section) => (
                    <div>
                      {section.props.title && (
                        <p className="text-sm font-semibold text-[#6B4226] mt-2">
                          {section.props.title}
                        </p>
                      )}
                      {section.props.links.map(({ label, href }) => (
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
          ))}

          {/* Admin Link */}
          {userRole === "admin" && (
            <Link
              to="/admin"
              className="block py-2 border-b border-[#d4c4b6]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}

          {/* Account */}
          <div className="border-b border-[#d4c4b6] pb-2">
            <button
              onClick={() =>
                setMobileDropdownOpen((prev) =>
                  prev === "account" ? null : "account"
                )
              }
              className="w-full flex justify-between items-center py-2"
            >
              <span>Account</span>
              <span>{mobileDropdownOpen === "account" ? "−" : "+"}</span>
            </button>
            {mobileDropdownOpen === "account" && (
              <div className="pl-4 pt-1 space-y-2">
                {token ? (
                  <>
                    <button
                      onClick={() => handleProtectedClick("/profile")}
                      className="block text-sm hover:text-[#D4A5A5]"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => handleProtectedClick("/myorder")}
                      className="block text-sm hover:text-[#D4A5A5]"
                    >
                      Track Order
                    </button>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm hover:text-[#D4A5A5]"
                    >
                      Wishlist
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block text-sm hover:text-[#D4A5A5]"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm hover:text-[#D4A5A5]"
                  >
                    Login / Register
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            className="block flex items-center gap-2 py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaShoppingCart /> Cart ({cartItemCount})
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
