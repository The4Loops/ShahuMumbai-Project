import React, { useState } from "react";
import Layout from "../layout/Layout";

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

  const [showBill, setShowBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

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

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto text-[#3C2A21]">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center">Your Cart</h1>

        {!showBill && (
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
              <button
                className="bg-[#A97474] text-white px-6 py-2 rounded text-lg hover:bg-[#8c5c5c] transition"
                onClick={() => setShowBill(true)}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}

        {showBill && (
          <div className="mt-8 bg-[#FFF8F4] p-6 rounded-lg border border-[#E4C8B0] shadow">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Bill Summary</h2>
            <ul className="mb-4">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between py-2 border-b border-[#E4C8B0]"
                >
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-xl font-bold border-t pt-3 border-[#E4C8B0]">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <div className="mt-6 mb-4">
              <h3 className="text-lg font-medium mb-2">Select Payment Method:</h3>
              <div className="flex flex-col gap-2">
                {['COD', 'UPI', 'Card'].map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    {method === "COD" && "Cash on Delivery"}
                    {method === "UPI" && "UPI (Google Pay / PhonePe)"}
                    {method === "Card" && "Credit/Debit Card"}
                  </label>
                ))}
              </div>

              {paymentMethod === "UPI" && (
                <div className="mt-3">
                  <label className="block mb-1 text-sm text-[#6B4226] font-medium">
                    Enter UPI ID:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. name@upi"
                    className="w-full border border-[#D8BBA3] px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#A97474]"
                  />
                </div>
              )}

              {paymentMethod === "Card" && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block mb-1 text-sm text-[#6B4226] font-medium">
                      Card Number:
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full border border-[#D8BBA3] px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#A97474]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block mb-1 text-sm text-[#6B4226] font-medium">
                        Expiry Date:
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full border border-[#D8BBA3] px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#A97474]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 text-sm text-[#6B4226] font-medium">
                        CVV:
                      </label>
                      <input
                        type="password"
                        placeholder="123"
                        className="w-full border border-[#D8BBA3] px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#A97474]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
              <button
                className="px-5 py-2 border border-[#A97474] rounded hover:bg-[#f1dddb]"
                onClick={() => setShowBill(false)}
              >
                Back to Cart
              </button>
              <button className="bg-[#A97474] text-white px-6 py-2 rounded text-lg hover:bg-[#8c5c5c] transition">
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;