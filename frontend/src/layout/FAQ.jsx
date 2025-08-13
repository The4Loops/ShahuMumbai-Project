import React, { useState } from "react";
import { IoChevronDown } from "react-icons/io5";

const faqs = [
  {
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy. If you're not satisfied with your purchase, you can return it within 30 days for a full refund.",
  },
  {
    question: "Do you offer international shipping?",
    answer:
      "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary depending on the destination.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order is shipped, you'll receive an email with a tracking number and a link to track your package.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "You can change or cancel your order within 24 hours of purchase by contacting our support team.",
  },
];

function FAQPopup({ onClose }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full mx-4 overflow-y-auto max-h-[90vh]">
        {/* Header with Close Button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <section className="p-6 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 cursor-pointer transition hover:shadow-md"
              onClick={() => toggleFAQ(index)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <IoChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-300 ease-in-out ${
                    openIndex === index ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-gray-600 animate-fadeIn">{faq.answer}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
export default FAQPopup;