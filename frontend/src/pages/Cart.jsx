// src/pages/Cart.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTrashAlt } from "react-icons/fa";
import { LuShieldCheck, LuTruck, LuRotateCcw } from "react-icons/lu";
import Layout from "../layout/Layout";
import { useNavigate } from "react-router-dom";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { Ecom } from "../analytics";
import { Helmet } from "react-helmet-async";
import { useCurrency } from "../supabase/CurrencyContext";
import { useLoading } from "../context/LoadingContext";

const categoryColors = {
  Accessories: "bg-yellow-50",
  Bags: "bg-rose-50",
  Jewelry: "bg-indigo-50",
};

/* ------------------------------------------------------------------ */
/*                     SKELETON ITEM (shown while loading)            */
/* ------------------------------------------------------------------ */
const CartItemSkeleton = () => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start gap-4 animate-pulse">
    <div className="flex gap-4">
      <div className="w-24 h-24 bg-gray-200 rounded-lg" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-8" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="h-5 bg-gray-200 rounded w-20" />
      <div className="h-5 w-5 bg-gray-200 rounded-full" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
function Cart() {
  const { setLoading } = useLoading();
  const {
    currency = "INR",
    baseCurrency = "INR",
    convertFromINR,
    loading: currencyLoading = true,
  } = useCurrency() || {};

  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLocalLoading] = useState(true);
  const navigate = useNavigate();

  // Helper: treat item.price & tax as INR, convert only here
  const formatDisplayPrice = (amountInBase, displayCurrency) => {
    const base = Number(amountInBase || 0);
    const converted =
      typeof convertFromINR === "function" && baseCurrency === "INR"
        ? convertFromINR(base)
        : base;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: displayCurrency || currency || baseCurrency || "INR",
    }).format(converted);
  };

  useEffect(() => {
    const fetchCartData = async () => {
      if (currencyLoading) return;

      setLoading(true);
      setLocalLoading(true);
      try {
        const response = await api.get("/api/cartById");

        const formattedItems = (response.data || []).map((item) => {
          const finalPriceINR =
            Number(item.product.price || 0) - Number(item.product.discountprice || 0);
          const hasDiscount = !!item.product.discountprice;

          return {
            id: item.id,
            title: item.product.name,
            category:
              item.product.categories?.[0]?.name ||
              item.product.categories?.name ||
              "Accessories",
            // Treat as INR internally
            priceINR: finalPriceINR,
            oldPriceINR: hasDiscount ? Number(item.product.price || 0) : null,
            quantity: item.quantity,
            inStock: item.product.stock > 0,
            currency: item.product.currency || "INR",
            discount: hasDiscount
              ? Math.round(
                  (Number(item.product.discountprice || 0) /
                    Number(item.product.price || 1)) * 100
                )
              : null,
            image: item.product.product_images.find((img) => img.is_hero)?.image_url,
          };
        });

        setCartItems(formattedItems);

        window.dispatchEvent(
          new CustomEvent("cart:updated", {
            detail: { absolute: formattedItems.length },
          })
        );

        if (formattedItems.length) {
          Ecom.viewCart(
            formattedItems.map((i) => ({
              id: i.id,
              title: i.title,
              category: i.category,
              price: i.priceINR,
              quantity: i.quantity,
              currency: "INR",
            })),
            formattedItems.reduce((a, i) => a + i.priceINR * i.quantity, 0),
            "INR"
          );
        }
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to load cart. Please try again.");
      } finally {
        setLoading(false);
        setLocalLoading(false);
      }
    };

    fetchCartData();
  }, [currency, currencyLoading, setLoading]);

  const handleQuantityChange = async (id, delta) => {
    try {
      const item = cartItems.find((item) => item.id === id);
      const newQuantity = Math.max(1, item.quantity + delta);

      await api.put(`/api/cart/${id}`, { quantity: newQuantity });

      setCartItems((items) =>
        items.map((it) => (it.id === id ? { ...it, quantity: newQuantity } : it))
      );

      Ecom.addToCart({
        ...item,
        quantity: newQuantity,
        id,
        price: item.priceINR,
        currency: "INR",
      });
      toast.dismiss();
      toast.success("Quantity updated!");

      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { delta: 0 } }));
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to update quantity.");
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/api/cart/${id}`);
      const removed = cartItems.find((it) => it.id === id);
      setCartItems((items) => items.filter((item) => item.id !== id));
      if (removed)
        Ecom.removeFromCart({
          ...removed,
          price: removed.priceINR,
          currency: "INR",
        });
      toast.dismiss();
      toast.success("Item removed from cart!");

      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { delta: -1 } }));
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to remove item.");
    }
  };

  // ---- totals in INR ----
  const subtotalINR = cartItems.reduce(
    (acc, item) => acc + item.priceINR * item.quantity,
    0
  );

  // Flat tax in INR (placeholder) – adjust as needed
  const taxINR = cartItems.length > 0 ? 36.08 : 0;
  const totalINR = subtotalINR + taxINR;

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const pageUrl = `${baseUrl}/cart`;

  const cartJsonLd = {
    "@context": "https://schema.org",
    "@type": "Order",
    orderStatus: "https://schema.org/OrderProcessing",
    merchant: { "@type": "Organization", name: "Shahu Mumbai" },
    potentialAction: {
      "@type": "Action",
      name: "Proceed to Checkout",
      target: `${baseUrl}/checkout`,
    },
    orderItem: cartItems.map((item) => ({
      "@type": "OrderItem",
      orderedItem: {
        "@type": "Product",
        name: item.title,
        image: item.image,
        sku: String(item.id),
        offers: {
          "@type": "Offer",
          price: item.priceINR.toFixed(2),
          priceCurrency: "INR",
        },
      },
      quantity: item.quantity,
    })),
  };

  if (currencyLoading) return null;

  return (
    <Layout>
      <Helmet>
        <title>Shopping Cart — Shahu Mumbai</title>
        <meta
          name="description"
          content="Review items in your Shahu Mumbai cart and proceed to secure checkout."
        />
        <link rel="canonical" href={pageUrl} />
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shopping Cart — Shahu Mumbai" />
        <meta property="og:description" content="Secure cart and checkout." />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${baseUrl}/og/cart.jpg`} />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify(cartJsonLd)}</script>
      </Helmet>

      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto bg-[#F1E7E5] min-h-screen">
        <h2 className="text-3xl font-bold mb-6 text-center">Shopping Cart</h2>

        {loading ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CartItemSkeleton key={i} />
              ))}
            </div>
            <div className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-xl shadow-lg animate-pulse">
              <div className="h-7 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
              <div className="h-10 bg-gray-200 rounded mt-6 w-full" />
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center text-gray-500">Your cart is empty</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-6">
              {cartItems.map((item, index) => {
                const lineSubtotalINR = item.priceINR * item.quantity;
                return (
                  <motion.div
                    key={item.id}
                    className={`${
                      categoryColors[item.category] || "bg-white"
                    } p-4 sm:p-6 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start gap-4`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex gap-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          {item.category}
                        </p>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span className="font-semibold">
                            {formatDisplayPrice(item.priceINR, currency)}
                          </span>
                          {item.oldPriceINR && (
                            <span className="line-through text-gray-400">
                              {formatDisplayPrice(item.oldPriceINR, currency)}
                            </span>
                          )}
                          {item.discount && (
                            <span className="text-white bg-pink-500 px-2 py-0.5 text-xs rounded-full">
                              {item.discount}%
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <span className="text-gray-700 font-medium text-md">
                        {formatDisplayPrice(lineSubtotalINR, currency)}
                      </span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <motion.div
              className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-xl shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-xl font-bold mb-4">Order Summary</h4>

              <div className="mb-4">
                <label
                  htmlFor="promo"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="promo"
                    placeholder="Enter code"
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
                    onClick={() => {
                      try {
                        window.gtag?.("event", "apply_promotion", {
                          coupon: promoCode || undefined,
                        });
                      } catch {}
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatDisplayPrice(subtotalINR, currency)}</span>
                </div>
                {/* <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-500 font-medium">Free</span>
                </div> */}
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatDisplayPrice(taxINR, currency)}</span>
                </div>
              </div>

              <hr className="my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatDisplayPrice(totalINR, currency)}</span>
              </div>

              <p className="text-[11px] text-gray-500 mt-1">
                All payments are processed in INR via Razorpay. Amounts shown in your
                currency are approximate.
              </p>

              <button
                onClick={() => {
                  try {
                    const gaItems = cartItems.map((i) => ({
                      id: i.id,
                      title: i.title,
                      category: i.category,
                      price: i.priceINR,
                      quantity: i.quantity,
                      currency: "INR",
                    }));
                    Ecom.beginCheckout(gaItems, subtotalINR, "INR");
                  } catch {}
                  navigate("/checkout");
                }}
                className="mt-6 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Proceed to Checkout
              </button>
              <p className="text-center text-sm text-gray-500 mt-2">
                Estimated delivery in 3–5 business days
              </p>
            </motion.div>
          </div>
        )}

        {/* Feature Banner */}
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gray-100 rounded-xl px-4 py-6 sm:px-8 flex flex-col sm:flex-row justify-around items-center text-center gap-6"
        >
          <div className="flex flex-col items-center gap-2">
            <LuShieldCheck className="text-green-600 text-2xl" />
            <p className="font-medium text-sm">Secure Checkout</p>
          </div>
          {/* <div className="flex flex-col items-center gap-2">
            <LuTruck className="text-blue-600 text-2xl" />
            <p className="font-medium text-sm">
              Free Shipping Over {formatDisplayPrice(1000, currency)}
            </p>
          </div> */}
          <div className="flex flex-col items-center gap-2">
            <LuRotateCcw className="text-purple-600 text-2xl" />
            <p className="font-medium text-sm">2-Day Returns</p>
          </div>
        </motion.div> 
      </div>
    </Layout>
  );
}

export default Cart;
