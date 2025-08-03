import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const SalesReport = () => {
  const summaryData = [
    { name: 'Last 24h', sales: 7 },
    { name: '30 Days', sales: 93 },
    { name: 'All Time', sales: 304 },
  ];

  const topProducts = [
    {
      id: 1,
      name: 'Modern Tote',
      image: require('../assets/images/product_images/dummyShirt.jpg'),
      sales: 54,
    },
    {
      id: 2,
      name: 'Vintage Bag',
      image: require('../assets/images/product_images/dummyPants.jpg'),
      sales: 39,
    },
    {
      id: 3,
      name: 'Ethnic Clutch',
      image: require('../assets/images/product_images/DummyHandbag.jpeg'),
      sales: 29,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Chart */}
      <div>
        <h2 className="text-xl font-bold text-[#6B4226] mb-4">Sales Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summaryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#D4A5A5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Sellers */}
      <div>
        <h2 className="text-xl font-bold text-[#6B4226] mb-6">Top Selling Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#D4A5A5] rounded-lg shadow-md overflow-hidden"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder.png`;
                }}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[#6B4226]">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{product.sales} sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;