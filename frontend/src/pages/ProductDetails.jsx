// src/pages/ProductDetails.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
} from "react-icons/fa";
import { IoMdShareAlt } from "react-icons/io";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import RelatedCard from "../components/RelatedCard";
import { apiWithCurrency } from "../supabase/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Ecom } from "../analytics";
import { Helmet } from "react-helmet-async";
import { useCurrency } from "../supabase/CurrencyContext";
import { useLoading } from "../context/LoadingContext";

/* ────────────────────── helpers ────────────────────── */
const asBool = (v) =>
  v === true || v === "true" || v === 1 || v === "1" || v === "Y";

const get = (obj, keys, fallback = undefined) =>
  keys.reduce(
    (acc, k) => (acc && acc[k] != null ? acc[k] : undefined),
    obj
  ) ?? fallback;

const IMAGE_BASE =
  process.env.REACT_APP_IMAGE_BASE || process.env.REACT_APP_API_BASE_URL || "";

const normalizeImageUrl = (u) => {
  if (!u || typeof u !== "string") return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("/")) return `${IMAGE_BASE}${u}`;
  return `${IMAGE_BASE}/${u}`;
};

const pickImageUrl = (img) =>
  normalizeImageUrl(
    img?.image_url ||
      img?.imageurl ||
      img?.url ||
      img?.publicUrl ||
      img?.publicurl ||
      img?.Location ||
      img?.location ||
      img?.path
  );

const categoryName = (p) =>
  p?.categories?.name ||
  get(p, ["category", "name"]) ||
  get(p, ["categories", 0, "name"]) ||
  get(p, ["categories", 0, "Name"]) ||
  "Accessories";

/* ────────────────────── price helpers ────────────────────── */
const getSalePrice = (p) => {
  const base = Number(p?.Price ?? 0);
  const disc = Number(p?.DiscountPrice ?? 0);
  return disc > 0 && base - disc > 0 ? base - disc : base;
};

const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number(val) % 1 === 0 ? 0 : 2,
  }).format(Number(val || 0));

/* ────────────────────── Razorpay helpers ────────────────────── */
// const API = process.env.REACT_APP_API_BASE_URL || "";

// async function loadRazorpay() {
//   if (typeof window !== "undefined" && window.Razorpay) return true;
//   return new Promise((resolve) => {
//     try {
//       const s = document.createElement("script");
//       s.src = "https://checkout.razorpay.com/v1/checkout.js";
//       s.onload = () => resolve(true);
//       s.onerror = () => resolve(false);
//       document.body.appendChild(s);
//     } catch {
//       resolve(false);
//     }
//   });
// }
// const generateToken = () =>
//   `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

