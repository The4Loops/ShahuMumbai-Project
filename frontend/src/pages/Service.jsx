import { motion } from "framer-motion";
import Layout from "../layout/Layout";

const services = [
  {
    title: "Personal Styling",
    description: "Work with our stylists to find the perfect vintage look tailored to your personality.",
    icon: "👗",
  },
  {
    title: "Custom Sourcing",
    description: "Looking for something rare? Let us find the vintage piece of your dreams.",
    icon: "🔍",
  },
  {
    title: "Vintage Curation",
    description: "Curated collections for boutiques and events with a focus on storytelling and history.",
    icon: "🧳",
  },
  {
    title: "Restoration",
    description: "We revive timeless pieces while preserving their unique character and authenticity.",
    icon: "🪡",
  },
  {
    title: "Home Decor Styling",
    description: "Add charm to your space with personalized vintage decor recommendations.",
    icon: "🏡",
  },
  {
    title: "Event Styling",
    description: "Vintage styling for weddings, shoots, and special events. Make it unforgettable.",
    icon: "📸",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function ServicePage() {
  return (
    <Layout>
    <div className="bg-[#fff8f1] px-4 sm:px-8 md:px-16 lg:px-24 py-16 text-[#2e2e2e] min-h-screen">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-serif mb-4">Our Services</h1>
        <p className="text-[#555] max-w-xl mx-auto">
          Discover a range of personalized vintage services designed to elevate your style and space.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {services.map((service, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow hover:shadow-md transition duration-300"
          >
            <div className="text-4xl mb-4">{service.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-[#666] text-sm">{service.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
    </Layout>
  );
}

export default ServicePage;
