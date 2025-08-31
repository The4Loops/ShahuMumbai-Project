import { motion } from "framer-motion";
import React,{useEffect,useState} from "react";
import { useNavigate } from "react-router-dom";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import placeholderImg from "../assets/products/coat.jpg";

function Featured() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch top 4 latest products
  const fetchLatestProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/products/getLatestProducts");
      setProducts(response.data);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to fetch latest products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  return (
    <section className="py-20 px-6 bg-[#F1E7E5] text-center relative overflow-hidden">
      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold mb-3 text-[#4B2C20]"
      >
        Featured Treasures
      </motion.h2>
      <p className="text-[#4B2C20]/70 mb-14 max-w-xl mx-auto">
        Handpicked vintage pieces that capture timeless style and craftsmanship.
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-[#4B2C20] text-lg">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-[#4B2C20] text-lg">No products found.</div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-2xl border border-[#E4D5C9] p-6 transition cursor-pointer "
              onClick={()=>navigate(`/products/${product.id}`)}
            >
              {/* Tag */}
              {product.is_new && (
                <span className="absolute top-4 left-4 text-xs bg-[#E3BDB4] text-[#4B2C20] px-3 py-1 rounded-full shadow">
                  New
                </span>
              )}

              {/* Image */}
              <div className="w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#F1E6E1] shadow-inner overflow-hidden">
                <img
                  src={
                    product.product_images?.find(img => img.is_hero)?.image_url ||
                    placeholderImg
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#4B2C20] mb-2">
                {product.name}
              </h3>

              {/* Price */}
              <p className="text-[#4B2C20] font-semibold text-base">
                ${product.price}{" "}
                {product.old_price && (
                  <span className="text-sm text-[#4B2C20]/50 line-through ml-1">
                    ${product.old_price}
                  </span>
                )}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/products")}
        className="mt-16 bg-[#4B2C20] text-white px-8 py-3 rounded-full shadow hover:bg-[#6B4226] transition"
      >
        View All Products
      </motion.button>
    </section>
  );
}

export default Featured;
