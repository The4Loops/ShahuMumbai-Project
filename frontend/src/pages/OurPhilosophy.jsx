import { motion } from "framer-motion";
import Layout from "../layout/Layout";

const philosophy = [
  {
    title: "Timeless Design",
    text: "We believe in designs that transcend trends — embracing pieces that last generations.",
  },
  {
    title: "Authenticity First",
    text: "Every item tells a story. We celebrate the imperfections that add soul and character.",
  },
  {
    title: "Sustainable Choices",
    text: "Vintage fashion is a step toward conscious, sustainable living — and we're proud to be part of that journey.",
  },
];

function OurPhilosophy() {
  return (
    <Layout>
      <div className="bg-[#F1E7E5] px-4 sm:px-10 py-16 text-[#2e2e2e] min-h-screen">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }} // Faster animation here
        >
          <h1 className="text-4xl font-serif mb-4">Our Philosophy</h1>
          <p className="max-w-2xl mx-auto text-[#555]">
            Guided by heritage, craftsmanship, and meaning, we curate with heart and purpose.
          </p>
        </motion.div>

        <div className="space-y-12 max-w-4xl mx-auto">
          {philosophy.map((item, idx) => (
            <motion.div
              key={idx}
              className="bg-white p-6 rounded-xl shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }} // Faster & less delay here
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-serif mb-2">{item.title}</h2>
              <p className="text-[#555]">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default OurPhilosophy;
