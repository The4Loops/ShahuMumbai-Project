import React, { useState, useEffect } from "react";
import api from "../supabase/axios"; // Import axios for API calls
import ProductCard from "../components/ProductCard";
import Layout from "../layout/Layout";
import { toast } from "react-toastify";

const Products = () => {
  const [filter, setFilter] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async (categoryFilter = "") => {
    try {
      const response = await api.get(`/api/products`);
      const products = response.data;

      if (products.length === 0) {
        setFilteredData([]);
        setLoading(false);
        return;
      }

      // Map API data to match ProductCard props
      const mappedData = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description || "No description available",
        price: product.price || 0,
        category: product.categories?.name || "Uncategorized",
        image:
          product.product_images?.find((img) => img.is_hero)?.image_url ||
          product.product_images?.[0]?.image_url ||
          require("../assets/images/product_images/DummyHandbag1.jpeg"), // Fallback image
      }));

      setFilteredData(mappedData);
      setLoading(false);
    } catch (err) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "An error occurred.");
      setFilteredData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Layout>
      <div className="pt-[130px] pb-12 px-4 bg-[#EDE1DF] min-h-screen font-serif">
        {/* Banner */}
        <div
          className="bg-[#ede0d4] border-l-8 border-[#9c6644] rounded-lg mx-auto mb-8 px-8 py-6 max-w-[1000px] text-center"
          style={{ backgroundColor: "#fdf6e9" }}
        >
          <h1 className="text-3xl font-bold text-[#4a2c17] mb-2">
            Explore Our Latest Products
          </h1>
          <p className="text-[#4a2c17] text-lg">
            Choose from a wide range of categories
          </p>
        </div>

        {/* Filter */}
        <div className="flex justify-end items-center gap-4 mb-6 max-w-5xl mx-auto">
          <label htmlFor="category-filter" className="sr-only">
            Filter by category
          </label>
          <select
            id="category-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 bg-[#f5ebe0] text-[#4a2c17] font-medium"
          >
            <option value="">All Categories</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
          {loading ? (
            <p className="text-center col-span-full text-[#6B4226] text-lg">
              Loading products...
            </p>
          ) : error ? (
            <p className="text-center col-span-full text-[#6B4226] text-lg">
              {error}
            </p>
          ) : filteredData.length > 0 ? (
            filteredData.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="text-center col-span-full text-[#6B4226] text-lg">
              No data to display
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
