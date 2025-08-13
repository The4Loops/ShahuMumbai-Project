// pages/ProductDetails.jsx (Amazon-style layout, themed colors preserved)
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoMdShareAlt } from "react-icons/io";
import RelatedCard from "../components/RelatedCard";
import api from "../supabase/axios";

// Carousel Arrows
const NextArrow = ({ onClick }) => (
  <button
    type="button"
    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer z-10 bg-white/80 rounded-full p-2 shadow border border-[#D4A5A5] hover:bg-white"
    onClick={onClick}
    aria-label="Next image"
  >
    <FaChevronRight size={18} className="text-[#6B4226]" />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    type="button"
    className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-10 bg-white/80 rounded-full p-2 shadow border border-[#D4A5A5] hover:bg-white"
    onClick={onClick}
    aria-label="Previous image"
  >
    <FaChevronLeft size={18} className="text-[#6B4226]" />
  </button>
);

const QuantitySelect = ({ max = 10, value, onChange }) => (
  <select
    aria-label="Select quantity"
    className="border border-[#D4A5A5] rounded-md px-3 py-2 bg-white"
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
  >
    {Array.from({ length: Math.min(max, 10) }, (_, i) => i + 1).map((n) => (
      <option key={n} value={n}>
        Qty: {n}
      </option>
    ))}
  </select>
);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const sliderRef = useRef();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productResponse = await api.get(`/api/products/${id}`);
        setProduct(productResponse.data);

        const relatedResponse = await api.get(
          `/api/products?category=${productResponse.data.categories?.name}&limit=8`
        );
        setRelatedProducts(
          relatedResponse.data.filter((p) => String(p.id) !== String(id))
        );

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
      <p className="p-6 text-center text-red-500">{error || "Product not found"}</p>
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

  // Images (hero first)
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

  // Pricing & discount: sale price is discountprice when present
  const hasDiscount =
    product.discountprice && Number(product.discountprice) < Number(product.price);
  const salePrice = hasDiscount ? Number(product.discountprice) : Number(product.price);
  const mrp = Number(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((mrp - salePrice) / mrp) * 100)
    : 0;

  const handleThumbClick = (idx) => sliderRef.current?.slickGoTo(idx);

  const hero = images[0] || `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;

  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-6 py-16 pt-[130px] bg-[#F1E7E5] font-serif">
        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto text-sm mb-4 text-[#6B4226]">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link to="/" className="hover:underline">Home</Link>
              <span className="mx-2 text-[#D4A5A5]">/</span>
            </li>
            <li>
              <Link to={`/category/${product.categories?.name || "all"}`} className="hover:underline">
                {product.categories?.name || "Category"}
              </Link>
              <span className="mx-2 text-[#D4A5A5]">/</span>
            </li>
            <li className="text-[#3E2C23] truncate max-w-[60%]" title={product.name}>{product.name}</li>
          </ol>
        </nav>

        {/* Main 3-column layout */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Thumbnails */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex lg:flex-col gap-3 lg:sticky lg:top-24">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbClick(idx)}
                  className="border-2 border-transparent hover:border-[#D4A5A5] rounded-md overflow-hidden w-20 h-20 bg-white"
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Center: Gallery */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-2 pb-8 relative">
              <Slider {...sliderSettings} ref={sliderRef}>
                {images.length ? (
                  images.map((img, index) => (
                    <div key={index} className="px-2">
                      <img
                        src={img}
                        alt={`${product.name} view ${index + 1}`}
                        className="h-[560px] w-full object-cover rounded-md border border-[#D4A5A5] shadow-sm bg-white"
                        onError={(e) => {
                          e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <img
                    src={hero}
                    alt={`${product.name}`}
                    className="h-[560px] w-full object-cover rounded-md"
                  />
                )}
              </Slider>

              {/* Share */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard");
                  }
                }}
                className="absolute bottom-2 right-2 inline-flex items-center gap-2 text-[#6B4226] bg-white/90 border border-[#D4A5A5] rounded-full px-3 py-1 shadow hover:bg-white"
                aria-label="Share product"
              >
                <IoMdShareAlt />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>

          {/* Right: Buy Box (sticky) */}
          <aside className="lg:col-span-4 order-3">
            <div className="lg:sticky lg:top-24 flex flex-col gap-4">
              <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-5">
                <h1 className="text-2xl font-bold text-[#6B4226] mb-1">{product.name}</h1>
                <p className="text-sm italic text-[#A3B18A]">Color: {product.color}</p>
                <p className="text-sm italic text-[#A3B18A]">Category: {product.categories?.name || "N/A"}</p>

                <div className="mt-4">
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-extrabold text-[#6B4226]">₹{salePrice.toFixed(2)}</p>
                      <p className="text-base text-gray-500 line-through">₹{mrp.toFixed(2)}</p>
                      <p className="text-base text-[#A3B18A] font-semibold">{discountPercentage}% OFF</p>
                    </div>
                  ) : (
                    <p className="text-3xl font-extrabold text-[#6B4226]">₹{mrp.toFixed(2)}</p>
                  )}
                </div>

                {/* Removed: shipping/returns hints */}

                <div className="mt-5 flex items-center gap-3">
                  <QuantitySelect max={Math.min(10, Number(product.stock) || 10)} value={qty} onChange={setQty} />
                  {Number(product.stock) > 0 ? (
                    <p className="text-sm text-[#A3B18A]">In Stock: {product.stock}</p>
                  ) : (
                    <p className="text-sm text-red-500">Out of Stock</p>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button
                    className={`bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.stock) === 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label="Add this product to your shopping cart"
                    disabled={Number(product.stock) === 0}
                    onClick={() => console.log("Add to cart", { id, qty })}
                  >
                    Add to Cart
                  </button>
                  <button
                    className={`bg-[#6B4226] hover:opacity-90 text-white px-6 py-3 rounded-md transition font-semibold shadow ${
                      Number(product.stock) === 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label="Buy now"
                    disabled={Number(product.stock) === 0}
                    onClick={() => console.log("Buy now", { id, qty })}
                  >
                    Buy Now
                  </button>
                </div>

                {/* Removed: seller info line */}
              </div>

              {/* About this item */}
              <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-4">
                <h3 className="text-[#6B4226] font-semibold mb-2">About this item</h3>
                <ul className="list-disc list-inside text-sm text-[#3E2C23] space-y-1">
                  {product.shortdescription ? (
                    product.shortdescription
                      .split(/\.|\n|\r/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((point, i) => <li key={i}>{point}</li>)
                  ) : (
                    <li>Premium quality and crafted design.</li>
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* Full description & details */}
        <section className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
              <h2 className="text-xl font-bold text-[#6B4226] mb-3">Product Description</h2>
              <p className="text-base text-[#3E2C23] leading-relaxed whitespace-pre-line">{product.description || "No additional description provided."}</p>
              <div className="mt-4 text-md text-[#6B4226]">
                Designer: <span className="font-semibold">{product.branddesigner}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-[#D4A5A5] shadow bg-white p-6">
              <h3 className="text-lg font-bold text-[#6B4226] mb-2">Specifications</h3>
              <dl className="text-sm text-[#3E2C23] grid grid-cols-1 gap-2">
                <div className="flex justify-between border-b border-[#F1E7E5] pb-2">
                  <dt>Color</dt><dd className="font-medium">{product.color || "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-[#F1E7E5] pb-2">
                  <dt>Category</dt><dd className="font-medium">{product.categories?.name || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Stock</dt><dd className="font-medium">{Number(product.stock) > 0 ? product.stock : "Out of stock"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Related Products */}
        <div className="mt-16 px-2 max-w-[1440px] mx-auto font-serif">
          <h2 className="text-2xl font-bold text-[#6B4226] mb-6 text-center">You May Also Like</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {relatedProducts.map((related) => {
              const relatedHasDiscount =
                related.discountprice && Number(related.discountprice) < Number(related.price);
              const relatedSalePrice = relatedHasDiscount
                ? Number(related.discountprice)
                : Number(related.price);
              const relatedImage =
                related.product_images?.find((img) => img.is_hero)?.image_url ||
                related.product_images?.[0]?.image_url ||
                "/assets/images/placeholder.png";
              return (
                <div key={related.id} className="w-[260px]">
                  <RelatedCard
                    product={{
                      id: related.id,
                      name: related.name,
                      price: relatedSalePrice,
                      image: relatedImage,
                      category: related.categories?.name || "N/A",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
