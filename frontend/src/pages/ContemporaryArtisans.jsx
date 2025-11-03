// // src/pages/ContemporaryArtisans.jsx (or TeamPage.jsx if you prefer)
// import { useState, useEffect, memo } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import Layout from "../layout/Layout";
// import api from "../supabase/axios";
// import { toast } from "react-toastify";
// import { Helmet } from "react-helmet-async";

// // --- Components ---
// const TeamToggle = ({ view, setView }) => (
//   <nav aria-label="Team categories" className="flex justify-center mb-12 relative">
//     <div className="flex gap-8 relative">
//       {["artisans", "technical"].map((type) => {
//         const isActive = view === type;
//         return (
//           <motion.button
//             key={type}
//             onClick={() => setView(type)}
//             aria-pressed={isActive}
//             className="relative px-4 py-2 font-medium text-lg rounded-md"
//             initial={false}
//             animate={{
//               scale: isActive ? 1.1 : 1,
//               color: isActive ? (type === "artisans" ? "#e91e63" : "#1e88e5") : "#333",
//             }}
//             transition={{ type: "spring", stiffness: 400, damping: 25 }}
//           >
//             {type === "artisans" ? "Contemporary Artisans" : "Technical Team"}
//             {isActive && (
//               <motion.div
//                 layoutId="underline"
//                 className="absolute left-0 right-0 h-[3px] bg-pink-800 bottom-0 rounded-full"
//                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
//               />
//             )}
//           </motion.button>
//         );
//       })}
//     </div>
//   </nav>
// );

// const TeamMemberCard = memo(({ member, view, delay }) => (
//   <motion.div
//     className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 overflow-hidden cursor-pointer"
//     initial={{ opacity: 0, y: 30 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.5, delay }}
//   >
//     <div className="w-full h-60" style={{ backgroundColor: member.color }} />
//     <div className="p-6">
//       <h3 className="text-xl font-semibold font-serif">{member.name}</h3>
//       <p
//         className={`text-sm italic mb-2 ${
//           view === "artisans" ? "text-pink-800" : "text-blue-800"
//         }`}
//       >
//         {member.specialty}
//       </p>
//       <p className="text-[#555] text-sm">{member.bio}</p>
//     </div>
//   </motion.div>
// ));

// function TeamPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [view, setView] = useState("artisans");
//   const [teamData, setTeamData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Load from query string or localStorage
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const savedView = params.get("view") || localStorage.getItem("teamView");
//     if (savedView === "technical" || savedView === "artisans") {
//       setView(savedView);
//     }
//   }, [location.search]);

//   // Save state to both query string and localStorage
//   const handleViewChange = (type) => {
//     setView(type);
//     localStorage.setItem("teamView", type);
//     const params = new URLSearchParams(location.search);
//     params.set("view", type);
//     navigate({ search: params.toString() }, { replace: true });
//   };

//   // Fetch team members from API
//   useEffect(() => {
//     const fetchTeam = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const { data } = await api.get("/api/team-members", {
//           params: { team_type: view === "artisans" ? "artist" : "technical" },
//         });
//         setTeamData(
//           (data.members || []).map((member) => ({
//             name: member.name,
//             specialty: member.role,
//             bio: member.description || "",
//             color: member.color,
//           }))
//         );
//       } catch (err) {
//         setError("Failed to load team members.");
//         toast.error("Failed to load team members.");
//         setTeamData([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTeam();
//   }, [view]);

//   // --- SEO (invisible only) ---
//   const baseUrl =
//     typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
//   const canonical = `${baseUrl}/contemporaryartisans`; 
//   const pageTitle = view === "artisans" ? "Contemporary Artisans — Shahu Mumbai" : "Technical Team — Shahu Mumbai";
//   const pageDesc =
//     view === "artisans"
//       ? "Meet the contemporary artisans crafting our heritage pieces at Shahu Mumbai."
//       : "Meet the technical team powering innovation and performance at Shahu Mumbai.";

//   const itemListJsonLd = {
//     "@context": "https://schema.org",
//     "@type": "ItemList",
//     itemListElement: teamData.map((m, i) => ({
//       "@type": "ListItem",
//       position: i + 1,
//       item: {
//         "@type": "Person",
//         name: m.name,
//         description: m.bio || m.specialty,
//         jobTitle: m.specialty,
//       },
//     })),
//   };

