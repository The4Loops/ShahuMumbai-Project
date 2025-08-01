import React from 'react';
import Navbar from './navbar/Navbar';
import Footer from './footer/Footer';

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f9f5f0] text-black font-serif">
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl mt-20 md:mt-32 mx-auto py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;

