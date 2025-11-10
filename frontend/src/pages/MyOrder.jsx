// // import React, { useState, useEffect } from "react";
// // import {
// //   FaHatCowboy,
// //   FaShoppingBag,
// //   FaShoePrints,
// //   FaGlasses,
// //   FaGem,
// //   FaTshirt,
// //   FaQuestion,
// //   FaFeatherAlt,
// // } from "react-icons/fa";
// // import Layout from "../layout/Layout";
// // import { Helmet } from "react-helmet-async";
// // import { apiWithCurrency } from "../supabase/axios";
// // import { useCurrency } from "../supabase/CurrencyContext";
// // import { toast } from "react-toastify";

// // const formatPrice = (value = 0, currency = "USD") =>
// //   new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));

// // const formatDateTime = (iso) =>
// //   iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null;

// // const MyOrders = () => {
// //   const { currency } = useCurrency() || {};
// //   const [orders, setOrders] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedOrderId, setSelectedOrderId] = useState(null);
// //   const [searchTerm, setSearchTerm] = useState("");

// //   useEffect(() => {
// //     const fetchOrders = async () => {
// //       try {
// //         setLoading(true);

// //         const api = apiWithCurrency(currency || "USD");
// //         const res = await api.get("/api/orders/user");
// //         setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
// //       } catch (err) {
// //         console.error("Failed to load orders:", err);
// //         toast.error("Could not load your orders.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchOrders();
// //   }, [currency]);

// //   const filteredOrders = orders.filter((order) =>
// //     String(order.id).toLowerCase().includes(searchTerm.toLowerCase())
// //   );

// //   return (
// //     <Layout>
// //       <div className="p-4 md:p-6 bg-[#F1E7E5] min-h-screen">
// //         <h1 className="text-2xl font-semibold mb-4 text-[#1C1C1C]">My Orders</h1>

// //         <input
// //           type="text"
// //           placeholder="Search orders by ID..."
// //           value={searchTerm}
// //           onChange={(e) => setSearchTerm(e.target.value)}
// //           className="border border-[#E5E5E5] px-3 py-2 rounded-md mb-6 w-full max-w-md bg-white text-[#1C1C1C]"
// //         />

// //         {loading ? (
// //           <p className="text-gray-600">Loading orders...</p>
// //         ) : filteredOrders.length === 0 ? (
// //           <p className="text-gray-600">No orders found.</p>
// //         ) : (
// //           filteredOrders.map((order) => {
// //             const currencyCode = order.currency || currency || "USD";
// //             return (
// //               <div key={order.id} className="border border-[#E5E5E5] rounded-lg mb-6 overflow-hidden bg-white">
// //                 <div className="p-4 bg-[#f9f2ea] flex justify-between items-center">
// //                   <div>
// //                     <p className="font-medium">Order ID: {order.id}</p>
// //                     <p className="text-sm text-gray-600">Date: {formatDateTime(order.placed_at)}</p>
// //                   </div>
// //                   <button
// //                     onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
// //                     className="text-[#EF4E9C] hover:underline text-sm"
// //                   >
// //                     {selectedOrderId === order.id ? "Hide Details" : "View Details"}
// //                   </button>
// //                 </div>

// //                 {selectedOrderId === order.id && (
// //                   <div className="p-4 space-y-4">
// //                     {order.items.map((item, idx) => {
// //                       let color = "bg-gray-200 text-gray-800";
// //                       return (
// //                         <div key={idx} className="flex items-center gap-4 bg-[#FFF4E8] p-3 rounded-md">
// //                           <div className={`w-14 h-14 rounded-md flex items-center justify-center ${color} text-xl`}>
// //                             <img src={item.image_url} alt={item.product_name} />
// //                           </div>
// //                           <div className="flex-1">
// //                             <p className="font-medium">{item.product_name}</p>
// //                             <p className="text-sm text-gray-600">
// //                               Qty: {item.quantity} • {formatPrice(item.unit_price, currencyCode)}
// //                             </p>
// //                           </div>
// //                           <div className="font-semibold">
// //                             {formatPrice(item.quantity * item.unit_price, currencyCode)}
// //                           </div>
// //                         </div>
// //                       );
// //                     })}
// //                   </div>
// //                 )}
// //               </div>
// //             );
// //           })
// //         )}
// //       </div>
// //     </Layout>
// //   );
// // };

// // export default MyOrders;
// import React, { useState, useEffect } from "react";
// import {
//   FaHatCowboy,
//   FaShoppingBag,
//   FaShoePrints,
//   FaGlasses,
//   FaGem,
//   FaTshirt,
//   FaQuestion,
//   FaFeatherAlt,
// } from "react-icons/fa";
// import Layout from "../layout/Layout";
// import { apiWithCurrency } from "../supabase/axios";
// import { useCurrency } from "../supabase/CurrencyContext";
// import { toast } from "react-toastify";