//   const breadcrumbJsonLd = {
//     "@context": "https://schema.org",
//     "@type": "BreadcrumbList",
//     itemListElement: [
//       { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
//       {
//         "@type": "ListItem",
//         position: 2,
//         name: view === "artisans" ? "Contemporary Artisans" : "Technical Team",
//         item: canonical,
//       },
//     ],
//   };

//   return (
//     <Layout>
//       <Helmet>
//         {/* Core SEO */}
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDesc} />
//         <meta name="robots" content="index,follow,max-image-preview:large" />
//         <meta
//           name="keywords"
//           content={
//             view === "artisans"
//               ? "Shahu Mumbai artisans, Indian artisans, contemporary artisans, designer profiles, heritage craftsmanship, handmade fashion India, artisan directory"
//               : "Shahu Mumbai technical team, engineering team, technology team, product engineering, ecommerce performance, technical profiles"
//           }
//         />

//         {/* Canonical + hreflang */}
//         <link rel="canonical" href={canonical} />
//         <link rel="alternate" hrefLang="en-IN" href={canonical} />
//         <link rel="alternate" hrefLang="x-default" href={canonical} />

//         {/* Open Graph */}
//         <meta property="og:type" content="website" />
//         <meta property="og:site_name" content="Shahu Mumbai" />
//         <meta property="og:locale" content="en_IN" />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDesc} />
//         <meta property="og:url" content={canonical} />
//         <meta property="og:image" content={`${baseUrl}/og/team.jpg`} />
//         <meta
//           property="og:image:alt"
//           content={view === "artisans" ? "Shahu Mumbai — Contemporary Artisans" : "Shahu Mumbai — Technical Team"}
//         />

//         {/* Twitter
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:site" content="@yourhandle" /> 
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDesc} />
//         <meta name="twitter:image" content={`${baseUrl}/og/team.jpg`} /> */}

//         {/* Breadcrumbs (kept) */}
//         <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>

//         {/* CollectionPage wrapper + your ItemList of Persons */}
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "CollectionPage",
//             name: pageTitle,
//             url: canonical,
//             description: pageDesc,
//             isPartOf: { "@type": "WebSite", name: "Shahu Mumbai", url: baseUrl },
//             about:
//               view === "artisans"
//                 ? "Contemporary Indian artisans and designers featured by Shahu Mumbai"
//                 : "Shahu Mumbai technical team profiles",
//             mainEntity: itemListJsonLd, // your ItemList of Person entries
//           })}
//         </script>

//         {/* (Optional) Organization — include if you haven't set it sitewide */}
//         {/* <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "Organization",
//             name: "Shahu Mumbai",
//             url: baseUrl,
//             logo: `${baseUrl}/static/logo-300.png`,
//             // sameAs: ["https://www.instagram.com/...", "https://www.linkedin.com/company/...", "https://www.youtube.com/@..."]
//           })}
//         </script> */}
//       </Helmet>


//       <div className="bg-[#F1E7E5] px-4 sm:px-10 py-16 min-h-screen text-[#2e2e2e]">
//         {/* Toggle */}
//         <TeamToggle view={view} setView={handleViewChange} />

//         {/* Title & Description */}
//         <motion.div
//           className="text-center mb-16"
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <h1 className="text-4xl font-serif mb-4">
//             {view === "artisans" ? "Contemporary Artisans" : "Technical Team"}
//           </h1>
//           <p className="text-[#555] max-w-xl mx-auto">
//             {view === "artisans"
//               ? "Meet the hands and hearts behind our most treasured creations — keeping heritage alive with every stitch, cut, and carve."
//               : "Meet our innovators and engineers who power our technology, ensuring smooth, secure, and high-performing solutions."}
//           </p>
//         </motion.div>

//         {/* Error or Loading */}
//         {error && <div className="text-center text-red-600 mb-8">{error}</div>}
//         {loading ? (
//           <div className="text-center text-gray-600">Loading...</div>
//         ) : teamData.length === 0 ? (
//           <div className="text-center text-gray-600">
//             No {view === "artisans" ? "artisans" : "technical team members"} found.
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
//             {teamData.map((member, idx) => (
//               <TeamMemberCard key={member.name} member={member} view={view} delay={idx * 0.15} />
//             ))}
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// }

// export default memo(TeamPage);

// src/pages/TeamPage.jsx
import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import Layout from "../layout/Layout";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";

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
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch only technical team
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

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
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : teamData.length === 0 ? (
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
