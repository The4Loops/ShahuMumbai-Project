import React from 'react';

function Collections() {
  const collections = [
    {
      title: 'Vintage Apparel',
      desc: 'Timeless clothing pieces from the golden age of fashion',
      count: '120+',
    },
    {
      title: 'Home Decor',
      desc: 'Antique furnishings and decorative pieces for your space',
      count: '85+',
    },
    {
      title: 'Accessories',
      desc: 'Vintage jewelry, bags, and timeless accessories',
      count: '200+',
    },
  ];

  return (
    <section className="bg-[#fdfaf6] py-20 px-6 text-center">
      <h2 className="text-3xl font-semibold mb-4">Our Collections</h2>
      <p className="text-gray-600 mb-10">Explore our carefully curated collections, each telling a unique story of style and heritage.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {collections.map((col, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition text-left">
            <div className="text-sm text-gray-500 mb-1">{col.count} ITEMS</div>
            <h3 className="text-xl font-semibold mb-2">{col.title}</h3>
            <p className="text-gray-600">{col.desc}</p>
            <a href="/" className="text-sm text-pink-600 mt-4 inline-block">Explore Collection →</a>
          </div>
        ))}
      </div>
    </section>
  );
}
export default Collections;