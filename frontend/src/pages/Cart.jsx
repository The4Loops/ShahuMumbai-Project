import React, { useState } from "react";
import Layout from "../layout/Layout";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Wireless Headphones",
      price: 99.99,
      quantity: 1,
      image: "https://placehold.co/100x100?text=Headphones",
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 149.99,
      quantity: 2,
      image: "https://placehold.co/100x100?text=Watch",
    },
  ]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "",
    notes: "",
  });

  const updateQuantity = (id, amount) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 49;
  const tax = 18;
  const grandTotal = total + shipping + tax;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    const { fullName, email, phone, address, paymentMethod } = form;
    if (fullName && email && phone && address && paymentMethod) {
      setIsPlacingOrder(true);
      setTimeout(() => {
        alert("Order placed successfully!");

        // Reset everything
        setIsPlacingOrder(false);
        setForm({
          fullName: "",
          email: "",
          phone: "",
          address: "",
          paymentMethod: "",
          notes: "",
        });
        setCartItems([]);
        setShowCheckout(false);
      }, 2000);
    } else {
      alert("Please fill all required fields.");
    }
  };

  const MotionButton = ({ children, ...props }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
      {...props}
    >
      {children}
    </motion.button>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto text-[#3C2A21]">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center">
          {showCheckout ? "Complete Your Order" : "Your Cart"}
        </h1>

        <AnimatePresence mode="wait">
          {!showCheckout ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4 }}
            >
              {cartItems.length === 0 ? (
                <p className="text-center text-lg text-[#6B4226]">
                  Your cart is empty.
                </p>
              ) : (
                <>
                  <div className="grid gap-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#E4C8B0] p-4 rounded-lg shadow bg-[#FAF4EF]"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-[#D8BBA3]"
                          />
                          <div>
                            <h2 className="text-lg sm:text-xl font-semibold">{item.name}</h2>
                            <p className="text-[#6B4226] font-medium">
                              ₹{item.price.toFixed(2)}
                            </p>
                            <div className="flex items-center mt-2 gap-2">
                              <button
                                className="px-3 py-1 border border-[#C8A491] rounded hover:bg-[#F2E7DE]"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                -
                              </button>
                              <span className="px-3">{item.quantity}</span>
                              <button
                                className="px-3 py-1 border border-[#C8A491] rounded hover:bg-[#F2E7DE]"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-lg font-semibold text-[#6B4226]">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            className="mt-2 text-[#A14D4D] hover:text-[#832f2f] text-sm underline"
                            onClick={() => removeItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 border-t border-[#E4C8B0] flex justify-between text-xl font-semibold">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <MotionButton
                      className="bg-[#A97474] text-white px-6 py-2 rounded text-lg hover:bg-[#8c5c5c] transition"
                      onClick={() => setShowCheckout(true)}
                    >
                      Proceed to Checkout
                    </MotionButton>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 gap-8 bg-[#FFF8F4] p-6 rounded-lg border border-[#E4C8B0] shadow mt-4"
            >
              {/* Checkout Form */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    placeholder="Full Name *"
                    className="w-full border p-2 rounded"
                    onChange={handleFormChange}
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    placeholder="Email Address *"
                    className="w-full border p-2 rounded"
                    onChange={handleFormChange}
                  />
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    placeholder="Phone Number *"
                    className="w-full border p-2 rounded"
                    onChange={handleFormChange}
                  />
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    placeholder="Shipping Address *"
                    className="w-full border p-2 rounded"
                    onChange={handleFormChange}
                  />
                  <select
                    name="paymentMethod"
                    className="w-full border p-2 rounded"
                    onChange={handleFormChange}
                    value={form.paymentMethod}
                  >
                    <option value="" disabled>Select Payment Method *</option>
                    <option value="COD">Cash on Delivery</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Card">Credit/Debit Card</option>
                  </select>
                  <textarea
                    name="notes"
                    value={form.notes}
                    placeholder="Any special instructions? (Optional)"
                    className="w-full border p-2 rounded"
                    rows="3"
                    onChange={handleFormChange}
                  ></textarea>
                </div>

                <div className="mt-6 flex justify-between gap-4">
                  <MotionButton
                    className="border border-[#A97474] px-4 py-2 rounded"
                    onClick={() => setShowCheckout(false)}
                  >
                    Back to Cart
                  </MotionButton>
                  <MotionButton
                    className="bg-[#A97474] text-white px-6 py-2 rounded text-lg hover:bg-[#8c5c5c] transition w-full sm:w-auto"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? (
                      <div className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          ></path>
                        </svg>
                        <span>Placing Order...</span>
                      </div>
                    ) : (
                      "Place Order"
                    )}
                  </MotionButton>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-[#D8BBA3] p-4 rounded shadow">
                <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between mb-2">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-3 pt-3 text-lg">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>₹{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl mt-2">
                    <span>Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Cart;
