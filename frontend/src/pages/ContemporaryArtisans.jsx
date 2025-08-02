import { motion } from "framer-motion";
import Layout from "../layout/Layout";

const artisans = [
  {
    name: "Anaya Kapoor",
    specialty: "Handwoven Textile Expert",
    bio: "Anaya revives ancient Indian weaving techniques to create timeless, sustainable fabrics.",
    image: "https://source.unsplash.com/400x400/?textile,artisan",
  },
  {
    name: "Rajiv Mehra",
    specialty: "Vintage Footwear Restorer",
    bio: "With a deep respect for craftsmanship, Rajiv breathes new life into classic leather pieces.",
    image: "https://source.unsplash.com/400x400/?shoes,craftsman",
  },
  {
    name: "Ira Das",
    specialty: "Jewelry Archivist",
    bio: "Ira curates and restores intricate heirloom jewelry with care, storytelling, and precision.",
    image: "https://source.unsplash.com/400x400/?vintage,jewelry",
  },
];

function ContemporaryArtisans() {
  return (
    <Layout>
    <div className="bg-[#fff8f1] px-4 sm:px-10 py-16 min-h-screen text-[#2e2e2e]">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-serif mb-4">Contemporary Artisans</h1>
        <p className="text-[#555] max-w-xl mx-auto">
          Meet the hands and hearts behind our most treasured creations — keeping heritage alive with every stitch, cut, and carve.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {artisans.map((artisan, idx) => (
          <motion.div
            key={idx}
            className="bg-white rounded-xl shadow hover:shadow-md transition duration-300 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            viewport={{ once: true }}
          >
            <img
              src={artisan.image}
              alt={artisan.name}
              className="w-full h-60 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold font-serif">{artisan.name}</h3>
              <p className="text-sm text-pink-800 italic mb-2">{artisan.specialty}</p>
              <p className="text-[#555] text-sm">{artisan.bio}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    </Layout>
  );
}
export default ContemporaryArtisans;