import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaLinkedinIn,
  FaPaperPlane,
} from "react-icons/fa";
import Layout from "../layout/Layout";

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <Layout>
    <div className="bg-[#F1E7E5] px-4 sm:px-8 md:px-16 lg:px-24 py-10 space-y-16 text-[#2e2e2e]">
      {/* Header */}
      <motion.div
        className="text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-3xl sm:text-4xl font-serif tracking-wider border border-dashed border-pink-200 inline-block px-6 py-3">
          Get in Touch
        </h1>
        <p className="mt-4 text-base sm:text-lg">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center mt-4 gap-2 sm:gap-6 text-sm text-[#777]">
          <p>📞 (555) 123-4567</p>
          <p>✉️ hello@vintageandco.com</p>
          <p>📍 San Francisco, CA</p>
        </div>
      </motion.div>

      {/* Form & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-serif mb-4">Send us a Message</h2>
          <form className="space-y-4">
            <input
              className="w-full p-2 border border-gray-200 rounded"
              placeholder="Your Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              className="w-full p-2 border border-gray-200 rounded"
              placeholder="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              className="w-full p-2 border border-gray-200 rounded"
              placeholder="Subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
            />
            <textarea
              className="w-full p-2 border border-gray-200 rounded"
              placeholder="Message"
              name="message"
              rows="4"
              value={form.message}
              onChange={handleChange}
            ></textarea>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-[#b88c85] text-white px-4 py-2 rounded hover:bg-pink-700 transition"
            >
              Send Message <FaPaperPlane size={16} />
            </button>
          </form>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm space-y-4"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-serif mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#444]">
            <div>
              <p className="font-semibold">Visit Our Store</p>
              <p>123 Vintage Lane</p>
              <p>San Francisco, CA 94102</p>
            </div>
            <div>
              <p className="font-semibold">Call Us</p>
              <p>(555) 123-4567</p>
              <p>Mon–Fri, 9AM–6PM PST</p>
            </div>
            <div>
              <p className="font-semibold">Email Us</p>
              <p>hello@vintageandco.com</p>
              <p>We respond within 24 hours</p>
            </div>
            <div>
              <p className="font-semibold">Customer Service</p>
              <p>Live Chat Available</p>
              <p>Mon–Fri, 10AM–5PM PST</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Business Hours */}
      <motion.div
        className="bg-white p-6 rounded-xl shadow-sm space-y-2"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h3 className="font-semibold text-sm">Business Hours</h3>
        <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
        <p>Saturday: 10:00 AM - 4:00 PM</p>
        <p>Sunday: Closed</p>
      </motion.div>

      {/* Location Info */}
      <motion.div
        className="bg-white p-6 rounded-xl text-center shadow-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h3 className="text-sm font-semibold">Find Us Here</h3>
        <p>Located in the heart of San Francisco's vintage district</p>
        <p className="italic text-xs mt-2 text-[#777]">
          Interactive map would be embedded here
        </p>
      </motion.div>

      {/* Social Section */}
      <motion.div
        className="text-center space-y-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h2 className="text-2xl font-serif">Follow Our Journey</h2>
        <p className="text-sm text-[#777]">
          Stay connected with us on social media for the latest vintage finds and behind-the-scenes stories.
        </p>
        <div className="bg-white py-6 rounded-xl flex flex-wrap justify-center gap-6 shadow-sm">
          {[ 
            { icon: FaFacebookF, label: "Facebook" },
            { icon: FaInstagram, label: "Instagram" },
            { icon: FaTwitter, label: "Twitter" },
            { icon: FaYoutube, label: "YouTube" },
            { icon: FaLinkedinIn, label: "LinkedIn" },
          ].map(({ icon: Icon, label }, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1 }}
              className="text-center text-sm cursor-pointer"
            >
              <Icon className="mx-auto mb-1 text-[#e91e63]" size={20} />
              {label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
    </Layout>
  );
}

export default ContactPage;
