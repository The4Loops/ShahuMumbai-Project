import React, { useState } from "react";
import { FaLock, FaCreditCard, FaUniversity, FaMobileAlt } from "react-icons/fa";
import { MdEmail, MdPhone, MdPerson, MdHome } from "react-icons/md";
import Layout from "../layout/Layout";
import { Ecom } from "../analytics";

const API = process.env.REACT_APP_API_BASE_URL;

async function loadRazorpay() {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}


const product = {
  id: 42, 
  name: "Premium Vintage Silk Scarf",
  prices: { INR: 299, USD: 10 },
  currencyMeta: {
    INR: { code: "INR", symbol: "₹", flag: "IN" },
    USD: { code: "USD", symbol: "$", flag: "US" },
  },
};

function Checkout() {
  const currency = "INR";
  const selectedPrice = product.prices[currency];
  const meta = product.currencyMeta[currency];

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState(""); // for UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState("");

  const generateToken = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${randomPart}`;
  };

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const isValid = () => {
    const { name, email, phone, address } = formData;
    return (
      name.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(email) &&
      /^\+?\d{10,}$/.test(phone) &&
      address.trim().length > 5 &&
      paymentMethod
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    // Analytics intent
    try {
      Ecom.addShippingInfo(
        [{ id: String(product.id), title: product.name, category: "Checkout", price: selectedPrice, quantity: 1 }],
        "Standard"
      );
      const pm = (paymentMethod || "Card").toLowerCase().replace(/\s+/g, "_");
      Ecom.addPaymentInfo(
        [{ id: String(product.id), title: product.name, category: "Checkout", price: selectedPrice, quantity: 1 }],
        pm || "card"
      );
    } catch {}

    const newToken = generateToken();
    setToken(newToken);

    // 1) Create pending order in your DB (server will recompute prices from products table)
    let orderNumber;
    try {
      const resp = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            anon_id: "web|guest",
          },
          items: [
            {
              product_id: product.id, // authoritative id
              product_title: product.name, // optional (audit)
              unit_price: selectedPrice,   // UI only; server ignores & uses DB price
              qty: 1,
            },
          ],
          currency: "INR",
          payment_method: (paymentMethod || "Card").toLowerCase().replace(/\s+/g, "_"),
          coupon: null,
          shipping_total: 0,
          tax_total: 0,
          discount_total: 0,
          status: "pending",
          payment_status: "pending",
          meta: { transaction_token: newToken },
        }),
      });

      const j = await resp.json();
      if (!resp.ok || !j.ok) {
        console.error("Checkout failed", j);
        alert("Something went wrong creating your order. Please try again.");
        return;
      }
      orderNumber = j.order_number;
    } catch (err) {
      console.error(err);
      alert("Network error during checkout (order create).");
      return;
    }

    // 2) Ask backend to create a Razorpay Order for this order_number
    try {
      const r = await fetch(`${API}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber }),
      });
      const rz = await r.json();
      if (!r.ok) {
        console.error("Razorpay order creation failed", rz);
        alert("Unable to start payment. Please try again.");
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) {
        alert("Razorpay failed to load");
        return;
      }

      // 3) Open Razorpay Checkout
      const options = {
        key: rz.key,
        order_id: rz.rzp.order_id,
        amount: rz.rzp.amount,
        currency: rz.rzp.currency,
        name: "Shahu",
        description: `Payment for ${orderNumber}`,
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: "#173F5F" },
        handler: async function (response) {
          // 4) Verify securely
          try {
            const v = await fetch(`${API}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const vr = await v.json();

            if (v.ok && vr.ok) {
              try {
                Ecom.purchase({
                  transactionId: orderNumber || newToken,
                  items: [{ id: String(product.id), title: product.name, category: "Checkout", price: selectedPrice, quantity: 1 }],
                  value: selectedPrice,
                  tax: 0,
                  shipping: 0,
                });
              } catch {}
              setIsModalOpen(true);
            } else {
              window.location.href = `/order/failed?order_id=${orderNumber}`;
            }
          } catch (e) {
            console.error(e);
            window.location.href = `/order/failed?order_id=${orderNumber}`;
          }
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      alert("Network error during payment start.");
      return;
    }

    // Optional cleanup
    setFormData({ name: "", email: "", phone: "", address: "" });
    setPaymentMethod("");
  };

  const paymentIcons = {
    "Credit Card": <FaCreditCard />,
    "Debit Card": <FaCreditCard />,
    UPI: <FaMobileAlt />,
    "Net Banking": <FaUniversity />,
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Customer Information */}
        <div className="border rounded-xl p-4 space-y-4 bg-white shadow-md">
          <h3 className="text-lg font-semibold mb-2">👤 Customer Information</h3>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdPerson className="text-gray-400" />
            <input name="name" value={formData.name} onChange={handleChange} className="flex-1 outline-none text-sm" placeholder="Full Name" />
          </div>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdEmail className="text-gray-400" />
            <input name="email" value={formData.email} onChange={handleChange} className="flex-1 outline-none text-sm" type="email" placeholder="Email Address" />
          </div>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdPhone className="text-gray-400" />
            <input name="phone" value={formData.phone} onChange={handleChange} className="flex-1 outline-none text-sm" type="tel" placeholder="+91 98765 43210" />
          </div>
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdHome className="text-gray-400" />
            <input name="address" value={formData.address} onChange={handleChange} className="flex-1 outline-none text-sm" placeholder="Full Address (House No, Street, City, Pincode)" />
          </div>
        </div>

        {/* Secure Payment */}
        <div className="border rounded-xl p-4 space-y-4 bg-white shadow-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <FaLock className="text-green-600" /> Secure Payment
          </h3>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            {["Credit Card", "Debit Card", "UPI", "Net Banking"].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`border rounded px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                  paymentMethod === method ? "bg-gray-200 font-bold" : ""
                }`}
              >
                {paymentIcons[method]} {method}
              </button>
            ))}
          </div>

          <div className="mt-4 bg-gray-50 p-4 rounded text-sm space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{meta.symbol}{selectedPrice}</span>
            </div>
            <div className="text-green-600 text-sm mt-2">
              Your payment is secured by Razorpay with 256-bit SSL encryption
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isValid()}
              className={`w-full mt-4 text-white py-2 rounded transition ${
                isValid() ? "bg-black hover:bg-gray-900" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              💳 Pay {meta.symbol}{selectedPrice} Securely
            </button>
          </div>
        </div>

        {/* Success Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
              <h2 className="text-xl font-semibold text-green-600">Payment Successful</h2>
              <p className="text-gray-700">Thank you for your purchase!</p>
              <p className="text-sm font-mono text-gray-600">
                🧾 Transaction Token: <strong>{token}</strong>
              </p>
              <button onClick={() => setIsModalOpen(false)} className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Checkout;