// const categoryIcons = {
//   hat: <FaHatCowboy />,
//   hats: <FaHatCowboy />,
//   bag: <FaShoppingBag />,
//   bags: <FaShoppingBag />,
//   shoe: <FaShoePrints />,
//   shoes: <FaShoePrints />,
//   glasses: <FaGlasses />,
//   eyewear: <FaGlasses />,
//   jewelry: <FaGem />,
//   accessory: <FaFeatherAlt />,
//   clothing: <FaTshirt />,
//   default: <FaQuestion />,
// };

// const formatPrice = (value = 0, currency = "USD") =>
//   new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));

// const formatDateTime = (iso) =>
//   iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null;

// const MyOrders = () => {
//   const { currency } = useCurrency() || {};
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedOrderId, setSelectedOrderId] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         const api = apiWithCurrency(currency || "USD");
//         const res = await api.get("/api/orders/user");
//         setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
//       } catch (err) {
//         console.error("Failed to load orders:", err);
//         toast.error("Could not load your orders.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrders();
//   }, [currency]);

//   const filteredOrders = orders.filter((order) =>
//     String(order.id).toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <Layout>
//       <div className="p-4 md:p-6 bg-[#F1E7E5] min-h-screen">
//         <h1 className="text-3xl font-semibold mb-6 text-[#1C1C1C]">My Orders</h1>

//         <input
//           type="text"
//           placeholder="Search orders by ID..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="border border-gray-300 px-3 py-2 rounded-md mb-6 w-full max-w-md bg-white"
//         />

//         {loading ? (
//           <p className="text-gray-600">Loading orders...</p>
//         ) : filteredOrders.length === 0 ? (
//           <p className="text-gray-600">No orders found.</p>
//         ) : (
//           filteredOrders.map((order) => {
//             const currencyCode = order.currency || currency || "USD";
//             return (
//               <div
//                 key={order.id}
//                 className="border border-gray-300 rounded-xl shadow-sm bg-white mb-6 overflow-hidden transition hover:shadow-md"
//               >
//                 {/* Header */}
//                 <div className="p-4 bg-[#f9f5f2] flex flex-col md:flex-row justify-between md:items-center gap-3">
//                   <div>
//                     <p className="font-semibold text-lg">Order #{order.id}</p>
//                     <p className="text-sm text-gray-600">Placed: {formatDateTime(order.placed_at)}</p>
//                     {order.tracking_number && (
//                       <div className="mt-1">
//                         <p className="text-sm text-gray-700">
//                           <span className="font-medium">Tracking:</span> {order.tracking_number}
//                         </p>

//                         {/* ✅ Track Button */}
//                         <a
//                           href={`https://track.aftership.com/${order.tracking_number}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="inline-block mt-1 text-xs bg-[#EF4E9C] text-white px-3 py-1 rounded-full hover:opacity-90"
//                         >
//                           Track Package
//                         </a>
//                       </div>
//                     )}
//                   </div>

//                   <span className="px-3 py-1 text-xs rounded-full font-medium bg-[#EF4E9C]/10 text-[#EF4E9C] w-fit">
//                     {order.status || "Processing"}
//                   </span>
//                 </div>

//                 {/* Product Preview */}
//                 <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
//                   {order.items.slice(0, 3).map((item, idx) => (
//                     <p key={idx} className="flex items-center gap-2">
//                       • {item.product_name} <span className="text-gray-500">(x{item.quantity})</span>
//                     </p>
//                   ))}
//                   {order.items.length > 3 && (
//                     <p className="text-gray-500">+ {order.items.length - 3} more</p>
//                   )}
//                 </div>

//                 {/* Expand Button */}
//                 <button
//                   onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
//                   className="block w-full text-center text-[#EF4E9C] py-2 hover:bg-pink-50 text-sm font-medium"
//                 >
//                   {selectedOrderId === order.id ? "Hide Details" : "View Full Details"}
//                 </button>

//                 {/* Expanded Details */}
//                 {selectedOrderId === order.id && (
//                   <div className="p-4 space-y-4 bg-[#fff7f2] border-t border-gray-200">
//                     {order.items.map((item, idx) => {
//                       const icon = categoryIcons[item.category?.toLowerCase()] || categoryIcons.default;
//                       return (
//                         <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-md shadow-sm">
//                           <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center text-xl">
//                             {item.image_url ? (
//                               <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
//                             ) : (
//                               icon
//                             )}
//                           </div>
//                           <div className="flex-1">
//                             <p className="font-medium">{item.product_name}</p>
//                             <p className="text-sm text-gray-600">
//                               Qty: {item.quantity} • {formatPrice(item.unit_price, currencyCode)}
//                             </p>
//                           </div>
//                           <p className="font-semibold">{formatPrice(item.quantity * item.unit_price, currencyCode)}</p>
//                         </div>
//                       );
//                     })}

//                     {order.shipping_address && (
//                       <div className="bg-white p-3 rounded-md shadow-sm text-sm">
//                         <p className="font-semibold mb-1">Shipping Address</p>
//                         <p className="text-gray-700">{order.shipping_address}</p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             );
//           })
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default MyOrders;

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
  const [loading, setLoading] = useState(true);
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
