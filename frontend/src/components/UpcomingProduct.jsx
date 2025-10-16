import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { toast } from "react-toastify";
import api from "../supabase/axios";
import placeholder from "../assets/products/coat.jpg";

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
  const [products, setProducts] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchUpcomingProducts = async () => {
      try {
        setLoading(true);
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

    fetchUpcomingProducts();
  }, []);

  // Open modal instead of directly joining
  const handleWaitlistClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  // Razorpay Payment Integration
  const confirmPayment = async () => {
    if (!selectedProduct) return;

    try {
      // Create order from backend
      const { data } = await api.post("/api/payment/create-order", {
        amount: (selectedProduct.price / 2) * 100, // 50% in cents (for USD)
        currency: "USD", // Changed to USD
      });

      const options = {
        key: "rzp_test_1234567890", // 🔑 Replace with your Razorpay Key ID
        amount: data.amount,
        currency: data.currency,
        name: "Vintage Store",
        description: `50% Payment for ${selectedProduct.name}`,
        order_id: data.id,
        handler: function (response) {
          toast.success("Payment Successful ✅");
          setWaitlist((prev) => [...prev, selectedProduct.id]);
          setShowModal(false);
          setSelectedProduct(null);

          // Save payment to backend (verification)
          api.post("/api/payment/verify", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            productId: selectedProduct.id,
          });
        },
        prefill: {
          name: "John Doe",
          email: "john@example.com",
          contact: "9876543210",
        },
        theme: {
          color: "#E3BDB4",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment failed, try again");
    }
  };

  const getHeroImage = (product) => {
    const heroImage = product.product_images?.find((img) => img.is_hero ==='Y' ? true : false);
    return heroImage?.image_url || product.product_images?.[0]?.image_url || placeholder;
  };

  const settings = {
    dots: true,
    infinite: products.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
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

      {(loading || products.length === 0) && !error ? (
        <Slider {...settings} className="max-w-7xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonSlide key={i} />
          ))}
        </Slider>
      ) : (
        <Slider {...settings} className="max-w-7xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="px-3">
              <div className="relative bg-white rounded-xl shadow-md overflow-hidden group">
                <img
                  src={getHeroImage(product)}
                  alt={product.Name}
                  className="w-full h-52 object-cover"
                />

                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
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

      {/* Vintage-Modern Payment Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#FAF3F0] border border-[#D9C5BC] p-6 rounded-2xl shadow-2xl w-96 relative animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-[#4B2C20] hover:text-[#2c1810] transition"
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-2xl font-serif text-[#4B2C20] mb-4">
              Confirm Your Spot
            </h2>

            {/* Product Info */}
            <div className="bg-white border border-[#E3BDB4] rounded-xl p-4 mb-4 shadow-sm">
              <p className="mb-2 text-[#4B2C20]">
                Product:{" "}
                <span className="font-semibold">{selectedProduct.Name}</span>
              </p>
              <p className="mb-2 text-[#4B2C20]">
                Price:{" "}
                <span className="font-semibold">${selectedProduct.Price}</span>
              </p>
              <p className="text-green-800 font-bold text-lg">
                Pay 50% Now: ${selectedProduct.Price / 2}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <button
                onClick={confirmPayment}
                className="bg-[#E3BDB4] text-[#4B2C20] px-5 py-2 rounded-lg font-medium shadow-md hover:bg-[#d3a99f] hover:shadow-lg transition"
              >
                Pay & Join
              </button>
              <button
                onClick={() => setShowModal(false)}
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