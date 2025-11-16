// UpcomingCarousel.jsx
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; // ← ONLY this one
import { toast } from "react-toastify";
import { apiWithCurrency } from "../supabase/axios";
import placeholder from "../assets/products/coat.jpg";
import { useCurrency } from "../supabase/CurrencyContext";
import { useNavigate } from "react-router-dom"; // 🔹 NEW

// react-icons
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

function UpcomingCarousel() {
  const { currency = "USD", loading: currencyLoading = true } = useCurrency() || {};
  const [products, setProducts] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const navigate = useNavigate(); // 🔹 for redirecting to /checkout

  useEffect(() => {
    const fetchUpcomingProducts = async () => {
      try {
        setLoading(true);
        const api = apiWithCurrency(currency);
        const { data } = await api.get("/api/products/upcomingProducts");
        setProducts(data.products || []);
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to fetch upcoming products";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (!currencyLoading) {
      fetchUpcomingProducts();
    }
  }, [currency, currencyLoading]);

  // Open modal instead of directly joining
  const handleWaitlistClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  // 🔹 NEW: hand over to Checkout as a "waitlist deposit" instead of calling /api/payment/*
  const confirmPayment = () => {
    if (!selectedProduct) return;

    // Normalize / map product for Checkout
    const mappedProduct = {
      id: selectedProduct.ProductId ?? selectedProduct.id,
      name: selectedProduct.Name ?? selectedProduct.name,
      fullPrice: Number(selectedProduct.Price || 0),
      depositAmount: Number(selectedProduct.Price || 0) / 2,
    };

    if (!mappedProduct.id || !mappedProduct.fullPrice) {
      toast.error("Unable to start waitlist checkout for this product.");
      return;
    }

    // Optional: prefill email from localStorage (same as Waitlist page)
    const waitlistEmail =
      (typeof window !== "undefined" && localStorage.getItem("waitlistEmail")) || "";

    // Keep a local "in waitlist" marker so the button text changes
    setWaitlist((prev) =>
      prev.includes(mappedProduct.id) ? prev : [...prev, mappedProduct.id]
    );

    // Optional: store in localStorage for resilience on refresh
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "waitlistCheckout",
          JSON.stringify({
            fromWaitlist: true,
            mode: "waitlistDeposit",
            product: mappedProduct,
            waitlistEmail: waitlistEmail || null,
          })
        );
      }
    } catch {
      // ignore storage errors
    }

    // 🔹 Navigate to Checkout with state – Checkout.jsx already knows how to handle this
    navigate("/checkout", {
      state: {
        fromWaitlist: true,
        mode: "waitlistDeposit",
        product: mappedProduct,
        waitlistEmail: waitlistEmail || null,
      },
    });

    // Close modal
    setShowModal(false);
    setSelectedProduct(null);
  };

  const getHeroImage = (product) => {
    const heroImage = product.product_images?.find((img) => img.is_hero);
    return heroImage?.image_url || product.product_images?.[0]?.image_url || placeholder;
  };

  const formatPrice = (value, currencyCode) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(value);
  };

  // ---- Custom Arrows with react-icons ----
  const PrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-xl transition-all hover:scale-110"
      style={{ left: "-20px" }}
      aria-label="Previous slide"
    >
      <FiChevronLeft className="w-6 h-6 text-[#4B2C20]" />
    </button>
  );

  const NextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-xl transition-all hover:scale-110"
      style={{ right: "-20px" }}
      aria-label="Next slide"
    >
      <FiChevronRight className="w-6 h-6 text-[#4B2C20]" />
    </button>
  );

  const settings = {
    dots: true,
    infinite: products.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  // Skeleton for loading state
  const SkeletonSlide = () => (
    <div className="px-3">
      <div className="relative bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="w-full h-52 bg-[#F1E7E5]/50 rounded-t-xl"></div>
        <div className="p-4">
          <div className="h-6 bg-[#F1E7E5]/50 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-[#F1E7E5]/50 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-16 px-6 bg-[#F1E7E5] text-center relative">
      <h2 className="text-3xl font-bold mb-6 text-[#4B2C20]">
        Upcoming Products
      </h2>

      {(loading || currencyLoading || products.length === 0) && !error ? (
        <Slider {...settings} className="max-w-7xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonSlide key={i} />
          ))}
        </Slider>
      ) : (
        <Slider {...settings} className="max-w-7xl mx-auto">
          {products.map((product) => (
            <div key={product.ProductId} className="px-3">
              <div className="relative bg-white rounded-xl shadow-md overflow-hidden group">
                <img
                  src={getHeroImage(product)}
                  alt={product.Name}
                  className="w-full h-52 object-cover"
                />

                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                  <h3 className="text-lg font-semibold mb-2">{product.Name}</h3>
                  <p className="mb-3 text-sm">
                    Launching on: {formatDateTime(product.LaunchingDate)}
                  </p>
                  <button
                    onClick={() => handleWaitlistClick(product)}
                    className="bg-[#E3BDB4] text-[#4B2C20] px-4 py-2 rounded-lg font-medium hover:bg-[#d3a99f] transition"
                    disabled={waitlist.includes(product.ProductId)}
                  >
                    {waitlist.includes(product.ProductId)
                      ? "In Waitlist"
                      : "Join Waitlist"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      )}

      {/* Waitlist / Deposit Modal (no direct Razorpay here anymore) */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FAF3F0] border border-[#D9C5BC] p-6 rounded-2xl shadow-2xl w-96 relative animate-fadeIn">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedProduct(null);
              }}
              className="absolute top-3 right-3 text-[#4B2C20] hover:text-[#2c1810] transition"
            >
              X
            </button>

            <h2 className="text-2xl font-serif text-[#4B2C20] mb-4">
              Confirm Your Spot
            </h2>

            <div className="bg-white border border-[#E3BDB4] rounded-xl p-4 mb-4 shadow-sm">
              <p className="mb-2 text-[#4B2C20]">
                Product:{" "}
                <span className="font-semibold">{selectedProduct.Name}</span>
              </p>
              <p className="mb-2 text-[#4B2C20]">
                Price:{" "}
                <span className="font-semibold">
                  {formatPrice(
                    selectedProduct.Price,
                    selectedProduct.currency || currency
                  )}
                </span>
              </p>
              <p className="text-green-800 font-bold text-lg">
                Pay 50% Now:{" "}
                {formatPrice(
                  selectedProduct.Price / 2,
                  selectedProduct.currency || currency
                )}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={confirmPayment}
                className="bg-[#E3BDB4] text-[#4B2C20] px-5 py-2 rounded-lg font-medium shadow-md hover:bg-[#d3a99f] hover:shadow-lg transition"
              >
                Pay & Join
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                }}
                className="bg-[#4B2C20] text-white px-5 py-2 rounded-lg font-medium shadow-md hover:bg-[#2c1810] hover:shadow-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default UpcomingCarousel;
