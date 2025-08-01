import React from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";
import Videos from "../assets/ComingSoon.mp4";

const About = () => {
  return (
    <Layout>
      <div className="bg-white text-gray-800 font-sans">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-beige-100 to-white text-center py-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Our Story
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            A journey through time, craftsmanship, and the enduring beauty of
            vintage treasures that tell stories of generations past.
          </p>
        </div>

        {/* Crafted with Purpose */}
        <div className="py-16 px-4 md:px-16 flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4">
              Crafted with Purpose
            </h2>
            <p className="mb-4 text-gray-700">
              Founded in 2018, Vintage & Co. began as a passion project born
              from our founder's love for timeless design and sustainable
              fashion...
              <br />
              <span className="italic block mt-4 bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
                "Every vintage piece tells a story. We're here to help you
                discover yours."
                <br />
                <span className="font-semibold">— Sarah Chen, Founder</span>
              </span>
            </p>
          </div>
          <motion.video
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="rounded-xl shadow-lg w-full md:w-1/2"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={Videos} type="video/mp4" />
            Your browser does not support the video tag.
          </motion.video>
        </div>

        {/* Our Values */}
        <div className="bg-gray-50 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-10">Our Values</h2>
          <div className="flex flex-col md:flex-row justify-center gap-8 px-4">
            {[
              {
                title: "Passionate Curation",
                description:
                  "Every piece is handpicked with love and expertise, ensuring only the finest vintage treasures make it to our collection.",
                icon: "❤️",
              },
              {
                title: "Sustainable Fashion",
                description:
                  "By giving new life to vintage pieces, we promote sustainable fashion practices and reduce environmental impact.",
                icon: "🌿",
              },
              {
                title: "Timeless Quality",
                description:
                  "We celebrate the superior craftsmanship of bygone eras, when items were built to last generations.",
                icon: "⏳",
              },
            ].map((val, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md max-w-sm mx-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl mb-4">{val.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{val.title}</h3>
                <p className="text-sm text-gray-600">{val.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Meet Our Team */}
        <div className="py-16 px-4 text-center">
          <h2 className="text-2xl font-semibold mb-10">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Founder & Chief Curator",
                description:
                  "With over 15 years in fashion and design, Sarah has an eye for exceptional vintage pieces and the stories they tell.",
              },
              {
                name: "Marcus Rodriguez",
                role: "Head of Restoration",
                description:
                  "A master craftsman specializing in furniture and textile restoration, bringing damaged pieces back to their former glory.",
              },
              {
                name: "Emma Thompson",
                role: "Vintage Fashion Expert",
                description:
                  "Fashion historian and stylist who helps authenticate and curate our clothing and accessory collections.",
              },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                className="bg-gray-50 p-6 rounded-xl shadow-md"
                whileHover={{ scale: 1.03 }}
              >
                <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
                <h4 className="font-bold text-lg">{member.name}</h4>
                <p className="text-sm text-gray-500 mb-2">{member.role}</p>
                <p className="text-sm text-gray-600">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{ backgroundColor: "#fdf6e9" }}
          className=" text-black py-16 text-center"
        >
          <div className="mb-6 text-3xl">🤍</div>
          <h2 className="text-2xl font-semibold mb-4">
            Start Your Vintage Journey
          </h2>
          <p className="max-w-xl mx-auto text-sm mb-6">
            Discover timeless pieces that will become cherished parts of your
            story. Join our community of vintage enthusiasts and sustainable
            fashion advocates.
          </p>
          <div className="flex justify-center gap-4 items-center flex-wrap">
            <button className="bg-white text-green-800 px-6 py-2 rounded-full font-semibold shadow-md hover:bg-gray-100 transition">
              Explore Our Shop
            </button>
            <input
              type="text"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-full text-gray-800 focus:outline-none"
            />
          </div>
          <div className="mt-8 flex justify-center gap-10 text-sm">
            <div>
              <span className="font-bold">500+</span>
              <br />
              Vintage Pieces
            </div>
            <div>
              <span className="font-bold">1,200+</span>
              <br />
              Happy Customers
            </div>
            <div>
              <span className="font-bold">6+</span>
              <br />
              Years of Experience
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
