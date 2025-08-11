import { motion } from "framer-motion";
import Layout from "../layout/Layout";

const timeline = [
  { year: "1920s", event: "Inspired by the golden age of elegance and flapper fashion." },
  { year: "1950s", event: "Iconic silhouettes return — the age of cinched waists and classic tailoring." },
  { year: "1980s", event: "Bold expression and statement vintage finds become collector’s treasures." },
  { year: "Today", event: "Shahu Mumbai curates vintage that honors every era with soul." },
];

 function HeritageTimeline() {
  return (
    <Layout>
    <div className="bg-[#F1E7E5] px-4 sm:px-10 py-16 text-[#2e2e2e] min-h-screen">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-serif mb-4">Heritage Timeline</h1>
        <p className="max-w-xl mx-auto text-[#555]">
          A journey through the decades of fashion, style, and stories that inspire us.
        </p>
      </motion.div>

      <div className="relative max-w-2xl mx-auto border-l-2 border-pink-300 pl-6 space-y-10">
        {timeline.map((item, idx) => (
          <motion.div
            key={idx}
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="absolute -left-4 top-1 w-3 h-3 bg-[#e91e63] rounded-full"></div>
            <h3 className="text-lg font-bold">{item.year}</h3>
            <p className="text-[#555]">{item.event}</p>
          </motion.div>
        ))}
      </div>
    </div>
    </Layout>
  );
}
export default HeritageTimeline;