// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaLock } from "react-icons/fa";
import { MdEmail, MdPhone, MdPerson, MdHome } from "react-icons/md";
import Layout from "../layout/Layout";
import { Ecom } from "../analytics";
import { Helmet } from "react-helmet-async";
import api from "../supabase/axios";
import { jwtDecode } from "jwt-decode";
import { trackDB } from "../analytics-db";
import { useLocation } from "react-router-dom";
import { useCurrency } from "../supabase/CurrencyContext";

const API = process.env.REACT_APP_API_BASE_URL || "";

// ---- helpers ----
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(n || 0));

const finalUnitPrice = (p) => {
  const rawPrice = p?.Price ?? p?.price ?? 0;
  const rawDiscount = p?.DiscountPrice ?? p?.discountprice;
  return Number((rawDiscount != null && rawDiscount !== "" ? rawDiscount : rawPrice) || 0);
};

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

function Checkout() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // legacy modal (kept)
  const [token, setToken] = useState("");
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [errBanner, setErrBanner] = useState("");
  const [lineCurrency, setLineCurrency] = useState("INR");

  const [thankOpen, setThankOpen] = useState(false);
  const [thankOrderNo, setThankOrderNo] = useState("");
  const [emailNoted, setEmailNoted] = useState(false);

  const {
    currency: userCurrency = "INR",
    baseCurrency = "INR",
    convertFromINR,
  } = useCurrency() || {};

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const pageUrl = `${baseUrl}/checkout`;

  // Waitlist deposit state (from UpcomingCarousel / Waitlist)
  const location = useLocation();
  const waitlistState = location.state;
  const isWaitlistDeposit =
    !!waitlistState?.fromWaitlist && waitlistState?.mode === "waitlistDeposit";
  const waitlistProduct = isWaitlistDeposit ? waitlistState?.product : null;
  const waitlistEmail = isWaitlistDeposit ? waitlistState?.waitlistEmail : null;

  // decode logged-in user (for DB tracking)
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  let decodedUser = "";
  if (authToken) {
    try {
      decodedUser = jwtDecode(authToken);
    } catch {
      decodedUser = "";
    }
  }
  const userId = decodedUser?.id || null;

  // totals (INR)
  const totals = useMemo(() => {
    const lines = cart || [];
    const subtotal = lines.reduce((sum, l) => {
      const unit = finalUnitPrice(l?.product);
      const qty = Number(l?.quantity || 1);
      return sum + unit * qty;
    }, 0);
    return { subtotal, tax: 0, shipping: 0, total: subtotal };
  }, [cart]);

  // approximate display in user currency
  const approximateTotalDisplay =
    typeof convertFromINR === "function" && baseCurrency === "INR" && userCurrency !== "INR"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: userCurrency,
        }).format(convertFromINR(totals.total || 0))
      : null;

  // Prefill email when coming from waitlist
  useEffect(() => {
    if (isWaitlistDeposit && waitlistEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: waitlistEmail }));
    }
  }, [isWaitlistDeposit, waitlistEmail, formData.email]);

  // Load cart or create synthetic waitlist cart
  useEffect(() => {
    (async () => {
      if (!API) {
        setErrBanner("REACT_APP_API_BASE_URL is not configured in your frontend env.");
      }

      if (isWaitlistDeposit && waitlistProduct) {
        const unitPrice = Number(
          (waitlistProduct.depositAmount ?? waitlistProduct.fullPrice ?? 0).toFixed(2)
        );

        setCart([
          {
            product: {
              id: waitlistProduct.id,
              name: waitlistProduct.name,
              Price: unitPrice,
              DiscountPrice: null,
              currency: "INR",
            },
            quantity: 1,
          },
        ]);
        setLineCurrency("INR");
        setLoadingCart(false);
        return;
      }

      // Normal cart flow
      try {
        setLoadingCart(true);
        const response = await api.get(`${API}/api/cartById`);
        const data = response.data;
        setCart(Array.isArray(data) ? data : []);
        setLineCurrency(data?.[0]?.product?.currency || "INR");
      } catch (e) {
        console.error("Checkout: load cart failed", e);
        setErrBanner("Could not load your cart. Please go back to Cart and try again.");
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [isWaitlistDeposit, waitlistProduct]);

  const generateToken = () =>
    `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const isValid = () => {
    const { name, email, phone, address } = formData || {};
    return (
      String(name || "").trim().length > 0 &&
      /\S+@\S+\.\S+/.test(String(email || "")) &&
      /^\+?\d{10,14}$/.test(String(phone || "")) &&
      String(address || "").trim().length > 5 &&
      cart?.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    setErrBanner("");

    // Analytics: intent
    let gaItems = [];
    let totalValue = 0;
    try {
      gaItems = (cart || []).map((l) => ({
        id: l?.product?.id,
        title: l?.product?.name,
        category:
          l?.product?.categories?.[0]?.name ||
          l?.product?.categories?.name ||
          "Checkout",
        price: finalUnitPrice(l?.product),
        quantity: l?.quantity || 1,
        currency: "INR",
      }));
      totalValue = gaItems.reduce((s, i) => s + i.price * i.quantity, 0);

      Ecom.addShippingInfo(gaItems, "Standard");
      const pm = (paymentMethod || "Card").toLowerCase().replace(/\s+/g, "_");
      Ecom.addPaymentInfo(gaItems, pm);

      trackDB(
        "begin_checkout",
        {
          payment_method: pm,
          items_count: gaItems.length,
          value: totalValue,
          currency: "INR",
          source: isWaitlistDeposit ? "waitlist_checkout" : "checkout_page",
        },
        userId
      );
    } catch {
      // ignore analytics failure
    }

    const newToken = generateToken();
    setToken(newToken);

    if (!API) {
      alert("API base URL is not configured (REACT_APP_API_BASE_URL).");
      trackDB(
        "checkout_failed",
        {
          stage: "env",
          reason: "missing_API_base_url",
          value: totalValue,
          currency: "INR",
        },
        userId
      );
      return;
    }

    let validLines = [];
    let items = [];

    if (isWaitlistDeposit && waitlistProduct) {
      const unit = Number(
        (waitlistProduct.depositAmount ?? waitlistProduct.fullPrice ?? 0).toFixed(2)
      );
      const qty = 1;

      validLines = [
        {
          product: {
            id: waitlistProduct.id,
            name: waitlistProduct.name,
            Price: unit,
            DiscountPrice: null,
          },
          quantity: qty,
        },
      ];

      items = [
        {
          product_id: waitlistProduct.id,
          product_title: waitlistProduct.name,
          unit_price: unit,
          qty,
        },
      ];
    } else {
      // Normal cart checkout: reload authoritative cart from server
      let serverCart = [];
      try {
        const response = await api.get(`${API}/api/cartById`);
        serverCart = response.data || [];
      } catch (e) {
        console.error("Failed to reload cart:", e);
        alert("Could not load your cart. Please refresh and try again.");
        trackDB(
          "checkout_failed",
          {
            stage: "load_cart",
            reason: String(e?.message || e),
            value: totalValue,
            currency: "INR",
          },
          userId
        );
        return;
      }

      const invalid = [];
      validLines = serverCart.filter((ci) => {
        const p = ci?.product;
        const active =
          p?.is_active === 1 ||
          p?.is_active === "Y" ||
          p?.is_active === true ||
          p?.is_active === undefined;
        const qty = Number(ci?.quantity || 1);
        const okStock = p?.stock == null ? true : Number(p.stock) >= qty;
        if (!active || !okStock) {
          invalid.push({
            id: p?.id,
            name: p?.name,
            reason: !active ? "inactive" : "insufficient stock",
          });
          return false;
        }
        return true;
      });

      if (!validLines.length) {
        alert(
          invalid.length
            ? `Your cart has items that cannot be purchased:\n${invalid
                .map((i) => `• ${i.name} (${i.reason})`)
                .join("\n")}`
            : "Your cart is empty."
        );
        trackDB(
          "checkout_failed",
          {
            stage: "no_valid_items",
            invalid_items: invalid.map((i) => ({
              id: i.id,
              name: i.name,
              reason: i.reason,
            })),
            currency: "INR",
          },
          userId
        );
        return;
      }

      items = validLines
        .map((ci) => {
          const unit = finalUnitPrice(ci?.product);
          return {
            product_id: ci?.product?.id ?? ci?.product?.ProductId,
            product_title: ci?.product?.name,
            unit_price: Number(unit.toFixed(2)),
            qty: Number(ci?.quantity || 1),
          };
        })
        .filter((it) => Number.isInteger(it.product_id) && it.qty > 0);
    }

    if (!items.length) {
      alert("No purchasable items. Please update your cart.");
      trackDB(
        "checkout_failed",
        {
          stage: "no_purchasable_items",
          currency: "INR",
        },
        userId
      );
      return;
    }

    // -------------------------------------------------------------------
    // 1) CREATE ORDER
    // -------------------------------------------------------------------
    let orderNumber;

    if (isWaitlistDeposit && waitlistProduct) {
      try {
        const wlResp = await api.post(
          `${API}/api/waitlist/deposit-order`,
          {
            productId: waitlistProduct.id,
            email: formData.email,
          },
          authToken
            ? {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            : {}
        );

        const wlData = wlResp.data;
        if (!wlData?.ok || !wlData?.order_number) {
          console.error("Waitlist deposit order failed", wlData);
          alert("Could not create waitlist deposit order. Please try again.");
          trackDB(
            "checkout_failed",
            {
              stage: "waitlist_order_create",
              reason: wlData?.error || "order_not_ok",
              currency: "INR",
            },
            userId
          );
          return;
        }

        orderNumber = wlData.order_number;
      } catch (err) {
        console.error("Waitlist deposit order network error:", err);
        alert("Network error while creating waitlist deposit order. Please try again.");
        trackDB(
          "checkout_failed",
          {
            stage: "waitlist_order_create_network",
            reason: String(err?.message || err),
            currency: "INR",
          },
          userId
        );
        return;
      }
    } else {
      const baseMeta = {
        transaction_token: newToken,
        source: "checkout",
      };

      const data = JSON.stringify({
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          anon_id: "web|guest",
        },
        items,
        currency: "INR",
        payment_method: (paymentMethod || "Card").toLowerCase().replace(/\s+/g, "_"),
        shipping_total: 0,
        tax_total: 0,
        discount_total: 0,
        status: "pending",
        payment_status: "unpaid",
        meta: baseMeta,
      });

      try {
        const resp = await api.post(`${API}/api/checkout/order`, data);
        const text = resp.data;

        if (!text?.ok) {
          console.error("Checkout failed", text);
          if (text?.missing?.length)
            alert(
              `Order create failed: missing product IDs ${text.missing.join(", ")}`
            );
          else if (text?.error === "product_inactive")
            alert(
              "One of your cart items is inactive. Please remove it and try again."
            );
          else alert("Something went wrong creating your order. Please try again.");

          trackDB(
            "checkout_failed",
            {
              stage: "order_create",
              reason: text?.error || "order_not_ok",
              missing: text?.missing || [],
              currency: "INR",
            },
            userId
          );
          return;
        }
        orderNumber = text.order_number;
      } catch (err) {
        console.error("Order create network error:", err);
        alert("Network error during checkout (order create).");
        trackDB(
          "checkout_failed",
          {
            stage: "order_create_network",
            reason: String(err?.message || err),
            currency: "INR",
          },
          userId
        );
        return;
      }
    }

    // -------------------------------------------------------------------
    // 2) Create Razorpay order
    // -------------------------------------------------------------------
    let rz;
    try {
      const response = await api.post(`${API}/api/payments/create-order`, {
        order_number: orderNumber,
      });

      rz = response.data;

      if (!rz?.rzp?.order_id) {
        console.error("Razorpay order creation failed", rz);
        alert(
          `Unable to start payment: ${rz?.message || rz?.error || "Unknown error"}`
        );
        trackDB(
          "checkout_failed",
          {
            stage: "create_razorpay",
            reason: rz?.message || rz?.error || "no_rzp_order_id",
            currency: "INR",
          },
          userId
        );
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay failed to load. Check your network/CSP.");
        trackDB(
          "checkout_failed",
          {
            stage: "razorpay_load",
            reason: "script_load_failed",
            currency: "INR",
          },
          userId
        );
        return;
      }

      const options = {
        key: rz.key,
        order_id: rz.rzp.order_id,
        amount: rz.rzp.amount,
        currency: rz.rzp.currency,
        name: "Shahu",
        description: `Payment for ${orderNumber}`,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#173F5F" },
        redirect: false,
        handler: async (response) => {
          try {
            const v = await api.post(`${API}/api/payments/verify`, response);
            const vr = v.data;

            if (v.status === 200 && vr?.ok) {
              try {
                const gaItemsVerify = validLines.map((ci) => ({
                  id: ci?.product?.id,
                  title: ci?.product?.name,
                  category:
                    ci?.product?.categories?.[0]?.name ||
                    ci?.product?.categories?.name ||
                    "Checkout",
                  price: finalUnitPrice(ci?.product),
                  quantity: ci?.quantity || 1,
                  currency: "INR",
                }));
                const valueVerify = gaItemsVerify.reduce(
                  (s, i) => s + i.price * i.quantity,
                  0
                );

                const txId = vr.order_number || orderNumber || newToken;

                Ecom.purchase({
                  transactionId: txId,
                  items: gaItemsVerify,
                  value: valueVerify,
                  tax: 0,
                  shipping: 0,
                });

                trackDB(
                  "purchase",
                  {
                    transaction_id: txId,
                    items: gaItemsVerify.map((i) => ({
                      id: i.id,
                      title: i.title,
                      price: i.price,
                      quantity: i.quantity,
                    })),
                    items_count: gaItemsVerify.length,
                    value: valueVerify,
                    currency: "INR",
                    payment_id: response.razorpay_payment_id,
                    payment_order_id: response.razorpay_order_id,
                    source: isWaitlistDeposit
                      ? "waitlist_checkout"
                      : "checkout_page",
                  },
                  userId
                );
              } catch {
                // ignore analytics failure
              }

              setThankOrderNo(vr.order_number || orderNumber);
              setEmailNoted(!!vr.email_sent);
              setThankOpen(true);
            } else {
              setErrBanner(
                vr?.message ||
                  "Payment verification failed. Your card was not charged."
              );
              trackDB(
                "checkout_failed",
                {
                  stage: "verify",
                  reason: vr?.message || vr?.error || "verify_failed",
                  currency: "INR",
                },
                userId
              );
            }
          } catch (e) {
            console.error("Verify error:", e);
            setErrBanner(
              "Payment verification failed due to a network error. Please try again."
            );
            trackDB(
              "checkout_failed",
              {
                stage: "verify_exception",
                reason: String(e?.message || e),
                currency: "INR",
              },
              userId
            );
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay modal closed");
            trackDB(
              "checkout_failed",
              {
                stage: "razorpay_dismiss",
                reason: "user_closed_modal",
                currency: "INR",
              },
              userId
            );
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Payment start error:", err);
      alert("Network error during payment start.");
      trackDB(
        "checkout_failed",
        {
          stage: "payment_start",
          reason: String(err?.message || err),
          currency: "INR",
        },
        userId
      );
      return;
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Checkout — Shahu Mumbai</title>
        <meta
          name="description"
          content="Complete your purchase securely on Shahu Mumbai."
        />
        <link rel="canonical" href={pageUrl} />
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>

      {errBanner && (
        <div className="max-w-3xl mx-auto mt-4 p-3 text-sm rounded bg-yellow-100 text-yellow-800">
          {errBanner}
        </div>
      )}

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Customer Information */}
        <div className="border rounded-xl p-4 space-y-4 bg-white shadow-md">
          <h3 className="text-lg font-semibold mb-2">👤 Customer Information</h3>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdPerson className="text-gray-400" />
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="flex-1 outline-none text-sm"
              placeholder="Full Name"
            />
          </div>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdEmail className="text-gray-400" />
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="flex-1 outline-none text-sm"
              type="email"
              placeholder="Email Address"
            />
          </div>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdPhone className="text-gray-400" />
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="flex-1 outline-none text-sm"
              type="tel"
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdHome className="text-gray-400" />
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="flex-1 outline-none text-sm"
              placeholder="Full Address (House No, Street, City, Pincode)"
            />
          </div>
        </div>

        {/* Secure Payment */}
        <div className="border rounded-xl p-4 space-y-4 bg-white shadow-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <FaLock className="text-green-600" /> Secure Payment
          </h3>

          <div className="mt-4 bg-gray-50 p-4 rounded text-sm space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{fmtINR(totals.total)}</span>
            </div>

            {approximateTotalDisplay && (
              <p className="text-xs text-gray-600">
                Approx.{" "}
                <span className="font-semibold">{approximateTotalDisplay}</span> in
                your local currency. You will be charged {fmtINR(totals.total)} in INR.
              </p>
            )}

            <div className="text-green-600 text-sm mt-2">
              Your payment is secured by Razorpay with 256-bit SSL encryption
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isValid() || loadingCart}
              className={`w-full mt-4 text-white py-2 rounded transition ${
                !isValid() || loadingCart
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-900"
              }`}
            >
              {loadingCart
                ? "Loading your cart..."
                : `💳 Pay ${fmtINR(totals.total)} Securely`}
            </button>
          </div>
        </div>

        {/* legacy success modal (kept for now) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
              <h2 className="text-xl font-semibold text-green-600">
                Payment Successful
              </h2>
              <p className="text-gray-700">Thank you for your purchase!</p>
              <p className="text-sm font-mono text-gray-600">
                🧾 Transaction Token: <strong>{token}</strong>
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 🎉 Thank-you modal after verify */}
        {thankOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
              <h2 className="text-xl font-semibold text-green-600">
                Payment Successful
              </h2>
              <p className="text-gray-700">Your order has been placed.</p>
              <p className="text-sm font-mono text-gray-600">
                🧾 Order Number: <strong>{thankOrderNo}</strong>
              </p>
              <p className="text-xs text-gray-600">
                {emailNoted
                  ? "A confirmation email has been sent."
                  : "We’ll email your receipt shortly."}
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/myorder"
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  View Orders
                </a>
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
}

export default Checkout;
