import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight, FaHeart } from "react-icons/fa";
import { IoMdShareAlt } from "react-icons/io";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import RelatedCard from "../components/RelatedCard";
import api from "../supabase/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Ecom } from "../analytics";
import { Helmet } from "react-helmet-async";

// ---------- helpers ----------
const asBool = (v) =>
  v === true || v === "true" || v === 1 || v === "1" || v === "Y";
const get = (obj, keys, fallback = undefined) =>
  keys.reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj) ??
  fallback;

const IMAGE_BASE =
  process.env.REACT_APP_IMAGE_BASE || process.env.REACT_APP_API_BASE_URL || "";

const normalizeImageUrl = (u) => {
  if (!u || typeof u !== "string") return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("/")) return `${IMAGE_BASE}${u}`;
  return `${IMAGE_BASE}/${u}`;
};

const pickImageUrl = (img) => normalizeImageUrl(
  img?.image_url ||  // Add this first
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

// Carousel Arrows
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

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistSubmitting, setWishlistSubmitting] = useState(false);
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

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Color (string)
  const [selectedColor, setSelectedColor] = useState(null);

  // Check if product is upcoming
  const isUpcoming = product?.LaunchingDate
    ? new Date(product.LaunchingDate) > new Date()
    : false;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data: p } = await api.get(`/api/products/${id}`);
        setProduct(p);

        const colors = Array.isArray(p?.Colors)
          ? p.Colors
          : Array.isArray(p?.colors)
          ? p.colors
          : [];
        setSelectedColor(colors[0] || null);

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
            price: Number(p.Price) - (Number(p.DiscountPrice || 0) || 0),
            quantity: 1,
            color: colors[0] || null,
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
        setReviewLoading(true);
        setReviewError(null);
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
        setReviewError("Failed to load reviews.");
      } finally {
        setReviewLoading(false);
      }
    };

    const checkWishlist = async () => {
      if (!token || !userid) {
        setIsInWishlist(false);
        return;
      }
      try {
        const { data } = await api.get("/api/wishlist");
        const isWishlisted = (data.data || []).some(
          (item) => String(item.product_id) === String(id)
        );
        setIsInWishlist(isWishlisted);
      } catch (err) {
        console.error("Error checking wishlist:", err);
        toast.error(err.response?.data?.error || "Failed to check wishlist");
      }
    };

    fetchProduct();
    fetchReviews();
    checkWishlist();
  }, [id, token, userid]);

  // Reset slider on color change
  useEffect(() => {
    try {
      sliderRef.current?.slickGoTo(0);
    } catch {}
  }, [selectedColor]);

  const handleToggleWishlist = async () => {
    if (!token || !userid) {
      toast.error("Please log in to manage your wishlist");
      return;
    }
    if (wishlistSubmitting) return;

    try {
      setWishlistSubmitting(true);
      if (isInWishlist) {
        const { data } = await api.get("/api/wishlist");
        const item = (data.data || []).find(
          (it) => String(it.product_id) === String(id)
        );
        if (item) {
          await api.delete(`/api/wishlist/${item.id}`);
          setIsInWishlist(false);
          toast.success("Removed from wishlist");
          try {
            Ecom.removeFromWishlist({
              id: product.ProductId,
              title: product.Name,
              category: categoryName(product),
              price:
                Number(product.Price) -
                (Number(product.DiscountPrice || 0) || 0),
            });
          } catch {}
        }
      } else {
        const response = await api.post("/api/wishlist", { product_id: id });
        setIsInWishlist(true);
        toast.success(response.data.message || "Added to wishlist");
        try {
          Ecom.addToWishlist({
            id: product.ProductId,
            title: product.Name,
            category: categoryName(product),
            price:
              Number(product.Price) - (Number(product.DiscountPrice || 0) || 0),
          });
        } catch {}
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update wishlist");
    } finally {
      setWishlistSubmitting(false);
    }
  };

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
      const response = await api.post(`/api/reviews`, {
        rating: Number(reviewRating),
        productid: id,
        userid: parseInt(userid),
        comment: reviewText.trim(),
      });
      toast.dismiss();
      toast.success("Review submitted successfully!");
      setReviews([...reviews, response.data]);
      const newAvg =
        (avgRating * reviewCount + Number(reviewRating)) / (reviewCount + 1);
      setAvgRating(Number(newAvg.toFixed(1)));
      setReviewText("");
      setReviewRating(5);
    } catch (e2) {
      toast.dismiss();
      toast.error(e2.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    const colors = Array.isArray(product?.Colors)
      ? product.Colors
      : Array.isArray(product?.colors)
      ? product.colors
      : [];
    if (colors.length && !selectedColor) {
      toast.error("Please select a color.");
      return;
    }
    if (Number(product.Stock) === 0 || cartSubmitting) return;

    try {
      setCartSubmitting(true);
      const payload = {
        product_id: product.ProductId,
        quantity: qty,
      };
      await api.post("/api/cart", payload);

      toast.dismiss();
      toast.success(
        `${product.Name}${
          selectedColor ? ` (${selectedColor})` : ""
        } added to cart!`
      );

      // 🔔 notify navbar (optimistic bump by units)
      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { delta: qty } })
      );

      try {
        Ecom.addToCart({
          id: product.ProductId,
          title: product.Name,
          category: categoryName(product),
          price:
            Number(product.Price) - (Number(product.DiscountPrice || 0) || 0),
          quantity: qty,
          color: selectedColor || null,
        });
      } catch {}
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.error || "Failed to add to cart.");
    } finally {
      setCartSubmitting(false);
    }
  };

  // SEO & loading
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/products/${id}`;
  const descSource =
    product?.shortdescription ||
    product?.description ||
    "Discover product details at Shahu Mumbai.";
  const metaDescription = (typeof descSource === "string" ? descSource : "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);

  if (error) {
    return (
      <Layout>
        <Helmet>
          <title>Error - Shahu Mumbai</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-[#F1E7E5]">
          <p className="p-6 text-center text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return null; // Return nothing while data is loading
  }

  if (isUpcoming) {
    return (
      <Layout>
        <Helmet>
          <title>{`${product.Name} — Coming Soon | Shahu Mumbai`}</title>
          <meta
            name="description"
            content={`Coming soon: ${product.Name} from Shahu Mumbai.`}
          />
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={`${product.Name} — Coming Soon`} />
          <meta
            property="og:description"
            content="Launching soon at Shahu Mumbai."
          />
        </Helmet>

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
      </Layout>
    );
  }

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  const imgs = Array.isArray(product.product_images) ? product.product_images : [];

  const orderedImages = [
    ...imgs.filter((i) => asBool(i?.ishero)).map(pickImageUrl),
    ...imgs.filter((i) => !asBool(i?.ishero)).map(pickImageUrl),
  ].filter(Boolean);

  // Remove duplicates
  const images = [...new Set(orderedImages)];
  const hero =
    images[0] || `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;

  const hasDiscount =
    product.DiscountPrice &&
    Number(product.DiscountPrice) < Number(product.Price);
  const salePrice = hasDiscount
    ? Number(product.Price) - Number(product.DiscountPrice)
    : Number(product.Price);
  const mrp = Number(product.Price);
  const discountPercentage = hasDiscount
    ? Math.round(((mrp - salePrice) / mrp) * 100)
    : 0;

  const handleThumbClick = (idx) => sliderRef.current?.slickGoTo(idx);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.Name,
    description: metaDescription,
    image: images.length ? images : [hero],
    sku: String(product.ProductId),
    category: categoryName(product),
    ...(product.BrandDesigner && {
      brand: { "@type": "Brand", name: product.BrandDesigner },
    }),
    ...(Array.isArray(product.Colors) && product.Colors.length
      ? { color: product.Colors.join(", ") }
      : {}),
    additionalProperty: [
      ...(Array.isArray(product.Colors) && product.Colors.length
        ? [
            {
              "@type": "PropertyValue",
              name: "Color options",
              value: product.Colors.join(", "),
            },
          ]
        : []),
      {
        "@type": "PropertyValue",
        name: "Category",
        value: categoryName(product),
      },
    ],
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "INR",
      price: Number(salePrice).toFixed(2),
      availability:
        Number(product.Stock) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      ...(product.Stock != null
        ? {
            inventoryLevel: {
              "@type": "QuantitativeValue",
              value: Number(product.Stock),
            },
          }
        : {}),
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(avgRating),
            reviewCount: String(reviewCount),
          },
        }
      : {}),
    ...(Array.isArray(reviews) && reviews.length
      ? {
          review: reviews.slice(0, 3).map((r) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: r?.users?.full_name || r?.FullName || "Anonymous",
            },
            datePublished: r?.created_at || r?.CreatedAt || undefined,
            reviewBody: r?.comment || r?.Comment || "",
            reviewRating: {
              "@type": "Rating",
              ratingValue: String(r?.rating || r?.Rating || 0),
              bestRating: "5",
              worstRating: "1",
            },
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${baseUrl}/products`,
      },
      { "@type": "ListItem", position: 3, name: product.Name, item: canonical },
    ],
  };

  return (
    <Layout>
      <Helmet>
        <title>{`${product.Name} — Shahu Mumbai`}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta
          name="keywords"
          content={[
            product.Name,
            categoryName(product),
            "Shahu Mumbai",
            "handwoven sarees",
            "artisan-made",
            "sustainable luxury",
          ]
            .filter(Boolean)
            .join(", ")}
        />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en-IN" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Shahu Mumbai" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content={`${product.Name} — Shahu Mumbai`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={images[0] || hero} />
        <meta
          property="og:image:alt"
          content={`${product.Name} — product image`}
        />
        <meta name="product:price:amount" content={String(salePrice)} />
        <meta name="product:price:currency" content="INR" />
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      </Helmet>

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
            <li
              className="text-[#3E2C23] truncate max-w-[60%]"
              title={product.Name}
            >
              {product.Name}
            </li>
          </ol>
        </nav>

        {/* Main layout */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Thumbs */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex lg:flex-col gap-2 lg:sticky lg:top-24">
              {images.length ? (
                images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleThumbClick(idx)}
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
              )}
            </div>
          </div>

          {/* Center: Gallery */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-2 pb-8 relative">
              <Slider {...sliderSettings} ref={sliderRef}>
                {images.length ? (
                  images.map((img, index) => (
                    <div key={index} className="px-2">
                      <img
                        src={img}
                        alt={`${product.Name} view ${index + 1}`}
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
                    alt={`${product.Name}`}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                  />
                )}
              </Slider>

              {/* Share */}
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

          {/* Right: Buy Box */}
          <aside className="lg:col-span-4 order-3">
            <div className="lg:sticky lg:top-24 flex flex-col gap-4">
              <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-5">
                <h1 className="text-2xl font-bold text-[#6B4226] mb-1">
                  {product.Name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={avgRating} />
                  <span className="text-xs text-[#3E2C23]">
                    {avgRating}/5 • {reviewCount} review
                    {reviewCount === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Color selector */}
                <div className="mt-3">
                  <p className="text-sm italic text-[#A3B18A] mb-1">
                    Color: {selectedColor || "—"}
                  </p>

                  {Array.isArray(product.colors) && product.colors.length ? (
                    <div className="flex items-center gap-3">
                      {product.colors.map((c) => {
                        const isSelected = selectedColor === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            title={c}
                            aria-pressed={isSelected}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none ${
                              isSelected
                                ? "border-[#6B4226] ring-2 ring-[#6B4226]/25"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          >
                            <span className="sr-only">{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : Array.isArray(product.Colors) && product.Colors.length ? (
                    <div className="flex items-center gap-3">
                      {product.Colors.map((c) => {
                        const isSelected = selectedColor === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            title={c}
                            aria-pressed={isSelected}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none ${
                              isSelected
                                ? "border-[#6B4226] ring-2 ring-[#6B4226]/25"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          >
                            <span className="sr-only">{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm italic text-[#A3B18A]">—</p>
                  )}
                </div>

                <p className="text-sm italic text-[#A3B18A] mt-1">
                  Category: {categoryName(product)}
                </p>

                <div className="mt-4">
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-extrabold text-[#6B4226]">
                        ${salePrice.toFixed(2)}
                      </p>
                      <p className="text-base text-gray-500 line-through">
                        ${mrp.toFixed(2)}
                      </p>
                      <p className="text-base text-[#A3B18A] font-semibold">
                        {discountPercentage}% OFF
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-extrabold text-[#6B4226]">
                      ${mrp.toFixed(2)}
                    </p>
                  )}
                </div>

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

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button
                    className={`bg-black hover:bg-slate-600 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.Stock) === 0 || cartSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-label="Add this product to your shopping cart"
                    disabled={Number(product.Stock) === 0 || cartSubmitting}
                    onClick={handleAddToCart}
                  >
                    {cartSubmitting ? "Adding..." : "Add to Cart"}
                  </button>
                  <button
                    className={`bg-black hover:bg-slate-600 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.Stock) === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-label="Buy now"
                    disabled={Number(product.Stock) === 0}
                    onClick={() =>
                      console.log("Buy now", { id, qty, color: selectedColor })
                    }
                  >
                    Buy Now
                  </button>
                  {/* New Row: Wishlist + Waitlist */}
                  <div className="flex items-center gap-3">
                    {/* Wishlist Icon Button */}
                    <button
                      type="button"
                      className={` flex items-center justify-center w-12 h-12 rounded-md border border-[#D4A5A5] shadow transition ${
                        isInWishlist
                          ? "bg-[#D4A5A5] text-white"
                          : "bg-black hover:bg-slate-600 text-[#D4A5A5]"
                      } ${
                        wishlistSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      aria-label={
                        isInWishlist
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      onClick={handleToggleWishlist}
                      disabled={wishlistSubmitting}
                    >
                      <FaHeart size={20} />
                    </button>

                    {/* Waitlist Button */}
                    <button
                      type="button"
                      className="flex-1 bg-black hover:bg-slate-600 text-white px-4 py-3 rounded-md font-semibold shadow transition"
                      aria-label="Join waitlist"
                      onClick={() =>
                        console.log("Add to Waitlist", product.ProductId)
                      }
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

        {/* Description & Specs */}
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
                  <dt>Color</dt>
                  <dd className="font-medium">
                    {Array.isArray(product.colors) && product.colors.length
                      ? product.colors.join(", ")
                      : Array.isArray(product.Colors) && product.Colors.length
                      ? product.Colors.join(", ")
                      : "—"}
                  </dd>
                </div>
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

        {/* Reviews */}
        <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="lg:col-span-8">
              <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-3 xs:p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
                  <h2 className="text-lg xs:text-xl font-bold text-[#6B4226]">
                    Customer Reviews
                  </h2>
                  <div className="flex items-center gap-1 xs:gap-2">
                    <StarRating value={avgRating} />
                    <span className="text-xs xs:text-sm text-[#3E2C23]">
                      {avgRating}/5 • {reviewCount} review
                      {reviewCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {reviewLoading ? (
                  <p className="text-[#6B4226] text-sm xs:text-base">
                    Loading reviews…
                  </p>
                ) : reviewError ? (
                  <p className="text-red-500 text-sm xs:text-base">
                    {reviewError}
                  </p>
                ) : reviews.length === 0 ? (
                  <p className="text-[#3E2C23] text-sm xs:text-base">
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <ul className="space-y-2 xs:space-y-3 sm:space-y-4">
                    {reviews.map((r) => (
                      <li
                        key={
                          r.ReviewId ||
                          `${r.userid}-${r.productid}-${
                            r.CreatedAt || r.created_at || Math.random()
                          }`
                        }
                        className="border border-[#F1E7E5] rounded-lg p-3 xs:p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 xs:gap-2">
                            <StarRating
                              value={Number(r.Rating || r.rating) || 0}
                            />
                            <span className="text-xs xs:text-sm text-[#6B4226] font-semibold">
                              {r.FullName || r?.users?.full_name || "Anonymous"}
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
          </div>

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

        {/* Related Products */}
        <div className="mt-16 px-2 max-w-[1440px] mx-auto font-serif">
          <h2 className="text-2xl font-bold text-[#6B4226] mb-6 text-center">
            You May Also Like
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {relatedProducts.map((related) => {
              const rImgs = Array.isArray(related.product_images)
                ? related.product_images
                : [];
              const relatedOrdered = [
                ...rImgs
                  .filter((i) => asBool(i?.is_hero === "Y" ? true : i?.is_hero))
                  .map(pickImageUrl),
                ...rImgs
                  .filter(
                    (i) => !asBool(i?.is_hero === "Y" ? true : i?.is_hero)
                  )
                  .map(pickImageUrl),
              ].filter(Boolean);
              const relatedImage =
                relatedOrdered[0] || "/assets/images/placeholder.png";
              const relatedHasDiscount =
                related.DiscountPrice &&
                Number(related.DiscountPrice) < Number(related.Price);
              const relatedSalePrice = relatedHasDiscount
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
                      price: relatedSalePrice,
                      image: relatedImage,
                      category: categoryName(related),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
