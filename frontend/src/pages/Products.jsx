import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../supabase/axios";
import ProductCard from "../components/ProductCard";
import Layout from "../layout/Layout";
import { toast } from "react-toastify";
import { FiFilter, FiChevronDown, FiX, FiSearch } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

const ITEMS_PER_PAGE = 30;
const FALLBACK_CATEGORIES = ["Men", "Women", "Accessories"];

// ------- helpers -------
const asBool = (v) => v === true || v === "true" || v === 1 || v === "1";
const categoryName = (p) =>
  p?.categories?.name ||
  (p?.category && p.category.name) ||
  (Array.isArray(p?.categories) ? p.categories[0]?.Name : null) ||
  "Uncategorized";

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
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);

  // Initialize search from URL query
  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearch(query);
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products`);
      const products = response.data || [];

      const mapped = products.map((p) => {
        const imgs = Array.isArray(p.product_images) ? p.product_images : [];
        const ordered = [
          ...imgs.filter((i) => asBool(i?.is_hero)).map(pickImageUrl),
          ...imgs.filter((i) => !asBool(i?.is_hero)).map(pickImageUrl),
        ].filter(Boolean);

        return {
          id: p.ProductId,
          name: p.Name,
          description: p.Description || "No description available",
          price: Number(p.Price || 0),
          category: categoryName(p),
          image: ordered[0] || "/assets/images/placeholder.png",
        };
      });

      setAllProducts(mapped);
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.error || "An error occurred.");
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
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
      if (!menuOpen) return;
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
  }, [menuOpen]);

  const activeCount =
    (search.trim() ? 1 : 0) +
    (selectedCategories.size > 0 ? 1 : 0) +
    (sort !== "relevance" ? 1 : 0);

  // ---------- SEO ----------
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/products`;
  const pageTitle = "Discover Handpicked Styles — Shahu Mumbai";
  const pageDesc =
    "Explore curated fashion in earthy tones and timeless silhouettes. Filter by category, search, and sort to find your perfect piece at Shahu Mumbai.";

  // Build ItemList JSON-LD for the current page slice
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Products",
    url: `${canonical}${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`,
    numberOfItems: paged.length,
    itemListElement: paged.map((p, idx) => ({
      "@type": "ListItem",
      position: start + idx + 1,
      url: `${baseUrl}/products/${p.id}`,
      name: p.name,
    })),
  };

  return (
    <Layout>
      <Helmet>
        {/* Core SEO */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta
          name="robots"
          content={paged.length === 0 ? "noindex,follow" : "index,follow,max-image-preview:large"}
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
            ...Array.from(selectedCategories || [])
          ].filter(Boolean).join(", ")}
        />

        {/* Canonical + hreflang */}
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en-IN" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${baseUrl}/og/products.jpg`} />
        <meta property="og:image:alt" content="Shahu Mumbai — product collection" />

        {/* Twitter */}
        {/* <meta name="twitter:card" content="summary_large_image" /> */}
        {/* If you have a handle, you can add: */}
        {/* <meta name="twitter:site" content="@yourhandle" /> */}
        {/* <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={`${baseUrl}/og/products.jpg`} /> */}

        {/* Breadcrumbs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
              { "@type": "ListItem", position: 2, name: "Products", item: canonical }
            ]
          })}
        </script>

        {/* Page type: CollectionPage (browse) or SearchResultsPage (search) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": debouncedSearch ? "SearchResultsPage" : "CollectionPage",
            name: pageTitle,
            url: canonical,
            description: pageDesc,
            isPartOf: { "@type": "WebSite", name: "Shahu Mumbai", url: baseUrl },
            ...(debouncedSearch ? { query: debouncedSearch } : {})
          })}
        </script>

        {/* ItemList: make each entry a Product with an Offer */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Products",
            url: `${canonical}${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`,
            numberOfItems: paged.length,
            itemListElement: paged.map((p, idx) => ({
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
                  priceCurrency: "INR",
                  price: typeof p.price === "number" ? p.price.toFixed(2) : String(p.price),
                  availability: "https://schema.org/InStock"
                }
              }
            }))
          })}
        </script>

        {/* Optional pagination rels – only if you later add `?page=` in the URL */}
        {/*
        <link rel="prev" href={`${canonical}?page=${page-1}`} />
        <link rel="next" href={`${canonical}?page=${page+1}`} />
        */}
      </Helmet>


      <div className="pt-[130px] pb-12 px-4 bg-[#EDE1DF] min-h-screen font-serif">
        {/* Banner */}
        <div className="max-w-7xl mx-auto">
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
            <div className="relative px-8 py-10 lg:px-12 lg:py-14 text-center">
              <span className="inline-block px-3 py-1 text-[11px] tracking-wider uppercase border border-[#9c6644] rounded-full text-[#4a2c17] bg-[#fdf6e9]">
                Freshly Curated
              </span>
              <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#4a2c17]">
                Discover Handpicked Styles
              </h1>
              <p className="mt-2 text-[#4a2c17]/80 text-base md:text-lg max-w-2xl mx-auto">
                Earthy tones, timeless silhouettes. Use filters to find your perfect piece.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[#4a2c17]">
              Showing{" "}
              <span className="font-bold">
                {filtered.length === 0 ? 0 : start + 1}–
                {Math.min(filtered.length, start + ITEMS_PER_PAGE)}
              </span>{" "}
              of <span className="font-bold">{filtered.length}</span>
            </p>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                ref={menuBtnRef}
                onClick={() => setMenuOpen((o) => !o)}
                className="relative flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg bg-[#fdf6e9] hover:bg-[#eadfce]"
              >
                <FiFilter />
                <span className="font-semibold">Filter & Sort</span>
                <FiChevronDown className={`transition ${menuOpen ? "rotate-180" : ""}`} />
                {activeCount > 0 && (
                  <span className="absolute -top-2 -right-2 text-[11px] leading-none bg-black text-white rounded-full px-2 py-1 border-2 border-black">
                    {activeCount}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-[340px] z-20 rounded-xl border-2 border-black shadow-lg overflow-hidden"
                  style={{ backgroundColor: "#fdf6e9" }}
                >
                  <div className="p-4 space-y-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-bold text-[#4a2c17] mb-1">
                        Search
                      </label>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70" />
                        <input
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setSearchParams(
                              e.target.value.trim()
                                ? { search: e.target.value.trim() }
                                : {}
                            );
                          }}
                          placeholder="Search products..."
                          className="w-full px-9 py-2 border border-black/60 rounded bg-[#EDE1DF] text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-[#4a2c17]">
                          Categories
                        </label>
                        {selectedCategories.size > 0 && (
                          <button
                            className="text-xs underline text-[#4a2c17]/80"
                            onClick={() => setSelectedCategories(new Set())}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {categoryOptions.map((cat) => {
                          const active = selectedCategories.has(cat);
                          return (
                            <label
                              key={cat}
                              className={`flex items-center gap-2 px-3 py-2 rounded border ${
                                active
                                  ? "bg-black text-white border-black"
                                  : "border-black hover:bg-[#eadfce]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="accent-[#6B4226]"
                                checked={active}
                                onChange={() => toggleCategory(cat)}
                              />
                              <span className="text-sm">{cat}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-sm font-bold text-[#4a2c17] mb-2">
                        Sort by
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: "relevance", label: "Relevance" },
                          { v: "price-asc", label: "Price ↑" },
                          { v: "price-desc", label: "Price ↓" },
                        ].map((opt) => (
                          <button
                            key={opt.v}
                            onClick={() => setSort(opt.v)}
                            className={`px-3 py-2 text-sm rounded border ${
                              sort === opt.v
                                ? "bg-black text-white border-black"
                                : "border-black hover:bg-[#eadfce]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="flex items-center justify-between gap-2 p-3 border-t-2 border-black bg-[#fdf6e9] rounded-b-xl">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-sm underline text-[#4a2c17]"
                    >
                      <FiX /> Reset
                    </button>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-[#fdf6e9] border border-[#9c6644]/30 rounded-lg animate-pulse"
                />
              ))
            ) : paged.length > 0 ? (
              paged.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="text-center col-span-full text-[#6B4226] text-lg">
                No products found
              </p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 border-2 border-black rounded disabled:opacity-50 hover:bg-[#fdf6e9]"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const n = idx + 1;
              const isActive = n === page;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-3 py-2 rounded border-2 ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "border-black hover:bg-[#fdf6e9]"
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border-2 border-black rounded disabled:opacity-50 hover:bg-[#fdf6e9]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
