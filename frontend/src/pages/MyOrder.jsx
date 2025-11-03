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
import { apiWithCurrency } from "../supabase/axios";
import { useCurrency } from "../supabase/CurrencyContext";
import { toast } from "react-toastify";

// Icon + color styling per item type
const getItemIcon = (name = "") => {
  const n = String(name || "").toLowerCase();
  if (n.includes("scarf")) return { icon: <FaFeatherAlt />, color: "bg-pink-100 text-[#EF4E9C]" };
  if (n.includes("bag")) return { icon: <FaShoppingBag />, color: "bg-yellow-100 text-yellow-600" };
  if (n.includes("boots")) return { icon: <FaShoePrints />, color: "bg-gray-200 text-gray-700" };
  if (n.includes("hat") || n.includes("fedora")) return { icon: <FaHatCowboy />, color: "bg-green-100 text-green-700" };
  if (n.includes("sunglasses") || n.includes("glasses")) return { icon: <FaGlasses />, color: "bg-blue-100 text-blue-600" };
  if (n.includes("dress") || n.includes("shirt")) return { icon: <FaTshirt />, color: "bg-indigo-100 text-indigo-600" };
  if (n.includes("brooch") || n.includes("pearl")) return { icon: <FaGem />, color: "bg-purple-100 text-purple-600" };
  return { icon: <FaQuestion />, color: "bg-gray-100 text-gray-600" };
};

// Format price with currency
const formatPrice = (value = 0, currencyCode = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(Number(value || 0));
  } catch {
    return `${currencyCode || "USD"} ${Number(value || 0).toFixed(2)}`;
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const MyOrders = () => {
  const { currency = "USD", loading: currencyLoading = true } = useCurrency() || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (currencyLoading) return;
      try {
        setLoading(true);
        const api = apiWithCurrency(currency);

        // Get JWT (adjust if you store under a different key)
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token") ||
          null;

        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // ✅ matches app.use('/api/orders', ordersRoutes)
        const res = await api.get("/api/orders/user", { headers });

        const list = Array.isArray(res.data?.orders) ? res.data.orders : [];
        setOrders(list);
      } catch (err) {
        console.error("Failed to load orders:", err);
        toast.dismiss();
        // Differentiate 401 vs path issues
        if (err?.response?.status === 401) {
          toast.error("Please sign in to view your orders.");
        } else if (err?.response?.status === 404) {
          toast.error("Orders route not found. Verify frontend path = /api/orders/user.");
        } else {
          toast.error("Failed to load orders. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currency, currencyLoading]);

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.placed_at || 0) - new Date(a.placed_at || 0)
  );

  const filteredOrders = sortedOrders.filter((order) =>
    String(order?.id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/myorder`;

  const ordersJsonLd = {
    "@context": "https://schema.org",
    "@type": "Order",
    orderStatus: "https://schema.org/OrderProcessing",
    merchant: { "@type": "Organization", name: "Shahu Mumbai" },
    orderItem: filteredOrders.flatMap((order) =>
      (order.items || []).map((item) => ({
        "@type": "OrderItem",
        orderedItem: {
          "@type": "Product",
          name: item.product_name || "Product",
          sku: String(item.product_id || ""),
          offers: {
            "@type": "Offer",
            price: Number(item.unit_price || 0).toFixed(2),
            priceCurrency: order.currency || currency || "USD",
          },
        },
        quantity: Number(item.quantity || 0),
      }))
    ),
  };

  const handleEmailInvoice = (order) => {
    const currencyCode = order.currency || currency || "USD";
    const invoiceText = `
Invoice for Order ${order.id}
-----------------------------
Date: ${formatDateTime(order.placed_at)}
Customer: ${order.customer?.name || "Guest"}
Email: ${order.customer?.email || ""}
Status: ${order.status || ""}

Items:
${(order.items || [])
  .map(
    (item) =>
      `• ${item.quantity}x ${item.product_name} - ${formatPrice(
        (item.unit_price || 0) * (item.quantity || 0),
        currencyCode
      )}`
  )
  .join("\n")}

Subtotal: ${formatPrice(order.subtotal || 0, currencyCode)}
Shipping: ${
      (order.shipping || 0) > 0
        ? formatPrice(order.shipping, currencyCode)
        : "Free"
    }
Tax: ${formatPrice(order.tax || 0, currencyCode)}
Total: ${formatPrice(
      (order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0),
      currencyCode
    )}

Tracking:
${order.carrier || ""} - ${order.tracking_number || ""}
Delivered: ${formatDateTime(order.delivered_at) || "Not Delivered"}
    `;
    alert(
      `Invoice sent to ${order.customer?.email || "your email on file"}\n\n${invoiceText}`
    );
  };

  if (currencyLoading) return null;

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
        <script type="application/ld+json">{JSON.stringify(ordersJsonLd)}</script>
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
          filteredOrders.map((order) => {
            const currencyCode = order.currency || currency || "USD";
            return (
              <div
                key={order.id}
                className="border border-[#E5E5E5] rounded-lg mb-6 overflow-hidden bg-white"
              >
                <div className="p-4 bg-[#f9f2ea] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <p className="font-medium text-[#1C1C1C]">Order ID: {order.id}</p>
                    <p className="text-sm text-[#666666]">
                      Date: {formatDateTime(order.placed_at)} | Delivery:{" "}
                      {formatDateTime(order.delivered_at) || "Not Delivered"}
                    </p>
                    <p className="text-sm text-[#666666]">Status: {order.status}</p>
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
                    {(order.items || []).map((item, index) => {
                      const { icon, color } = getItemIcon(item.product_name);
                      return (
                        <div
                          key={`${item.product_id}-${index}`}
                          className="flex items-center gap-4 bg-[#FFF4E8] p-3 rounded-md"
                        >
                          <div
                            className={`w-14 h-14 rounded-md flex items-center justify-center ${color} text-xl transform transition-transform duration-300 hover:scale-105`}
                          >
                            {icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#1C1C1C]">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-[#666666]">
                              Qty: {item.quantity} •{" "}
                              {formatPrice(item.unit_price, currencyCode)}
                            </p>
                          </div>
                          <div className="font-semibold text-nowrap text-[#1C1C1C]">
                            {formatPrice(
                              (item.unit_price || 0) * (item.quantity || 0),
                              currencyCode
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="text-right space-y-1 text-[#1C1C1C]">
                      <p>Subtotal: {formatPrice(order.subtotal || 0, currencyCode)}</p>
                      <p>
                        Shipping:{" "}
                        {(order.shipping || 0) > 0
                          ? formatPrice(order.shipping, currencyCode)
                          : "Free"}
                      </p>
                      <p>Tax: {formatPrice(order.tax || 0, currencyCode)}</p>
                      <p className="font-bold">
                        Total:{" "}
                        {formatPrice(
                          (order.subtotal || 0) + (order.shipping || 0) + (order.tax || 0),
                          currencyCode
                        )}
                      </p>
                    </div>

                    <div className="text-sm text-[#666666] mt-4">
                      <p>
                        <strong>Tracking:</strong> {order.carrier || "—"}{" "}
                        {order.tracking_number ? `- ${order.tracking_number}` : ""}
                      </p>
                      <p>
                        <strong>Shipped:</strong> {formatDateTime(order.shipped_at) || "—"}
                      </p>
                      <p>
                        <strong>Delivered:</strong> {formatDateTime(order.delivered_at) || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;
