// src/pages/MyOrders.jsx
import React, { useState, useEffect } from "react";
import {
  FaHatCowboy,
  FaShoppingBag,
  FaShoePrints,
  FaGlasses,
  FaGem,
  FaTshirt,
  FaQuestion,
  FaFeatherAlt,
} from "react-icons/fa";
import Layout from "../layout/Layout";
import { Helmet } from "react-helmet-async";
import api from "../supabase/axios"; // ✅ use your axios wrapper

// Icon + color styling per item type
const getItemIcon = (name) => {
  name = name.toLowerCase();
  if (name.includes("scarf")) return { icon: <FaFeatherAlt />, color: "bg-pink-100 text-[#EF4E9C]" };
  if (name.includes("bag")) return { icon: <FaShoppingBag />, color: "bg-yellow-100 text-yellow-600" };
  if (name.includes("boots")) return { icon: <FaShoePrints />, color: "bg-gray-200 text-gray-700" };
  if (name.includes("hat") || name.includes("fedora")) return { icon: <FaHatCowboy />, color: "bg-green-100 text-green-700" };
  if (name.includes("sunglasses") || name.includes("glasses")) return { icon: <FaGlasses />, color: "bg-blue-100 text-blue-600" };
  if (name.includes("dress") || name.includes("shirt")) return { icon: <FaTshirt />, color: "bg-indigo-100 text-indigo-600" };
  if (name.includes("brooch") || name.includes("pearl")) return { icon: <FaGem />, color: "bg-purple-100 text-purple-600" };
  return { icon: <FaQuestion />, color: "bg-gray-100 text-gray-600" };
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch orders dynamically
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/orders/user");
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleEmailInvoice = (order) => {
    const invoiceText = `
Invoice for Order ${order.id}
-----------------------------
Date: ${order.placed_at}
Customer: ${order.customer?.name}
Email: ${order.customer?.email}
Address: ${order.customer?.address}
Payment: ${order.customer?.payment}

Items:
${order.items
  ?.map((item) => `• ${item.quantity}x ${item.product_name} - $${(item.unit_price * item.quantity).toFixed(2)}`)
  .join("\n")}

Subtotal: $${order.subtotal?.toFixed(2)}
Shipping: ${order.shipping > 0 ? `$${order.shipping}` : "Free"}
Tax: $${order.tax?.toFixed(2)}
Total: $${(order.subtotal + order.shipping + order.tax).toFixed(2)}

Tracking:
${order.tracking?.carrier} - ${order.tracking?.trackingNumber}
Expected Delivery: ${order.tracking?.expectedDelivery}
    `;
    alert(`Invoice sent to ${order.customer?.email}\n\n${invoiceText}`);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return null; // Handle null or undefined values
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filteredOrders = sortedOrders.filter((order) =>
    order.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/myorder`;

  return (
    <Layout>
      <Helmet>
        <title>My Orders — Shahu Mumbai</title>
        <meta name="description" content="View your recent orders, invoices, and tracking details." />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="My Orders — Shahu Mumbai" />
        <meta property="og:description" content="Private order history page for customers." />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="p-4 md:p-6 bg-[#F1E7E5] min-h-screen">
        <h1 className="text-2xl font-semibold mb-4 text-[#1C1C1C]">My Orders</h1>

        <input
          type="text"
          placeholder="Search orders by ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-[#E5E5E5] px-3 py-2 rounded-md mb-6 w-full max-w-md bg-white text-[#1C1C1C]"
        />

        {loading ? (
          <p className="text-gray-600">Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-600">No orders found.</p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-[#E5E5E5] rounded-lg mb-6 overflow-hidden bg-white"
            >
              <div className="p-4 bg-[#f9f2ea] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <p className="font-medium text-[#1C1C1C]">Order ID: {order.id}</p>
                  <p className="text-sm text-[#666666]">
                    Date: {formatDateTime(order.placed_at)} | Delivery: {formatDateTime(order.delivered_at) || 'Not Delivered'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setSelectedOrderId(selectedOrderId === order.id ? null : order.id)
                    }
                    className="text-[#EF4E9C] hover:underline text-sm"
                  >
                    {selectedOrderId === order.id ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => handleEmailInvoice(order)}
                    className="text-[#3DC79B] hover:underline text-sm"
                  >
                    📧 Email Invoice
                  </button>
                </div>
              </div>

              {selectedOrderId === order.id && (
                <div className="p-4 bg-white space-y-4">
                  {order.items?.map((item, index) => {
                    const { icon, color } = getItemIcon(item.product_name);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 bg-[#FFF4E8] p-3 rounded-md"
                      >
                        <div
                          className={`w-14 h-14 rounded-md flex items-center justify-center ${color} text-xl transform transition-transform duration-300 hover:scale-105`}
                        >
                          {icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1C1C1C]">{item.name}</p>
                          <p className="text-sm text-[#666666]">
                            Qty: {item.quantity} • ${item.unit_price?.toFixed(2)}
                          </p>
                        </div>
                        <div className="font-semibold text-nowrap text-[#1C1C1C]">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}

                  <div className="text-right space-y-1 text-[#1C1C1C]">
                    <p>Subtotal: ${order.subtotal?.toFixed(2)}</p>
                    <p>Shipping: {order.shipping > 0 ? `$${order.shipping}` : "Free"}</p>
                    <p>Tax: ${order.tax?.toFixed(2)}</p>
                    <p className="font-bold">
                      Total: ${(order.subtotal + order.shipping + order.tax).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-sm text-[#666666] mt-4">
                    <p>
                      <strong>Tracking:</strong> {order.tracking?.carrier} -{" "}
                      {order.tracking?.trackingNumber}
                    </p>
                    <p>
                      <strong>Status:</strong> {order.tracking?.status} |{" "}
                      <strong>ETA:</strong> {order.tracking?.expectedDelivery}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;
