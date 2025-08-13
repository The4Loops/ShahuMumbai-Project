import React, { useState, useEffect, useRef } from "react";
import { FiGrid, FiList, FiX } from "react-icons/fi";

export default function UserManagement() {
  const [users, setUsers] = useState([
    { name: "John Doe", email: "john.doe@example.com", role: "admin", status: "active", joined: "Jan 15, 2024", lastLogin: "Jan 20, 2024" },
    { name: "Sarah Mitchell", email: "sarah.mitchell@example.com", role: "manager", status: "active", joined: "Jan 12, 2024", lastLogin: "Jan 19, 2024" },
    { name: "Michael Chen", email: "michael.chen@example.com", role: "editor", status: "active", joined: "Jan 10, 2024", lastLogin: "Jan 18, 2024" },
    { name: "Emily Rodriguez", email: "emily.rodriguez@example.com", role: "user", status: "inactive", joined: "Jan 8, 2024", lastLogin: "Jan 15, 2024" },
    { name: "David Wilson", email: "david.wilson@example.com", role: "user", status: "active", joined: "Jan 5, 2024", lastLogin: "Jan 17, 2024" },
    { name: "Lisa Thompson", email: "lisa.thompson@example.com", role: "editor", status: "active", joined: "Jan 3, 2024", lastLogin: "Jan 16, 2024" },
  ]);

  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [actionMenuIndex, setActionMenuIndex] = useState(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
  });

  const menuRef = useRef(null);

  const badgeColors = {
    admin: "bg-red-100 text-red-600",
    manager: "bg-blue-100 text-blue-600",
    editor: "bg-green-100 text-green-600",
    user: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-600",
    inactive: "bg-red-100 text-red-600",
  };

  const avatarColors = {
    admin: "bg-red-500 text-white",
    manager: "bg-blue-500 text-white",
    editor: "bg-green-500 text-white",
    user: "bg-gray-500 text-white",
  };

  const filteredUsers = users.filter((u) => {
    return (
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === "All" || u.role === roleFilter.toLowerCase()) &&
      (statusFilter === "All" || u.status === statusFilter.toLowerCase())
    );
  });

  const handleAddOrEditUser = () => {
    if (!newUser.name || !newUser.email) return alert("Name and Email are required!");

    if (editingIndex !== null) {
      const updated = [...users];
      updated[editingIndex] = { ...users[editingIndex], ...newUser };
      setUsers(updated);
    } else {
      const now = new Date();
      const joinedDate = now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const addedUser = {
        ...newUser,
        joined: joinedDate,
        lastLogin: "Never",
      };

      setUsers([addedUser, ...users]);
    }

    resetForm();
  };

  const handleEdit = (index) => {
    setNewUser({ ...users[index], password: "" });
    setEditingIndex(index);
    setShowModal(true);
    setActionMenuIndex(null);
  };

  const handleDelete = (index) => {
    if (window.confirm(`Are you sure you want to delete ${users[index].name}?`)) {
      setUsers(users.filter((_, i) => i !== index));
    }
    setActionMenuIndex(null);
  };

  const resetForm = () => {
    setNewUser({ name: "", email: "", password: "", role: "user", status: "active" });
    setEditingIndex(null);
    setShowModal(false);
  };

  const renderAvatar = (user) => {
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${avatarColors[user.role]}`}>
        {user.name.charAt(0)}
      </div>
    );
  };

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActionMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-semibold">Employee Management</h1>
      <p className="text-gray-500 text-sm mt-1">Manage users, roles, and permissions across your organization</p>

      {/* Filter Section */}
      <div className="mt-6 p-2 border rounded-lg bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <span className="text-gray-500">🔍 Filter & Search Users</span>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="border rounded-lg px-3 py-2 w-full sm:w-64 focus:ring focus:ring-blue-200 outline-none"
            />
            <select className="border rounded-lg px-3 py-2" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option>All</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Editor</option>
              <option>User</option>
            </select>
            <select className="border rounded-lg px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button
              onClick={() => { setShowModal(true); setEditingIndex(null); }}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      {/* Table/Cards Toggle */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </p>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded flex items-center gap-1 ${view === "table" ? "bg-black text-white" : "bg-gray-100"}`}
            onClick={() => setView("table")}
          >
            <FiList /> Table
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center gap-1 ${view === "cards" ? "bg-black text-white" : "bg-gray-100"}`}
            onClick={() => setView("cards")}
          >
            <FiGrid /> Cards
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === "table" && (
        <div className="mt-6 border rounded-lg overflow-x-auto shadow-sm relative">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">User</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Joined</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 relative">
                  <td className="py-3 px-4 flex items-center gap-3">
                    {renderAvatar(user)}
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[user.status]}`}>{user.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.joined}
                    <div className="text-xs text-gray-400">Last: {user.lastLogin}</div>
                  </td>
                  <td className="py-3 px-4 text-right relative" ref={menuRef}>
                    <button onClick={() => setActionMenuIndex(actionMenuIndex === idx ? null : idx)} className="px-2 py-1 rounded hover:bg-gray-100">⋮</button>
                    {actionMenuIndex === idx && (
                      <div className="absolute right-4 mt-1 bg-white border rounded shadow-lg text-sm z-10">
                        <button onClick={() => handleEdit(idx)} className="block px-4 py-2 hover:bg-gray-100 w-full text-left">Edit</button>
                        <button onClick={() => handleDelete(idx)} className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards View */}
      {view === "cards" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white flex flex-col gap-2 shadow-sm hover:shadow-md transition relative">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${avatarColors[user.role]}`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <button onClick={() => setActionMenuIndex(actionMenuIndex === idx ? null : idx)} className="ml-auto px-2 py-1 rounded hover:bg-gray-100">⋮</button>
                {actionMenuIndex === idx && (
                  <div className="absolute right-4 top-10 bg-white border rounded shadow-lg text-sm z-10" ref={menuRef}>
                    <button onClick={() => handleEdit(idx)} className="block px-4 py-2 hover:bg-gray-100 w-full text-left">Edit</button>
                    <button onClick={() => handleDelete(idx)} className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600">Delete</button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[user.role]}`}>{user.role}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[user.status]}`}>{user.status}</span>
              </div>
              <div className="text-sm text-gray-600">Joined: {user.joined}</div>
              <div className="text-xs text-gray-400">Last Login: {user.lastLogin}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button onClick={resetForm} className="absolute top-3 right-3 text-gray-500 hover:text-black">
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">{editingIndex !== null ? "Edit User" : "Add New User"}</h2>

            <input type="text" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="border rounded-lg px-3 py-2 w-full mb-3" />
            <input type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="border rounded-lg px-3 py-2 w-full mb-3" />
            <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="border rounded-lg px-3 py-2 w-full mb-3" />

            <div className="flex gap-3 mb-3">
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border rounded-lg px-3 py-2 w-1/2">
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <select value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value })} className="border rounded-lg px-3 py-2 w-1/2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button onClick={handleAddOrEditUser} className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800">
              {editingIndex !== null ? "Update User" : "Add User"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
