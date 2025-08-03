import { useState } from "react";
import {
  FaBox,
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaSearch,
  FaUndoAlt,
  FaTimesCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../layout/Layout";

const ORDERS_PER_PAGE = 5;

const orders = [
  {
    id: "#VIN-2024-001234",
    date: "August 3, 2025",
    subtotal: 404.97,
    tax: 32.4,
    shipping: 0.0,
    delivery: "3-5 business days",
    items: [
      {
        name: "Vintage Silk Scarf Collection",
        qty: 2,
        price: 89.99,
        image: "https://via.placeholder.com/80?text=Scarf",
      },
      {
        name: "Antique Leather Handbag",
        qty: 1,
        price: 149.99,
        image: "https://via.placeholder.com/80?text=Bag",
      },
      {
        name: "Victorian Pearl Brooch",
        qty: 1,
        price: 75.0,
        image: "https://via.placeholder.com/80?text=Brooch",
      },
    ],
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      address: "123 Vintage Lane, Apt 4B San Francisco, CA 94102 United States",
      payment: "Visa ending in 4242",
    },
    tracking: {
      carrier: "VintageExpress",
      status: "In Transit",
      expectedDelivery: "August 7, 2025",
      trackingNumber: "VX123456789US",
    },
  },
  {
    id: "#VIN-2024-000876",
    date: "July 20, 2025",
    subtotal: 129.99,
    tax: 10.4,
    shipping: 5.0,
    delivery: "Delivered",
    items: [
      {
        name: "Retro Sunglasses",
        qty: 1,
        price: 129.99,
        image: "https://via.placeholder.com/80?text=Sunglasses",
      },
    ],
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      address: "123 Vintage Lane, Apt 4B San Francisco, CA 94102 United States",
      payment: "Mastercard ending in 1234",
    },
    tracking: {
      carrier: "VintageExpress",
      status: "Delivered",
      expectedDelivery: "July 24, 2025",
      trackingNumber: "VX000008888US",
    },
  },
  {
    id: "#VIN-2024-001000",
    date: "July 5, 2025",
    subtotal: 189.0,
    tax: 15.0,
    shipping: 0.0,
    delivery: "Delivered",
    items: [
      {
        name: "Vintage Leather Boots",
        qty: 1,
        price: 189.0,
        image: "https://via.placeholder.com/80?text=Boots",
      },
    ],
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      address: "123 Vintage Lane, Apt 4B San Francisco, CA 94102 United States",
      payment: "Amex ending in 9876",
    },
    tracking: {
      carrier: "VintageExpress",
      status: "Delivered",
      expectedDelivery: "July 10, 2025",
      trackingNumber: "VX999999999US",
    },
  },
  {
    id: "#VIN-2024-001235",
    date: "August 2, 2025",
    subtotal: 259.5,
    tax: 20.0,
    shipping: 0.0,
    delivery: "In Transit",
    items: [
      {
        name: "Vintage Floral Dress",
        qty: 1,
        price: 129.75,
        image: "https://via.placeholder.com/80?text=Dress",
      },
      {
        name: "Classic Fedora Hat",
        qty: 1,
        price: 129.75,
        image: "https://via.placeholder.com/80?text=Hat",
      },
    ],
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      address: "123 Vintage Lane, Apt 4B San Francisco, CA 94102 United States",
      payment: "Visa ending in 4242",
    },
    tracking: {
      carrier: "VintageExpress",
      status: "In Transit",
      expectedDelivery: "August 6, 2025",
      trackingNumber: "VX777777777US",
    },
  },
];


const MyOrders = () => {
  const [openOrders, setOpenOrders] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleOrder = (id) => {
    setOpenOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "All" || order.tracking.status === statusFilter;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const handleCancel = (id) => alert(`Cancel requested for ${id}`);
  const handleReturn = (id) => alert(`Return requested for ${id}`);

  return (
    <Layout>
    <div className="min-h-screen bg-#fdf9f4 p-4 md:p-10">
      <div className="text-center mb-8">
        <FaBox className="text-blue-500 text-4xl mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-semibold">Your Orders</h1>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Order ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/4 px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="All">All Statuses</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* Order List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {paginatedOrders.map((order) => {
          const total = order.subtotal + order.tax + order.shipping;
          const isOpen = openOrders[order.id];

          return (
            <div key={order.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {isOpen ? "Hide Details" : "View Details"}
                </button>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-4 space-y-4"
                  >
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 bg-gray-50 p-3 rounded-md"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.qty} • ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="font-semibold">
                            ${(item.price * item.qty).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      <SummaryRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
                      <SummaryRow label="Shipping" value={order.shipping > 0 ? `$${order.shipping.toFixed(2)}` : "Free"} />
                      <SummaryRow label="Tax" value={`$${order.tax.toFixed(2)}`} />
                      <SummaryRow label="Total" value={`$${total.toFixed(2)}`} bold />
                    </div>

                    <div className="text-sm text-gray-700">
                      <p><strong>Delivery:</strong> {order.delivery}</p>
                      <p><strong>Status:</strong> {order.tracking.status}</p>
                    </div>

                    <div className="text-sm text-gray-700 border-t pt-4 space-y-1">
                      <DetailRow icon={<FaUser />} label="Name" value={order.customer.name} />
                      <DetailRow icon={<FaEnvelope />} label="Email" value={order.customer.email} />
                      <DetailRow icon={<FaMapMarkerAlt />} label="Address" value={order.customer.address} />
                      <DetailRow icon={<FaCreditCard />} label="Payment" value={order.customer.payment} />
                    </div>

                    <div className="text-sm text-blue-700 border-t pt-4 space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <FaTruck /> Tracking
                      </div>
                      <p><strong>Carrier:</strong> {order.tracking.carrier}</p>
                      <p><strong>Tracking #:</strong> {order.tracking.trackingNumber}</p>
                      <p><strong>Expected:</strong> {order.tracking.expectedDelivery}</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="flex items-center gap-2 text-red-600 hover:underline text-sm"
                      >
                        <FaTimesCircle /> Cancel Order
                      </button>
                      <button
                        onClick={() => handleReturn(order.id)}
                        className="flex items-center gap-2 text-yellow-600 hover:underline text-sm"
                      >
                        <FaUndoAlt /> Request Return
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-md border text-sm ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="text-gray-400 mt-1">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

const SummaryRow = ({ label, value, bold }) => (
  <div className="flex justify-between">
    <span className={bold ? "font-semibold" : ""}>{label}</span>
    <span className={bold ? "font-semibold" : ""}>{value}</span>
  </div>
  
);

export default MyOrders;