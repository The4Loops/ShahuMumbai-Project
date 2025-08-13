// pages/ProductDetails.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../layout/Layout";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import RelatedCard from "../components/RelatedCard";
import api from "../supabase/axios";

// Carousel Arrows
const NextArrow = ({ onClick }) => (
  <div
    className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
    onClick={onClick}
  >
    <FaChevronRight size={24} className="text-[#6B4226]" />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
    onClick={onClick}
  >
    <FaChevronLeft size={24} className="text-[#6B4226]" />
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const productResponse = await api.get(`/api/products/${id}`);
        setProduct(productResponse.data);

        // Fetch related products (assuming API supports category-based filtering)
        const relatedResponse = await api.get(
          `/api/products?category=${productResponse.data.categories?.name}&limit=4`
        );
        setRelatedProducts(relatedResponse.data.filter((p) => p.id !== id));

        document.title = `${productResponse.data.name} - YourBrand`;
      } catch (err) {
        setError("Failed to fetch product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <p className="p-6 text-center text-[#6B4226]">Loading...</p>;
  }

  if (error || !product) {
    return (
      <p className="p-6 text-center text-red-500">
        {error || "Product not found"}
      </p>
    );
  }

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  // Extract image URLs, prioritizing the hero image
  const images = product.product_images
    ? [
        ...product.product_images
          .filter((img) => img.is_hero)
          .map((img) => img.image_url),
        ...product.product_images
          .filter((img) => !img.is_hero)
          .map((img) => img.image_url),
      ]
    : [];

    // Calculate discount percentage
  const finalPrice = product.discountprice && product.discountprice < product.price
    ? (product.price - product.discountprice).toFixed(2)
    : product.price.toFixed(2);
  const discountPercentage = product.discountprice && product.discountprice < product.price
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;
  return (
    <Layout>
      <div className="min-h-screen px-6 py-16 pt-[130px] bg-[#F1E7E5] font-serif">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Product Image Carousel */}
          <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-2 pb-8">
            <Slider {...sliderSettings} ref={sliderRef}>
              {images.map((img, index) => (
                <div key={index} className="px-2">
                  <img
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    className="h-[400px] w-full object-cover rounded-md border border-[#D4A5A5] shadow-sm"
                    onError={(e) => {
                      e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                    }}
                  />
                </div>
              ))}
            </Slider>

            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => sliderRef.current?.slickGoTo(index)}
                  className="focus:outline-none border-2 border-transparent hover:border-[#D4A5A5] rounded-md transition"
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold text-[#6B4226] mb-2">
                {product.name}
              </h1>
              <p className="text-sm italic text-[#A3B18A] mb-3">
                Color: {product.color}
              </p>
              <p className="text-sm italic text-[#A3B18A] mb-3">
                Category: {product.categories?.name || "N/A"}
              </p>
              <p className="text-base text-[#3E2C23] leading-relaxed mb-3">
                {product.shortdescription}
              </p>
              <p className="text-base text-[#3E2C23] leading-relaxed mb-3">
                {product.description}
              </p>
              <p className="text-md text-[#6B4226]">
                Designer:{" "}
                <span className="font-semibold">{product.branddesigner}</span>
              </p>
               {product.stock > 0 ? (
                <p className="text-sm text-[#A3B18A] mt-2">In Stock: {product.stock} available</p>
              ) : (
                <p className="text-sm text-red-500 mt-2">Out of Stock</p>
              )}
            </div>

            <div className="mt-4">
              {product.discountprice && product.discountprice < product.price ? (
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold text-[#6B4226]">₹{finalPrice}</p>
                  <p className="text-lg text-gray-500 line-through">₹{product.price.toFixed(2)}</p>
                  <p className="text-lg text-[#A3B18A] font-semibold">{discountPercentage}% OFF</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#6B4226] mb-4">₹{product.price.toFixed(2)}</p>
              )}
              <button
                className={`bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                  product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="Add this product to your shopping cart"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-20 px-4 max-w-[1440px] mx-auto font-serif">
          <h2 className="text-2xl font-bold text-[#6B4226] mb-8 text-center">
            You May Also Like
          </h2>
          <div className="flex flex-wrap justify-center gap-12">
            {relatedProducts.map((related, index) => (
              <div key={index} className="w-[270px]">
                 <RelatedCard
                  product={{
                    id: related.id,
                    name: related.name,
                    price: related.discountprice && related.discountprice < related.price 
                      ? related.discountprice 
                      : related.price,
                    image: related.product_images?.find(img => img.is_hero)?.image_url || 
                           related.product_images?.[0]?.image_url || 
                           '/assets/images/placeholder.png',
                    category: related.categories?.name || 'N/A',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
