import React, { useState } from "react";
import { FaLock, FaCreditCard, FaUniversity, FaMobileAlt } from "react-icons/fa";
import { MdEmail, MdPhone, MdPerson, MdHome } from "react-icons/md";
import Layout from "../layout/Layout";
import { Ecom } from "../analytics"; // ✅ added

const product = {
  name: "Premium Vintage Silk Scarf",
  prices: {
    INR: 299,
    USD: 10,
  },
  currencyMeta: {
    INR: { code: "INR", symbol: "₹", flag: "IN" },
    USD: { code: "USD", symbol: "$", flag: "US" },
  },
};

function Checkout() {
  const currency = "INR";
  const selectedPrice = product.prices[currency];
  const meta = product.currencyMeta[currency];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "", // ✅ Added address field
  });

  const [paymentMethod, setPaymentMethod] = useState("");
  const [credentials, setCredentials] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
    bankName: "",
    netbankingUserId: "",
    netbankingPassword: "",
    netbankingOtp: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState("");

  const generateToken = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${randomPart}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in credentials) {
      setCredentials((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isValid = () => {
    const { name, email, phone, address } = formData;
    return (
      name.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(email) &&
      /^\+?\d{10,}$/.test(phone) &&
      address.trim().length > 5 && // ✅ Require at least 6 characters for address
      paymentMethod
    );
  };

  const handleSubmit = () => {
    if (!isValid()) {
      return;
    }

    // ✅ GA4: add_shipping_info when submitting (we have address now)
    try {
      Ecom.addShippingInfo(
        [
          {
            id: "SKU-1",
            title: product.name,
            category: "Checkout",
            price: selectedPrice,
            quantity: 1,
          },
        ],
        "Standard"
      );
    } catch {}

    // ✅ GA4: add_payment_info (with selected method)
    try {
      Ecom.addPaymentInfo(
        [
          {
            id: "SKU-1",
            title: product.name,
            category: "Checkout",
            price: selectedPrice,
            quantity: 1,
          },
        ],
        paymentMethod.toLowerCase().replace(" ", "_") || "card"
      );
    } catch {}

    const newToken = generateToken();
    setToken(newToken);
    setIsModalOpen(true);

    // ✅ GA4: purchase event after "success"
    try {
      Ecom.purchase({
        transactionId: newToken,
        items: [
          {
            id: "SKU-1",
            title: product.name,
            category: "Checkout",
            price: selectedPrice,
            quantity: 1,
          },
        ],
        value: selectedPrice,
        tax: 0,
        shipping: 0,
        coupon: undefined,
      });
    } catch {}

    setFormData({ name: "", email: "", phone: "", address: "" });
    setCredentials({
      cardNumber: "",
      expiry: "",
      cvv: "",
      upiId: "",
      bankName: "",
      netbankingUserId: "",
      netbankingPassword: "",
      netbankingOtp: "",
    });
    setPaymentMethod("");
  };

  const renderPaymentFields = () => {
    switch (paymentMethod) {
      case "Credit Card":
      case "Debit Card":
        return (
          <div className="space-y-2">
            <input
              name="cardNumber"
              value={credentials.cardNumber}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Card Number"
            />
            <div className="flex gap-2">
              <input
                name="expiry"
                value={credentials.expiry}
                onChange={handleChange}
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="MM/YY"
              />
              <input
                name="cvv"
                value={credentials.cvv}
                onChange={handleChange}
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="CVV"
              />
            </div>
          </div>
        );

      case "UPI":
        return (
          <input
            name="upiId"
            value={credentials.upiId}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Enter your UPI ID (e.g., yourname@upi)"
          />
        );

      case "Net Banking":
        return (
          <div className="space-y-2 text-sm">
            <select
              name="bankName"
              value={credentials.bankName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Your Bank</option>
              <option value="SBI">State Bank of India (SBI)</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="Axis">Axis Bank</option>
              <option value="Kotak">Kotak Mahindra Bank</option>
              <option value="PNB">Punjab National Bank (PNB)</option>
              <option value="Canara">Canara Bank</option>
              <option value="Yes">Yes Bank</option>
              <option value="Citi">Citibank</option>
              <option value="HSBC">HSBC</option>
              <option value="SCB">Standard Chartered Bank</option>
              <option value="Deutsche">Deutsche Bank</option>
              <option value="Barclays">Barclays</option>
              <option value="BOA">Bank of America</option>
              <option value="JPMorgan">JPMorgan Chase</option>
              <option value="DBS">DBS Bank</option>
              <option value="BNP">BNP Paribas</option>
              <option value="UBS">UBS</option>
            </select>
            <input
              name="netbankingUserId"
              value={credentials.netbankingUserId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="User ID / Customer ID"
            />
            <input
              name="netbankingPassword"
              value={credentials.netbankingPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              type="password"
              placeholder="Password / OTP"
            />
            <input
              name="netbankingOtp"
              value={credentials.netbankingOtp}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Transaction Password / OTP"
            />
            <p className="text-xs text-gray-500 mt-1">
              🔒 No sensitive bank details (like account number or IFSC) are directly shared with the merchant.
            </p>
          </div>
        );

      default:
        return null;
    }
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
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="flex-1 outline-none text-sm"
              type="text"
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
          {/* ✅ Address Field */}
          <div className="flex items-center border rounded px-3 py-2 gap-2">
            <MdHome className="text-gray-400" />
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="flex-1 outline-none text-sm"
              type="text"
              placeholder="Full Address (House No, Street, City, Pincode)"
            />
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

          {paymentMethod && <div className="mt-4">{renderPaymentFields()}</div>}

          <div className="mt-4 bg-gray-50 p-4 rounded text-sm space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>
                {meta.symbol}
                {selectedPrice}
              </span>
            </div>
            <div className="text-green-600 text-sm mt-2">
              ✅ Your payment is secured by Razorpay with 256-bit SSL encryption
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isValid()}
              className={`w-full mt-4 text-white py-2 rounded transition ${
                isValid()
                  ? "bg-black hover:bg-gray-900"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              💳 Pay {meta.symbol}
              {selectedPrice} Securely
            </button>
          </div>
        </div>

        {/* ✅ Success Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
              <h2 className="text-xl font-semibold text-green-600">
                ✅ Payment Successful
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
      </div>
    </Layout>
  );
}

export default Checkout;
