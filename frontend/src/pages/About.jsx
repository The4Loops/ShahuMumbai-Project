import { useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";

function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <Layout>
      <div className="bg-[#FDF8F4] text-[#3B2E1E]">
        {/* ABOUT US */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeInUp}
            className="text-left"
          >
            <h2 className="text-2xl font-semibold mb-4">ABOUT US</h2>
            <p className="text-sm text-[#6B6B6B]">
              Shahu Mumbai is the iconic brand born from one man's extraordinary vision to renew the Thai silk industry. Founded in 1950 by Bhumi— an American architect, art collector and cultural pioneer — the brand helped bring Thai silk to global prominence.
            </p>
          </motion.div>
          <div className="rounded-xl bg-[#6B4226] h-64 w-full" />
        </section>

        <section className="text-center py-6 text-lg italic text-[#3B2E1E]">
          <p>"Thai silk is not just a fabric, it's a story."</p>
          <p className="mt-2 text-sm text-[#6B6B6B]">- Shahu Mumbai</p>
        </section>

        {/* THE CRAFT */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-center">
          <div className="rounded-xl bg-[#6B4226] h-64 w-full" />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl font-semibold mb-4">THE CRAFT</h2>
            <p className="text-sm text-[#6B6B6B]">
              At Shahu, craftsmanship is at the heart of everything we do. As one of the world’s leading producers of handwoven fabric, we are renowned for our exceptional Thai silk. Our vertically integrated process ensures uncompromising quality in every step.
            </p>
          </motion.div>
        </section>

        {/* THE Shahu STORY */}
        <motion.section
          className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-[#D6AD60] to-[#3B2E1E] flex items-center justify-center text-white text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="bg-black bg-opacity-40 p-6 rounded-xl">
            <h2 className="text-3xl font-semibold">THE Shahu Mumbai</h2>
            <button className="mt-4 px-4 py-2 bg-[#F6E7D8] text-[#3B2E1E] rounded-full text-sm hover:bg-[#e0ccb5]">
              LEARN MORE
            </button>
          </div>
        </motion.section>

        {/* FASHION, HOME, RESTAURANTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8">
          {["Fashion", "Home Furnishings", "Restaurants & Bar"].map((title, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="relative overflow-hidden rounded-xl h-72 bg-[#6B4226] flex items-end p-4 text-[#3B2E1E] text-xl font-medium"
            >
              <span className="bg-white bg-opacity-60 p-2 rounded">{title}</span>
            </motion.div>
          ))}
        </section>

        {/* FOUNDATION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              THE Shahu Mumbai
            </h2>
            <p className="text-sm text-[#6B6B6B]">
              The Foundation preserves the legacy of the man who redefined Thai silk. It supports cultural heritage, education, and the arts, and also oversees the iconic Shahu Mumbai in U.S.A
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-sm">
                <div className="rounded-xl mb-2 bg-[#6B4226] h-32" />
                <p className="text-[#3B2E1E]">Shahu Mumbai</p>
                <button className="text-xs text-[#D6AD60] hover:underline">EXPLORE MORE</button>
              </div>
              <div className="text-sm">
                <div className="rounded-xl mb-2 bg-[#6B4226] h-32" />
                <p className="text-[#3B2E1E]">Shahu Mumbai Art Center</p>
                <button className="text-xs text-[#D6AD60] hover:underline">EXPLORE MORE</button>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[#6B4226] h-64 w-full" />
        </section>
      </div>
    </Layout>
  );
}

export default About;
