import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import SalesReport from './SalesReport';
import AddProduct from './AddProduct';
import InventoryTracker from './InventioryTracker';
import BannerManager from './BannerManager';
import OrderDashboard from './OrderDashboard';
import Analytics from './Analytics';
import AddCategory from './AddCategory';
import AddAdmin from './AddAdmin';
import { FaBars, FaTimes } from 'react-icons/fa';

const TABS = [
  'Add Product',
  'Sales Report',
  'Add Admin',
  'Inventory Tracker',
  'Banner Manager',
  'Order Dashboard',
  'Analytics',
  'Add Category',
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); 
    };

    handleResize(); 
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f9f5f0] px-6 py-12 font-serif">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#6B4226] mb-10 text-center">Admin Panel</h1>

          {/* Mobile Toggle Button */}
          {isMobile && (
            <div className="mb-4 flex justify-end">
              <button
                className="text-[#6B4226] text-2xl border border-[#D4A5A5] px-3 py-2 rounded-md"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Toggle Sidebar"
              >
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            {(isSidebarOpen || !isMobile) && (
              <div className="w-full lg:w-80 bg-white p-6 rounded-lg shadow border border-[#D4A5A5]">
                <div className="flex flex-col gap-4">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        if (isMobile) setIsSidebarOpen(false);
                      }}
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
            )}

            {/* Tab Content */}
            <div className="w-full bg-white p-6 rounded-lg shadow-md border border-[#D4A5A5]">
              {activeTab === 'Add Product' && <AddProduct />}
              {activeTab === 'Sales Report' && <SalesReport />}
              {activeTab === 'Add Admin' && <AddAdmin />}
              {activeTab === 'Inventory Tracker' && <InventoryTracker />}
              {activeTab === 'Banner Manager' && <BannerManager />}
              {activeTab === 'Order Dashboard' && <OrderDashboard />}
              {activeTab === 'Analytics' && <Analytics />}
              {activeTab === 'Add Category' && <AddCategory />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const SalesCard = ({ title, count }) => (
  <div className="border border-[#D4A5A5] p-6 rounded-lg shadow-md bg-[#fff8f4]">
    <h2 className="text-xl font-semibold text-[#6B4226]">{title}</h2>
    <p className="text-3xl mt-2 font-bold text-[#6B4226]">{count} Sales</p>
  </div>
);

export default AdminPanel;
