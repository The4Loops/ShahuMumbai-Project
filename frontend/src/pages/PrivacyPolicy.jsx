import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:px-10">
        <Helmet>
          <title>Privacy Policy | Shahu Mumbai</title>
          <meta
            name="description"
            content="How Shahu Mumbai collects, uses, and protects your personal information."
          />
          <link
            rel="canonical"
            href="https://www.shahumumbai.com/privacy-policy"
          />
        </Helmet>

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Your privacy is our priority. Learn how Shahu Mumbai collects, uses,
            and protects your personal data.
          </p>
        </header>

        {/* Content */}
        <section className="space-y-10 text-gray-700 leading-relaxed">
          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Information We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Personal details such as name, email, phone number, and address.
              </li>
              <li>
                Payment details (processed securely via trusted payment
                partners).
              </li>
              <li>
                Browsing data such as IP address, device type, and visited
                pages.
              </li>
              <li>
                Information you share voluntarily (e.g., surveys, support
                requests).
              </li>
            </ul>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Process and fulfill your orders.</li>
              <li>Provide updates and promotional communications.</li>
              <li>Improve our products, website, and services.</li>
              <li>Offer personalized recommendations and offers.</li>
              <li>Comply with legal requirements.</li>
            </ul>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Sharing Your Information
            </h2>
            <p className="mb-3">
              Shahu Mumbai does not sell or rent your personal data. We may
              share information only with:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Trusted service providers (hosting, payments, logistics).</li>
              <li>Legal authorities when required by law.</li>
            </ul>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              data. While no system is completely secure, we take all reasonable
              precautions to prevent unauthorized access.
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Cookies</h2>
            <p>
              We use cookies to enhance user experience, analyze traffic, and
              personalize content. You may disable cookies in your browser, but
              some site features may not function properly.
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Your Rights
            </h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Access, correct, or delete your personal information.</li>
              <li>Opt out of marketing communications.</li>
              <li>Request details on how your data is used.</li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:bhumi.founder@shahumumbai.com"
                className="text-blue-600 underline font-medium hover:text-blue-700"
              >
                bhumi.founder@shahumumbai.com
              </a>
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Updates to This Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically. Any changes will
              be reflected on this page with a revised “Last Updated” date.
            </p>
          </div>

          <footer className="text-sm text-gray-500 text-center">
            Last Updated: January 1, 2025
          </footer>
        </section>
      </main>
    </Layout>
  );
}
