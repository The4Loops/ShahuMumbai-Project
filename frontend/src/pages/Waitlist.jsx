// src/pages/Waitlist.jsx
import React, { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import { Helmet } from "react-helmet-async";

// Tailwind background colors for placeholders
const colors = [
  "bg-blue-400",
  "bg-purple-400",
  "bg-green-400",
  "bg-pink-400",
  "bg-yellow-400",
  "bg-red-400",
  "bg-indigo-400",
  "bg-teal-400",
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const fakeTimes = ["Just now", "2m ago", "5m ago", "10m ago", "30m ago"];
const getRandomTime = () => fakeTimes[Math.floor(Math.random() * fakeTimes.length)];

const statuses = ["Available", "Out of Stock", "Upcoming"];
const getRandomStatus = () => statuses[Math.floor(Math.random() * statuses.length)];

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "Available":
      return "bg-green-100 text-green-700 border-green-300";
    case "Out of Stock":
      return "bg-red-100 text-red-700 border-red-300";
    case "Upcoming":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const Waitlist = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "SuperCool Gadget",
      status: "Out of Stock",
      color: getRandomColor(),
      updated: getRandomTime(),
    },
    {
      id: 2,
      name: "Smart Headphones",
      status: "Upcoming",
      color: getRandomColor(),
      updated: getRandomTime(),
    },
    {
      id: 3,
      name: "Future Laptop",
      status: "Available",
      color: getRandomColor(),
      updated: getRandomTime(),
      availableSince: Date.now(), // track available time
    },
  ]);

  const [toasts, setToasts] = useState([]);

  // Auto-refresh product status & last updated every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setProducts((prev) =>
        prev
          .map((product) => {
            const newStatus = getRandomStatus();
            const newUpdated = getRandomTime();
            let updatedProduct = { ...product, updated: newUpdated };

            // If status changes
            if (newStatus !== product.status) {
              const toastMsg = `${product.name} is now ${newStatus}!`;
              const id = Date.now() + Math.random();

              setToasts((old) => [...old, { id, message: toastMsg }]);

              // Auto-remove toast after 1s
              setTimeout(() => {
                setToasts((old) => old.filter((t) => t.id !== id));
              }, 1000);

              updatedProduct.status = newStatus;

              // If product just became Available → mark timestamp
              if (newStatus === "Available") {
                updatedProduct.availableSince = Date.now();
              }
            }

            return updatedProduct;
          })
          // Remove products that have been "Available" for over 24 hours
          .filter((p) => {
            if (p.status === "Available" && p.availableSince) {
              const hoursSinceAvailable = (Date.now() - p.availableSince) / (1000 * 60 * 60);
              return hoursSinceAvailable < 24;
            }
            return true;
          })
      );

      // remove flash after animation
      setTimeout(() => {
        setProducts((prev) => prev.map((product) => ({ ...product, flash: false })));
      }, 800);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${origin}/waitlist`;

  return (
    <Layout>
      <Helmet>
        <title>Waitlist | Shahu Mumbai</title>
        <meta
          name="description"
          content="Track availability of items you’re watching. Get notified when products are back in stock at Shahu Mumbai."
        />
        {/* Utility/personalized page – keep out of index */}
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Waitlist | Shahu Mumbai" />
        <meta property="og:description" content="Track availability of items you’re watching." />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="max-w-6xl mx-auto p-6 relative">
        <h1 className="text-3xl font-bold mb-8 text-center">My Waitlist</h1>

        {/* Toast Notification Stack */}
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-50">
          {toasts.map((toast) => (
            <div key={toast.id} className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
              {toast.message}
            </div>
          ))}
        </div>

        {/* Grid of product cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border hover:shadow-xl transition relative ${
                product.flash ? "animate-flash" : ""
              }`}
            >
              {/* Status Badge */}
              <span
                className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadgeStyle(
                  product.status
                )}`}
              >
                {product.status}
              </span>

              {/* Image Placeholder */}
              <div className={`h-40 flex items-center justify-center ${product.color}`}>
                <span className="text-white text-2xl font-bold">{product.name.charAt(0)}</span>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>

                {product.status === "Available" ? (
                  <p className="mt-2 text-sm text-gray-600">✅ This product is available now — no waitlist needed.</p>
                ) : (
                  <div className="mt-3 p-3 bg-indigo-50 border rounded-md">
                    <p className="text-sm text-gray-700">You are on the waitlist for:</p>
                    <p className="font-bold text-indigo-700">{product.name}</p>
                    <p className="text-xs text-gray-500">Status: {product.status}</p>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-400">⏱ Last updated: {product.updated}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes flash {
          0% { background-color: #fef3c7; }
          100% { background-color: transparent; }
        }
        .animate-flash {
          animation: flash 0.8s ease-in-out;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fadeInOut {
          animation: fadeInOut 1s ease-in-out forwards;
        }
      `}</style>
    </Layout>
  );
};

export default Waitlist;
