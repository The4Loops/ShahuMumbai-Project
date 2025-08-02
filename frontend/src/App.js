import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import Account from "./pages/Account";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import React from "react";
import Cart from "./pages/Cart";
import About from "./pages/About";
import AdminPanel from "./admin/AdminPanel";
import Callback from "./supabase/Callback";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ContactUs from './pages/ContactUs';
import ServicePage from "./pages/Service";
import OurPhilosophy from "./pages/OurPhilosophy";
import HeritageTimeline from "./pages/HeritageTimeline";
import OurStudios from "./pages/OurStudios";
import ContemporaryArtisans from "./pages/ContemporaryArtisans";


function App() {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={4000} // Auto dismiss after 4s
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
        <Route path="/cart" element={<Cart />} />
        <Route path="/Service" element={<ServicePage />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/ourphilosophy" element={<OurPhilosophy />} />
        <Route path="/heritagetimeline" element={<HeritageTimeline />} />
        <Route path="/ourstudios" element={<OurStudios />} />
        <Route path="/contemporaryartisans" element={<ContemporaryArtisans />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/about" element={<About />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

export default App;
