import React from "react";

const TermsPopup = ({ onClose }) => {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl font-bold text-gray-500 hover:text-gray-800"
          aria-label="Close Terms & Conditions"
        >
          &times;
        </button>

        {/* Content */}
        <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
        <p className="text-gray-600 mb-4">
          Welcome to Shahu Mumbai! By accessing or using our website, you agree to comply with and be bound by the following terms and conditions.
        </p>

        <h2 className="text-xl font-semibold mb-2">Use of Our Website</h2>
        <p className="text-gray-600 mb-4">
          You agree to use our website for lawful purposes only. You must not engage in any activity that disrupts or interferes with our services.
        </p>

        <h2 className="text-xl font-semibold mb-2">Orders & Payments</h2>
        <p className="text-gray-600 mb-4">
          All orders are subject to acceptance and availability. Prices are subject to change without notice.
        </p>

        <h2 className="text-xl font-semibold mb-2">Returns & Refunds</h2>
        <p className="text-gray-600 mb-4">
          Please refer to our Returns Policy for details on returning or exchanging products.
        </p>

        <h2 className="text-xl font-semibold mb-2">Intellectual Property</h2>
        <p className="text-gray-600 mb-4">
          All content on this site, including text, graphics, logos, and images, is the property of Shahu Mumbai and may not be used without permission.
        </p>

        <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
        <p className="text-gray-600 mb-4">
          We are not liable for any damages arising from the use or inability to use our website or products.
        </p>

        <h2 className="text-xl font-semibold mb-2">Changes to Terms</h2>
        <p className="text-gray-600 mb-4">
          We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date.
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

export default TermsPopup;
