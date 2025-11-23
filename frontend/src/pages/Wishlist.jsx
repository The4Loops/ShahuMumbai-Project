import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AiOutlineShoppingCart, AiOutlineDelete } from "react-icons/ai";
import Layout from "../layout/Layout";
import { Ecom, UX } from "../analytics";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { Helmet } from "react-helmet-async";
import { useCurrency } from "../supabase/CurrencyContext";
import { useLoading } from "../context/LoadingContext";

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

// Format price with currency
const formatPrice = (value, currencyCode) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(value);
};

const Wishlist = () => {
  const { currency = "USD", loading: currencyLoading = true } = useCurrency() || {};
  const [wishlistItems, setWishlistItems] = useState([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState(null);
  const [cartSubmitting, setCartSubmitting] = useState(false);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await api.get("/api/auth/me");
          setUser(res.data.user);
        } catch (err) {
          setUser(null); // Guest user
        }
      };
      fetchUser();
    }, []);
    
  const userId = user?.id;

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/wishlist");
        setWishlistItems(data.data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load wishlist");
        toast.error(err.response?.data?.error || "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [userId, currency, currencyLoading,setLoading]);

  const handleAddToCart = async (item) => {
    if (item.products.stock <= 0 || cartSubmitting) return;
    setLoading(true);
    try {
      setCartSubmitting(true);
      const payload = {
        user_id: userId,
        product_id: item.product_id,
        quantity: 1,
        color: null, // No color selection in wishlist
      };
      await api.post("/api/cart", payload);
      toast.success(`${item.products.name} added to cart!`);
      try {
        Ecom.addToCart({
          id: item.product_id,
          title: item.products.name,
          category: item.products.categories?.[0]?.name || "N/A",
          price: item.products.price - (Number(item.products.discountprice) || 0),
          quantity: 1,
          currency: item.products.currency || currency,
        });
      } catch {}
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add to cart");
    } finally {
      setCartSubmitting(false);
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId, item) => {
    setLoading(true);
    if (removeSubmitting) return;
    try {
      setRemoveSubmitting(true);
      await api.delete(`/api/wishlist/${itemId}`);
      setWishlistItems(wishlistItems.filter((i) => i.id !== itemId));
      toast.success("Removed from wishlist");
      try {
        UX.removeFromWishlist({
          id: item.product_id,
          item_id: item.product_id,
          item_name: item.products.name,
          category: item.products.categories?.[0]?.name || "N/A",
          price: item.products.price - (Number(item.products.discountprice) || 0),
          currency: item.products.currency || currency,
        });
      } catch {}
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove item");
    } finally {
      setRemoveSubmitting(false);
      setLoading(false);
    }
  };

  const handleClearWishlist = async () => {
    setLoading(true);
    if (clearSubmitting) return;
    try {
      setClearSubmitting(true);
      await api.delete("/api/wishlist");
      const itemsToRemove = [...wishlistItems];
      setWishlistItems([]);
      toast.success("Wishlist cleared");
      try {
        itemsToRemove.forEach((item) =>
          UX.removeFromWishlist({
            id: item.product_id,
            item_id: item.product_id,
            item_name: item.products.name,
            category: item.products.categories?.[0]?.name || "N/A",
            price: item.products.price - (Number(item.products.discountprice) || 0),
            currency: item.products.currency || currency,
          })
        );
      } catch {}
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to clear wishlist");
    } finally {
      setClearSubmitting(false);
      setLoading(false);
    }
  };

  const inStockItems = wishlistItems.filter((item) => item.products.stock > 0);
  const totalValue = wishlistItems
    .reduce(
      (total, item) => total + (item.products.price - (Number(item.products.discountprice) || 0)),
      0
    )
    .toFixed(2);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${origin}/wishlist`;

  const wishlistJsonLd = {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: "Wishlist",
    itemListElement: wishlistItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: item.products.name,
        image: item.products.product_images?.find((img) => img.is_hero)?.image_url || item.products.image_url,
        sku: String(item.product_id),
        offers: {
          "@type": "Offer",
          price: (item.products.price - (Number(item.products.discountprice) || 0)).toFixed(2),
          priceCurrency: item.products.currency || currency,
          availability: item.products.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
    })),
  };

  if (currencyLoading) return null;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;

  return (
    <Layout>
      <Helmet>
        <title>Wishlist | Shahu Mumbai</title>
        <meta
          name="description"
          content="View and manage items you’ve saved for later at Shahu Mumbai."
        />
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Wishlist | Shahu Mumbai" />
        <meta property="og:description" content="Your saved items in one place." />
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json">{JSON.stringify(wishlistJsonLd)}</script>
      </Helmet>

      <div className="p-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Favorite Items</h1>
            <p className="text-gray-500 text-sm">{wishlistItems.length} items saved for later</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              className={`flex items-center gap-2 border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50 text-sm font-medium ${
                clearSubmitting || !wishlistItems.length ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleClearWishlist}
              disabled={clearSubmitting || !wishlistItems.length}
            >
              <AiOutlineDelete size={16} /> Clear All
            </button>
            <button
              className={`flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm font-medium ${
                cartSubmitting || !inStockItems.length ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (cartSubmitting || !inStockItems.length) return;
                inStockItems.forEach((item) => handleAddToCart(item));
              }}
              disabled={cartSubmitting || !inStockItems.length}
            >
              <AiOutlineShoppingCart size={16} /> Add All to Cart ({inStockItems.length})
            </button>
          </div>
        </div>

        {/* Stats Row with animation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Items", value: wishlistItems.length },
            { label: "In Stock", value: inStockItems.length },
            { label: "Total Value", value: formatPrice(totalValue, currency) },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="border rounded-lg p-6 text-center"
              variants={fadeUpVariant}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Wishlist Grid with animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item, index) => {
            const discountPrice = Number(item.products.discountprice) || 0;
            const hasDiscount = discountPrice > 0 && discountPrice < item.products.price;
            const salePrice = hasDiscount ? item.products.price - discountPrice : item.products.price;
            const discountPercentage = hasDiscount
              ? Math.round(((item.products.price - salePrice) / item.products.price) * 100)
              : 0;
            const heroImage =
              item.products.product_images?.find((img) => img.is_hero)?.image_url ||
              item.products.image_url ||
              "/assets/images/placeholder.png";

            return (
              <motion.div
                key={item.id}
                variants={fadeUpVariant}
                initial="hidden"
                animate="visible"
                custom={index + 3}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-md overflow-hidden relative"
              >
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    -{discountPercentage}%
                  </div>
                )}
                <div
                  className="w-full h-56 bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroImage})` }}
                  onError={(e) => {
                    e.currentTarget.style.backgroundImage = `url(/assets/images/placeholder.png)`;
                  }}
                />
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    {item.products.categories?.length
                      ? item.products.categories.map((c) => c.name).join(", ")
                      : "N/A"}
                  </div>
                  <div className="font-semibold text-sm mb-2 line-clamp-2">{item.products.name}</div>
                  <div className="mb-2">
                    <span className="text-lg font-bold text-gray-800">{formatPrice(salePrice, item.products.currency || currency)}</span>
                    {hasDiscount && (
                      <span className="line-through text-sm text-gray-400 ml-2">
                        {formatPrice(item.products.price, item.products.currency || currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 text-sm px-3 py-1 rounded flex items-center justify-center gap-1 ${
                        removeSubmitting
                          ? "bg-pink-100 text-pink-600 opacity-50 cursor-not-allowed"
                          : "bg-pink-100 text-pink-600 hover:bg-pink-200"
                      }`}
                      onClick={() => handleRemoveItem(item.id, item)}
                      disabled={removeSubmitting}
                    >
                      <AiOutlineDelete size={14} /> Remove
                    </button>
                    <button
                      className={`flex-1 text-sm px-3 py-1 rounded flex items-center justify-center gap-1 ${
                        item.products.stock > 0
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                      disabled={item.products.stock <= 0 || cartSubmitting}
                      onClick={() => handleAddToCart(item)}
                    >
                      {item.products.stock > 0 ? <AiOutlineShoppingCart size={14} /> : "Out of Stock"}
                      {item.products.stock > 0 && "Add to Cart"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;