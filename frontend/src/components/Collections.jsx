import React from 'react';

function Collections() {
  const collections = [
    { title: 'Vintage Apparel', desc: 'Timeless clothing pieces from the golden age of fashion', count: '120+' },
    { title: 'Home Decor', desc: 'Antique furnishings and decorative pieces for your space', count: '85+' },
    { title: 'Accessories', desc: 'Vintage jewelry, bags, and timeless accessories', count: '200+' },
  ];

  return (
    <section className="bg-[#F1E7E5] py-11 px-6 text-center">
      <h2 className="text-3xl font-semibold mb-4 text-[#6B4226]">Our Collections</h2>
      <p className="text-[#6B4226]/70 mb-10">
        Explore our carefully curated collections, each telling a unique story of style and heritage.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {collections.map((col, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition text-left border border-[#E6DCD2]">
            <div className="text-sm text-[#6B4226]/60 mb-1">{col.count} ITEMS</div>
            <h3 className="text-xl font-semibold mb-2 text-[#6B4226]">{col.title}</h3>
            <p className="text-[#6B4226]/70">{col.desc}</p>

            {/* THEMED BUTTON */}
            <a
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#D4A5A5] text-white px-4 py-2 text-sm font-medium
                         hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]/40"
            >
              Explore Collection →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
export default Collections;
