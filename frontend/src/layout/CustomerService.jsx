import React from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

function CustomerServicePopup({ onClose }) {


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full mx-4 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Customer Service</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-lg text-gray-600 mb-8 text-center">
            We’re here to help. Whether you have a question about your order, our products, or our policies, our team is ready to assist you.
          </p>

          {/* Contact Info */}
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaPhoneAlt className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaEnvelope className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-600">support@example.com</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow p-6 text-center">
              <FaMapMarkerAlt className="mx-auto text-3xl text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Address</h3>
              <p className="text-gray-600">123 Main Street, Mumbai, India</p>
            </div>
          </div>

          {/* Contact Form */}
          <form className="bg-gray-50 rounded-xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Your Email"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                rows="4"
                placeholder="How can we help you?"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default CustomerServicePopup;