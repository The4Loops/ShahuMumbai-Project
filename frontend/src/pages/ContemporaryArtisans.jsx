import { useState, useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";

// --- Data ---
const artisans = [
  {
    name: "Anaya Kapoor",
    specialty: "Handwoven Textile Expert",
    bio: "Anaya revives ancient Indian weaving techniques to create timeless, sustainable fabrics.",
    color: "#fbe4d8",
  },
  {
    name: "Rajiv Mehra",
    specialty: "Vintage Footwear Restorer",
    bio: "With a deep respect for craftsmanship, Rajiv breathes new life into classic leather pieces.",
    color: "#d8e2dc",
  },
  {
    name: "Ira Das",
    specialty: "Jewelry Archivist",
    bio: "Ira curates and restores intricate heirloom jewelry with care, storytelling, and precision.",
    color: "#e2d4f0",
  },
];

const technicalTeam = [
  {
    name: "Aarav Sharma",
    specialty: "Lead Software Engineer",
    bio: "Aarav builds scalable systems and ensures seamless integration of cutting-edge tech.",
    color: "#d0e8ff",
  },
  {
    name: "Priya Nair",
    specialty: "UI/UX Designer",
    bio: "Priya crafts intuitive digital experiences blending creativity and functionality.",
    color: "#ffe8d6",
  },
  {
    name: "Karan Malhotra",
    specialty: "DevOps Specialist",
    bio: "Karan optimizes infrastructure and automates workflows for high efficiency.",
    color: "#e3f2e1",
  },
];

// --- Components ---
const TeamToggle = ({ view, setView }) => (
  <nav aria-label="Team categories" className="flex justify-center mb-12 relative">
    <div className="flex gap-8 relative">
      {["artisans", "technical"].map((type) => {
        const isActive = view === type;
        return (
          <motion.button
            key={type}
            onClick={() => setView(type)}
            aria-pressed={isActive}
            className="relative px-4 py-2 font-medium text-lg rounded-md"
            initial={false}
            animate={{
              scale: isActive ? 1.1 : 1,
              color: isActive ? (type === "artisans" ? "#e91e63" : "#1e88e5") : "#333",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {type === "artisans" ? "Contemporary Artisans" : "Technical Team"}
            {isActive && (
              <motion.div
                layoutId="underline"
                className="absolute left-0 right-0 h-[3px] bg-pink-800 bottom-0 rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  </nav>
);

const TeamMemberCard = memo(({ member, view, delay }) => (
  <motion.div
    className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="w-full h-60" style={{ backgroundColor: member.color }} />
    <div className="p-6">
      <h3 className="text-xl font-semibold font-serif">{member.name}</h3>
      <p
        className={`text-sm italic mb-2 ${
          view === "artisans" ? "text-pink-800" : "text-blue-800"
        }`}
      >
        {member.specialty}
      </p>
      <p className="text-[#555] text-sm">{member.bio}</p>
    </div>
  </motion.div>
));

function TeamPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [view, setView] = useState("artisans");

  // Load from query string or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const savedView = params.get("view") || localStorage.getItem("teamView");
    if (savedView === "technical" || savedView === "artisans") {
      setView(savedView);
    }
  }, [location.search]);

  // Save state to both query string and localStorage
  const handleViewChange = (type) => {
    setView(type);
    localStorage.setItem("teamView", type);
    const params = new URLSearchParams(location.search);
    params.set("view", type);
    navigate({ search: params.toString() }, { replace: true });
  };

  const teamData = view === "artisans" ? artisans : technicalTeam;

  return (
    <Layout>
      <div className="bg-[#F1E7E5] px-4 sm:px-10 py-16 min-h-screen text-[#2e2e2e]">
        
        {/* Toggle */}
        <TeamToggle view={view} setView={handleViewChange} />

        {/* Title & Description */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-serif mb-4">
            {view === "artisans" ? "Contemporary Artisans" : "Technical Team"}
          </h1>
          <p className="text-[#555] max-w-xl mx-auto">
            {view === "artisans"
              ? "Meet the hands and hearts behind our most treasured creations — keeping heritage alive with every stitch, cut, and carve."
              : "Meet our innovators and engineers who power our technology, ensuring smooth, secure, and high-performing solutions."}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {teamData.map((member, idx) => (
            <TeamMemberCard
              key={member.name}
              member={member}
              view={view}
              delay={idx * 0.15}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
export default memo(TeamPage);