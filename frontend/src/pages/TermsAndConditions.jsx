import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";

export default function TermsAndConditions() {
  return (
    <Layout>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-gray-800">
        <Helmet>
          <title>Terms & Conditions | Shahu Mumbai</title>
          <meta
            name="description"
            content="Terms of use for the Shahu Mumbai website, orders, and services."
          />
          <link
            rel="canonical"
            href="https://www.shahumumbai.com/terms-and-conditions"
          />
        </Helmet>

        {/* Page Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-gray-900">
            Terms & Conditions
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            By using Shahu Mumbai’s website, products, and services, you agree
            to the following terms and conditions.
          </p>
        </header>

        {/* Terms Sections */}
        <section className="space-y-8">
          {[
            {
              title: "Use of Services",
              content:
                "Use our website for lawful purposes only. Attempts to breach security or engage in fraudulent activities are strictly prohibited.",
            },
            {
              title: "Orders & Payments",
              content:
                "All orders are subject to acceptance and availability. Payments are processed securely through trusted partners. We may refuse or cancel orders due to suspicious activity or stock limitations.",
            },
            {
              title: "Shipping & Delivery",
              content:
                "Delivery timelines are estimates and may vary by location and conditions. Customers must provide accurate shipping details to ensure timely delivery.",
            },
            {
              title: "Returns & Refunds",
              content: (
                <>
                  Our return and refund policy applies as stated on the website
                  at the time of purchase. Please refer to our{" "}
                  <a
                    href="/cancellation-and-refund-policy"
                    className="text-blue-600 hover:text-blue-700 underline transition"
                  >
                    Cancellation & Refund Policy
                  </a>{" "}
                  for more information.
                </>
              ),
            },
            {
              title: "Intellectual Property",
              content:
                "All content including logos, designs, text, and images is the property of Shahu Mumbai and cannot be used without prior written permission.",
            },
            {
              title: "Limitation of Liability",
              content:
                "Shahu Mumbai is not liable for indirect, incidental, or consequential damages arising from the use of our website or services, to the maximum extent permitted by law.",
            },
            {
              title: "Governing Law",
              content:
                "These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of Mumbai courts.",
            },
          ].map((section, idx) => (
            <div
              key={idx}
              className="p-6 bg-white shadow-sm rounded-lg border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {section.title}
              </h2>
              <p className="text-gray-700 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </section>

        {/* Footer Note */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Effective Date: <span className="font-medium">January 1, 2025</span>
          </p>
        </footer>
      </main>
    </Layout>
  );
}
