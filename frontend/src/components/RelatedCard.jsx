import React from "react";
import { Link } from "react-router-dom";

const RelatedCard = ({ product }) => {
  const { id, name, price, category, image } = product;

  return (
    <Link
      to={`/products/${id}`}
      className="bg-white border border-[#D4A5A5] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300 flex flex-col"
    >
      {/* Fixed height image container */}
      <div className="aspect-square w-full bg-gray-50 overflow-hidden">
        <img
          src={process.env.PUBLIC_URL + image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 font-serif flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-[#6B4226]">{name}</h3>
        <p className="text-sm text-[#A3B18A] italic">{category}</p>
        <p className="text-md font-bold text-[#6B4226]">${price}</p>
      </div>
    </Link>
  );
};

export default RelatedCard;
