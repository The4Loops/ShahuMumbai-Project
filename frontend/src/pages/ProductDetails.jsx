// pages/ProductDetails.jsx
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import RelatedCard from '../components/RelatedCard';




const dummyData = [
  {
    id: '1',
    name: 'Vintage Bag',
    price: 2499,
    description: 'Handcrafted fabric bag with Indian flair.',
    designer: 'Shahu Mumbai',
    category: 'Accessories',
    color: 'Red',
    images: [
      '/assets/images/product_images/dummyHandbag.jpeg',
      '/assets/images/product_images/dummyHandbag1.jpeg',
      '/assets/images/product_images/dummyHandbag2.jpeg',
      '/assets/images/product_images/dummyHandbag3.jpeg',
      '/assets/images/product_images/dummyHandbag4.jpeg',
    ],
  },
  {
    id: '2',
    name: 'Vintage Bag',
    price: 2499,
    description: 'Handcrafted fabric bag with Indian flair.',
    designer: 'Shahu Mumbai',
    category: 'Accessories',
    color: 'Red',
    images: [
      '/assets/images/product_images/dummyHandbag.jpeg',
      '/assets/images/product_images/dummyHandbag1.jpeg',
      '/assets/images/product_images/dummyHandbag2.jpeg',
      '/assets/images/product_images/dummyHandbag3.jpeg',
      '/assets/images/product_images/dummyHandbag4.jpeg',
    ],
  },
  {
    id: '3',
    name: 'Vintage Bag',
    price: 2499,
    description: 'Handcrafted fabric bag with Indian flair.',
    designer: 'Shahu Mumbai',
    category: 'Accessories',
    color: 'Red',
    images: [
      '/assets/images/product_images/DummyHandbag.jpeg',
      '/assets/images/product_images/DummyHandbag1.jpeg',
      '/assets/images/product_images/DummyHandbag2.jpeg',
      '/assets/images/product_images/DummyHandbag3.jpeg',
      '/assets/images/product_images/DummyHandbag4.jpeg',
    ],
  },
  {
    id: '4',
    name: 'Vintage Bag',
    price: 2499,
    description: 'Handcrafted fabric bag with Indian flair.',
    designer: 'Shahu Mumbai',
    category: 'Accessories',
    color: 'Red',
    images: [
      '/assets/images/product_images/DummyHandbag.jpeg',
      '/assets/images/product_images/DummyHandbag1.jpeg',
      '/assets/images/product_images/DummyHandbag2.jpeg',
      '/assets/images/product_images/DummyHandbag3.jpeg',
      '/assets/images/product_images/DummyHandbag4.jpeg',
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
  const sliderRef = useRef();

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - YourBrand`;
    }
  }, [product]);

  if (!product) {
    return <p className="p-6 text-center text-red-500">Product not found</p>;
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

  return (
    <Layout>
      <div className="min-h-screen px-6 py-16 pt-[130px] bg-[#f9f5f0] font-serif">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Image Carousel */}
          <div className="rounded-lg border border-[#D4A5A5] shadow-md bg-white p-2 pb-8">
            <Slider {...sliderSettings} ref={sliderRef}>
              {product.images.map((img, index) => (
                <div key={index} className="px-2">
                  <img
                    src={process.env.PUBLIC_URL + img}
                    alt={`${product.name} ${index + 1}`}
                    className="h-[400px] w-full object-cover rounded-md border border-[#D4A5A5] shadow-sm"
                    onError={(e) => {
                      e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                    }}
                  />
                </div>
              ))}
            </Slider>

            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => sliderRef.current?.slickGoTo(index)}
                  className="focus:outline-none border-2 border-transparent hover:border-[#D4A5A5] rounded-md transition"
                >
                  <img
                    src={process.env.PUBLIC_URL + img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                </button>
              ))}
            </div>

          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold text-[#6B4226] mb-2">{product.name}</h1>
              <p className="text-sm italic text-[#A3B18A] mb-3">Color: {product.color}</p>
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
          {/* Related Products Section */}
          <div className="mt-20 px-4 max-w-[1440px] mx-auto font-serif">
            <h2 className="text-2xl font-bold text-[#6B4226] mb-8 text-center">You May Also Like</h2>

            <div className="flex flex-wrap justify-center gap-12">
              {dummyData
                .filter((p) => p.id !== id)
                .slice(0, 4)
                .map((related, index) => (
                  <div key={index} className="w-[270px]">
                    <RelatedCard
                      product={{
                        id: related.id,
                        name: related.name,
                        price: related.price,
                        image: related.images?.[0] || related.image,
                        category: related.category,
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
