// src/pages/Products.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiWithCurrency } from "../supabase/axios";
import ProductCard from "../components/ProductCard";
import Layout from "../layout/Layout";
import { toast } from "react-toastify";
import { FiFilter, FiChevronDown, FiX, FiSearch } from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "../supabase/CurrencyContext";
import { useLoading } from "../context/LoadingContext";

const ITEMS_PER_PAGE = 30;
const FALLBACK_CATEGORIES = ["Men", "Women", "Accessories"];

// ------- helpers -------
const asBool = (v) => v === true || v === "true" || v === 1 || v === "1";
const categoryName = (p) =>
  p?.categories?.name ||
  (p?.category && p.category.name) ||
  (Array.isArray(p?.categories) ? p.categories[0]?.Name : null) ||
  "Accessories";

const IMAGE_BASE =
  process.env.REACT_APP_IMAGE_BASE ||
  process.env.REACT_APP_API_BASE_URL ||
  "";

const normalizeImageUrl = (u) => {
  if (!u || typeof u !== "string") return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("/")) return `${IMAGE_BASE}${u}`;
  return `${IMAGE_BASE}/${u}`;
};

const pickImageUrl = (img) =>
  normalizeImageUrl(
    img?.image_url ||
      img?.url ||
      img?.publicUrl ||
      img?.public_url ||
      img?.Location ||
      img?.location ||
      img?.path ||
      ""
  );

