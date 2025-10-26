import { Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, useState, Suspense as ReactSuspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { CurrencyProvider } from "./supabase/CurrencyContext";
import "./App.css";

import HomePage from "./pages/HomePage";
import Account from "./pages/Account";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import About from "./pages/About";
import AdminPanel from "./admin/AdminPanel";
import Callback from "./supabase/Callback";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ContactUs from "./pages/ContactUs";
import ServicePage from "./pages/Service";
import OurPhilosophy from "./pages/OurPhilosophy";
import HeritageTimeline from "./pages/HeritageTimeline";
import OurStudios from "./pages/OurStudios";
import ContemporaryArtisans from "./pages/ContemporaryArtisans";
import MyOrder from "./pages/MyOrder";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import useAutoLogout from "./AutoLogout";
import Blog from "./pages/Blog";
import Returns from "./pages/Returns";
import NewsletterPopup from "./layout/NewsletterSection";
import PageTracker from "./PageTracker";
import BlogsView from "./layout/BlogsView";
import WaitlistProductCard from "./pages/Waitlist";
import CollectionsPage from "./pages/CollectionsPage";
import VintageLoader from "./Loader";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy";
import AddBlogPost from "./admin/AddBlogPost";

const PageSkeleton = () => (
  <div className="min-h-screen bg-[#EDE1DF] flex items-center justify-center p-4">
    <div className="w-full max-w-4xl space-y-8 animate-pulse">
      <div className="h-16 bg-[#fdf6e9]/50 rounded-lg"></div>
      <div className="h-64 bg-[#fdf6e9]/50 rounded-2xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-[#fdf6e9]/50 rounded-xl"></div>
        ))}
      </div>
      <div className="h-20 bg-[#fdf6e9]/50 rounded-lg"></div>
    </div>
  </div>
);

function App() {
  useAutoLogout();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";

  // 1) Show loader on every route change
  useEffect(() => {
    setIsLoading(true);
  }, [location.pathname, location.search]);

  // 2) Callback that pages call once ALL their data is ready
  const handlePageLoaded = () => {
    setIsLoading(false);
  };

  const PageWrapper = ({ Component, onPageLoaded }) => (
    <Component onPageLoaded={onPageLoaded} />
  );

  return (
    <HelmetProvider>
      <CurrencyProvider>
        <Helmet>
          <html lang="en" />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="robots" content="index,follow" />
          <meta name="theme-color" content="#ffffff" />
          <meta property="og:site_name" content="Shahu Mumbai" />
          <link rel="canonical" href={siteUrl} />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shahu Mumbai",
              url: siteUrl,
              logo: `${siteUrl}/ShahuLogo.png`,
              sameAs: [
                "https://www.instagram.com/shahumumbai",
                "https://www.linkedin.com/company/shahumumbai",
              ],
            })}
          </script>
        </Helmet>

        {isLoading && <VintageLoader />}

        <PageTracker />

        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <ReactSuspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<PageWrapper Component={HomePage} onPageLoaded={handlePageLoaded} />} />
            <Route path="/home" element={<PageWrapper Component={HomePage} onPageLoaded={handlePageLoaded} />} />
            <Route path="/account" element={<PageWrapper Component={Account} onPageLoaded={handlePageLoaded} />} />
            <Route path="/products" element={<PageWrapper Component={Products} onPageLoaded={handlePageLoaded} />} />
            <Route path="/cart" element={<PageWrapper Component={Cart} onPageLoaded={handlePageLoaded} />} />
            <Route path="/Services" element={<PageWrapper Component={ServicePage} onPageLoaded={handlePageLoaded} />} />
            <Route path="/contactus" element={<PageWrapper Component={ContactUs} onPageLoaded={handlePageLoaded} />} />
            <Route path="/ourphilosophy" element={<PageWrapper Component={OurPhilosophy} onPageLoaded={handlePageLoaded} />} />
            <Route path="/heritagetimeline" element={<PageWrapper Component={HeritageTimeline} onPageLoaded={handlePageLoaded} />} />
            <Route path="/ourstudios" element={<PageWrapper Component={OurStudios} onPageLoaded={handlePageLoaded} />} />
            <Route path="/contemporaryartisans" element={<PageWrapper Component={ContemporaryArtisans} onPageLoaded={handlePageLoaded} />} />
            <Route path="/auth/callback" element={<PageWrapper Component={Callback} onPageLoaded={handlePageLoaded} />} />
            <Route path="/about" element={<PageWrapper Component={About} onPageLoaded={handlePageLoaded} />} />
            <Route path="/products/:id" element={<PageWrapper Component={ProductDetails} onPageLoaded={handlePageLoaded} />} />
            <Route path="/admin" element={<PageWrapper Component={AdminPanel} onPageLoaded={handlePageLoaded} />} />
            <Route path="/admin/addblogpost" element={<PageWrapper Component={AddBlogPost} onPageLoaded={handlePageLoaded} />} />
            <Route path="/admin/addblogpost/:id" element={<PageWrapper Component={AddBlogPost} onPageLoaded={handlePageLoaded} />} />
            <Route path="/myorder" element={<PageWrapper Component={MyOrder} onPageLoaded={handlePageLoaded} />} />
            <Route path="/wishlist" element={<PageWrapper Component={Wishlist} onPageLoaded={handlePageLoaded} />} />
            <Route path="/profile" element={<PageWrapper Component={Profile} onPageLoaded={handlePageLoaded} />} />
            <Route path="/checkout" element={<PageWrapper Component={Checkout} onPageLoaded={handlePageLoaded} />} />
            <Route path="/blog" element={<PageWrapper Component={Blog} onPageLoaded={handlePageLoaded} />} />
            <Route path="/blogs/:id" element={<PageWrapper Component={BlogsView} onPageLoaded={handlePageLoaded} />} />
            <Route path="/returns" element={<PageWrapper Component={Returns} onPageLoaded={handlePageLoaded} />} />
            <Route path="/waitlist" element={<PageWrapper Component={WaitlistProductCard} onPageLoaded={handlePageLoaded} />} />
            <Route path="/collections/:id" element={<PageWrapper Component={CollectionsPage} onPageLoaded={handlePageLoaded} />} />
            <Route path="/privacy-policy" element={<PageWrapper Component={PrivacyPolicy} onPageLoaded={handlePageLoaded} />} />
            <Route path="/terms-and-conditions" element={<PageWrapper Component={TermsAndConditions} onPageLoaded={handlePageLoaded} />} />
            <Route path="/shipping-policy" element={<PageWrapper Component={ShippingPolicy} onPageLoaded={handlePageLoaded} />} />
            <Route path="/cancellation-refund-policy" element={<PageWrapper Component={CancellationRefundPolicy} onPageLoaded={handlePageLoaded} />} />
          </Routes>
        </ReactSuspense>

        {!isLoading && <NewsletterPopup />}
      </CurrencyProvider>
    </HelmetProvider>
  );
}

export default App;
