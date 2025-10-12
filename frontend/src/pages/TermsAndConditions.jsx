import React from "react";
import { Helmet } from "react-helmet-async";

export default function TermsAndConditions() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Helmet>
        <title>Terms & Conditions | Shahu Mumbai</title>
        <meta name="description" content="Terms of use for the Shahu Mumbai website, orders, and services." />
        <link rel="canonical" href="https://www.shahumumbai.com/terms-and-conditions" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <p className="text-gray-600 mb-4">
        By using Shahu Mumbai’s website, products, and services, you agree to the following terms.
      </p>

      <h2 className="text-xl font-semibold mb-2">Use of Services</h2>
      <p className="text-gray-600 mb-4">
        Use our website for lawful purposes only. Attempts to breach security or engage in fraudulent activities are
        prohibited.
      </p>

      <h2 className="text-xl font-semibold mb-2">Orders & Payments</h2>
      <p className="text-gray-600 mb-4">
        All orders are subject to acceptance and availability. Payments are processed securely through trusted partners.
        We may refuse or cancel orders due to suspicious activity or stock limitations.
      </p>

      <h2 className="text-xl font-semibold mb-2">Shipping & Delivery</h2>
      <p className="text-gray-600 mb-4">
        Delivery timelines are estimates and may vary by location and conditions. Customers must provide accurate
        shipping details.
      </p>

      <h2 className="text-xl font-semibold mb-2">Returns & Refunds</h2>
      <p className="text-gray-600 mb-4">
        Our return and refund policy applies as stated on the website at the time of purchase. See{" "}
        <a href="/cancellation-and-refund-policy" className="text-blue-600 underline">
          Cancellation & Refund Policy
        </a>.
      </p>

      <h2 className="text-xl font-semibold mb-2">Intellectual Property</h2>
      <p className="text-gray-600 mb-4">
        All content (logos, designs, text, images) is the property of Shahu Mumbai and cannot be used without prior
        written permission.
      </p>

      <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
      <p className="text-gray-600 mb-4">
        Shahu Mumbai is not liable for indirect, incidental, or consequential damages arising from the use of our
        website or services, to the maximum extent permitted by law.
      </p>

      <h2 className="text-xl font-semibold mb-2">Governing Law</h2>
      <p className="text-gray-600 mb-6">
        These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of
        Mumbai courts.
      </p>

      <p className="text-gray-500 text-sm">Effective Date: January 1, 2025</p>
    </main>
  );
}
