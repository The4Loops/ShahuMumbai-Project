import React from "react";
import { Helmet } from "react-helmet-async";

function ReturnsPopup({ onClose }) {
  // Build minimal FAQPage JSON-LD from your visible content
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is your return policy?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "You may return items within 30 days of delivery for a full refund, provided they are unused, in original packaging, and accompanied by proof of purchase. Certain items (e.g., final sale) may not be eligible.",
        },
      },
      {
        "@type": "Question",
        name: "How do I return an item?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Login to My Orders, choose the order, click Request Return, pack the item securely in original packaging, and ship with the provided label.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer exchanges?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Please initiate a return for the original item and place a new order for your preferred size or color.",
        },
      },
      {
        "@type": "Question",
        name: "When will I get my refund?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Refunds are processed to your original payment method within 5–7 business days after we receive and inspect the returned item.",
        },
      },
      {
        "@type": "Question",
        name: "How can I contact support?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Email support@example.com or call +1 (555) 123-4567 for help with the return process.",
        },
      },
    ],
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="returns-title"
      aria-describedby="returns-content"
    >
      {/* JSON-LD lives inside the modal (non-visual) */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </script>
      </Helmet>

      <div className="bg-gray-50 rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto font-serif">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 flex justify-between items-center px-6 py-4 rounded-t-2xl">
          <h2 id="returns-title" className="text-xl md:text-2xl font-bold">
            Returns &amp; Exchanges
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-2xl font-bold"
            aria-label="Close returns and exchanges dialog"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div id="returns-content" className="p-6 space-y-8">
          {/* Policy Overview */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-3">
              Return Policy
            </h3>
            <p className="text-gray-700 leading-relaxed">
              You may return items within <strong>30 days</strong> of delivery for a full refund, provided they are unused, in original packaging, and accompanied by proof of purchase.
              Certain items, such as final sale products, may not be eligible for returns.
            </p>
          </div>

          {/* Steps to Return */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-3">
              How to Return an Item
            </h3>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>Log in to your account and navigate to "My Orders".</li>
              <li>Select the order containing the item you wish to return.</li>
              <li>Click "Request Return" and follow the instructions.</li>
              <li>Pack the item securely in its original packaging.</li>
              <li>Ship the item using the provided return label.</li>
            </ol>
          </div>

          {/* Exchanges */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-3">Exchanges</h3>
            <p className="text-gray-700 leading-relaxed">
              If you wish to exchange an item for a different size or color, please initiate a return for the original item and place a new order.
              This ensures you receive your desired item quickly and avoids stock shortages.
            </p>
          </div>

          {/* Refund Information */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-3">Refunds</h3>
            <p className="text-gray-700 leading-relaxed">
              Refunds are processed to your original payment method within <strong>5-7 business days</strong> after we receive and inspect the returned item.
              You will receive an email confirmation once your refund is issued.
            </p>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-3">Need Help?</h3>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about our return process, please contact our support team at{" "}
              <a
                href="mailto:support@example.com"
                className="text-blue-600 hover:underline"
              >
                support@example.com
              </a>{" "}
              or call us at <span className="font-medium">+1 (555) 123-4567</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReturnsPopup;
