import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { Link } from "react-router-dom";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import clsx from "clsx";

const Account = lazy(() => import("../../pages/Account"));

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
      { label: "Our Philosophy", href: "/" },
      { label: "Heritage Timeline", href: "/" },
      { label: "Our Studios", href: "/" },
    ],
  },
  {
    section: "Craft",
    items: [
      { label: "Contemporary artisans", href: "/" },
      { label: "Services", href: "/service" },
      { label: "Contact us", href: "/contactus" },
    ],
  },
];

const DropdownSection = ({ title, links, onLinkClick }) => (
  <div className="min-w-[180px] mt-4 first:mt-0">
    <h3 className="font-semibold mb-2 border-b pb-1 text-[#6B4226]">{title.toUpperCase()}</h3>
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
  >
    <span
      className="hover:text-[#D4A5A5] text-[#6B4226] font-medium cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setOpen(!isOpen)}
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
  const [showAccount, setShowAccount] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState({ products: false, about: false });
  const [dropdown, setDropdown] = useState({ products: false, about: false });

  const productsRef = useRef(null);
  const aboutRef = useRef(null);
  const cartItemCount = 3;

  const toggleMobileDropdown = (key) =>
    setMobileDropdown((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleClickOutside = useCallback((e) => {
    if (productsRef.current && !productsRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, products: false }));
    }
    if (aboutRef.current && !aboutRef.current.contains(e.target)) {
      setDropdown((prev) => ({ ...prev, about: false }));
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const renderProductsContent = useMemo(() => (
    <>
      <DropdownSection
        title="Our Stories"
        links={[PRODUCTS[0]]}
        onLinkClick={() => setDropdown({ products: false, about: false })}
      />
      <DropdownSection
        title="Categories"
        links={PRODUCTS.slice(1)}
        onLinkClick={() => setDropdown({ products: false, about: false })}
      />
    </>
  ), []);

  const renderAboutContent = useMemo(() => (
    <>
      {ABOUT.map(({ section, items }) => (
        <DropdownSection
          key={section}
          title={section}
          links={items}
          onLinkClick={() => setDropdown({ products: false, about: false })}
        />
      ))}
    </>
  ), []);

  return (
    <>
      <nav className={clsx(
        "fixed top-0 w-full z-50 bg-[#f9f5f0] border-b border-[#d6ccc2] shadow-md justify-evenly font-serif",
        { "blur-sm": showAccount }
      )}>
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-[1.5rem] sm:text-[1.8rem] font-bold text-[#6B4226] tracking-wide">
            𝐒𝐇𝐀𝐇𝐔 𝐌𝐔𝐌𝐁𝐀𝐈
          </Link>

          <div className="lg:hidden text-[#6B4226] text-xl cursor-pointer" onClick={() => setIsMobileMenuOpen((p) => !p)}>
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            <input
              type="text"
              placeholder="Search"
              className="w-full max-w-[400px] px-4 py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#D4A5A5]"
            />
            <div className="flex items-center gap-5 text-[#6B4226]">
              <span onClick={() => setShowAccount((p) => !p)} className="cursor-pointer hover:text-[#D4A5A5]" role="button" tabIndex={0}>
                <FaUser size={20} title="Account" />
              </span>
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
        </div>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex justify-center gap-8 py-3 px-8 bg-[#f9f5f0] border-t border-[#e0d8d1]">
          <li><Link to="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">Home</Link></li>

          <DesktopDropdown
            label="Products"
            isOpen={dropdown.products}
            setOpen={(state) => 
              setDropdown({
                products: state,
                about: false,
              })  
            }
            refEl={productsRef}
            content={renderProductsContent}
          />

          <li><Link to="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">Men</Link></li>
          <li><Link to="/" className="hover:text-[#D4A5A5] text-[#6B4226] font-medium">Women</Link></li>

          <DesktopDropdown
            label="About SHAHU"
            isOpen={dropdown.about}
            setOpen={(state) => setDropdown({
                products: false,
                about: state,
              })
            }
            refEl={aboutRef}
            content={renderAboutContent}
          />
        </ul>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-xl transition-transform duration-300">
              <div className="p-6">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full mb-4 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[#D4A5A5]"
                />
                <ul className="space-y-4 text-[#6B4226] font-medium">
                  <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>

                  {["products", "about"].map((key) => (
                    <li key={key}>
                      <button className="w-full flex justify-between items-center" onClick={() => toggleMobileDropdown(key)}>
                        {key === "products" ? "Products" : "About SHAHU"}
                        <span>{mobileDropdown[key] ? "▲" : "▼"}</span>
                      </button>
                      {mobileDropdown[key] && (
                        <ul className="ml-4 mt-2 text-sm space-y-2">
                          {(key === "products" ? PRODUCTS : ABOUT.flatMap(s => s.items)).map(({ label, href }) => (
                            <li key={label}>
                              <Link to={href} onClick={() => setIsMobileMenuOpen(false)}>{label}</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}

                  <li>
                    <button onClick={() => { setShowAccount(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-2">
                      <FaUser /> Account
                    </button>
                  </li>
                  <li>
                    <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                      <FaShoppingCart />
                      Cart
                      <span className="ml-1 bg-red-700 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                        {cartItemCount}
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Account Modal */}
      {showAccount && (
        <div className="fixed inset-0 flex justify-center items-center z-50" onClick={() => setShowAccount(false)}>
          <div className="bg-white  rounded-md max-w-md w-11/12 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800" onClick={() => setShowAccount(false)}>
              &times;
            </button>
            <Suspense fallback={<div>Loading...</div>}>
              <Account />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
