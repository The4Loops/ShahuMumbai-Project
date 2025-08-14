import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import SalesReport from './SalesReport';
import AddProduct from './AddProduct';
import InventoryTracker from './InventioryTracker';
import BannerManager from './BannerManager';
import OrderDashboard from './OrderDashboard';
import Analytics from './Analytics';
import AddCategory from './AddCategory';
import AddBlogPost from './AddBlogPost';
import EmployeeManagement from './EmployeeManagement';
import TeamManagement from './TeamManagement';
import Tables from './Tables'; // ✅ Updated import

import { FaBars, FaTimes } from 'react-icons/fa';

const TABS = [
  'Add Product',
  'Sales Report',
  'Inventory Tracker',
  'Banner Manager',
  'Order Dashboard',
  'Analytics',
  'Add Category',
  'Add Blog Post',
  'Employee Management',
  'Team Management',
  'Table',
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    if (isSidebarOpen) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  const Sidebar = (
    <div className="flex flex-col gap-3">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => {
            setActiveTab(tab);
            if (isMobile) setIsSidebarOpen(false);
          }}
          className={`text-left px-4 py-3 rounded-md font-medium transition
            ${activeTab === tab
              ? 'bg-[#D4A5A5] text-white shadow'
              : 'text-[#6B4226] hover:bg-[#f3dede]'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#f9f5f0] px-4 sm:px-6 lg:px-8 py-6 lg:py-12 font-serif">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6B4226]">
              Admin Panel
            </h1>

            {isMobile && (
              <button
                className="text-[#6B4226] text-2xl border border-[#D4A5A5] px-3 py-2 rounded-md"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Toggle Sidebar"
              >
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
            )}
          </div>

          {/* Mobile Toggle / Pills */}
          {isMobile && (
            <div className="mb-4 relative flex overflow-x-auto rounded-full border border-gray-300">
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${100 / TABS.length}%`,
                  transform: `translateX(${TABS.indexOf(activeTab) * 100}%)`,
                }}
              ></div>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex-shrink-0 py-2 px-4 whitespace-nowrap rounded-full z-10 transition-colors duration-300 ${
                    activeTab === tab
                      ? 'text-white font-semibold'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative">
            <div className="hidden lg:block w-full lg:w-80 bg-white p-6 rounded-lg shadow border border-[#D4A5A5] h-fit sticky top-24">
              {Sidebar}
            </div>

            {isMobile && isSidebarOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 z-40"
                  onClick={() => setIsSidebarOpen(false)}
                />
                <aside
                  className="fixed z-50 top-0 left-0 h-full w-80 max-w-[85vw] bg-white p-6 shadow-2xl border-r border-[#D4A5A5] rounded-r-xl"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#6B4226]">Menu</h2>
                    <button
                      className="text-[#6B4226] text-xl border border-[#D4A5A5] px-2 py-1 rounded-md"
                      onClick={() => setIsSidebarOpen(false)}
                      aria-label="Close Sidebar"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  {Sidebar}
                </aside>
              </>
            )}

            <div className="w-full bg-white p-4 sm:p-6 rounded-lg shadow-md border border-[#D4A5A5]">
              {activeTab === 'Add Product' && <AddProduct />}
              {activeTab === 'Sales Report' && <SalesReport />}
              {activeTab === 'Inventory Tracker' && <InventoryTracker />}
              {activeTab === 'Banner Manager' && <BannerManager />}
              {activeTab === 'Order Dashboard' && <OrderDashboard />}
              {activeTab === 'Analytics' && <Analytics />}
              {activeTab === 'Add Category' && <AddCategory />}
              {activeTab === 'Add Blog Post' && <AddBlogPost />}
              {activeTab === 'Employee Management' && <EmployeeManagement />}
              {activeTab === 'Team Management' && <TeamManagement />}
              {activeTab === 'Table' && <Tables />} {/* ✅ Updated Table */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
