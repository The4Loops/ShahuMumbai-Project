// pages/ProductDetails.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const dummyData = [
  {
    id: '3',
    name: 'Vintage Bag',
    price: 2499,
    description: 'Handcrafted fabric bag with Indian flair.',
    designer: 'Shahu Mumbai',
    category: 'Accessories',
    images: [
      '/assets/images/product_images/dummyHandbag.jpeg',
      '/assets/images/product_images/dummyHandbag1.jpeg',
      '/assets/images/product_images/dummyHandbag2.jpeg',
      '/assets/images/product_images/dummyHandbag3.jpeg',
      '/assets/images/product_images/dummyHandbag4.jpeg',
    ],
  },
];

const NextArrow = ({ onClick }) => (
  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10" onClick={onClick}>
    <FaChevronRight size={24} className="text-[#6B4226]" />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10" onClick={onClick}>
    <FaChevronLeft size={24} className="text-[#6B4226]" />
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const product = dummyData.find((p) => p.id === id);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - YourBrand`;
    }
  }, [product]);

  if (!product) {
    return <p className="p-6 text-center text-red-500">Product not found</p>;
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    className: 'rounded-md',
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    appendDots: dots => (
      <div style={{ bottom: '-24px' }}>
        <ul className="slick-dots">{dots}</ul>
      </div>
    ),
  };

  return (
    <Layout>
      <div className="min-h-screen px-6 py-16 pt-[130px] bg-[#f9f5f0] font-serif">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Image Carousel */}
          <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-2 pb-8">
            <Slider {...sliderSettings}>
              {product.images.map((img, index) => (
                <div key={index} className="px-2">
                  <img
                    src={process.env.PUBLIC_URL + img}
                    alt={`${product.name} ${index + 1}`}
                    className="h-[400px] w-full object-cover rounded-md border border-[#D4A5A5] shadow-sm"
                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`; }}
                  />
                </div>
              ))}
            </Slider>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold text-[#6B4226] mb-2">{product.name}</h1>
              <p className="text-sm italic text-[#A3B18A] mb-3">{product.category}</p>
              <p className="text-base text-[#3E2C23] leading-relaxed mb-3">{product.description}</p>
              <p className="text-md text-[#6B4226]">
                Designer: <span className="font-semibold">{product.designer}</span>
              </p>
            </div>

            <div className="mt-4">
              <p className="text-2xl font-bold text-[#6B4226] mb-4">₹{product.price}</p>
              <button
                className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow"
                aria-label="Add this product to your shopping cart"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
