import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const artistTeam = [
  {
    initials: "IC",
    name: "Isabella Chen",
    role: "Lead Designer",
    desc: "Creative visionary with 8+ years in vintage-inspired design. Specializes in authentic period aesthetics and modern functionality.",
    color: "bg-pink-500",
  },
  {
    initials: "MR",
    name: "Marcus Rivera",
    role: "Art Director",
    desc: "Award-winning art director passionate about storytelling through visual design. Expert in branding and creative campaigns.",
    color: "bg-orange-400",
  },
  {
    initials: "SA",
    name: "Sofia Andersson",
    role: "Illustrator",
    desc: "Hand-drawn illustrations and digital art specialist. Creates unique vintage-style artwork and custom designs.",
    color: "bg-green-500",
  },
  {
    initials: "ER",
    name: "Elena Rodriguez",
    role: "Color Specialist",
    desc: "Expert in vintage color palettes and authentic period-appropriate design choices. 10+ years in restoration.",
    color: "bg-purple-500",
  },
  {
    initials: "JL",
    name: "James Liu",
    role: "Typography Designer",
    desc: "Specialist in vintage typography and hand-lettering. Creates custom fonts and period-accurate text designs.",
    color: "bg-blue-500",
  },
  {
    initials: "AN",
    name: "Aria Nakamura",
    role: "UI/UX Designer",
    desc: "Bridges vintage aesthetics with modern usability. Expert in creating intuitive interfaces with classic appeal.",
    color: "bg-teal-500",
  },
];

const technicalTeam = [
  {
    initials: "DK",
    name: "David Kim",
    role: "Frontend Developer",
    desc: "Specializes in modern React.js and Tailwind CSS development. Passionate about clean, responsive design.",
    color: "bg-indigo-500",
  },
  {
    initials: "SJ",
    name: "Sarah Johnson",
    role: "Backend Developer",
    desc: "Expert in Node.js, Express, and API development. Builds secure, scalable backend solutions.",
    color: "bg-pink-500",
  },
  {
    initials: "MP",
    name: "Michael Patel",
    role: "Full Stack Engineer",
    desc: "Brings concepts to life from UI to database with a focus on performance and security.",
    color: "bg-orange-400",
  },
  {
    initials: "RS",
    name: "Rachel Singh",
    role: "DevOps Engineer",
    desc: "Automates workflows and manages CI/CD pipelines for smooth product delivery.",
    color: "bg-green-500",
  },
  {
    initials: "TH",
    name: "Tom Harris",
    role: "QA Engineer",
    desc: "Ensures bug-free releases through rigorous testing and automation.",
    color: "bg-purple-500",
  },
  {
    initials: "LW",
    name: "Linda Wong",
    role: "Security Specialist",
    desc: "Protects applications and data through penetration testing and security audits.",
    color: "bg-blue-500",
  },
];

export default function TeamManagement() {
  const [teamType, setTeamType] = useState("artist");
  const [search, setSearch] = useState("");

  const teamData = teamType === "artist" ? artistTeam : technicalTeam;
  const filteredTeam = teamData.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase())
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center">Team Management</h1>
      <p className="text-center text-gray-600 mt-2">
        Manage your creative and technical teams. Add new members, update roles,
        and organize your workforce.
      </p>

      {/* Toggle with Animated Indicator */}
      <div className="relative flex w-fit mx-auto mt-6 bg-gray-100 rounded-full p-1">
        <button
          onClick={() => setTeamType("artist")}
          className={`relative z-10 px-6 py-2 rounded-full font-medium ${
            teamType === "artist" ? "text-white" : "text-gray-600"
          }`}
        >
          🎨 Artist Team
        </button>
        <button
          onClick={() => setTeamType("technical")}
          className={`relative z-10 px-6 py-2 rounded-full font-medium ${
            teamType === "technical" ? "text-white" : "text-gray-600"
          }`}
        >
          🛠 Technical Team
        </button>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 bottom-1 w-1/2 rounded-full ${
            teamType === "artist" ? "left-1 bg-pink-500" : "left-1/2 bg-blue-500"
          }`}
        />
      </div>

      {/* Search + Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 gap-4">
        <input
          type="text"
          placeholder={`Search ${teamType} team members...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64"
        />
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{teamData.length} members</span>
          <span className="text-gray-600">
            Total: {artistTeam.length + technicalTeam.length}
          </span>
          <button className="bg-black text-white px-4 py-2 rounded-lg">
            + Add {teamType === "artist" ? "Artist" : "Tech"}
          </button>
        </div>
      </div>

      {/* Team Cards */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredTeam.map((member, idx) => (
            <motion.div
              key={member.name}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ scale: 1.03 }}
              className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition"
            >
              <div
                className={`w-12 h-12 flex items-center justify-center text-white rounded-full ${member.color} text-lg font-semibold`}
              >
                {member.initials}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.role}</p>
              <p className="text-gray-600 mt-3 text-sm">{member.desc}</p>
              <span className="inline-block mt-4 px-3 py-1 text-xs bg-pink-100 text-pink-600 rounded-full">
                {teamType === "artist" ? "artist" : "tech"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <div className="border rounded-lg p-4 border-pink-300">
          <h4 className="font-semibold">🎨 Artist Team</h4>
          <p className="text-2xl">{artistTeam.length}</p>
          <p className="text-gray-500">Creative professionals</p>
        </div>
        <div className="border rounded-lg p-4 border-blue-300">
          <h4 className="font-semibold">🛠 Technical Team</h4>
          <p className="text-2xl">{technicalTeam.length}</p>
          <p className="text-gray-500">Technical specialists</p>
        </div>
      </div>
    </div>
  );
}