/* ────────────────────── UI components ────────────────────── */
const NextArrow = ({ onClick }) => (
  <button
    type="button"
    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer z-10 bg-white/80 rounded-full p-2 shadow border border-[#D4A5A5] hover:bg-white"
    onClick={onClick}
    aria-label="Next image"
  >
    <FaChevronRight size={18} className="text-[#6B4226]" />
  </button>
);
const PrevArrow = ({ onClick }) => (
  <button
    type="button"
    className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-10 bg-white/80 rounded-full p-2 shadow border border-[#D4A5A5] hover:bg-white"
    onClick={onClick}
    aria-label="Previous image"
  >
    <FaChevronLeft size={18} className="text-[#6B4226]" />
  </button>
);
const QuantitySelect = ({ max = 10, value, onChange }) => (
  <select
    aria-label="Select quantity"
    className="border border-[#D4A5A5] rounded-md px-3 py-2 bg-white"
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
  >
    {Array.from({ length: Math.min(max, 10) }, (_, i) => i + 1).map((n) => (
      <option key={n} value={n}>
        Qty: {n}
      </option>
    ))}
  </select>
);
const StarRating = ({ value = 0, size = 18 }) => {
  const full = Math.floor(value);
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < full ? "full" : "empty"
  );
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Rating: ${value} out of 5`}
    >
      {stars.map((t, i) =>
        t === "full" ? (
          <AiFillStar key={i} size={size} className="text-[#D4A5A5]" />
        ) : (
          <AiOutlineStar key={i} size={size} className="text-[#D4A5A5]" />
        )
      )}
    </span>
  );
};

/* ────────────────────── MAIN COMPONENT ────────────────────── */
const ProductDetails = () => {
  const { currency = "USD", loading: currencyLoading = true } = useCurrency() || {};
  const { setLoading } = useLoading();                 // only global loader
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistSubmitting, setWishlistSubmitting] = useState(false);
  const [buyNowSubmitting, setBuyNowSubmitting] = useState(false);
  const sliderRef = useRef();

  const token = localStorage.getItem("token");
  let decoded = "";
  if (token) {
    try {
      decoded = jwtDecode(token);
    } catch {
      decoded = "";
    }
  }
  const userid = decoded?.id;
  const fullName = decoded?.fullname || "Anonymous";

  // reviews
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // thank‑you modal
  const [thankOpen, setThankOpen] = useState(false);
  const [thankOrderNo, setThankOrderNo] = useState("");
  const [emailNoted, setEmailNoted] = useState(false);

  const isUpcoming = product?.LaunchingDate
    ? new Date(product.LaunchingDate) > new Date()
    : false;

  /* ────────────────────── FETCH PRODUCT ────────────────────── */
  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = apiWithCurrency("INR");
      const { data: p } = await api.get(`/api/products/${id}`);
      setProduct(p);

      const cat = categoryName(p);
      const { data: rel } = await api.get(
        `/api/products?category=${encodeURIComponent(cat)}&limit=8`
      );
      setRelatedProducts(
        (rel || []).filter((rp) => String(rp.id) !== String(id))
      );

      document.title = `${p.Name} - Shahu Mumbai`;

      try {
        Ecom.viewItem({
          id: p.ProductId,
          title: p.Name,
          category: cat,
          price: getSalePrice(p),
          quantity: 1,
          currency: "INR",
        });
      } catch {}
    } catch (err) {
      setError("Failed to fetch product details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const api = apiWithCurrency("INR");
      const res = await api.get(`/api/reviews/${id}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setReviews(list);
      const count = list.length;
      const avg = count
        ? list.reduce((s, r) => s + Number(r.Rating || 0), 0) / count
        : 0;
      setReviewCount(count);
      setAvgRating(Number(avg.toFixed(1)));
    } catch {
      // silent – reviews are optional
    }
  };

  const checkWishlist = async () => {
    if (!token || !userid) {
      setIsInWishlist(false);
      return;
    }
    try {
      const api = apiWithCurrency("INR");
      const { data } = await api.get("/api/wishlist");
      const isWishlisted = (data.data || []).some(
        (item) => String(item.product_id) === String(id)
      );
      setIsInWishlist(isWishlisted);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to check wishlist");
    }
  };

  useEffect(() => {
    if (!currencyLoading) {
      fetchProduct();
      fetchReviews();
      checkWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, userid, currencyLoading]);

  /* ────────────────────── WISHLIST ────────────────────── */
  const handleToggleWishlist = async () => {
    if (!token || !userid) {
      toast.error("Please log in to manage your wishlist");
      return;
    }
    if (wishlistSubmitting) return;

    try {
      setWishlistSubmitting(true);
      const api = apiWithCurrency("INR");
      if (isInWishlist) {
        const { data } = await api.get("/api/wishlist");
        const item = (data.data || []).find(
          (it) => String(it.product_id) === String(id)
        );
        if (item) {
          await api.delete(`/api/wishlist/${item.id}`);
          setIsInWishlist(false);
          toast.success("Removed from wishlist");
        }
      } else {
        await api.post("/api/wishlist", { product_id: id });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update wishlist");
    } finally {
      setWishlistSubmitting(false);
    }
  };

  /* ────────────────────── REVIEW FORM ────────────────────── */
  const [reviewName, setReviewName] = useState(fullName);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cartSubmitting, setCartSubmitting] = useState(false);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    try {
      setSubmitting(true);
      const api = apiWithCurrency("INR");
      await api.post(`/api/reviews`, {
        rating: Number(reviewRating),
        productid: id,
        userid: parseInt(userid),
        comment: reviewText.trim(),
      });
      toast.success("Review submitted successfully!");
      fetchReviews();
    } catch (e2) {
      toast.error(e2.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ────────────────────── ADD TO CART ────────────────────── */
  const handleAddToCart = async () => {
    setLoading(true);
    if (Number(product.Stock) === 0 || cartSubmitting) return;
    try {
      setCartSubmitting(true);
      const api = apiWithCurrency("INR");
      await api.post("/api/cart", {
        product_id: product.ProductId,
        quantity: qty,
      });
      toast.success(`${product.Name} added to cart!`);
      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { delta: qty } })
      );
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to add to cart.");
    } finally {
      setCartSubmitting(false);
      setLoading(false);
    }
  };

  /* ────────────────────── BUY NOW (Razorpay) ────────────────────── */
  const handleBuyNow = async () => {
    if (!product) return;

    if (Number(product.Stock) === 0) {
      toast.error("This product is out of stock.");
      return;
    }

    try {
      setLoading(true);
      setBuyNowSubmitting(true);

      const api = apiWithCurrency("INR");

      // Option 1: Just add to cart (will accumulate if already in cart)
      await api.post("/api/cart", {
        product_id: product.ProductId,
        quantity: qty,
      });

      // Optional: fire a small tracking event
      try {
        Ecom.addPaymentInfo(
          [
            {
              id: product.ProductId,
              title: product.Name,
              category: categoryName(product),
              price: getSalePrice(product),
              quantity: qty,
              currency: "INR",
            },
          ],
          "buy_now"
        );
      } catch {
        // ignore analytics errors
      }

      // Go to checkout – Checkout will load cart and show correct total
      navigate("/checkout", {
        state: {
          source: "buy_now",
          productId: product.ProductId,
          quantity: qty,
        },
      });
    } catch (err) {
      toast.error(
        err?.response?.data?.error || "Could not start checkout. Please try again."
      );
    } finally {
      setBuyNowSubmitting(false);
      setLoading(false);
    }
  };

  /* ────────────────────── SEO ────────────────────── */
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/products/${id}`;
  const metaDescription = (product?.shortdescription || product?.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);

  /* ────────────────────── EARLY RETURNS ────────────────────── */
  if (error) {
    return (
      <Layout>
        <Helmet>
          <title>Error - Shahu Mumbai</title>
        </Helmet>
        <Helmet>
          <title>Error - Shahu Mumbai</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-[#F1E7E5]">
          <p className="p-6 text-center text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  /* -------------------------------------------------
   *  IMPORTANT: Render Layout *immediately* so the
   *  background colour exists while the spinner shows.
   * ------------------------------------------------- */
  return (
    <Layout>
      <Helmet>
        <title>{product ? `${product.Name} — Shahu Mumbai` : "Loading…"}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        {/* other meta tags … */}
      </Helmet>

      {/* ────── SKELETON WHILE LOADING ────── */}
      {!product ? (
        <div className="min-h-screen bg-[#F1E7E5] px-4 md:px-6 py-16 pt-[60px] font-serif">
          {/* Breadcrumb skeleton */}
          <div className="max-w-6xl mx-auto mb-6 h-6 bg-gray-200 rounded animate-pulse" />

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Thumbs */}
            <div className="lg:col-span-2">
              <div className="flex lg:flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-gray-200 rounded-md animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div className="lg:col-span-6">
              <div className="h-[70vh] bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Buy box */}
            <div className="lg:col-span-4">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ) : isUpcoming ? (
        /* ────── COMING SOON ────── */
        <div className="min-h-screen flex items-center justify-center bg-[#F1E7E5] font-serif">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#6B4226] mb-4">
              Coming Soon
            </h1>
            <p className="text-lg text-[#3E2C23]">
              {product.Name} will be available soon!
            </p>
            <p className="text-sm text-[#3E2C23] mt-2">
              Launching on:{" "}
              {new Date(product.LaunchingDate).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </div>
        </div>
      ) : (
        /* ────── FULL PRODUCT UI ────── */
        <div className="min-h-screen px-4 md:px-6 py-16 pt-[60px] bg-[#F1E7E5] font-serif">
          {/* Breadcrumb */}
          <nav className="max-w-6xl mx-auto text-sm mb-4 text-[#6B4226]">
            <ol className="flex flex-wrap gap-1">
              <li>
                <Link to="/" className="hover:underline">
                  Home
                </Link>
                <span className="mx-2 text-[#D4A5A5]">/</span>
              </li>
              <li>
                <Link to="/products" className="hover:underline">
                  Our Products
                </Link>
                <span className="mx-2 text-[#D4A5A5]">/</span>
              </li>
              <li className="text-[#3E2C23] truncate max-w-[60%]" title={product.Name}>
                {product.Name}
              </li>
            </ol>
          </nav>

          {/* ────── MAIN LAYOUT ────── */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Thumbs */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="flex lg:flex-col gap-2 lg:sticky lg:top-24">
                {(() => {
                  const imgs = Array.isArray(product.product_images)
                    ? product.product_images
                    : [];
                  const ordered = [
                    ...imgs.filter((i) => asBool(i?.is_hero)).map(pickImageUrl),
                    ...imgs.filter((i) => !asBool(i?.is_hero)).map(pickImageUrl),
                  ].filter(Boolean);
                  const images = [...new Set(ordered)];
                  return images.length ? (
                    images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => sliderRef.current?.slickGoTo(idx)}
                        className="border-2 border-transparent hover:border-[#D4A5A5] rounded-md overflow-hidden w-16 h-10 sm:w-20 sm:h-20 bg-white"
                        aria-label={`Thumbnail ${idx + 1}`}
                      >
                        <img
                          src={img}
                          alt={`${product.Name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                          }}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-md border border-[#D4A5A5]" />
                  );
                })()}
              </div>
            </div>

            {/* Gallery */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-2 pb-8 relative">
                <Slider
                  {...{
                    dots: false,
                    infinite: true,
                    speed: 400,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    arrows: true,
                    nextArrow: <NextArrow />,
                    prevArrow: <PrevArrow />,
                  }}
                  ref={sliderRef}
                >
                  {(() => {
                    const imgs = Array.isArray(product.product_images)
                      ? product.product_images
                      : [];
                    const ordered = [
                      ...imgs.filter((i) => asBool(i?.is_hero)).map(pickImageUrl),
                      ...imgs.filter((i) => !asBool(i?.is_hero)).map(pickImageUrl),
                    ].filter(Boolean);
                    const images = [...new Set(ordered)];
                    const hero =
                      images[0] ||
                      `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                    return images.length ? (
                      images.map((img, i) => (
                        <div key={i} className="px-2">
                          <img
                            src={img}
                            alt={`${product.Name} view ${i + 1}`}
                            className="w-full h-auto max-h-[70vh] object-cover rounded-md border border-[#D4A5A5] shadow-sm bg-white"
                            onError={(e) => {
                              e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <img
                        src={hero}
                        alt={product.Name}
                        className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                      />
                    );
                  })()}
                </Slider>

                {/* Share button */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.Name,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard");
                    }
                  }}
                  className="absolute bottom-2 right-2 inline-flex items-center gap-2 text-[#6B4226] bg-white/90 border border-[#D4A5A5] rounded-full px-3 py-1 shadow hover:bg-white"
                  aria-label="Share product"
                >
                  <IoMdShareAlt />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>

            {/* Buy Box */}
            <aside className="lg:col-span-4 order-3">
              <div className="lg:sticky lg:top-24 flex flex-col gap-4">
                <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-5">
                  <h1 className="text-2xl font-bold text-[#6B4226] mb-1">
                    {product.Name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={avgRating} />
                    <span className="text-xs text-[#3E2C23]">
                      {avgRating}/5 • {reviewCount} review{reviewCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <p className="text-sm italic text-[#A3B18A] mt-1">
                    Category: {categoryName(product)}
                  </p>

                  {/* Price */}
                  {(() => {
                    const hasDiscount =
                      product.DiscountPrice &&
                      Number(product.DiscountPrice) < Number(product.Price);
                    const salePrice = getSalePrice(product);
                    const mrp = Number(product.Price);
                    const discountPct = hasDiscount
                      ? Math.round(((mrp - salePrice) / mrp) * 100)
                      : 0;

                    return hasDiscount ? (
                      <div className="flex items-baseline gap-3 mt-4">
                        <p className="text-3xl font-extrabold text-[#6B4226]">
                          {formatINR(salePrice)}
                        </p>
                        <p className="text-base text-gray-500 line-through">
                          {formatINR(mrp)}
                        </p>
                        <p className="text-base text-[#A3B18A] font-semibold">
                          {discountPct}% OFF
                        </p>
                      </div>
                    ) : (
                      <p className="text-3xl font-extrabold text-[#6B4226] mt-4">
                        {formatINR(mrp)}
                      </p>
                    );
                  })()}

                  {/* Qty & Stock */}
                  <div className="mt-5 flex items-center gap-3">
                    <QuantitySelect
                      max={Math.min(10, Number(product.Stock) || 10)}
                      value={qty}
                      onChange={setQty}
                    />
                    {Number(product.Stock) > 0 ? (
                      <p className="text-sm text-[#A3B18A]">
                        In Stock: {product.Stock}
                      </p>
                    ) : (
                      <p className="text-sm text-red-500">Out of Stock</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <button
                      className={`bg-black hover:bg-slate-600 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                        Number(product.Stock) === 0 || cartSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={Number(product.Stock) === 0 || cartSubmitting}
                      onClick={handleAddToCart}
                    >
                      {cartSubmitting ? "Adding..." : "Add to Cart"}
                    </button>

                    <button
                      className={`bg-black hover:bg-slate-600 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                        Number(product.Stock) === 0 || buyNowSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={Number(product.Stock) === 0 || buyNowSubmitting}
                      onClick={handleBuyNow}
                    >
                      {buyNowSubmitting ? "Starting Payment…" : "Buy Now"}
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`flex items-center justify-center w-12 h-12 rounded-md border border-[#D4A5A5] shadow transition ${
                          isInWishlist
                            ? "bg-[#D4A5A5] text-white"
                            : "bg-black hover:bg-slate-600 text-[#D4A5A5]"
                        } ${wishlistSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        aria-label={
                          isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                        }
                        onClick={handleToggleWishlist}
                        disabled={wishlistSubmitting}
                      >
                        <FaHeart size={20} />
                      </button>

                      <button
                        type="button"
                        className="flex-1 bg-black hover:bg-slate-600 text-white px-4 py-3 rounded-md font-semibold shadow transition"
                        aria-label="Join waitlist"
                      >
                        Join Waitlist
                      </button>
                    </div>
                  </div>
                </div>

                {/* About this item */}
                <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-4">
                  <h3 className="text-[#6B4226] font-semibold mb-2">
                    About this item
                  </h3>
                  <ul className="list-disc list-inside text-sm text-[#3E2C23] space-y-1">
                    {product.ShortDescription ? (
                      String(product.ShortDescription)
                        .split(/\.|\n|\r/)
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((point, i) => <li key={i}>{point}</li>)
                    ) : (
                      <li>Premium quality and crafted design.</li>
                    )}
                  </ul>
                </div>
              </div>
            </aside>
          </div>

          {/* ────── DESCRIPTION & SPECS ────── */}
          <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
                <h2 className="text-xl font-bold text-[#6B4226] mb-3">
                  Product Description
                </h2>
                <p className="text-base text-[#3E2C23] leading-relaxed whitespace-pre-line">
                  {product.Description || "No additional description provided."}
                </p>
                {product.BrandDesigner && (
                  <div className="mt-4 text-md text-[#6B4226]">
                    Designer:{" "}
                    <span className="font-semibold">{product.BrandDesigner}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
                <h3 className="text-lg font-bold text-[#6B4226] mb-2">
                  Specifications
                </h3>
                <dl className="text-sm text-[#3E2C23] grid grid-cols-1 gap-2">
                  <div className="flex justify-between border-b border-[#F1E7E5] pb-2">
                    <dt>Category</dt>
                    <dd className="font-medium">{categoryName(product)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Stock</dt>
                    <dd className="font-medium">
                      {Number(product.Stock) > 0 ? product.Stock : "Out of stock"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* ────── REVIEWS ────── */}
          <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-3 xs:p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
                  <h2 className="text-lg xs:text-xl font-bold text-[#6B4226]">
                    Customer Reviews
                  </h2>
                  <div className="flex items-center gap-1 xs:gap-2">
                    <StarRating value={avgRating} />
                    <span className="text-xs xs:text-sm text-[#3E2C23]">
                      {avgRating}/5 • {reviewCount} review{reviewCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-[#3E2C23] text-sm xs:text-base">
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <ul className="space-y-2 xs:space-y-3 sm:space-y-4">
                    {reviews.map((r) => (
                      <li
                        key={
                          r.ReviewId ||
                          `${r.userid}-${r.productid}-${r.CreatedAt ||
                            r.created_at ||
                            Math.random()}`
                        }
                        className="border border-[#F1E7E5] rounded-lg p-3 xs:p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 xs:gap-2">
                            <StarRating
                              value={Number(r.Rating || r.rating) || 0}
                            />
                            <span className="text-xs xs:text-sm text-[#6B4226] font-semibold">
                              {r.FullName ||
                                r?.users?.full_name ||
                                "Anonymous"}
                            </span>
                          </div>
                          <time className="text-[10px] xs:text-xs text-[#3E2C23] opacity-70">
                            {r.CreatedAt || r.created_at
                              ? new Date(
                                  r.CreatedAt || r.created_at
                                ).toLocaleDateString("en-IN")
                              : ""}
                          </time>
                        </div>
                        <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-[#3E2C23] leading-relaxed whitespace-pre-line">
                          {r.Comment || r.comment}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Review Form */}
            <div className="lg:col-span-4">
              <form
                onSubmit={submitReview}
                className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6"
              >
                <h3 className="text-lg font-bold text-[#6B4226] mb-3">
                  Write a review
                </h3>

                <label className="block text-sm text-[#3E2C23] mb-1">
                  Your name (optional)
                </label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full border border-[#D4A5A5] rounded-md px-3 py-2 mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
                  placeholder="e.g., Arjun"
                  readOnly
                />

                <label className="block text-sm text-[#3E2C23] mb-1">
                  Rating
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full border border-[#D4A5A5] rounded-md px-3 py-2 mb-3 bg-white"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} -{" "}
                      {n === 5
                        ? "Excellent"
                        : n === 4
                        ? "Good"
                        : n === 3
                        ? "Average"
                        : n === 2
                        ? "Poor"
                        : "Terrible"}
                    </option>
                  ))}
                </select>

                <label className="block text-sm text-[#3E2C23] mb-1">
                  Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full min-h-[120px] border border-[#D4A5A5] rounded-md px-3 py-2 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
                  placeholder="Share what you liked or what could be improved…"
                  required
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full bg-[#6B4226] text-white px-6 py-3 rounded-md font-semibold shadow hover:opacity-90 transition ${
                    submitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>
          </section>

          {/* ────── RELATED PRODUCTS ────── */}
          <div className="mt-16 px-2 max-w-[1440px] mx-auto font-serif">
            <h2 className="text-2xl font-bold text-[#6B4226] mb-6 text-center">
              You May Also Like
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              {relatedProducts.map((related) => {
                const rImgs = Array.isArray(related.product_images)
                  ? related.product_images
                  : [];
                const ordered = [
                  ...rImgs.filter((i) => asBool(i?.is_hero)).map(pickImageUrl),
                  ...rImgs.filter((i) => !asBool(i?.is_hero)).map(pickImageUrl),
                ].filter(Boolean);
                const img = ordered[0] || "/assets/images/placeholder.png";
                const sale =
                  Number(related.DiscountPrice) > 0 &&
                  Number(related.DiscountPrice) < Number(related.Price)
                    ? Number(related.Price) - Number(related.DiscountPrice)
                    : Number(related.Price);

                return (
                  <div
                    key={related.id || related.ProductId}
                    className="w-[260px]"
                  >
                    <RelatedCard
                      product={{
                        id: related.id || related.ProductId,
                        name: related.Name || related.name,
                        price: sale,
                        currency: "INR",
                        image: img,
                        category: categoryName(related),
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ────── THANK‑YOU MODAL ────── */}
          {thankOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
                <h2 className="text-xl font-semibold text-green-600">
                  Payment Successful
                </h2>
                <p className="text-gray-700">Your order has been placed.</p>
                <p className="text-sm font-mono text-gray-600">
                  Order Number: <strong>{thankOrderNo}</strong>
                </p>
                <p className="text-xs text-gray-600">
                  {emailNoted
                    ? "A confirmation email has been sent."
                    : "We’ll email your receipt shortly."}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    to="/myorder"
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    View Orders
                  </Link>
                  <button
                    onClick={() => setThankOpen(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ProductDetails;