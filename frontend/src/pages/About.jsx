import { useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const AnimatedSection = ({ children, className = "" }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeInUp}
    className={className}
  >
    {children}
  </motion.div>
);

function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="bg-[#F1E7E5] text-[#3B2E1E]">
        
        {/* ABOUT US */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-center">
          <AnimatedSection className="text-left">
            <h1 className="text-3xl font-bold mb-4">About Us</h1>
            <p className="text-sm text-[#6B6B6B]">
              Shahu Mumbai is the iconic brand born from one man's extraordinary vision to renew the Thai silk industry. Founded in 1950 by Bhumi— an American architect, art collector, and cultural pioneer — the brand helped bring Thai silk to global prominence.
            </p>
          </AnimatedSection>
          <div
            className="rounded-xl bg-[#6B4226] h-64 w-full"
            role="presentation"
            aria-hidden="true"
          />
        </section>

        {/* QUOTE */}
        <section className="text-center py-6 text-lg italic text-[#3B2E1E]">
          <p>"Thai silk is not just a fabric, it's a story."</p>
          <p className="mt-2 text-sm text-[#6B6B6B]">- Shahu Mumbai</p>
        </section>

        {/* THE CRAFT */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-center">
          <div
            className="rounded-xl bg-[#6B4226] h-64 w-full"
            role="presentation"
            aria-hidden="true"
          />
          <AnimatedSection>
            <h2 className="text-2xl font-semibold mb-4">The Craft</h2>
            <p className="text-sm text-[#6B6B6B]">
              At Shahu, craftsmanship is at the heart of everything we do. As one of the world’s leading producers of handwoven fabric, we are renowned for our exceptional Thai silk. Our vertically integrated process ensures uncompromising quality in every step.
            </p>
          </AnimatedSection>
        </section>

        {/* THE SHAHU STORY */}
        <motion.section
          className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-[#D6AD60] to-[#3B2E1E] flex items-center justify-center text-white text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="bg-black bg-opacity-40 p-6 rounded-xl">
            <h2 className="text-3xl font-semibold">The Shahu Mumbai Story</h2>
            <a
              href="/story"
              className="mt-4 inline-block px-4 py-2 bg-[#F6E7D8] text-[#3B2E1E] rounded-full text-sm hover:bg-[#e0ccb5]"
            >
              Learn More
            </a>
          </div>
        </motion.section>

        {/* FASHION, HOME, RESTAURANTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8">
          {["Fashion", "Home Furnishings", "Restaurants & Bar"].map((title, i) => (
            <AnimatedSection
              key={i}
              className="relative overflow-hidden rounded-xl h-72 bg-[#6B4226] flex items-end p-4 text-[#3B2E1E] text-xl font-medium"
            >
              <span className="bg-white bg-opacity-60 p-2 rounded">{title}</span>
            </AnimatedSection>
          ))}
        </section>

        {/* FOUNDATION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-4">The Shahu Mumbai Foundation</h2>
            <p className="text-sm text-[#6B6B6B]">
              The Foundation preserves the legacy of the man who redefined Thai silk. It supports cultural heritage, education, and the arts, and also oversees the iconic Shahu Mumbai in the U.S.A.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { name: "Shahu Mumbai", link: "/foundation/shahu" },
                { name: "Shahu Mumbai Art Center", link: "/foundation/art-center" }
              ].map((item, idx) => (
                <div className="text-sm" key={idx}>
                  <div
                    className="rounded-xl mb-2 bg-[#6B4226] h-32"
                    role="presentation"
                    aria-hidden="true"
                  />
                  <p className="text-[#3B2E1E]">{item.name}</p>
                  <a
                    href={item.link}
                    className="text-xs text-[#D6AD60] hover:underline"
                  >
                    Explore More
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl bg-[#6B4226] h-64 w-full"
            role="presentation"
            aria-hidden="true"
          />
        </section>
      </div>
    </Layout>
  );
}

export default About;
