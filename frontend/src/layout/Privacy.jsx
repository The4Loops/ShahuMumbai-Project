import React from "react";

const PrivacyPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-800"
          aria-label="Close Privacy Policy"
        >
          &times;
        </button>

        {/* Content */}
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">
          At Shahu Mumbai, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information.
        </p>

        <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
        <p className="text-gray-600 mb-4">
          We may collect information such as your name, email address, phone number, shipping address, and payment details when you place an order or sign up for our newsletter.
        </p>

        <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
        <p className="text-gray-600 mb-4">
          We use your information to process orders, improve our services, send marketing communications, and respond to your inquiries.
        </p>

        <h2 className="text-xl font-semibold mb-2">Data Security</h2>
        <p className="text-gray-600 mb-4">
          We implement industry-standard measures to protect your personal information from unauthorized access, disclosure, or misuse.
        </p>

        <h2 className="text-xl font-semibold mb-2">Your Rights</h2>
        <p className="text-gray-600 mb-4">
          You may request access, correction, or deletion of your personal information at any time by contacting us.
        </p>

        <h2 className="text-xl font-semibold mb-2">Changes to This Policy</h2>
        <p className="text-gray-600 mb-4">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
        </p>

        <p className="text-gray-500 text-sm mt-6">Effective Date: January 1, 2025</p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PrivacyPopup;
