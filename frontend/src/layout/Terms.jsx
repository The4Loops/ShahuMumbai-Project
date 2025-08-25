import React from "react";

const TermsPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl sm:text-2xl font-bold text-gray-500 hover:text-gray-800"
          aria-label="Close Terms & Conditions"
        >
          &times;
        </button>

        {/* Content */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Terms & Conditions</h1>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          By using Shahu Mumbai’s website, products, and services, you agree to
          the following terms:
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Use of Services</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          You agree to use our website and services for lawful purposes only.
          Misuse of the website, including attempts to breach security or engage
          in fraudulent activities, is strictly prohibited.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Orders & Payments</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          All orders are subject to acceptance and availability. Payments are
          processed securely through trusted partners. Shahu Mumbai reserves the
          right to refuse or cancel any order due to suspicious activity or stock
          limitations.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Shipping & Delivery</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          Delivery timelines are estimates and may vary based on location and
          circumstances. Customers are responsible for providing accurate shipping
          details.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Returns & Refunds</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          Our return and refund policy applies as stated on the website at the
          time of purchase.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Intellectual Property</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          All content on our website (logos, designs, text, and images) is the
          property of Shahu Mumbai and cannot be used without prior written
          permission.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Limitation of Liability</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          Shahu Mumbai is not liable for indirect, incidental, or consequential
          damages arising from use of our website or services.
        </p>

        <h2 className="text-lg sm:text-xl font-semibold mb-2">Governing Law</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          These terms are governed by the laws of India. Any disputes will be
          subject to the exclusive jurisdiction of Mumbai courts.
        </p>

        <p className="text-gray-500 text-xs sm:text-sm mt-6">
          Effective Date: January 1, 2025
        </p>
      </div>

      {/* Animation styles */}
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

export default TermsPopup;
