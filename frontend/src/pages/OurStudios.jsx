import { motion } from "framer-motion";
import Layout from "../layout/Layout";

const studios = [
  {
    name: "Mumbai Flagship",
    desc: "Our original studio nestled in the heart of Mumbai’s vintage district — where stories begin.",
    color: "#f4c7ab", // Soft peach
  },
  {
    name: "Goa Atelier",
    desc: "Our coastal retreat for designers, restorers, and creative minds — infused with local heritage.",
    color: "#c6e2d8", // Gentle mint
  },
];

function OurStudios() {
  return (
    <Layout>
      <div className="bg-[#F1E7E5] px-4 sm:px-10 py-16 text-[#2e2e2e] min-h-screen">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-serif mb-4">Our Studios</h1>
          <p className="max-w-xl mx-auto text-[#555]">
            Where vintage dreams are born, restored, and curated into something unforgettable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {studios.map((studio, idx) => (
            <motion.div
              key={idx}
              className="bg-white rounded-xl shadow overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
            >
              <div
                className="w-full h-60"
                style={{ backgroundColor: studio.color }}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{studio.name}</h3>
                <p className="text-[#555] text-sm">{studio.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default OurStudios;
