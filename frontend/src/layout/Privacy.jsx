import React from "react";

const PrivacyPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white max-w-lg w-full rounded-lg relative animate-fadeIn max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black font-bold text-lg sm:text-xl"
        >
          ✕
        </button>

        {/* Content */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          At Shahu Mumbai, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Information We Collect</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          We may collect information such as your name, email address, phone number, shipping address, and payment details when you place an order or sign up for our newsletter.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">How We Use Your Information</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          We use your information to process orders, improve our services, send marketing communications, and respond to your inquiries.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Data Security</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          We implement industry-standard measures to protect your personal information from unauthorized access, disclosure, or misuse.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Your Rights</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          You may request access, correction, or deletion of your personal information at any time by contacting us.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Changes to This Policy</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
        </p>

        <p className="text-gray-500 text-xs sm:text-sm mt-6">Effective Date: January 1, 2025</p>
      </div>

      <style>{`
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
