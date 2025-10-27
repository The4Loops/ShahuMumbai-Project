import { Routes, Route } from "react-router-dom";
import React from "react";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy";
import AddBlogPost from "./admin/AddBlogPost";

function App() {
  useAutoLogout();

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.shahumumbai.com";

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

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/account" element={<Account />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/Services" element={<ServicePage />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/ourphilosophy" element={<OurPhilosophy />} />
          <Route path="/heritagetimeline" element={<HeritageTimeline />} />
          <Route path="/ourstudios" element={<OurStudios />} />
          <Route path="/contemporaryartisans" element={<ContemporaryArtisans />} />
          <Route path="/auth/callback" element={<Callback />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/addblogpost" element={<AddBlogPost />} />
          <Route path="/admin/addblogpost/:id" element={<AddBlogPost />} />
          <Route path="/myorder" element={<MyOrder />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blogs/:id" element={<BlogsView />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/waitlist" element={<WaitlistProductCard />} />
          <Route path="/collections/:id" element={<CollectionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
        </Routes>

        <NewsletterPopup />
      </CurrencyProvider>
    </HelmetProvider>
  );
}

export default App;
