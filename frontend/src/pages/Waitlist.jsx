import React, { useState, useEffect, useRef } from "react";
import Layout from "../layout/Layout";
import { Helmet } from "react-helmet-async";
import { apiWithCurrency } from "../supabase/axios";
import { useCurrency } from "../supabase/CurrencyContext";
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";

// Badge styling
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
  const { currency = "USD", loading: currencyLoading = true } = useCurrency() || {};
  const [products, setProducts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const { setLoading } = useLoading();
  const prevRef = useRef([]);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLoading]);

  // Use a saved email so user doesn't retype
  const email =
    (typeof window !== "undefined" && (localStorage.getItem("waitlistEmail") || "")) || "";

  const fetchWaitlist = async () => {
    if (!email || currencyLoading) return;

    setLoading(true);
    try {
      const api = apiWithCurrency(currency);
      const res = await api.get(`/api/waitlist?email=${encodeURIComponent(email)}`);
      const data = res.data;

      // Toast on status change since last snapshot
      const prevById = Object.fromEntries(prevRef.current.map((p) => [p.id, p]));
      data.forEach((p) => {
        const prev = prevById[p.id];
        if (prev && prev.status !== p.status) {
          const id = Date.now() + Math.random();
          setToasts((old) => [...old, { id, message: `${p.name} is now ${p.status}!` }]);
          setTimeout(() => {
            setToasts((old) => old.filter((t) => t.id !== id));
          }, 1200);
          p.flash = true;
        }
      });

      // Remove flash class after animation
      setTimeout(() => {
        setProducts((curr) => curr.map((prod) => ({ ...prod, flash: false })));
      }, 800);

      // Hide items that have been Available > 24h
      const filtered = data.filter((p) => {
        if (p.status === "Available" && p.availableSince) {
          const hours = (Date.now() - p.availableSince) / (1000 * 60 * 60);
          return hours < 24;
        }
        return true;
      });

      setProducts(filtered);
      prevRef.current = data; // store raw list (pre-filter) for next diff
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to load waitlist. Please try again.");
    }finally {
      setLoading(false);
    }
  };

  // Initial + 5-min refresh
  useEffect(() => {
    fetchWaitlist();
    const id = setInterval(fetchWaitlist, 300000); // 5 minutes
    return () => clearInterval(id);
  }, [email, currency, currencyLoading]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${origin}/waitlist`;

  const waitlistJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        image: product.imageUrl,
        sku: String(product.id),
        offers: {
          "@type": "Offer",
          availability:
            product.status === "Available"
              ? "https://schema.org/InStock"
              : product.status === "Out of Stock"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/PreOrder",
          priceCurrency: product.currency || currency,
        },
      },
    })),
  };

  if (currencyLoading) {
    return null; // Wait for currency to load
  }

  return (
    <Layout>
      <Helmet>
        <title>Waitlist | Shahu Mumbai</title>
        <meta
          name="description"
          content="Track availability of items you’re watching. Get notified when products are back in stock at Shahu Mumbai."
        />
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Waitlist | Shahu Mumbai" />
        <meta property="og:description" content="Track availability of items you’re watching." />
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json">{JSON.stringify(waitlistJsonLd)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto p-6 relative">
        <h1 className="text-3xl font-bold mb-8 text-center">My Waitlist</h1>

        {/* Simple email capture if not set */}
        {!email && (
          <div className="max-w-md mx-auto mb-8 p-4 border rounded-lg">
            <p className="text-sm mb-2">Enter your email to load your waitlist:</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.currentTarget.email.value.trim();
                if (val) {
                  localStorage.setItem("waitlistEmail", val);
                  fetchWaitlist();
                }
              }}
            >
              <div className="flex gap-2">
                <input
                  name="email"
                  type="email"
                  className="flex-1 border px-3 py-2 rounded"
                  placeholder="you@example.com"
                  required
                />
                <button className="px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
              </div>
            </form>
          </div>
        )}

        {/* Toast Notification Stack */}
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut"
            >
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
              <div className="h-40 flex items-center justify-center bg-gray-200">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-700 text-2xl font-bold">
                    {product.name?.charAt(0)}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>

                {product.status === "Available" ? (
                  <p className="mt-2 text-sm text-gray-600">
                    ✅ This product is available now — no waitlist needed.
                  </p>
                ) : (
                  <div className="mt-3 p-3 bg-indigo-50 border rounded-md">
                    <p className="text-sm text-gray-700">You are on the waitlist for:</p>
                    <p className="font-bold text-indigo-700">{product.name}</p>
                    <p className="text-xs text-gray-500">Status: {product.status}</p>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-400">
                  ⏱ Last updated:{" "}
                  {product.updated ? new Date(product.updated).toLocaleString() : "—"}
                </p>
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