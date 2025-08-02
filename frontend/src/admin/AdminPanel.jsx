import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = [
  'Add Product',
  'Sales Report',
  'Add Admin',
  'Inventory Tracker',
  'Banner Manager',
  'Order Dashboard',
  'Analytics',
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f9f5f0] px-6 py-12 font-serif">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#6B4226] mb-10 text-center">Admin Panel</h1>

          <div className="flex gap-8">
            {/* Side Menu */}
            <div className="w-64 bg-white p-6 rounded-lg shadow border border-[#D4A5A5]">
              <div className="flex flex-col gap-4">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-left px-4 py-2 rounded-md font-medium transition ${
                      activeTab === tab
                        ? 'bg-[#D4A5A5] text-white shadow'
                        : 'text-[#6B4226] hover:bg-[#f3dede]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-white p-8 rounded-lg shadow-md border border-[#D4A5A5]">
              {activeTab === 'Add Product' && <AddProduct />}
              {activeTab === 'Sales Report' && <SalesReport />}
              {activeTab === 'Add Admin' && <AddAdmin />}
              {activeTab === 'Inventory Tracker' && <InventoryTracker />}
              {activeTab === 'Banner Manager' && <BannerManager />}
              {activeTab === 'Order Dashboard' && <OrderDashboard />}
              {activeTab === 'Analytics' && <Analytics />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const AddProduct = () => {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input type="text" placeholder="Product Name" className="input" />
      <input type="text" placeholder="Designer" className="input" />
      <input type="text" placeholder="Color" className="input" />
      <input type="text" placeholder="Category" className="input" />
      <input type="number" placeholder="Price (₹)" className="input" />
      <input type="number" placeholder="Quantity" className="input" />
      <input type="file" multiple className="input col-span-2" />
      <button
        type="submit"
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow col-span-2"
      >
        Add Product
      </button>
    </form>
  );
};

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


const SalesCard = ({ title, count }) => (
  <div className="border border-[#D4A5A5] p-6 rounded-lg shadow-md bg-[#fff8f4]">
    <h2 className="text-xl font-semibold text-[#6B4226]">{title}</h2>
    <p className="text-3xl mt-2 font-bold text-[#6B4226]">{count} Sales</p>
  </div>
);

const AddAdmin = () => {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input type="text" placeholder="Full Name" className="input" />
      <input type="email" placeholder="Email" className="input" />
      <input type="password" placeholder="Password" className="input" />
      <input type="password" placeholder="Confirm Password" className="input" />
      <button
        type="submit"
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow col-span-2"
      >
        Add Admin
      </button>
    </form>
  );
};

const InventoryTracker = () => {
  const products = [
    { name: 'Vintage Bag', quantity: 5 },
    { name: 'Tote Bag', quantity: 0 },
    { name: 'Pouch', quantity: 12 },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6B4226] mb-4">Inventory</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-[#fff1eb] text-[#6B4226]">
            <th className="p-3 border">Product</th>
            <th className="p-3 border">Quantity</th>
            <th className="p-3 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, idx) => (
            <tr key={idx} className="text-center">
              <td className="border p-2">{prod.name}</td>
              <td className="border p-2">{prod.quantity}</td>
              <td className="border p-2">
                {prod.quantity === 0 ? (
                  <span className="text-red-500 font-semibold">Out of Stock</span>
                ) : (
                  <span className="text-green-600">In Stock</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BannerManager = () => {
  return (
    <form className="grid gap-4">
      <input type="text" placeholder="Banner Title" className="input" />
      <textarea placeholder="Message/Description" className="input h-28" />
      <input type="file" accept="image/*" className="input" />
      <button
        className="bg-[#D4A5A5] hover:bg-[#C39898] text-white px-6 py-3 rounded-md transition font-semibold shadow"
      >
        Save Banner
      </button>
    </form>
  );
};

const OrderDashboard = () => {
  const orders = [
    { id: 'ORD123', customer: 'Riya', status: 'Pending' },
    { id: 'ORD124', customer: 'Aarav', status: 'Shipped' },
    { id: 'ORD125', customer: 'Kunal', status: 'Delivered' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6B4226] mb-4">Recent Orders</h2>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex justify-between items-center p-4 border rounded-md bg-[#fff8f4]"
          >
            <span>{order.id} - {order.customer}</span>
            <span
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                order.status === 'Delivered' ? 'bg-green-200' :
                order.status === 'Shipped' ? 'bg-yellow-200' :
                'bg-red-200'
              }`}
            >
              {order.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Analytics = () => {
  const metrics = [
    { title: 'Total Users', value: 134 },
    { title: 'Returning Visitors', value: 27 },
    { title: 'Conversion Rate', value: '4.3%' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {metrics.map((metric, idx) => (
        <div key={idx} className="bg-[#fff8f4] p-6 rounded-lg border shadow text-center">
          <h3 className="text-lg text-[#6B4226] font-semibold">{metric.title}</h3>
          <p className="text-3xl text-[#6B4226] font-bold mt-2">{metric.value}</p>
        </div>
      ))}
    </div>
  );
};




export default AdminPanel;
