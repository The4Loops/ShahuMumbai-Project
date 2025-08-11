import React, { useState } from "react";
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
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEmailInvoice = (order) => {
    const invoiceText = `
Invoice for Order ${order.id}
-----------------------------
Date: ${order.date}
Customer: ${order.customer.name}
Email: ${order.customer.email}
Address: ${order.customer.address}
Payment: ${order.customer.payment}

Items:
${order.items
  .map((item) => `• ${item.qty}x ${item.name} - $${(item.price * item.qty).toFixed(2)}`)
  .join("\n")}

Subtotal: $${order.subtotal.toFixed(2)}
Shipping: ${order.shipping > 0 ? `$${order.shipping}` : "Free"}
Tax: $${order.tax.toFixed(2)}
Total: $${(order.subtotal + order.shipping + order.tax).toFixed(2)}

Tracking:
${order.tracking.carrier} - ${order.tracking.trackingNumber}
Expected Delivery: ${order.tracking.expectedDelivery}
    `;
    alert(`Invoice sent to ${order.customer.email}\n\n${invoiceText}`);
  };

  const orders = [
    {
      id: "ORD001",
      date: "2025-08-01",
      delivery: "Aug 05, 2025",
      subtotal: 120.0,
      shipping: 10.0,
      tax: 9.6,
      items: [
        { name: "Vintage Fedora Hat", price: 40, qty: 1 },
        { name: "Leather Bag", price: 80, qty: 1 },
      ],
      customer: {
        name: "Alice Johnson",
        email: "alice@example.com",
        address: "123 Maple St, Springfield",
        payment: "Credit Card",
      },
      tracking: {
        status: "Delivered",
        carrier: "UPS",
        trackingNumber: "1Z999AA10123456784",
        expectedDelivery: "2025-08-05",
      },
    },
    {
      id: "ORD002",
      date: "2025-07-30",
      delivery: "Aug 04, 2025",
      subtotal: 60.0,
      shipping: 0,
      tax: 4.8,
      items: [{ name: "Silk Scarf", price: 30, qty: 2 }],
      customer: {
        name: "Bob Smith",
        email: "bob@example.com",
        address: "456 Oak Ave, Riverdale",
        payment: "PayPal",
      },
      tracking: {
        status: "In Transit",
        carrier: "FedEx",
        trackingNumber: "123456789012",
        expectedDelivery: "2025-08-06",
      },
    },
    {
      id: "ORD003",
      date: "2025-07-28",
      delivery: "Aug 03, 2025",
      subtotal: 150.0,
      shipping: 5.0,
      tax: 12.0,
      items: [{ name: "Pearl Brooch", price: 75, qty: 2 }],
      customer: {
        name: "Carol Lee",
        email: "carol@example.com",
        address: "789 Pine Rd, Lakeside",
        payment: "Apple Pay",
      },
      tracking: {
        status: "Delivered",
        carrier: "DHL",
        trackingNumber: "DHL987654321",
        expectedDelivery: "2025-08-03",
      },
    },
    {
      id: "ORD004",
      date: "2025-07-25",
      delivery: "Jul 30, 2025",
      subtotal: 45.0,
      shipping: 0,
      tax: 3.6,
      items: [{ name: "Sunglasses", price: 45, qty: 1 }],
      customer: {
        name: "David Kim",
        email: "david@example.com",
        address: "321 Birch Ln, Hilltown",
        payment: "Visa",
      },
      tracking: {
        status: "In Transit",
        carrier: "USPS",
        trackingNumber: "9400110200888888888888",
        expectedDelivery: "2025-08-07",
      },
    },
    {
      id: "ORD005",
      date: "2025-07-22",
      delivery: "Jul 28, 2025",
      subtotal: 90.0,
      shipping: 5.0,
      tax: 7.2,
      items: [{ name: "Ankle Boots", price: 90, qty: 1 }],
      customer: {
        name: "Eva Green",
        email: "eva@example.com",
        address: "654 Cedar Blvd, Sunnytown",
        payment: "MasterCard",
      },
      tracking: {
        status: "Delivered",
        carrier: "Amazon Logistics",
        trackingNumber: "TBA123456789",
        expectedDelivery: "2025-07-28",
      },
    },
  ];


  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const filteredOrders = sortedOrders.filter((order) =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
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

      {filteredOrders.map((order) => (
        <div
          key={order.id}
          className="border border-[#E5E5E5] rounded-lg mb-6 overflow-hidden bg-white"
        >
          <div className="p-4 bg-[#f9f2ea] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <p className="font-medium text-[#1C1C1C]">Order ID: {order.id}</p>
              <p className="text-sm text-[#666666]">
                Date: {order.date} | Delivery: {order.delivery}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() =>
                  setSelectedOrderId(
                    selectedOrderId === order.id ? null : order.id
                  )
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
              {order.items.map((item, index) => {
                const { icon, color } = getItemIcon(item.name);
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
                        Qty: {item.qty} • ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="font-semibold text-nowrap text-[#1C1C1C]">
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                );
              })}

              <div className="text-right space-y-1 text-[#1C1C1C]">
                <p>Subtotal: ${order.subtotal.toFixed(2)}</p>
                <p>
                  Shipping: {order.shipping > 0 ? `$${order.shipping}` : "Free"}
                </p>
                <p>Tax: ${order.tax.toFixed(2)}</p>
                <p className="font-bold">
                  Total: $
                  {(order.subtotal + order.shipping + order.tax).toFixed(2)}
                </p>
              </div>

              <div className="text-sm text-[#666666] mt-4">
                <p>
                  <strong>Tracking:</strong> {order.tracking.carrier} -{" "}
                  {order.tracking.trackingNumber}
                </p>
                <p>
                  <strong>Status:</strong> {order.tracking.status} |{" "}
                  <strong>ETA:</strong> {order.tracking.expectedDelivery}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
    </Layout>
  );
};

export default MyOrders;
