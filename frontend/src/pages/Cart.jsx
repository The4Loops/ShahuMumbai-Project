import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTrashAlt } from "react-icons/fa";
import { LuShieldCheck, LuTruck, LuRotateCcw } from "react-icons/lu";
import Layout from "../layout/Layout";
import { useNavigate } from "react-router-dom";

const initialItems = [
  {
    id: 1,
    title: "Vintage Silk Scarf Collection",
    category: "Accessories",
    price: 89.99,
    oldPrice: 129.99,
    quantity: 2,
    inStock: true,
    discount: 31,
  },
  {
    id: 2,
    title: "Antique Leather Handbag",
    category: "Bags",
    price: 149.99,
    oldPrice: 199.99,
    quantity: 1,
    inStock: true,
    discount: 25,
  },
  {
    id: 3,
    title: "Victorian Pearl Brooch",
    category: "Jewelry",
    price: 75.0,
    oldPrice: null,
    quantity: 1,
    inStock: true,
  },
];

const categoryColors = {
  Accessories: "bg-yellow-50",
  Bags: "bg-rose-50",
  Jewelry: "bg-indigo-50",
};

function Cart() {
  const [cartItems, setCartItems] = useState(initialItems);
  const [promoCode, setPromoCode] = useState("");
  const navigate = useNavigate();

  const handleQuantityChange = (id, delta) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleRemove = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = 36.08;
  const total = subtotal + tax;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto bg-[#f9f5f0] min-h-screen">
        <h2 className="text-3xl font-bold mb-6 text-center">
          🛒 Shopping Cart
        </h2>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.id}
                className={`${
                  categoryColors[item.category] || "bg-white"
                } p-4 sm:p-6 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start gap-4`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex-1">
                  <p className="text-xs uppercase text-gray-500 mb-1">
                    {item.category}
                  </p>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-red-500 font-semibold">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.oldPrice && (
                      <span className="line-through text-gray-400">
                        ${item.oldPrice.toFixed(2)}
                      </span>
                    )}
                    {item.discount && (
                      <span className="text-white bg-pink-500 px-2 py-0.5 text-xs rounded-full">
                        -{item.discount}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <span className="text-gray-700 font-medium text-md">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-xl shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-xl font-bold mb-4">Order Summary</h4>

            {/* Promo Code */}
            <div className="mb-4">
              <label
                htmlFor="promo"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="promo"
                  placeholder="Enter code"
                  className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm">
                  Apply
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-500 font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <hr className="my-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Proceed to Checkout
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
              Estimated delivery in 3–5 business days
            </p>
          </motion.div>
        </div>

        {/* Feature Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gray-100 rounded-xl px-4 py-6 sm:px-8 flex flex-col sm:flex-row justify-around items-center text-center gap-6"
        >
          <div className="flex flex-col items-center gap-2">
            <LuShieldCheck className="text-green-600 text-2xl" />
            <p className="font-medium text-sm">Secure Checkout</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LuTruck className="text-blue-600 text-2xl" />
            <p className="font-medium text-sm">Free Shipping Over $100</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LuRotateCcw className="text-purple-600 text-2xl" />
            <p className="font-medium text-sm">30-Day Returns</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

export default Cart;
