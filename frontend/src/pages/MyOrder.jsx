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
import { useLoading } from "../context/LoadingContext";

const categoryIcons = {
  hat: <FaHatCowboy />,
  hats: <FaHatCowboy />,
  bag: <FaShoppingBag />,
  bags: <FaShoppingBag />,
  shoe: <FaShoePrints />,
  shoes: <FaShoePrints />,
  glasses: <FaGlasses />,
  eyewear: <FaGlasses />,
  jewelry: <FaGem />,
  accessory: <FaFeatherAlt />,
  clothing: <FaTshirt />,
  default: <FaQuestion />,
};

const formatPrice = (value = 0, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null;

const MyOrders = () => {
  const { currency } = useCurrency() || {};
  const [orders, setOrders] = useState([]);
  const { setLoading } = useLoading();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const api = apiWithCurrency(currency || "USD");
        const res = await api.get("/api/orders/user");
        setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
      } catch (err) {
        console.error("Failed to load orders:", err);
        toast.error("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currency, setLoading]);

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

        {filteredOrders.length === 0 ? (
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
                    {order.status && (
                      <p className="text-sm font-semibold text-[#EF4E9C]">Status: {order.status}</p>
                    )}
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

                    {Array.isArray(order.items) && order.items.map((item, idx) => {
                      const icon = categoryIcons[item.category?.toLowerCase()] || categoryIcons.default;
                      
                      return (
                        <div key={idx} className="flex items-center gap-4 bg-[#FFF4E8] p-3 rounded-md">
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-white flex items-center justify-center text-xl">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              icon
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>

                            {/* ✅ Product Description */}
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}

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

                    {/* ✅ Shipping Address */}
                    {order.shipping_address && (
                      <div className="bg-[#f4f4f4] p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Shipping Address</p>
                        <p className="text-gray-600">{order.shipping_address}</p>
                      </div>
                    )}

                    {/* ✅ Tracking ID (supports both tracking_id or tracking_number) */}
                    {(order.tracking_id || order.tracking_number) && (
                      <p className="text-sm text-[#1C1C1C] font-medium">
                        Tracking ID: <span className="text-[#EF4E9C]">{order.tracking_id || order.tracking_number}</span>
                      </p>
                    )}

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
