import React from "react";
import { Helmet } from "react-helmet-async";
import Layout from "../layout/Layout";

export default function ShippingPolicy() {
  const policy = [
    {
      title: "1. Processing Time",
      items: [
        "Ready-to-Ship: Orders are prepared and dispatched within standard processing time of 48 hours after payment confirmation. ",
        "Made-to-Order: Orders take up to 15 days to dispatch and then ship via your chosen speed. Total delivery time is 15–20 days end-to-end, that includes making of the product, shipping and delivery. ",
      ],
    },
    {
      title: "2. Delivery Timelines",
      subsections: [
        {
          subTitle: "India",
          items: [
            "Metro cities: ~2 days after dispatch",
            "Non-metro cities: ~3–4 days after dispatch",
            "Remote locations: ~4–8 days after dispatch",
          ],
        },
        {
          subTitle: "USA, UK, Canada, Dubai",
          items: [
            "Metro cities: ~1–3 days after dispatch",
            "Non-metro cities: ~4–6 days after dispatch",
            "Remote locations: ~8–12 days after dispatch",
          ],
        },
      ],
      note: "We ship internationally to the USA, UK, Canada, and Dubai. Ready-to-Ship orders follow the above timelines. For Made-to-Order products, total delivery time is ~15–20 days including production and shipping.",
    },
    {
      title: "3. Shipping Charges",
      items: [
        "All orders carry a delivery fee based on the customer’s chosen delivery speed.",
        "Fees are calculated according to package size and delivery speed.",
      ],
    },
    {
      title: "4. Order Tracking",
      text: "Once your order is placed, paid, and confirmed, you’ll receive an email with the tracking link and number. You can also track your order in the “Orders” section on our website.",
    },
    {
      title: "5. Incorrect or Undeliverable Addresses",
      items: [
        "If an incorrect address is provided, a correction fee may be charged by the delivery partner.",
        "Re-shipping charges apply and are calculated case-by-case with the delivery partner.",
      ],
    },
    {
      title: "6. International Orders",
      items: [
        "Customs & Taxes: Local taxes are borne by the customer. Duties & tariffs are paid by us—no hassle for buyers.",
        "Tracking: International orders receive tracking details via email, just like domestic orders.",
      ],
    },
    {
      title: "7. Delays or Exceptions",
      text: "If your delivery is delayed or a parcel is lost, email us and our team will assist you:",
      contact: "bhumi.founder@shahumumbai.com",
    },
    {
      title: "8. Damaged or Missing Items",
      items: [
        "Please report issues as soon as possible and no later than 3 days after the expected delivery date.",
        "Contact: bhumi.founder@shahumumbai.com",
      ],
    },
    {
      title: "9. Contact for Shipping Queries",
      contact: "bhumi.founder@shahumumbai.com",
    },
  ];

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
          {policy.map((section, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-2xl p-6 transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {section.title}
              </h2>

              {/* list items */}
              {section.items && (
                <ul className="list-disc list-inside space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}

              {/* text */}
              {section.text && <p className="mb-3">{section.text}</p>}

              {/* subsections */}
              {section.subsections &&
                section.subsections.map((sub, i) => (
                  <div key={i} className="mt-4">
                    <h3 className="font-semibold mb-1">{sub.subTitle}</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {sub.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}

              {/* note */}
              {section.note && (
                <p className="text-gray-600 mt-3">{section.note}</p>
              )}

              {/* contact */}
              {section.contact && (
                <p className="mt-3">
                  📧{" "}
                  <a
                    href={`mailto:${section.contact}`}
                    className="text-blue-600 underline font-medium hover:text-blue-700"
                  >
                    {section.contact}
                  </a>
                </p>
              )}
            </div>
          ))}

          <footer className="text-sm text-gray-500 text-center">
            Last Updated: January 2025
          </footer>
        </section>
      </main>
    </Layout>
  );
}
