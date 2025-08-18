import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoMdShareAlt } from "react-icons/io";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import RelatedCard from "../components/RelatedCard";
import api from "../supabase/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Ecom } from "../analytics"; // ✅ added

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const sliderRef = useRef();
  const token = localStorage.getItem("token");
  var decoded = "";
  if (token) {
    decoded = jwtDecode(token);
  }
  const userid = decoded?.id;
  const fullName = decoded?.fullname || "Anonymous";

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // New review form
  const [reviewName, setReviewName] = useState(fullName);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cartSubmitting, setCartSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productResponse = await api.get(`/api/products/${id}`);
        setProduct(productResponse.data);

        const relatedResponse = await api.get(
          `/api/products?category=${productResponse.data.categories?.name}&limit=8`
        );
        setRelatedProducts(
          relatedResponse.data.filter((p) => String(p.id) !== String(id))
        );

        document.title = `${productResponse.data.name} - YourBrand`;

        // ✅ GA4: view_item after product is fetched
        try {
          const p = productResponse.data;
          Ecom.viewItem({
            id: p.id,
            title: p.name,
            category: p?.categories?.name,
            price:
              Number(p.price) - (Number(p.discountprice || 0) || 0),
            quantity: 1,
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
        // Adjust to your API shape; expecting an array of {id, name, rating, comment, created_at}
        const res = await api.get(`/api/reviews/${id}`);
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setReviews(list);
        const count = list.length;
        const avg = count
          ? list.reduce((s, r) => s + Number(r.rating || 0), 0) / count
          : 0;
        setReviewCount(count);
        setAvgRating(Number(avg.toFixed(1)));
      } catch (e) {
        setReviewError("Failed to load reviews.");
      } finally {
        setReviewLoading(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

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
    } catch (e) {
      if (e.response?.status === 400) {
        toast.dismiss();
        toast.error(e.response?.data?.message || "Failed to submit review.");
      } else {
        toast.dismiss();
        toast.error("Failed to submit review." + e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (Number(product.stock) === 0 || cartSubmitting) return;
    try {
      setCartSubmitting(true);
      const response = await api.post("/api/cart", {
        user_id: userid,
        product_id: product.id,
        quantity: qty,
      });
      toast.dismiss();
      toast.success(`${product.name} added to cart!`);

      // ✅ GA4: add_to_cart after successful API
      try {
        Ecom.addToCart({
          id: product.id,
          title: product.name,
          category: product?.categories?.name,
          price:
            Number(product.price) - (Number(product.discountprice || 0) || 0),
          quantity: qty,
        });
      } catch {}
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.error || "Failed to add to cart.");
    } finally {
      setCartSubmitting(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-center text-[#6B4226]">Loading...</p>;
  }

  if (error || !product) {
    return (
      <p className="p-6 text-center text-red-500">
        {error || "Product not found"}
      </p>
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

  // Images (hero first)
  const images = product.product_images
    ? [
        ...product.product_images
          .filter((img) => img.is_hero)
          .map((img) => img.image_url),
        ...product.product_images
          .filter((img) => !img.is_hero)
          .map((img) => img.image_url),
      ]
    : [];

  // Pricing & discount: sale price is discountprice when present
  const hasDiscount =
    product.discountprice &&
    Number(product.discountprice) < Number(product.price);
  const salePrice = hasDiscount
    ? Number(product.price) - Number(product.discountprice)
    : Number(product.price);
  const mrp = Number(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((mrp - salePrice) / mrp) * 100)
    : 0;

  const handleThumbClick = (idx) => sliderRef.current?.slickGoTo(idx);

  const hero =
    images[0] || `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;

  return (
    <Layout>
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
              title={product.name}
            >
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main 3-column layout */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Thumbnails */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex lg:flex-col gap-3 lg:sticky lg:top-24">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbClick(idx)}
                  className="border-2 border-transparent hover:border-[#D4A5A5] rounded-md overflow-hidden w-20 h-20 bg-white"
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                    }}
                  />
                </button>
              ))}
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
                        alt={`${product.name} view ${index + 1}`}
                        className="h-[560px] w-full object-cover rounded-md border border-[#D4A5A5] shadow-sm bg-white"
                        onError={(e) => {
                          e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <img
                    src={hero}
                    alt={`${product.name}`}
                    className="h-[560px] w-full object-cover rounded-md"
                  />
                )}
              </Slider>

              {/* Share */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
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

          {/* Right: Buy Box (sticky) */}
          <aside className="lg:col-span-4 order-3">
            <div className="lg:sticky lg:top-24 flex flex-col gap-4">
              <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-5">
                <h1 className="text-2xl font-bold text-[#6B4226] mb-1">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={avgRating} />
                  <span className="text-xs text-[#3E2C23]">
                    {avgRating}/5 • {reviewCount} review
                    {reviewCount === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-sm italic text-[#A3B18A] mt-1">
                  Color: {product.color}
                </p>
                <p className="text-sm italic text-[#A3B18A]">
                  Category: {product.categories?.name || "N/A"}
                </p>

                <div className="mt-4">
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-extrabold text-[#6B4226]">
                        ₹{salePrice.toFixed(2)}
                      </p>
                      <p className="text-base text-gray-500 line-through">
                        ₹{mrp.toFixed(2)}
                      </p>
                      <p className="text-base text-[#A3B18A] font-semibold">
                        {discountPercentage}% OFF
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-extrabold text-[#6B4226]">
                      ₹{mrp.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <QuantitySelect
                    max={Math.min(10, Number(product.stock) || 10)}
                    value={qty}
                    onChange={setQty}
                  />
                  {Number(product.stock) > 0 ? (
                    <p className="text-sm text-[#A3B18A]">
                      In Stock: {product.stock}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">Out of Stock</p>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button
                    className={`bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.stock) === 0 || cartSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-label="Add this product to your shopping cart"
                    disabled={Number(product.stock) === 0 || cartSubmitting}
                    onClick={handleAddToCart}
                  >
                    {cartSubmitting ? "Adding..." : "Add to Cart"}
                  </button>
                  <button
                    className={`bg-[#6B4226] hover:opacity-90 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.stock) === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-label="Buy now"
                    disabled={Number(product.stock) === 0}
                    onClick={() => console.log("Buy now", { id, qty })}
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              {/* About this item */}
              <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-4">
                <h3 className="text-[#6B4226] font-semibold mb-2">
                  About this item
                </h3>
                <ul className="list-disc list-inside text-sm text-[#3E2C23] space-y-1">
                  {product.shortdescription ? (
                    product.shortdescription
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

        {/* Full description & details */}
        <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
              <h2 className="text-xl font-bold text-[#6B4226] mb-3">
                Product Description
              </h2>
              <p className="text-base text-[#3E2C23] leading-relaxed whitespace-pre-line">
                {product.description || "No additional description provided."}
              </p>
              <div className="mt-4 text-md text-[#6B4226]">
                Designer:{" "}
                <span className="font-semibold">{product.branddesigner}</span>
              </div>
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
                  <dd className="font-medium">{product.color || "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-[#F1E7E5] pb-2">
                  <dt>Category</dt>
                  <dd className="font-medium">
                    {product.categories?.name || "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Stock</dt>
                  <dd className="font-medium">
                    {Number(product.stock) > 0 ? product.stock : "Out of stock"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#6B4226]">
                  Customer Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <StarRating value={avgRating} />
                  <span className="text-sm text-[#3E2C23]">
                    {avgRating}/5 • {reviewCount} review
                    {reviewCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {reviewLoading ? (
                <p className="text-[#6B4226]">Loading reviews…</p>
              ) : reviewError ? (
                <p className="text-red-500">{reviewError}</p>
              ) : reviews.length === 0 ? (
                <p className="text-[#3E2C23]">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="border border-[#F1E7E5] rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating value={Number(r.rating) || 0} />
                          <span className="text-sm text-[#6B4226] font-semibold">
                            {r.users.full_name || "Anonymous"}
                          </span>
                        </div>
                        <time className="text-xs text-[#3E2C23] opacity-70">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString("en-IN")
                            : ""}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-[#3E2C23] leading-relaxed whitespace-pre-line">
                        {r.comment}
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
              const relatedHasDiscount =
                related.discountprice &&
                Number(related.discountprice) < Number(related.price);
              const relatedSalePrice = relatedHasDiscount
                ? Number(related.price)
                : Number(related.discountprice);
              const relatedImage =
                related.product_images?.find((img) => img.is_hero)?.image_url ||
                related.product_images?.[0]?.image_url ||
                "/assets/images/placeholder.png";
              return (
                <div key={related.id} className="w-[260px]">
                  <RelatedCard
                    product={{
                      id: related.id,
                      name: related.name,
                      price: relatedSalePrice,
                      image: relatedImage,
                      category: related.categories?.name || "N/A",
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
