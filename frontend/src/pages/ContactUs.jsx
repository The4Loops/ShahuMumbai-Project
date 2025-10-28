import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPaperPlane,
} from "react-icons/fa";
import Layout from "../layout/Layout";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";

function ContactPage() {
  const token = localStorage.getItem("token");
  let decoded = {};
  if (token) {
    try {
      decoded = jwtDecode(token);
    } catch (e) {
      console.error("Invalid token", e);
      localStorage.removeItem("token");
    }
  }

  const [form, setForm] = useState({
    name: decoded.fullname || "",
    email: decoded.email || "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/contacts", {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        status: "pending",
      });
      toast.dismiss();
      toast.success("Message sent successfully!");
      setForm({
        name: decoded.fullname || "",
        email: decoded.email || "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: FaFacebookF, label: "Facebook" },
    { icon: FaInstagram, label: "Instagram" },
    { icon: FaLinkedinIn, label: "LinkedIn" },
  ];

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const pageUrl = `${baseUrl}/contactus`;

  // JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Contact", item: pageUrl },
    ],
  };

  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Shahu Mumbai",
    url: pageUrl,
    description: "Contact Shahu Mumbai for inquiries, collaborations, or support.",
  };

  return (
    <Layout>
      <Helmet>
        <title>Contact Us — Shahu Mumbai</title>
        <meta
          name="description"
          content="Get in touch with Shahu Mumbai. We’re here to help with inquiries, bespoke requests, and collaborations."
        />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Us — Shahu Mumbai" />
        <meta
          property="og:description"
          content="Reach out to the Shahu Mumbai team for any assistance."
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${baseUrl}/og/contact.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(contactPageJsonLd)}</script>
      </Helmet>

      <div className="bg-[#F1E7E5] px-6 md:px-16 lg:px-24 py-16 text-[#2e2e2e]">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif tracking-wide">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            We would love to hear from you. Whether you are seeking a bespoke
            piece, exploring collaborations, or simply discovering Shahu, our
            team is here to assist.
          </p>
        </div>

        {/* Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-serif mb-2">Contact Details</h2>
              <p className="text-[#555]">Email — bhumi.founder@shahumumbai.com</p>
              <p className="text-[#555]">Phone — +91 9920678152</p>
            </div>

            <div>
              <h2 className="text-2xl font-serif mb-2">Follow Us</h2>
              <div className="flex gap-6 mt-3">
                {socialLinks.map(({ icon: Icon, label }, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-full shadow transition transform hover:scale-110 hover:shadow-md cursor-pointer"
                    title={label}
                  >
                    <Icon className="text-[#6B4226]" size={20} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-serif mb-2">Business Hours</h2>
              <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
              <p>Saturday: 10:00 AM - 4:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow transition hover:shadow-md hover:scale-[1.01]">
            <h2 className="text-2xl font-serif mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full p-3 border border-gray-200 rounded bg-gray-50"
                placeholder="Your Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                readOnly={!!token}
              />
              <input
                type="email"
                className="w-full p-3 border border-gray-200 rounded bg-gray-50"
                placeholder="Email Address *"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                readOnly={!!token}
              />
              <input
                className="w-full p-3 border border-gray-200 rounded"
                placeholder="Subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
              />
              <textarea
                className="w-full p-3 border border-gray-200 rounded"
                placeholder="Message *"
                name="message"
                rows="4"
                value={form.message}
                onChange={handleChange}
                required
              ></textarea>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-[#b88c85] text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}{" "}
                <FaPaperPlane size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="mt-16 w-full h-72 md:h-96 rounded-xl overflow-hidden shadow">
          <iframe
            title="Shahu Mumbai Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.975916574955!2d72.832465!3d18.922003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7d1c73a0d5cad%3A0xc70a25a7209c733c!2sGateway%20Of%20India%20Mumbai!5e0!3m2!1sen!2sin!4v1692978472528!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </Layout>
  );
}

export default ContactPage;