const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const Products = () => {
  const {
    currency = "USD",
    loading: currencyLoading = true,
    convertFromINR,
    baseCurrency = "INR",
  } = useCurrency() || {};

  const [allProducts, setAllProducts] = useState([]);
  const { setLoading } = useLoading();
  const [loading, setLocalLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);

  // Initialize category filter from URL query parameter 'name'
  useEffect(() => {
    const category = searchParams.get("name");
    if (category) {
      setSelectedCategories(new Set([category]));
    }
  }, [searchParams]);

  // Initialize search from URL query
  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearch(query);
  }, [searchParams]);

  // Detect mobile for layout adjustments (breakpoint at sm: 640px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setLocalLoading(true);

      const minDelay = new Promise((resolve) => setTimeout(resolve, 600));

      const api = apiWithCurrency(currency);
      const category =
        searchParams.get("name") || Array.from(selectedCategories)[0] || "";
      const response = await api.get(`/api/products`, {
        params: {
          category: category || undefined,
          search: debouncedSearch || undefined,
        },
      });

      await minDelay;

      const products = response.data || [];

      const mapped = products.map((p) => {
        const imgs = Array.isArray(p.product_images) ? p.product_images : [];
        const ordered = [
          ...imgs.filter((i) => asBool(i?.is_hero)).map(pickImageUrl),
          ...imgs.filter((i) => !asBool(i?.is_hero)).map(pickImageUrl),
        ].filter(Boolean);

        const basePriceINR = Number(p.Price || 0);

        return {
          id: p.ProductId,
          name: p.Name,
          description: p.Description || "No description available",
          priceINR: basePriceINR,
          price: basePriceINR, // still INR internally (for sort/search)
          currency: p.currency || baseCurrency,
          category: categoryName(p),
          image: ordered[0] || "/assets/images/placeholder.png",
          baseCurrency, // for the card to show INR note
        };
      });

      setAllProducts(mapped);
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.error || "An error occurred.");
      setAllProducts([]);
    } finally {
      setLoading(false);
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (!currencyLoading) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, currencyLoading, debouncedSearch, selectedCategories]);

  const categoryOptions = useMemo(() => {
    const set = new Set(allProducts.map((p) => p.category).filter(Boolean));
    if (set.size === 0) return FALLBACK_CATEGORIES;
    return Array.from(set);
  }, [allProducts]);

  const filtered = useMemo(() => {
    let data = [...allProducts];

    if (selectedCategories.size > 0) {
      data = data.filter((p) => selectedCategories.has(p.category));
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          String(p.price).toLowerCase().includes(q)
      );
    }

    if (sort === "price-asc") data.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") data.sort((a, b) => b.price - a.price);

    return data;
  }, [allProducts, selectedCategories, debouncedSearch, sort]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategories, debouncedSearch, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paged = filtered.slice(start, start + ITEMS_PER_PAGE);

  // Convert paged products from INR to active currency for display
  const pagedWithDisplayPrice = useMemo(
    () =>
      paged.map((p) => ({
        ...p,
        displayPrice: convertFromINR
          ? convertFromINR(p.priceINR ?? p.price)
          : p.price,
        displayCurrency: currency,
      })),
    [paged, convertFromINR, currency]
  );

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);

      if (next.size > 0) {
        setSearchParams({
          name: Array.from(next)[0],
          search: debouncedSearch || "",
        });
      } else {
        setSearchParams(debouncedSearch ? { search: debouncedSearch } : {});
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSearch("");
    setSort("relevance");
    setSearchParams({});
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuOpen || isMobile) return;
      const target = e.target;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, isMobile]);

  const activeCount =
    (search.trim() ? 1 : 0) +
    (selectedCategories.size > 0 ? 1 : 0) +
    (sort !== "relevance" ? 1 : 0);

  // ---------- SEO ----------
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/products`;
  const pageTitle =
    selectedCategories.size > 0
      ? `${Array.from(selectedCategories)[0]} Products — Shahu Mumbai`
      : "Discover Handpicked Styles — Shahu Mumbai";
  const pageDesc =
    selectedCategories.size > 0
      ? `Explore ${Array.from(selectedCategories)[0]} products at Shahu Mumbai. Filter, search, and sort to find your perfect piece.`
      : "Explore curated fashion in earthy tones and timeless silhouettes. Filter by category, search, and sort to find your perfect piece at Shahu Mumbai.";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      selectedCategories.size > 0
        ? `${Array.from(selectedCategories)[0]} Products`
        : "Products",
    url: `${canonical}${
      debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""
    }`,
    numberOfItems: pagedWithDisplayPrice.length,
    itemListElement: pagedWithDisplayPrice.map((p, idx) => ({
      "@type": "ListItem",
      position: start + idx + 1,
      item: {
        "@type": "Product",
        name: p.name,
        url: `${baseUrl}/products/${p.id}`,
        image: p.image ? [p.image] : undefined,
        description: p.description,
        category: p.category,
        offers: {
          "@type": "Offer",
          url: `${baseUrl}/products/${p.id}`,
          priceCurrency: p.displayCurrency || currency,
          price:
            typeof p.displayPrice === "number"
              ? p.displayPrice.toFixed(2)
              : String(p.displayPrice),
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: isMobile ? 0.2 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  useEffect(() => {
    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentRect) {
            window.requestAnimationFrame(() => {});
          }
        }
      });
      const grid = document.querySelector(".products-grid");
      if (grid) {
        resizeObserver.observe(grid);
      }
    }
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isMobile]);

  return (
    <Layout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta
          name="robots"
          content={
            pagedWithDisplayPrice.length === 0
              ? "noindex,follow"
              : "index,follow,max-image-preview:large"
          }
        />
        <meta
          name="keywords"
          content={[
            "Shahu Mumbai",
            "handwoven sarees",
            "artisan-made",
            "sustainable luxury",
            "Indian fashion",
            "designer sarees",
            ...Array.from(selectedCategories || []),
          ]
            .filter(Boolean)
            .join(", ")}
        />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en-IN" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${baseUrl}/og/products.jpg`} />
        <meta
          property="og:image:alt"
          content="Shahu Mumbai — product collection"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${baseUrl}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Products",
                item: canonical,
              },
            ],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": debouncedSearch ? "SearchResultsPage" : "CollectionPage",
            name: pageTitle,
            url: canonical,
            description: pageDesc,
            isPartOf: {
              "@type": "WebSite",
              name: "Shahu Mumbai",
              url: baseUrl,
            },
            ...(debouncedSearch ? { query: debouncedSearch } : {}),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(itemListJsonLd)}
        </script>
      </Helmet>

      <div className="pt-[10px] pb-12 px-2 xs:px-4 bg-[#EDE1DF] min-h-screen font-serif products-container">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto"
        >
          <div
            className="relative overflow-hidden rounded-2xl border-2 border-black"
            style={{
              background:
                "linear-gradient(135deg, #fdf6e9 0%, #EDE1DF 60%, #eadfce 100%)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(#9c664422 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div className="relative px-4 xs:px-6 py-8 xs:py-10 text-center products-banner">
              <span className="inline-block px-2 py-1 text-[10px] xs:text-[11px] tracking-wider uppercase border border-[#9c6644] rounded-full text-[#4a2c17] bg-[#fdf6e9]">
                Freshly Curated
              </span>
              <h1 className="mt-2 text-2xl xs:text-3xl font-extrabold text-[#4a2c17]">
                {selectedCategories.size > 0
                  ? `Explore ${Array.from(selectedCategories)[0]}`
                  : "Discover Handpicked Styles"}
              </h1>
              <p className="mt-2 text-sm xs:text-base text-[#4a2c17]/80 max-w-[90%] mx-auto">
                {pageDesc}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-7xl mx-auto mt-4 xs:mt-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[#4a2c17] text-sm xs:text-base">
              Showing{" "}
              <span className="font-bold">
                {filtered.length === 0 ? 0 : start + 1}–
                {Math.min(filtered.length, start + ITEMS_PER_PAGE)}
              </span>{" "}
              of <span className="font-bold">{filtered.length}</span>
            </p>

            <div className="relative w-full sm:w-auto">
              <button
                ref={menuBtnRef}
                onClick={() => setMenuOpen((o) => !o)}
                className="relative flex items-center gap-2 px-3 xs:px-4 py-2 border-2 border-black rounded-lg bg-[#fdf6e9] hover:bg-[#eadfce] products-filter-button w-full sm:w-auto justify-center sm:justify-start transition-all duration-300 ease-in-out"
              >
                <FiFilter size={16} />
                <span className="text-sm font-semibold">Filter & Sort</span>
                <FiChevronDown
                  className={`transition-transform duration-300 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
                {activeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 text-[10px] leading-none bg-black text-white rounded-full px-1.5 py-0.5 border-2 border-black"
                  >
                    {activeCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    ref={menuRef}
                    initial={{
                      opacity: 0,
                      y: isMobile ? 20 : -10,
                      height: isMobile ? 0 : "auto",
                    }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{
                      opacity: 0,
                      y: isMobile ? 20 : -10,
                      height: isMobile ? 0 : "auto",
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`${
                      isMobile
                        ? "static w-full mt-4 rounded-xl border-2 border-black overflow-hidden bg-[#fdf6e9] shadow-lg"
                        : "absolute right-0 mt-2 w-[340px] max-w-[340px] z-20 rounded-xl border-2 border-black shadow-lg overflow-hidden bg-[#fdf6e9]"
                    } products-filter-dropdown`}
                  >
                    <div className="p-3 xs:p-4 space-y-3">
                      <div>
                        <label className="block text-xs xs:text-sm font-bold text-[#4a2c17] mb-1">
                          Search
                        </label>
                        <div className="relative">
                          <FiSearch className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 opacity-70" />
                          <input
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                              setSearchParams(
                                e.target.value.trim() ||
                                  selectedCategories.size > 0
                                  ? {
                                      name:
                                        Array.from(selectedCategories)[0] || "",
                                      search: e.target.value.trim(),
                                    }
                                  : {}
                              );
                            }}
                            placeholder="Search products..."
                            className="w-full px-8 xs:px-9 py-1.5 xs:py-2 border border-black/60 rounded bg-[#EDE1DF] text-xs xs:text-sm focus:outline-none transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs xs:text-sm font-bold text-[#4a2c17]">
                            Categories
                          </label>
                          {selectedCategories.size > 0 && (
                            <button
                              className="text-[10px] xs:text-xs underline text-[#4a2c17]/80 hover:text-[#4a2c17] transition-colors duration-200"
                              onClick={() => setSelectedCategories(new Set())}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 xs:gap-2">
                          {categoryOptions.map((cat) => {
                            const active = selectedCategories.has(cat);
                            return (
                              <motion.label
                                key={cat}
                                initial={false}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-1 xs:gap-2 px-2 xs:px-3 py-1.5 xs:py-2 rounded border text-xs xs:text-sm cursor-pointer transition-all duration-200 ${
                                  active
                                    ? "bg-black text-white border-black"
                                    : "border-black hover:bg-[#eadfce]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="accent-[#6B4226] w-3.5 h-3.5 xs:w-4 xs:h-4"
                                  checked={active}
                                  onChange={() => toggleCategory(cat)}
                                />
                                <span>{cat}</span>
                              </motion.label>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs xs:text-sm font-bold text-[#4a2c17] mb-1 xs:mb-2">
                          Sort by
                        </label>
                        <div className="grid grid-cols-3 gap-1 xs:gap-2">
                          {[
                            { v: "relevance", label: "Relevance" },
                            { v: "price-asc", label: "Price ↑" },
                            { v: "price-desc", label: "Price ↓" },
                          ].map((opt) => (
                            <motion.button
                              key={opt.v}
                              onClick={() => setSort(opt.v)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm rounded border cursor-pointer transition-all duration-200 ${
                                sort === opt.v
                                  ? "bg-black text-white border-black"
                                  : "border-black hover:bg-[#eadfce]"
                              }`}
                            >
                              {opt.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 xs:p-3 border-t-2 border-black bg-[#fdf6e9] rounded-b-xl">
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-[10px] xs:text-sm underline text-[#4a2c17] hover:text-[#4a2c17]/80 transition-colors duration-200"
                      >
                        <FiX /> Reset
                      </button>
                      <motion.button
                        onClick={() => setMenuOpen(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 xs:px-4 py-1.5 xs:py-2 bg-black text-white rounded-lg font-bold text-xs xs:text-sm hover:bg-gray-800 transition-all duration-200"
                      >
                        Apply
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="max-w-7xl mx-auto mt-4 xs:mt-6 products-grid"
          variants={containerVariants}
          initial="hidden"
          animate={loading || currencyLoading ? "hidden" : "visible"}
          transition={{ duration: isMobile ? 0.6 : 0.4 }}
        >
          <div className="grid gap-4 xs:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading || currencyLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-80 bg-[#fdf6e9] border border-[#9c6644]/30 rounded-lg animate-pulse w-full max-w-[300px] mx-auto"
                />
              ))
            ) : pagedWithDisplayPrice.length > 0 ? (
              pagedWithDisplayPrice.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="w-full"
                >
                  <ProductCard
                    product={product}
                    currency={currency}
                  />
                </motion.div>
              ))
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center col-span-full text-[#6B4226] text-base xs:text-lg"
              >
                No products found
              </motion.p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap items-center justify-center gap-1 xs:gap-2 mt-6 xs:mt-8"
              >
                <motion.button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  whileHover={!page === 1 ? { scale: 1.05 } : {}}
                  whileTap={{ scale: 0.95 }}
                  className="px-2 xs:px-3 py-1.5 xs:py-2 border-2 border-black rounded text-xs xs:text-sm disabled:opacity-50 hover:bg-[#fdf6e9] transition-all duration-200"
                >
                  Prev
                </motion.button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const n = idx + 1;
                  const isActive = n === page;
                  return (
                    <motion.button
                      key={n}
                      onClick={() => setPage(n)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-2 xs:px-3 py-1.5 xs:py-2 rounded border-2 text-xs xs:text-sm cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-black text-white border-black"
                          : "border-black hover:bg-[#eadfce]"
                      }`}
                    >
                      {n}
                    </motion.button>
                  );
                })}
                <motion.button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  whileHover={page === totalPages ? {} : { scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-2 xs:px-3 py-1.5 xs:py-2 border-2 border-black rounded text-xs xs:text-sm disabled:opacity-50 hover:bg-[#fdf6e9] transition-all duration-200"
                >
                  Next
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Products;
