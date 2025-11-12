import { useEffect, memo, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import { useLoading } from "../context/LoadingContext";

const TeamMemberCard = memo(({ member, delay }) => (
  <motion.div
    className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="w-full h-60" style={{ backgroundColor: member.color || "#ccc" }} />
    <div className="p-6">
      <h3 className="text-xl font-semibold font-serif">{member.name}</h3>
      <p className="text-sm italic mb-2 text-blue-800">{member.specialty}</p>
      <p className="text-[#555] text-sm">{member.bio}</p>
    </div>
  </motion.div>
));

function TeamPage() {
  const { setLoading } = useLoading();
  const [teamData, setTeamData] = useState([]);
  const [error, setError] = useState(null);

  // Fetch team members + control global loading
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true); // Show full-screen spinner
      setError(null);

      try {
        const { data } = await api.get("/api/team-members", {
          params: { team_type: "technical" },
        });

        setTeamData(
          (data.members || []).map((member) => ({
            name: member.name,
            specialty: member.role,
            bio: member.description || "",
            color: member.color,
          }))
        );
      } catch (err) {
        setError("Failed to load team members.");
        toast.error("Failed to load team members.");
        setTeamData([]); // Ensure empty state
      } finally {
        setLoading(false); // Hide spinner — always!
      }
    };

    fetchTeam();
  }, [setLoading]);

  // SEO
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/team`;
  const pageTitle = "Technical Team — Shahu Mumbai";
  const pageDesc = "Meet the innovators and engineers powering Shahu Mumbai.";

  return (
    <Layout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="bg-[#F1E7E5] px-4 sm:px-10 py-16 min-h-screen text-[#2e2e2e]">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-serif mb-4">Technical Team</h1>
          <p className="text-[#555] max-w-xl mx-auto">
            Meet our innovators and engineers who power our technology, ensuring smooth,
            secure, and high-performing solutions.
          </p>
        </motion.div>

        {error && <div className="text-center text-red-600 mb-8">{error}</div>}

        {teamData.length === 0 && !error ? (
          <div className="text-center text-gray-600">No technical team members found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {teamData.map((member, idx) => (
              <TeamMemberCard key={member.name} member={member} delay={idx * 0.15} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default memo(TeamPage);