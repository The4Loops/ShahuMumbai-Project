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
import AddBlogPost from './AddBlogPost';
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
  'Add Blog Post',
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

  // Close drawer with ESC
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6B4226]">Admin Panel</h1>

            {/* Mobile Toggle Button */}
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

          {/* Mobile Tab Picker (quick jump without opening drawer) */}
          {isMobile && (
            <div className="mb-4">
              <label className="sr-only" htmlFor="tabPicker">Select admin section</label>
              <select
                id="tabPicker"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full border border-[#D4A5A5] bg-white rounded-md px-3 py-2 text-[#6B4226] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
              >
                {TABS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative">
            {/* Sidebar (desktop static) */}
            <div className="hidden lg:block w-full lg:w-80 bg-white p-6 rounded-lg shadow border border-[#D4A5A5] h-fit sticky top-24">
              {Sidebar}
            </div>

            {/* Off-canvas Sidebar (mobile) */}
            {isMobile && isSidebarOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/40 z-40"
                  onClick={() => setIsSidebarOpen(false)}
                />
                {/* Drawer */}
                <aside
                  className="fixed z-50 top-0 left-0 h-full w-80 max-w-[85vw] bg-white p-6 shadow-2xl border-r border-[#D4A5A5]
                             rounded-r-xl"
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

            {/* Tab Content */}
            <div className="w-full bg-white p-4 sm:p-6 rounded-lg shadow-md border border-[#D4A5A5]">
              {activeTab === 'Add Product' && <AddProduct />}
              {activeTab === 'Sales Report' && <SalesReport />}
              {activeTab === 'Add Admin' && <AddAdmin />}
              {activeTab === 'Inventory Tracker' && <InventoryTracker />}
              {activeTab === 'Banner Manager' && <BannerManager />}
              {activeTab === 'Order Dashboard' && <OrderDashboard />}
              {activeTab === 'Analytics' && <Analytics />}
              {activeTab === 'Add Category' && <AddCategory />}
              {activeTab === 'Add Blog Post' && <AddBlogPost />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
