import { useState, useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";
import api from "../supabase/axios"; // Assuming this is your axios instance
import { toast } from "react-toastify";

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
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch team members from API
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/api/team-members", {
          params: { team_type: view === "artisans" ? "artist" : "technical" },
        });
        setTeamData(
          (data.members || []).map((member) => ({
            name: member.name,
            specialty: member.role, // Map role to specialty
            bio: member.description || "", // Map description to bio
            color: member.color,
          }))
        );
      } catch (err) {
        setError("Failed to load team members.");
        toast.error("Failed to load team members.");
        setTeamData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [view]);

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

        {/* Error or Loading */}
        {error && (
          <div className="text-center text-red-600 mb-8">{error}</div>
        )}
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : teamData.length === 0 ? (
          <div className="text-center text-gray-600">
            No {view === "artisans" ? "artisans" : "technical team members"} found.
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  );
}
export default memo(TeamPage);