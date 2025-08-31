import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import placeholder from "../assets/products/coat.jpg";

// Dummy Data with launch time included
const upcomingProducts = [
  { id: 1, name: "Vintage Leather Jacket", launch_date: "2025-09-10T14:30:00", image: placeholder },
  { id: 2, name: "Classic Handbag", launch_date: "2025-09-15T11:00:00", image: placeholder },
  { id: 3, name: "Retro Sunglasses", launch_date: "2025-09-20T17:45:00", image: placeholder},
  { id: 4, name: "Antique Wristwatch", launch_date: "2025-09-25T09:15:00", image: placeholder },
  { id: 5, name: "Designer Shoes", launch_date: "2025-09-30T20:00:00", image: placeholder },
];

// Format date + time to dd-mm-yyyy hh:mm AM/PM
const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

function UpcomingCarousel() {
  const [waitlist, setWaitlist] = useState([]);

  const handleWaitlist = (product) => {
    if (!waitlist.includes(product.id)) {
      setWaitlist([...waitlist, product.id]);
    }
  };

  const settings = {
    dots: true,
    infinite: upcomingProducts.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="py-16 px-6 bg-[#F1E7E5] text-center relative">
      <h2 className="text-3xl font-bold mb-6 text-[#4B2C20]">Upcoming Products</h2>

      <Slider {...settings} className="max-w-7xl mx-auto">
        {upcomingProducts.map((product) => (
          <div key={product.id} className="px-3">
            <div className="relative bg-white rounded-xl shadow-md overflow-hidden group">
              {/* Image */}
              <img src={product.image} alt={product.name} className="w-full h-52 object-cover" />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="mb-3 text-sm">
                  Launching on: {formatDateTime(product.launch_date)}
                </p>
                <button
                  onClick={() => handleWaitlist(product)}
                  className="bg-[#E3BDB4] text-[#4B2C20] px-4 py-2 rounded-lg font-medium hover:bg-[#d3a99f] transition"
                >
                  {waitlist.includes(product.id) ? "In Waitlist" : "Join Waitlist"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default UpcomingCarousel;
