// src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, currency }) => {
  const {
    id,
    name,
    description = "",
    price,
    category,
    image,
    currency: productCurrency,
    priceINR,
    displayPrice,
    displayCurrency,
    baseCurrency = "INR",
  } = product;

  const activeCurrency =
    displayCurrency || productCurrency || currency || "USD";

  const effectivePrice =
    typeof displayPrice === "number" && !Number.isNaN(displayPrice)
      ? displayPrice
      : price;

  const formatPrice = (value, currencyCode) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const maxLength = 120;
  const truncatedDescription =
    description && description.length > maxLength
      ? description.slice(0, maxLength).trim() + "…"
      : description;

  const showBaseNote =
    baseCurrency &&
    activeCurrency &&
    baseCurrency !== activeCurrency &&
    (priceINR || price);

  return (
    <div className="bg-[#F9F5F0] border border-[#D4A5A5] rounded-xl shadow-[0_4px_10px_rgba(139,115,105,0.15)] p-5 relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1">
      <Link to={`/products/${id}`} className="group">
        <div className="absolute top-0 left-0 w-full h-[6px] bg-[#F9F5F0] group-hover:bg-[#C39898] transition-colors duration-300" />
        {image && (
          <div className="w-full mb-4 overflow-hidden rounded-lg border border-[#D4A5A5] bg-[#fef8f4] shadow-inner relative">
            <img
              src={image}
              alt={name}
              className="w-full h-48 object-cover rounded-md filter sepia-[0.15] brightness-100 contrast-95 saturate-[85%] transition-transform duration-300 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f9f5f0]/40 via-transparent to-[#f9f5f0]/30 pointer-events-none rounded-md" />
          </div>
        )}
        <div className="flex flex-col gap-2 font-serif">
          <h3 className="text-2xl font-bold text-[#6B4226] tracking-wide">
            {name}
          </h3>
          <p className="text-sm italic text-[#A3B18A]">{category}</p>
          <p className="text-[1rem] text-[#3E2C23] leading-relaxed">
            {truncatedDescription}
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-lg font-semibold text-[#6B4226]">
              {formatPrice(effectivePrice, activeCurrency)}
            </p>
            {showBaseNote && (
              <p className="text-xs text-[#3E2C23]/70">
                Approx.{" "}
                {formatPrice(priceINR ?? price, baseCurrency)} (charged in{" "}
                {baseCurrency})
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#DDB892] group-hover:bg-[#B77E65] transition-colors duration-300" />
      </Link>
    </div>
  );
};

export default ProductCard;
