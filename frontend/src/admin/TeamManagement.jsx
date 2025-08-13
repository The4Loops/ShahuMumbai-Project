import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const artistTeam = [
  {
    initials: "IC",
    name: "Isabella Chen",
    role: "Lead Designer",
    desc: "Creative visionary with 8+ years in vintage-inspired design.",
    color: "bg-pink-500",
  },
  // ... your other artist members
];

const technicalTeam = [
  {
    initials: "JD",
    name: "John Doe",
    role: "Frontend Engineer",
    desc: "Expert in React and modern frontend tech.",
    color: "bg-blue-500",
  },
  // ... your other technical members
];

export default function TeamManagement() {
  const [teamType, setTeamType] = useState("artist");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [artistTeamState, setArtistTeamState] = useState(artistTeam);
  const [technicalTeamState, setTechnicalTeamState] = useState(technicalTeam);

  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    color: "bg-pink-500",
    team: teamType,
    desc: "",
  });

  const teamData = teamType === "artist" ? artistTeamState : technicalTeamState;
  const filteredTeam = teamData.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddOrUpdateMember = () => {
    if (!newMember.name || !newMember.role) {
      return alert("Please fill all required fields");
    }

    const memberToSave = {
      ...newMember,
      initials: newMember.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    };

    if (isEditing && editingIndex !== null) {
      // Remove from original team
      if (teamType === "artist") {
        setArtistTeamState((prev) =>
          prev.filter((_, i) => i !== editingIndex)
        );
      } else {
        setTechnicalTeamState((prev) =>
          prev.filter((_, i) => i !== editingIndex)
        );
      }

      // Add to new/selected team
      if (newMember.team === "artist") {
        setArtistTeamState((prev) => [...prev, memberToSave]);
      } else {
        setTechnicalTeamState((prev) => [...prev, memberToSave]);
      }
    } else {
      // Add new member
      if (newMember.team === "artist") {
        setArtistTeamState((prev) => [...prev, memberToSave]);
      } else {
        setTechnicalTeamState((prev) => [...prev, memberToSave]);
      }
    }

    // Reset modal
    setNewMember({ name: "", role: "", color: "bg-pink-500", team: teamType, desc: "" });
    setShowModal(false);
    setIsEditing(false);
    setEditingIndex(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center">Team Management</h1>

      {/* Team Toggle */}
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

      {/* Search + Add */}
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
            Total: {artistTeamState.length + technicalTeamState.length}
          </span>
          <button
            className="bg-black text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setNewMember({ name: "", role: "", color: "bg-pink-500", team: teamType, desc: "" });
              setIsEditing(false);
              setShowModal(true);
            }}
          >
            + Add {teamType === "artist" ? "Artist" : "Tech"}
          </button>
        </div>
      </div>

     {/* Team Cards */}
<motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
  <AnimatePresence mode="popLayout">
    {filteredTeam.map((member, idx) => (
      <motion.div
        key={member.name + idx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: idx * 0.05 }}
        whileHover={{
          scale: 1.03,
          boxShadow: "0px 10px 25px rgba(0,0,0,0.15)",
          borderColor: "#000000",
        }}
        className="relative border border-gray-200 rounded-lg p-5 transition-all duration-300 group"
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

        {/* Edit/Delete Icons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => {
              setNewMember({ ...member, team: teamType });
              setIsEditing(true);
              setEditingIndex(idx);
              setShowModal(true);
            }}
            className="bg-gray-100 p-1 rounded hover:bg-gray-200"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (teamType === "artist") {
                setArtistTeamState((prev) => prev.filter((_, i) => i !== idx));
              } else {
                setTechnicalTeamState((prev) => prev.filter((_, i) => i !== idx));
              }
            }}
            className="bg-gray-100 p-1 rounded hover:bg-gray-200"
          >
            🗑
          </button>
        </div>
      </motion.div>
    ))}
  </AnimatePresence>
</motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="bg-white rounded-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {isEditing ? "Edit Team Member" : "Add New Team Member"}
                </h2>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-4">
                <div
                  className={`w-16 h-16 flex items-center justify-center text-white rounded-full ${newMember.color} text-lg font-semibold mb-2`}
                >
                  {newMember.name
                    ? newMember.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "XX"}
                </div>
                <div className="text-center">
                  <p className="font-semibold">{newMember.name || "Team Member Name"}</p>
                  <p className="text-gray-500">{newMember.role || "Role/Specialty"}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Role/Specialty *"
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                />
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  value={newMember.team}
                  onChange={(e) => setNewMember({ ...newMember, team: e.target.value })}
                >
                  <option value="artist">Artist Team</option>
                  <option value="technical">Technical Team</option>
                </select>

                {/* Color picker */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "bg-pink-500",
                    "bg-purple-500",
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-orange-400",
                    "bg-red-500",
                    "bg-teal-500",
                    "bg-gray-600",
                  ].map((color) => (
                    <div
                      key={color}
                      className={`${color} w-8 h-8 rounded-lg cursor-pointer border ${
                        newMember.color === color ? "border-black" : "border-transparent"
                      }`}
                      onClick={() => setNewMember({ ...newMember, color })}
                    />
                  ))}
                </div>

                <textarea
                  placeholder="Short Bio *"
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  value={newMember.desc}
                  maxLength={300}
                  onChange={(e) => setNewMember({ ...newMember, desc: e.target.value })}
                />
                <p className="text-gray-400 text-sm text-right">{newMember.desc.length}/300 characters</p>

                <button
                  className="bg-black text-white px-4 py-2 rounded-lg w-full"
                  onClick={handleAddOrUpdateMember}
                >
                  {isEditing ? "Update Member" : "Add Member"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
