// src/pages/Waitlist.jsx
import React, { useState, useEffect, useRef } from "react";
import Layout from "../layout/Layout";
import { Helmet } from "react-helmet-async";
import { apiWithCurrency } from "../supabase/axios";
import { useCurrency } from "../supabase/CurrencyContext";
import { toast } from "react-toastify";
import { useLoading } from "../context/LoadingContext";
import { useNavigate } from "react-router-dom";

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
  const [payingId, setPayingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const email =
    (typeof window !== "undefined" && (localStorage.getItem("waitlistEmail") || "")) || "";

  const authToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchWaitlist = async () => {
    if (!email || currencyLoading) return;

    setLoading(true);
    try {
      const api = apiWithCurrency(currency);
      const res = await api.get(`/api/waitlist?email=${encodeURIComponent(email)}`);
      const data = res.data || [];

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

      setTimeout(() => {
        setProducts((curr) => curr.map((prod) => ({ ...prod, flash: false })));
      }, 800);

      const filtered = data.filter((p) => {
        if (p.status === "Available" && p.availableSince) {
          const hours = (Date.now() - p.availableSince) / (1000 * 60 * 60);
          return hours < 24;
        }
        return true;
      });

      setProducts(filtered);
      prevRef.current = data;
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to load waitlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
    const id = setInterval(fetchWaitlist, 300000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, currency, currencyLoading]);

  const handleSaveEmail = (e) => {
    e.preventDefault();
    const val = e.currentTarget.email.value.trim();
    if (val) {
      localStorage.setItem("waitlistEmail", val);
      fetchWaitlist();
    }
  };

  const handlePayAndJoin = (product) => {
    if (!authToken) {
      toast.error("Please log in to pay and join the waitlist.");
      navigate("/login");
      return;
    }

    setPayingId(product.id);

    try {
      const payload = {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        status: product.status,
        fromWaitlist: true,
        // You can optionally add depositFraction: 0.5 here
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("waitlistCheckout", JSON.stringify(payload));
      }
    } catch {
      // ignore storage errors
    }

    navigate("/checkout", {
      state: { fromWaitlist: true },
    });

    setPayingId(null);
  };

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
    return null;
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

        {!email && (
          <div className="max-w-md mx-auto mb-8 p-4 border rounded-lg">
            <p className="text-sm mb-2">Enter your email to load your waitlist:</p>
            <form onSubmit={handleSaveEmail}>
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

        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 z-50">
          {toasts.map((toastItem) => (
            <div
              key={toastItem.id}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut"
            >
              {toastItem.message}
            </div>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const depositPaid = product.depositPaid;
            const needsFinalPayment = product.needsFinalPayment;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border hover:shadow-xl transition relative ${
                  product.flash ? "animate-flash" : ""
                }`}
              >
                <span
                  className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadgeStyle(
                    product.status
                  )}`}
                >
                  {product.status}
                </span>

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

                <div className="p-4 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>

                  {product.status === "Available" ? (
                    <p className="mt-1 text-sm text-gray-700">
                      ✅ This product is available now.
                    </p>
                  ) : (
                    <div className="mt-1 p-3 bg-indigo-50 border rounded-md">
                      <p className="text-sm text-gray-700">You are on the waitlist for:</p>
                      <p className="font-bold text-indigo-700">{product.name}</p>
                      <p className="text-xs text-gray-500">Status: {product.status}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {depositPaid && (
                      <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-green-700">
                        50% deposit paid
                      </span>
                    )}
                    {needsFinalPayment && (
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700">
                        Final 50% payment pending
                      </span>
                    )}
                  </div>

                  {!depositPaid && product.status !== "Available" && (
                    <button
                      onClick={() => handlePayAndJoin(product)}
                      disabled={payingId === product.id}
                      className={`w-full mt-2 text-sm font-semibold rounded-md px-3 py-2 border ${
                        payingId === product.id
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-900"
                      }`}
                    >
                      {payingId === product.id ? "Opening checkout..." : "Pay & Join (50% deposit)"}
                    </button>
                  )}

                  <p className="mt-1 text-xs text-gray-400">
                    ⏱ Last updated:{" "}
                    {product.updated ? new Date(product.updated).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
