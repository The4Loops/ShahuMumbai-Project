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

const formatPrice = (value = 0, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null;

const MyOrders = () => {
  const { currency } = useCurrency() || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
          toast.error("Please sign in to view your orders.");
          setLoading(false);
          return;
        }

        const api = apiWithCurrency(currency || "USD");
        const res = await api.get("/api/orders/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Orders API:", res.data); // ✅ Debugging
        setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
      } catch (err) {
        console.error("Failed to load orders:", err);
        toast.error("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currency]);

  const filteredOrders = orders.filter((order) =>
    String(order.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
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
              <div key={order.id} className="border border-[#E5E5E5] rounded-lg mb-6 overflow-hidden bg-white">
                <div className="p-4 bg-[#f9f2ea] flex justify-between items-center">
                  <div>
                    <p className="font-medium">Order ID: {order.id}</p>
                    <p className="text-sm text-gray-600">Date: {formatDateTime(order.placed_at)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                    className="text-[#EF4E9C] hover:underline text-sm"
                  >
                    {selectedOrderId === order.id ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {selectedOrderId === order.id && (
                  <div className="p-4 space-y-4">
                    {order.items.map((item, idx) => {
                      const { icon, color } = getItemIcon(item.product_name);
                      return (
                        <div key={idx} className="flex items-center gap-4 bg-[#FFF4E8] p-3 rounded-md">
                          <div className={`w-14 h-14 rounded-md flex items-center justify-center ${color} text-xl`}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} • {formatPrice(item.unit_price, currencyCode)}
                            </p>
                          </div>
                          <div className="font-semibold">
                            {formatPrice(item.quantity * item.unit_price, currencyCode)}
                          </div>
                        </div>
                      );
                    })}
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
