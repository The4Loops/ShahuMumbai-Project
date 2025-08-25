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

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert("Please fill in all required fields.");
      return;
    }
    console.log("Form submitted:", form);
    // 🔗 connect API/email service here
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const socialLinks = [
    { icon: FaFacebookF, label: "Facebook" },
    { icon: FaInstagram, label: "Instagram" },
    { icon: FaTwitter, label: "Twitter" },
    { icon: FaYoutube, label: "YouTube" },
    { icon: FaLinkedinIn, label: "LinkedIn" },
  ];

  const contactInfo = [
    {
      title: "Visit Our Store",
      details: ["123 Vintage Lane", "Mumbai, India"],
    },
    {
      title: "Call Us",
      details: ["(555) 123-4567", "Mon–Fri, 9AM–6PM"],
    },
    {
      title: "Email Us",
      details: ["bhumi.founder@shahumumbai.com", "We respond within 24 hours"],
    },
    {
      title: "Customer Service",
      details: ["Live Chat Available", "Mon–Fri, 10AM–5PM"],
    },
  ];

  return (
    <Layout>
      <div className="bg-[#F1E7E5] px-4 sm:px-8 md:px-16 lg:px-24 py-12 space-y-16 text-[#2e2e2e]">
        {/* Header */}
        <motion.div
          className="text-center"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl sm:text-4xl font-serif tracking-wider border border-dashed border-pink-200 inline-block px-6 py-3">
            Get in Touch
          </h1>
          <p className="mt-4 text-base sm:text-lg max-w-xl mx-auto">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center mt-4 gap-2 sm:gap-6 text-sm text-[#777]">
            <p>📞 (555) 123-4567</p>
            <p>✉️ bhumi.founder@shahumumbai.com</p>
            <p>📍 Mumbai, India</p>
          </div>
        </motion.div>

        {/* Form & Info+Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <motion.div
            className="bg-white p-6 rounded-xl shadow-sm"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-serif mb-4">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full p-2 border border-gray-200 rounded"
                placeholder="Your Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                className="w-full p-2 border border-gray-200 rounded"
                placeholder="Email Address *"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
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
                placeholder="Message *"
                name="message"
                rows="4"
                value={form.message}
                onChange={handleChange}
                required
              ></textarea>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-[#b88c85] text-white px-4 py-2 rounded hover:bg-pink-700 transition"
              >
                Send Message <FaPaperPlane size={16} />
              </button>
            </form>
          </motion.div>

          {/* Contact Info + Google Map */}
          <motion.div
            className="bg-white p-6 rounded-xl shadow-sm space-y-6"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              {contactInfo.map((info, i) => (
                <div key={i}>
                  <p className="font-semibold">{info.title}</p>
                  {info.details.map((d, idx) => (
                    <p key={idx} className="text-sm text-[#444]">
                      {d}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* Google Map - full width below info on mobile */}
            <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow">
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
          </motion.div>
        </div>

        {/* Business Hours */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm space-y-2"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 className="font-semibold text-sm">Business Hours</h3>
          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
          <p>Saturday: 10:00 AM - 4:00 PM</p>
          <p>Sunday: Closed</p>
        </motion.div>

        {/* Social Section */}
        <motion.div
          className="text-center space-y-4"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-serif">Follow Our Journey</h2>
          <p className="text-sm text-[#777] max-w-md mx-auto">
            Stay connected with us on social media for the latest vintage finds
            and behind-the-scenes stories.
          </p>
          <div className="bg-white py-6 rounded-xl flex flex-wrap justify-center gap-6 shadow-sm">
            {socialLinks.map(({ icon: Icon, label }, idx) => (
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
