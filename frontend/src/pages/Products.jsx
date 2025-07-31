// Products.jsx
import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import Layout from '../layout/Layout';

const dummyData = [
  {
    id: 1,
    name: 'Product 1',
    category: 'Men',
    price: 1200,
    description: 'Rustic shirt',
    image: '/assets/images/product_images/dummy-shirt.jpg',
  },
  {
    id: 2,
    name: 'Product 2',
    category: 'Women',
    price: 2400,
    description: 'Blue pants',
    image: '/assets/images/product_images/dummyPants.jpg',
  },
  {
    id: 3,
    name: 'Vintage Bag',
    category: 'Accessories',
    price: 2499,
    description: 'Handcrafted fabric bag with Indian flair.',
    image: '/assets/images/product_images/dummyHandbag.jpeg',
  },
  {
    id: 4,
    name: 'Product 4',
    category: 'Women',
    price: 1350,
    description: 'Brown shoes',
    image: '/assets/images/product_images/dummyShoes.jpg',
  },
];

const Products = () => {
  const [filter, setFilter] = useState('');
  const [filteredData, setFilteredData] = useState(dummyData);

  const handleFilter = () => {
    if (!filter) {
      setFilteredData(dummyData);
    } else {
      const result = dummyData.filter((item) => item.category === filter);
      setFilteredData(result);
    }
  };

  return (
    <Layout>
      <div className="pt-[130px] pb-12 px-4 bg-[#F9F5F0] min-h-screen font-serif">
        {/* Banner */}
        <div className="bg-[#ede0d4] border-l-8 border-[#9c6644] rounded-lg mx-auto mb-8 px-8 py-6 max-w-[1000px] text-center bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
          <h1 className="text-3xl font-bold text-[#4a2c17] mb-2">Explore Our Latest Products</h1>
          <p className="text-[#4a2c17] text-lg">Choose from a wide range of categories</p>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-end items-center gap-4 mb-6 max-w-5xl mx-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 bg-[#f5ebe0] text-[#4a2c17] font-medium"
          >
            <option value="">All Categories</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Accessories">Accessories</option>
          </select>
          <button
            onClick={handleFilter}
            className="bg-[#D4A5A5] text-white font-semibold px-4 py-2 rounded-md hover:bg-[#C39898] transition-colors"
          >
            Filter
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
          {filteredData.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
