import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";

export default function ShippingPolicy() {
  return (
    <Layout>
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:px-10">
        <Helmet>
          <title>Shipping Policy | Shahu Mumbai</title>
          <meta
            name="description"
            content="Order processing, delivery timelines, charges, tracking, and international shipping details for Shahu Mumbai."
          />
          <link
            rel="canonical"
            href="https://www.shahumumbai.com/shipping-policy"
          />
        </Helmet>

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Shipping Policy
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Everything you need to know about order processing, delivery
            timelines, tracking, and international shipping with Shahu Mumbai.
          </p>
        </header>

        <section className="space-y-10 text-gray-700 leading-relaxed">
          {/* Processing Time */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Processing Time
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="font-medium">Ready-to-Ship:</span> Orders are
                prepared and dispatched within standard processing times after
                payment confirmation.
              </li>
              <li>
                <span className="font-medium">Made-to-Order:</span> For the
                first batch going live in October, orders take{" "}
                <span className="font-medium">~15 days to dispatch</span> and
                then ship via your chosen speed. Total delivery time is{" "}
                <span className="font-medium">~15–20 days</span> end-to-end.
              </li>
            </ul>
          </div>

          {/* Delivery Timelines */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Delivery Timelines
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">India</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Metro cities: ~2 days after dispatch</li>
                  <li>Non-metro: ~3–4 days after dispatch</li>
                  <li>Remote locations: ~4–8 days after dispatch</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  USA, UK, Canada, Dubai
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ready-to-Ship: ~1–3 days after dispatch</li>
                  <li>Non-metro/Remote equivalents: ~4–6 to ~8–12 days</li>
                </ul>
              </div>
              <p className="text-gray-600">
                <span className="font-medium">International shipping:</span> We
                currently ship to the USA, UK, Canada, and Dubai. For
                Made-to-Order items, the overall delivery window is{" "}
                <span className="font-medium">15–20 days</span> including
                production and shipping.
              </p>
            </div>
          </div>

          {/* Shipping Charges */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Shipping Charges
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                All orders carry a delivery fee based on the customer’s{" "}
                <span className="font-medium">chosen delivery speed</span>.
              </li>
              <li>
                Fees are calculated according to{" "}
                <span className="font-medium">
                  package size and delivery speed
                </span>
                .
              </li>
            </ul>
          </div>

          {/* Order Tracking */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Order Tracking
            </h2>
            <p>
              Once your order is placed, paid, and confirmed, you’ll receive an{" "}
              <span className="font-medium">email with the tracking link</span>{" "}
              and number. You can also track your order in the{" "}
              <span className="font-medium">“Orders”</span> section on our
              website.
            </p>
          </div>

          {/* Incorrect or Undeliverable Addresses */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Incorrect or Undeliverable Addresses
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                If an incorrect address is provided, a{" "}
                <span className="font-medium">correction fee</span> may be
                charged by the delivery partner.
              </li>
              <li>
                <span className="font-medium">Re-shipping</span> charges apply
                and are calculated case-by-case with the delivery partner.
              </li>
            </ul>
          </div>

          {/* International Orders */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. International Orders
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="font-medium">Customs & Taxes:</span> Local
                taxes are borne by the customer. Duties & tariffs are paid by
                us—no hassle for buyers.
              </li>
              <li>
                <span className="font-medium">Tracking:</span> International
                orders receive tracking details via email, just like domestic
                orders.
              </li>
            </ul>
          </div>

          {/* Delays or Exceptions */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Delays or Exceptions
            </h2>
            <p className="mb-3">
              If your delivery is delayed or a parcel is lost, email us and our
              team will assist you:
            </p>
            <p>
              📧{" "}
              <a
                href="mailto:bhumi.founder@shahumumbai.com"
                className="text-blue-600 underline font-medium hover:text-blue-700"
              >
                bhumi.founder@shahumumbai.com
              </a>{" "}
              (we typically reply within <span className="font-medium">
                2–24 hours
              </span>
              ).
            </p>
          </div>

          {/* Damaged or Missing Items */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Damaged or Missing Items
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Please report issues{" "}
                <span className="font-medium">as soon as possible</span> and no
                later than <span className="font-medium">3 days</span> after
                the expected delivery date.
              </li>
              <li>
                Contact:{" "}
                <a
                  href="mailto:bhumi.founder@shahumumbai.com"
                  className="text-blue-600 underline font-medium hover:text-blue-700"
                >
                  bhumi.founder@shahumumbai.com
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Contact for Shipping Queries
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
