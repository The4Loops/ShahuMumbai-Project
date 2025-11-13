// src/pages/ProductDetails.jsx
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
import { apiWithCurrency } from "../supabase/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Ecom } from "../analytics";
import { Helmet } from "react-helmet-async";
import { useCurrency } from "../supabase/CurrencyContext";
import { trackDB } from "../analytics-db"; // 🔹 DB tracking

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

// --- PRICE HELPERS (DB is INR; NEVER convert) ---
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

// --- Razorpay + API helpers (single-product checkout) ---
const API = process.env.REACT_APP_API_BASE_URL || "";

async function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return true;
  return new Promise((resolve) => {
    try {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    } catch {
      resolve(false);
    }
  });
}

const generateToken = () =>
  `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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
  // keep context usage for unrelated parts, but DO NOT use it for price formatting
  const { currency = "USD", loading: currencyLoading = true } = useCurrency() || {};
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Thank-you modal state
  const [thankOpen, setThankOpen] = useState(false);
  const [thankOrderNo, setThankOrderNo] = useState("");
  const [emailNoted, setEmailNoted] = useState(false);

  // Check if product is upcoming
  const isUpcoming = product?.LaunchingDate
    ? new Date(product.LaunchingDate) > new Date()
    : false;

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // NOTE: API returns INR numbers now; do not ask for currency conversion
      const api = apiWithCurrency("INR");
      const { data: p } = await api.get(`/api/products/${id}`);
      setProduct(p);

      const cat = categoryName(p);
      const { data: rel } = await api.get(
        `/api/products?category=${encodeURIComponent(cat)}&limit=8`
      );
      setRelatedProducts((rel || []).filter((rp) => String(rp.id) !== String(id)));

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
      setReviewLoading(true);
      setReviewError(null);
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
          try {
            Ecom.removeFromWishlist({
              id: product.ProductId,
              title: product.Name,
              category: categoryName(product),
              price: getSalePrice(product),
              currency: "INR",
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
            price: getSalePrice(product),
            currency: "INR",
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
      const api = apiWithCurrency("INR");
      const response = await api.post(`/api/reviews`, {
        rating: Number(reviewRating),
        productid: id,
        userid: parseInt(userid),
        comment: reviewText.trim(),
      });
      toast.dismiss();
      toast.success("Review submitted successfully!");
      fetchReviews();
    } catch (e2) {
      toast.dismiss();
      toast.error(e2.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (Number(product.Stock) === 0 || cartSubmitting) return;

    try {
      setCartSubmitting(true);
      const api = apiWithCurrency("INR");
      const payload = { product_id: product.ProductId, quantity: qty };
      await api.post("/api/cart", payload);

      toast.dismiss();
      toast.success(`${product.Name} added to cart!`);

      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { delta: qty } })
      );

      try {
        const price = getSalePrice(product);

        // GA e-com
        Ecom.addToCart({
          id: product.ProductId,
          title: product.Name,
          category: categoryName(product),
          price,
          quantity: qty,
          currency: "INR",
        });

        // 🔹 DB analytics: add_to_cart
        trackDB(
          "add_to_cart",
          {
            product_id: product.ProductId,
            title: product.Name,
            category: categoryName(product),
            price,
            quantity: qty,
            value: price * qty,
            source: "product_details_add_to_cart",
          },
          userid || null
        );
      } catch {}
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.error || "Failed to add to cart.");
    } finally {
      setCartSubmitting(false);
    }
  };

  // ---- BUY NOW (Single-product Razorpay) ----
  const handleBuyNow = async () => {
    if (!product) return;
    if (Number(product.Stock) === 0) {
      toast.dismiss();
      toast.error("This product is out of stock.");
      return;
    }
    if (!API) {
      toast.error("API base URL is not configured (REACT_APP_API_BASE_URL).");
      return;
    }

    try {
      setBuyNowSubmitting(true);

      const salePrice = getSalePrice(product);
      const quantity = Number(qty || 1);
      const items = [
        {
          product_id: product.ProductId,
          product_title: product.Name,
          unit_price: Number(Number(salePrice).toFixed(2)), // client hint; server recalcs
          qty: quantity,
        },
      ];

      // analytics intent
      try {
        Ecom.addPaymentInfo(
          [
            {
              id: product.ProductId,
              title: product.Name,
              category: categoryName(product),
              price: salePrice,
              quantity,
              currency: "INR",
            },
          ],
          "buy_now"
        );

        // 🔹 DB analytics: begin_checkout
        trackDB(
          "begin_checkout",
          {
            product_id: product.ProductId,
            title: product.Name,
            category: categoryName(product),
            price: salePrice,
            quantity,
            value: salePrice * quantity,
            source: "product_details_buy_now",
          },
          userid || null
        );
      } catch {}

      const transactionToken = generateToken();

      // 1) Create order in your app (INR end-to-end)
      const orderResp = await fetch(`${API}/api/checkout/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer: {
            name: fullName || "Guest",
            email: "",
            phone: "",
            address: "",
            anon_id: "web|guest",
          },
          items,
          currency: "INR",
          payment_method: "buy_now",
          shipping_total: 0,
          tax_total: 0,
          discount_total: 0,
          status: "pending",
          payment_status: "unpaid",
          meta: {
            transaction_token: transactionToken,
            source: "product_details_buy_now",
          },
        }),
      });

      const orderText = await orderResp.text();
      let orderJson;
      try {
        orderJson = JSON.parse(orderText);
      } catch {
        orderJson = { ok: false, error: "non_json_response", raw: orderText };
      }
      if (!orderResp.ok || !orderJson?.ok || !orderJson?.order_number) {
        console.error("Order create failed", orderJson);
        toast.error("Unable to create order. Please try again.");

        // 🔹 DB analytics: checkout_failed (order_create)
        trackDB(
          "checkout_failed",
          {
            stage: "order_create",
            reason: orderJson?.error || orderResp.status,
            product_id: product.ProductId,
            title: product.Name,
            value: salePrice * quantity,
          },
          userid || null
        );
        return;
      }
      const orderNumber = orderJson.order_number;

      // 2) Create Razorpay order
      const rpResp = await fetch(`${API}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_number: orderNumber }),
      });
      const rpText = await rpResp.text();
      let rpJson;
      try {
        rpJson = JSON.parse(rpText);
      } catch {
        rpJson = { error: "non_json_response", raw: rpText };
      }
      if (!rpResp.ok || !rpJson?.rzp?.order_id) {
        console.error("Razorpay order creation failed", rpJson);
        toast.error(
          `Unable to start payment: ${
            rpJson?.message || rpJson?.error || rpResp.status
          }`
        );

        // 🔹 DB analytics: checkout_failed (create_razorpay)
        trackDB(
          "checkout_failed",
          {
            stage: "create_razorpay",
            reason: rpJson?.message || rpJson?.error || rpResp.status,
            product_id: product.ProductId,
            title: product.Name,
            value: salePrice * quantity,
          },
          userid || null
        );
        return;
      }

      // 3) Open Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Razorpay failed to load. Check your network/CSP.");

        // 🔹 DB analytics: checkout_failed (razorpay_load)
        trackDB(
          "checkout_failed",
          {
            stage: "razorpay_load",
            reason: "script_load_failed",
            product_id: product.ProductId,
            title: product.Name,
            value: salePrice * quantity,
          },
          userid || null
        );
        return;
      }

      const options = {
        key: rpJson.key,
        order_id: rpJson.rzp.order_id,
        amount: rpJson.rzp.amount,
        currency: rpJson.rzp.currency,
        name: "Shahu",
        description: `Payment for ${orderNumber}`,
        prefill: { name: fullName || "Guest" },
        theme: { color: "#173F5F" },
        redirect: false,
        handler: async (response) => {
          try {
            const v = await fetch(`${API}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(response),
            });
            const vText = await v.text();
            let vr;
            try {
              vr = JSON.parse(vText);
            } catch {
              vr = { ok: false, error: "non_json_response", raw: vText };
            }

            if (v.ok && vr.ok) {
              try {
                const txId = vr.order_number || orderNumber || transactionToken;

                Ecom.purchase({
                  transactionId: txId,
                  items: [
                    {
                      id: product.ProductId,
                      title: product.Name,
                      category: categoryName(product),
                      price: salePrice,
                      quantity,
                      currency: "INR",
                    },
                  ],
                  value: salePrice * quantity,
                  tax: 0,
                  shipping: 0,
                });

                // 🔹 DB analytics: purchase
                trackDB(
                  "purchase",
                  {
                    transaction_id: txId,
                    product_id: product.ProductId,
                    title: product.Name,
                    category: categoryName(product),
                    price: salePrice,
                    quantity,
                    value: salePrice * quantity,
                    payment_id: response.razorpay_payment_id,
                    payment_order_id: response.razorpay_order_id,
                    source: "product_details_buy_now",
                  },
                  userid || null
                );
              } catch {}

              // 🎉 Thank-you modal (NO redirect)
              setThankOrderNo(vr.order_number || orderNumber);
              setEmailNoted(!!vr.email_sent);
              setThankOpen(true);
            } else {
              toast.error(vr?.message || "Payment verification failed");

              // 🔹 DB analytics: checkout_failed (verify)
              trackDB(
                "checkout_failed",
                {
                  stage: "verify",
                  reason: vr?.message || vr?.error || "verify_failed",
                  product_id: product.ProductId,
                  title: product.Name,
                  value: salePrice * quantity,
                },
                userid || null
              );
            }
          } catch (e) {
            console.error("Verify error:", e);
            toast.error("Payment verification failed");

            // 🔹 DB analytics: checkout_failed (verify_exception)
            trackDB(
              "checkout_failed",
              {
                stage: "verify_exception",
                reason: String(e?.message || e),
                product_id: product.ProductId,
                title: product.Name,
                value: salePrice * quantity,
              },
              userid || null
            );
          }
        },
        modal: { ondismiss: () => console.log("Razorpay modal closed") },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Buy Now error:", err);
      toast.error("Could not start payment. Please try again.");

      // 🔹 DB analytics: checkout_failed (client_error)
      try {
        const salePrice = getSalePrice(product);
        const quantity = Number(qty || 1);
        trackDB(
          "checkout_failed",
          {
            stage: "client_error",
            reason: String(err?.message || err),
            product_id: product.ProductId,
            title: product.Name,
            value: salePrice * quantity,
          },
          userid || null
        );
      } catch {}
    } finally {
      setBuyNowSubmitting(false);
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

  if (!product || currencyLoading) return null;

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
          <meta
            property="og:title"
            content={`${product.Name} — Coming Soon`}
          />
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

  const imgs = Array.isArray(product.product_images)
    ? product.product_images
    : [];
  const orderedImages = [
    ...imgs.filter((i) => asBool(i?.is_hero)).map(pickImageUrl),
    ...imgs.filter((i) => !asBool(i?.is_hero)).map(pickImageUrl),
  ].filter(Boolean);
  const images = [...new Set(orderedImages)];
  const hero =
    images[0] || `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;

  const hasDiscount =
    product.DiscountPrice &&
    Number(product.DiscountPrice) < Number(product.Price);
  const salePrice = getSalePrice(product);
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
    additionalProperty: [
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
              name:
                r?.users?.full_name || r?.FullName || "Anonymous",
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
      {
        "@type": "ListItem",
        position: 3,
        name: product.Name,
        item: canonical,
      },
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
        <meta
          property="og:title"
          content={`${product.Name} — Shahu Mumbai`}
        />
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

                <p className="text-sm italic text-[#A3B18A] mt-1">
                  Category: {categoryName(product)}
                </p>

                <div className="mt-4">
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-extrabold text-[#6B4226]">
                        {formatINR(salePrice)}
                      </p>
                      <p className="text-base text-gray-500 line-through">
                        {formatINR(mrp)}
                      </p>
                      <p className="text-base text-[#A3B18A] font-semibold">
                        {discountPercentage}% OFF
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-extrabold text-[#6B4226]">
                      {formatINR(mrp)}
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
                    disabled={
                      Number(product.Stock) === 0 || cartSubmitting
                    }
                    onClick={handleAddToCart}
                  >
                    {cartSubmitting ? "Adding..." : "Add to Cart"}
                  </button>

                  {/* BUY NOW → Razorpay */}
                  <button
                    className={`bg-black hover:bg-slate-600 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.Stock) === 0 || buyNowSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-label="Buy now"
                    disabled={
                      Number(product.Stock) === 0 || buyNowSubmitting
                    }
                    onClick={handleBuyNow}
                  >
                    {buyNowSubmitting ? "Starting Payment…" : "Buy Now"}
                  </button>

                  {/* Wishlist + Waitlist */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`flex items-center justify-center w-12 h-12 rounded-md border border-[#D4A5A5] shadow transition ${
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

        {/* Description & Specs */}
        <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
              <h2 className="text-xl font-bold text-[#6B4226] mb-3">
                Product Description
              </h2>
              <p className="text-base text-[#3E2C23] leading-relaxed whitespace-pre-line">
                {product.Description ||
                  "No additional description provided."}
              </p>
              {product.BrandDesigner && (
                <div className="mt-4 text-md text-[#6B4226]">
                  Designer:{" "}
                  <span className="font-semibold">
                    {product.BrandDesigner}
                  </span>
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
                  <dd className="font-medium">
                    {categoryName(product)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Stock</dt>
                  <dd className="font-medium">
                    {Number(product.Stock) > 0
                      ? product.Stock
                      : "Out of stock"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Reviews */}
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
                          r.CreatedAt ||
                          r.created_at ||
                          Math.random()
                        }`
                      }
                      className="border border-[#F1E7E5] rounded-lg p-3 xs:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 xs:gap-2">
                          <StarRating
                            value={
                              Number(r.Rating || r.rating) || 0
                            }
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
                onChange={(e) =>
                  setReviewRating(Number(e.target.value))
                }
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
                ...rImgs.filter((i) => asBool(i?.is_hero)).map(
                  pickImageUrl
                ),
                ...rImgs
                  .filter((i) => !asBool(i?.is_hero))
                  .map(pickImageUrl),
              ].filter(Boolean);
              const relatedImage =
                relatedOrdered[0] || "/assets/images/placeholder.png";
              const relatedSalePrice =
                Number(related.DiscountPrice) > 0 &&
                Number(related.DiscountPrice) <
                  Number(related.Price)
                  ? Number(related.Price) -
                    Number(related.DiscountPrice)
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
                      currency: "INR",
                      image: relatedImage,
                      category: categoryName(related),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 🎉 Thank-you modal */}
        {thankOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
              <h2 className="text-xl font-semibold text-green-600">
                Payment Successful
              </h2>
              <p className="text-gray-700">
                Your order has been placed.
              </p>
              <p className="text-sm font-mono text-gray-600">
                🧾 Order Number:{" "}
                <strong>{thankOrderNo}</strong>
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
    </Layout>
  );
};

export default ProductDetails;
