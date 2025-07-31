import React from 'react';
import Navbar from './navbar/Navbar';
import Footer from './footer/Footer';

function Layout({ children }) {
  return (
    <div className="bg-[#D4A5A5] flex flex-col min-h-screen bg-white text-black font-serif">
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mt-32 mx-auto py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default Layout;
