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
          At Shahu, your privacy is of utmost importance to us. We are committed
          to protecting your personal information and ensuring a safe and secure
          shopping experience. This Privacy Policy explains how we collect, use,
          and safeguard your data when you interact with our website, products,
          and services.
        </p>

        {/* Information We Collect */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          Information We Collect
        </h2>
        <ul className="list-disc list-inside text-gray-600 mb-4 text-sm sm:text-base space-y-2">
          <li>
            Personal details such as name, email address, phone number, and
            shipping/billing address.
          </li>
          <li>
            Payment information (processed securely through our payment partners;
            we do not store full card details unless you choose to save them for
            future use).
          </li>
          <li>
            Browsing information such as IP address, device type, and pages
            visited on our site.
          </li>
          <li>
            Any information you voluntarily share with us (e.g., customer
            support queries, sign-ups, or surveys).
          </li>
        </ul>

        {/* How We Use */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          How We Use Your Information
        </h2>
        <ul className="list-disc list-inside text-gray-600 mb-4 text-sm sm:text-base space-y-2">
          <li>Process and fulfill your orders.</li>
          <li>
            Communicate with you regarding your purchases, updates, and brand
            news.
          </li>
          <li>Improve our website, products, and customer experience.</li>
          <li>Provide personalized recommendations and exclusive offers.</li>
          <li>Comply with legal and regulatory obligations.</li>
        </ul>

        {/* Sharing */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          Sharing Your Information
        </h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          Shahu Mumbai does not sell, trade, or rent your personal data. We may
          share information only with:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-4 text-sm sm:text-base space-y-2">
          <li>
            Trusted third-party service providers who help us operate our
            website, process payments, or deliver orders.
          </li>
          <li>
            Legal authorities if required by law or to protect our rights in
            cases of disputes.
          </li>
        </ul>

        {/* Data Security */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Data Security</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          We implement industry-standard security measures to protect your
          personal information. While no method of transmission over the
          internet is 100% secure, we take all reasonable steps to ensure your
          data is handled with care.
        </p>

        {/* Cookies */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Cookies</h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          Our website uses cookies and similar technologies to enhance browsing,
          analyze performance, and personalize content. You can disable cookies
          in your browser, but some features may not function properly.
        </p>

        {/* Your Rights */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Your Rights</h2>
        <ul className="list-disc list-inside text-gray-600 mb-4 text-sm sm:text-base space-y-2">
          <li>Access, correct, or delete your personal data.</li>
          <li>Opt out of marketing communications.</li>
          <li>Request details on how your data is used.</li>
        </ul>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          To exercise these rights, contact us at{" "}
          <a
            href="mailto:bhumi.founder@shahumumbai.com"
            className="text-blue-600 underline"
          >
            bhumi.founder@shahumumbai.com
          </a>
          .
        </p>

        {/* Updates */}
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          Updates to This Policy
        </h2>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">
          We may update this Privacy Policy from time to time. The updated
          version will always be available on our website with a “Last Updated”
          date.
        </p>

        <p className="text-gray-500 text-xs sm:text-sm mt-6">
          Last Updated: January 1, 2025
        </p>
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
