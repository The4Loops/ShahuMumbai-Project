import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../supabase/axios";
import { toast } from "react-toastify";

export default function TeamManagement() {
  const [teamType, setTeamType] = useState("artist");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    color: "bg-pink-500",
    team_type: teamType,
    description: "",
  });

  // Fetch team members
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      setTeamData([]); // Clear teamData to prevent stale data
      try {
        const { data } = await api.get("/api/team-members", {
          params: { team_type: teamType },
        });
        setTeamData(data.members || []);
      } catch (err) {
        toast.error("Failed to load team members");
        setTeamData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamType]);

  // Update newMember.team_type when teamType changes
  useEffect(() => {
    setNewMember((prev) => ({ ...prev, team_type: teamType }));
  }, [teamType]);

  const filteredTeam = teamData.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddOrUpdateMember = async () => {
    if (!newMember.name || !newMember.role) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      let response;
      if (isEditing && editingId) {
        response = await api.put(`/api/team-members/${editingId}`, newMember);
      } else {
        response = await api.post("/api/team-members", newMember);
      }
      toast.success(isEditing ? "Member updated" : "Member added");

      // Refresh team data
      const { data } = await api.get("/api/team-members", {
        params: { team_type: teamType },
      });
      setTeamData(data.members || []);

      // Reset modal
      setNewMember({ name: "", role: "", color: "bg-pink-500", team_type: teamType, description: "" });
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      toast.error("Failed to save member");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await api.delete(`/api/team-members/${id}`);
      toast.success("Member deleted");
      // Refresh team data
      const { data } = await api.get("/api/team-members", {
        params: { team_type: teamType },
      });
      setTeamData(data.members || []);
    } catch (err) {
      toast.error("Failed to delete member");
    }
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
          <button
            className="bg-black text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setNewMember({ name: "", role: "", color: "bg-pink-500", team_type: teamType, description: "" });
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
          {loading ? (
            <p>Loading...</p>
          ) : filteredTeam.length === 0 ? (
            <p className="col-span-full text-center text-gray-600">No {teamType} team members found</p>
          ) : (
            filteredTeam.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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
                  {member.team_type}
                </span>

                {/* Edit/Delete Icons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => {
                      setNewMember({
                        name: member.name,
                        role: member.role,
                        color: member.color,
                        team_type: member.team_type,
                        description: member.desc || "",
                      });
                      setIsEditing(true);
                      setEditingId(member.id);
                      setShowModal(true);
                    }}
                    className="bg-gray-100 p-1 rounded hover:bg-gray-200"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="bg-gray-100 p-1 rounded hover:bg-gray-200"
                  >
                    🗑
                  </button>
                </div>
              </motion.div>
            ))
          )}
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
                  value={newMember.team_type}
                  onChange={(e) => setNewMember({ ...newMember, team_type: e.target.value })}
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
                  placeholder="Short Bio"
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  value={newMember.description}
                  maxLength={300}
                  onChange={(e) => setNewMember({ ...newMember, description: e.target.value })}
                />
                <p className="text-gray-400 text-sm text-right">{newMember.description.length}/300 characters</p>

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