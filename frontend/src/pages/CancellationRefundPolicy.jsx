import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";

export default function CancellationRefundPolicy() {
  return (
    <Layout>
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:px-10">
        <Helmet>
          <title>Cancellation & Refund Policy | Shahu Mumbai</title>
          <meta
            name="description"
            content="Official policy for cancellations, returns, exchanges, and refunds at Shahu Mumbai."
          />
          <link
            rel="canonical"
            href="https://www.shahumumbai.com/cancellation-and-refund-policy"
          />
        </Helmet>

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Cancellation & Refund Policy
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Clear timelines and simple steps to cancel, return, or exchange your
            order.
          </p>
        </header>

        <section className="space-y-10 text-gray-700 leading-relaxed">
          {/* Cancellation Policy */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Cancellation Policy
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Orders can be <span className="font-medium">cancelled within 24 hours</span> of purchase for a{" "}
                <span className="font-medium">full refund</span>.
              </li>
              <li>
                If an order has already shipped, cancellation isn’t possible. In such cases, customers may request a{" "}
                <span className="font-medium">partial refund</span> (case-by-case) or initiate a return if eligible.
              </li>
            </ul>
          </div>

          {/* Return Eligibility */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Return Eligibility
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                All orders are eligible for return within{" "}
                <span className="font-medium">48 hours (2 days)</span> of
                receiving the product.
              </li>
              <li>
                Items must be <span className="font-medium">unused</span>, in{" "}
                <span className="font-medium">original condition</span>, with{" "}
                <span className="font-medium">tags</span> and{" "}
                <span className="font-medium">original packaging</span> intact.
              </li>
            </ul>
          </div>

          {/* Non-Returnable Items */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Non-Returnable Items
            </h2>
            <p className="mb-2">
              For hygiene and limited-edition reasons, certain items cannot be returned. Examples include (but are not limited to):
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Customized or monogrammed products</li>
              <li>Items marked “final sale” or “non-returnable”</li>
              <li>Used, washed, altered, or damaged items</li>
            </ul>
          </div>

          {/* Refund Process */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Refund Process
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Approved refunds are processed to the{" "}
                <span className="font-medium">original payment method</span> (or
                store credit where applicable).
              </li>
              <li>
                Refund initiation typically occurs within{" "}
                <span className="font-medium">3–7 business days</span> after we
                receive and inspect the returned item (actual credit time depends
                on your bank/payment provider).
              </li>
              <li>
                Original shipping fees are{" "}
                <span className="font-medium">non-refundable</span> unless the
                return is due to our error (wrong/defective item).
              </li>
            </ul>
          </div>

          {/* Exchange Policy */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Exchange Policy
            </h2>
            <p>
              Exchanges may be offered for size/color variations{" "}
              <span className="font-medium">within 48 hours</span> of delivery,
              subject to stock availability and standard return checks.
            </p>
          </div>

          {/* Return Procedure */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Return Procedure
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Email us at{" "}
                <a
                  href="mailto:bhumi.founder@shahumumbai.com"
                  className="text-blue-600 underline font-medium hover:text-blue-700"
                >
                  bhumi.founder@shahumumbai.com
                </a>{" "}
                with the subject line{" "}
                <span className="font-medium">
                  “Return Request – [Order ID]”
                </span>
                .
              </li>
              <li>
                Include your reason for return and (if applicable){" "}
                <span className="font-medium">clear photos</span> of the product/issue.
              </li>
              <li>
                Our team will review and guide you through pickup/shipping and
                next steps.
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Contact for Return/Cancellation Requests
            </h2>
            <p>
              📧{" "}
              <a
                href="mailto:bhumi.founder@shahumumbai.com"
                className="text-blue-600 underline font-medium hover:text-blue-700"
              >
                bhumi.founder@shahumumbai.com
              </a>
            </p>
          </div>

          <footer className="text-sm text-gray-500 text-center">
            Last Updated: January 2025
          </footer>
        </section>
      </main>
    </Layout>
  );
}
