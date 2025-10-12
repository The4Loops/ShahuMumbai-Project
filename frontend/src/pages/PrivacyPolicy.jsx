import React from "react";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Helmet>
        <title>Privacy Policy | Shahu Mumbai</title>
        <meta name="description" content="How Shahu Mumbai collects, uses, and protects your personal information." />
        <link rel="canonical" href="https://www.shahumumbai.com/privacy-policy" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-gray-600 mb-4">
        At Shahu, your privacy is of utmost importance to us. We are committed to protecting your personal information
        and ensuring a safe and secure shopping experience. This Privacy Policy explains how we collect, use, and
        safeguard your data when you interact with our website, products, and services.
      </p>

      <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
      <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
        <li>Personal details such as name, email address, phone number, and shipping/billing address.</li>
        <li>Payment information (processed securely through our payment partners; we do not store full card details unless you choose to save them).</li>
        <li>Browsing information such as IP address, device type, and pages visited on our site.</li>
        <li>Any information you voluntarily share with us (e.g., support queries, sign-ups, surveys).</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
      <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
        <li>Process and fulfill your orders.</li>
        <li>Communicate about purchases, updates, and brand news.</li>
        <li>Improve our website, products, and experience.</li>
        <li>Provide personalized recommendations and offers.</li>
        <li>Comply with legal and regulatory obligations.</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">Sharing Your Information</h2>
      <p className="text-gray-600 mb-4">
        Shahu Mumbai does not sell, trade, or rent your personal data. We may share information only with:
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
        <li>Trusted third-party service providers (hosting, payments, logistics).</li>
        <li>Legal authorities where required by law or to protect our rights.</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">Data Security</h2>
      <p className="text-gray-600 mb-4">
        We implement industry-standard security measures. While no method of transmission over the internet is 100%
        secure, we take reasonable steps to safeguard your data.
      </p>

      <h2 className="text-xl font-semibold mb-2">Cookies</h2>
      <p className="text-gray-600 mb-4">
        We use cookies to enhance browsing, analyze performance, and personalize content. You can disable cookies in your
        browser, but some features may not function properly.
      </p>

      <h2 className="text-xl font-semibold mb-2">Your Rights</h2>
      <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
        <li>Access, correct, or delete your personal data.</li>
        <li>Opt out of marketing communications.</li>
        <li>Request details on how your data is used.</li>
      </ul>

      <p className="text-gray-600 mb-4">
        To exercise these rights, contact us at{" "}
        <a href="mailto:bhumi.founder@shahumumbai.com" className="text-blue-600 underline">
          bhumi.founder@shahumumbai.com
        </a>.
      </p>

      <h2 className="text-xl font-semibold mb-2">Updates to This Policy</h2>
      <p className="text-gray-600 mb-6">
        We may update this Privacy Policy from time to time. The updated version will be posted with a “Last Updated”
        date.
      </p>

      <p className="text-gray-500 text-sm">Last Updated: January 1, 2025</p>
    </main>
  );
}
