import { motion } from "framer-motion";
import Layout from "../layout/Layout";
import { Heart, BookOpen, Scissors } from "lucide-react"; 

function OurStudios() {
  return (
    <Layout>
      <div className="bg-[#F1E7E5] px-6 sm:px-12 py-20 text-[#2e2e2e] min-h-screen">
        
        {/* Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl font-serif mb-6 tracking-wide">
            Our Studio
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-[#444] leading-relaxed">
            Where heritage meets modernity — a creative house rooted in India’s
            traditions and connected to the world.
          </p>
        </motion.div>

        {/* Studio Card */}
        <motion.div
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row mb-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Image / Visual placeholder */}
          <div className="md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-[#f4c7ab] to-[#f1e7e5]" />

          {/* Content */}
          <div className="p-10 flex flex-col justify-center md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4">
              Global Fashion House — Mumbai
            </h2>
            <p className="text-[#555] text-base leading-relaxed">
              Based in Mumbai, a city that reflects both India’s rich artistic 
              traditions and a cosmopolitan spirit. A global fashion house with 
              Indian roots, blending local craftsmanship with international vision.
            </p>
          </div>
        </motion.div>

        {/* Crafted with Care Section */}
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-serif mb-6">Crafted with Care</h2>
          <p className="max-w-3xl mx-auto text-[#444] leading-relaxed text-lg mb-12">
            Every creation at Shahu is handmade by skilled artisans. Each piece carries a human story.
          </p>

          {/* Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mother */}
            <div className="bg-white rounded-xl shadow-md p-6 text-left flex flex-col items-start">
              <div className="bg-[#f4c7ab]/40 p-3 rounded-full mb-4">
                <BookOpen className="w-6 h-6 text-[#b85c38]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">A Mother’s Dream</h3>
              <p className="text-[#555] text-sm leading-relaxed">
                Funding her children’s education with each stitch of fabric.
              </p>
            </div>

            {/* Father */}
            <div className="bg-white rounded-xl shadow-md p-6 text-left flex flex-col items-start">
              <div className="bg-[#c6e2d8]/40 p-3 rounded-full mb-4">
                <Scissors className="w-6 h-6 text-[#287271]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">A Father’s Legacy</h3>
              <p className="text-[#555] text-sm leading-relaxed">
                Preserving cultural traditions while supporting his family.
              </p>
            </div>

            {/* Widow */}
            <div className="bg-white rounded-xl shadow-md p-6 text-left flex flex-col items-start">
              <div className="bg-[#fddde6]/40 p-3 rounded-full mb-4">
                <Heart className="w-6 h-6 text-[#b23a48]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">A Widow’s Passion</h3>
              <p className="text-[#555] text-sm leading-relaxed">
                Continuing her late husband’s vision through fashion.
              </p>
            </div>
          </div>

          <p className="max-w-2xl mx-auto mt-12 text-[#333] font-medium">
            Every dollar supports lives, preserves heritage, and celebrates craftsmanship over machinery.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}

export default OurStudios;
