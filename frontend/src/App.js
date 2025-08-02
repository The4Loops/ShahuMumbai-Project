import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import Account from './pages/Account';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails'
import React from 'react'
import Cart from './pages/Cart';
import About from './pages/About';
import AdminPanel from './admin/AdminPanel';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/products" element={<Products />} />
         <Route path="/cart" element={<Cart />} />
         <Route path="/about" element={<About />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

export default App;