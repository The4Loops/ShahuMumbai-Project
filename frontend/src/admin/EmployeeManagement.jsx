import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiGrid, FiList, FiX } from "react-icons/fi";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";

function EmployeeManagement() {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [actionMenuUserId, setActionMenuUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    FullName: "",
    Email: "",
    Password: "",
    role: "Users",
    Active: true,
  });

  // Store refs for each action menu
  const actionMenuRefs = useRef({});

  const badgeColors = {
    Admin: "bg-red-100 text-red-600",
    Manager: "bg-blue-100 text-blue-600",
    Editor: "bg-green-100 text-green-600",
    Users: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-600",
    inactive: "bg-red-100 text-red-600",
  };

  const avatarColors = {
    Admin: "bg-red-500 text-white",
    Manager: "bg-blue-500 text-white",
    Editor: "bg-green-500 text-white",
    Users: "bg-gray-500 text-white",
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/users", {
        params: {
          search: search || undefined,
          role: roleFilter !== "All" ? roleFilter : undefined,
          status: statusFilter !== "All" ? statusFilter.toLowerCase() : undefined,
          excludeRole: "Users",
        },
      });
      const transformedUsers = response.data.users.map(user => ({
        UserId: user.UserId,
        FullName: user.FullName,
        Email: user.Email,
        role: user.Label,
        Active: user.Active,
        Joined: user.Joined || "N/A",
        LastLogin: user.LastLogin || "Never",
      }));
      setUsers(transformedUsers);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce fetchUsers to prevent excessive API calls
  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), [search, roleFilter, statusFilter]);

  useEffect(() => {
    debouncedFetchUsers();
  }, [debouncedFetchUsers]);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuUserId !== null) {
        const currentRef = actionMenuRefs.current[actionMenuUserId];
        if (currentRef && !currentRef.contains(e.target)) {
          setActionMenuUserId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuUserId]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") resetForm();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleAddOrEditUser = async () => {
    if (!newUser.FullName || !newUser.Email) {
      toast.dismiss();
      toast.error("Name and Email are required!");
      return;
    }
    if (editingUserId === null && (!newUser.Password || newUser.Password.length < 8)) {
      toast.dismiss();
      toast.error("Password is required and must be at least 8 characters!");
      return;
    }

    try {
      if (editingUserId !== null) {
        await api.put(`/api/users/${editingUserId}`, {
          FullName: newUser.FullName,
          Email: newUser.Email,
          Password: newUser.Password || undefined,
          role: newUser.role,
          Active: newUser.Active,
        });
        toast.dismiss();
        toast.success("User updated successfully");
      } else {
        await api.post("/api/users", {
          FullName: newUser.FullName,
          Email: newUser.Email,
          Password: newUser.Password,
          role: newUser.role,
          Active: newUser.Active,
        });
        toast.dismiss();
        toast.success("User created successfully");
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (userId) => {
    const user = users.find(u => u.UserId === userId);
    if (!user) return;
    setNewUser({
      FullName: user.FullName,
      Email: user.Email,
      Password: "",
      role: user.role,
      Active: user.Active,
    });
    setEditingUserId(userId);
    setShowModal(true);
    setActionMenuUserId(null);
  };

  const handleDelete = async (userId) => {
    const user = users.find(u => u.UserId === userId);
    if (!user) return;
    if (window.confirm(`Are you sure you want to delete ${user.FullName}?`)) {
      try {
        await api.delete(`/api/users/${user.UserId}`);
        toast.dismiss();
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.error || "Failed to delete user");
      }
    }
    setActionMenuUserId(null);
  };

  const resetForm = () => {
    setNewUser({
      FullName: "",
      Email: "",
      Password: "",
      role: "Users",
      Active: true,
    });
    setEditingUserId(null);
    setShowModal(false);
  };

  const renderAvatar = (user) => {
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          avatarColors[user.role] || avatarColors.Users
        }`}
      >
        {user.FullName?.charAt(0) || "?"}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Employee Management</h1>
      <p className="text-gray-500 text-sm mt-1">Manage users, roles, and permissions across your organization</p>

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
            <select
              className="border rounded-lg px-3 py-2"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option>All</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Editor</option>
              <option>Users</option>
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>active</option>
              <option>inactive</option>
            </select>
            <button
              onClick={() => {
                setShowModal(true);
                setEditingUserId(null);
              }}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {users?.length || 0} of {users?.length || 0} users
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

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No users found.</div>
      ) : view === "table" ? (
        <div className="mt-6 border rounded-lg overflow-x-auto shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Users</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Joined</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.UserId} className="border-b hover:bg-gray-50 relative">
                  <td className="py-3 px-4 flex items-center gap-3">
                    {renderAvatar(user)}
                    <div>
                      <div className="font-medium">{user.FullName}</div>
                      <div className="text-sm text-gray-500">{user.Email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        badgeColors[user.Active ? "active" : "inactive"]
                      }`}
                    >
                      {user.Active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.Joined}
                    <div className="text-xs text-gray-400">Last: {user.LastLogin}</div>
                  </td>
                  <td className="py-3 px-4 text-right relative">
                    <div ref={(el) => (actionMenuRefs.current[user.UserId] = el)}>
                      <button
                        onClick={() => setActionMenuUserId(actionMenuUserId === user.UserId ? null : user.UserId)}
                        className="px-2 py-1 rounded hover:bg-gray-100"
                      >
                        ⋮
                      </button>
                      {actionMenuUserId === user.UserId && (
                        <div className="absolute right-4 mt-1 bg-white border rounded shadow-lg text-sm z-10">
                          <button
                            onClick={() => handleEdit(user.UserId)}
                            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.UserId)}
                            className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.UserId}
              className="border rounded-lg p-4 bg-white flex flex-col gap-2 shadow-sm hover:shadow-md transition relative"
            >
              <div className="flex items-center gap-3">
                {renderAvatar(user)}
                <div>
                  <div className="font-medium">{user.FullName}</div>
                  <div className="text-sm text-gray-500">{user.Email}</div>
                </div>
                <div ref={(el) => (actionMenuRefs.current[user.UserId] = el)}>
                  <button
                    onClick={() => setActionMenuUserId(actionMenuUserId === user.UserId ? null : user.UserId)}
                    className="ml-auto px-2 py-1 rounded hover:bg-gray-100"
                  >
                    ⋮
                  </button>
                  {actionMenuUserId === user.UserId && (
                    <div className="absolute right-4 top-10 bg-white border rounded shadow-lg text-sm z-10">
                      <button
                        onClick={() => handleEdit(user.UserId)}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.UserId)}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[user.role]}`}>
                  {user.role}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    badgeColors[user.Active ? "active" : "inactive"]
                  }`}
                >
                  {user.Active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="text-sm text-gray-600">Joined: {user.Joined}</div>
              <div className="text-xs text-gray-400">Last Login: {user.LastLogin}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button onClick={resetForm} className="absolute top-3 right-3 text-gray-500 hover:text-black">
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">{editingUserId !== null ? "Edit User" : "Add New User"}</h2>

            <input
              type="text"
              placeholder="Full Name"
              value={newUser.FullName}
              onChange={(e) => setNewUser({ ...newUser, FullName: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mb-3"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newUser.Email}
              onChange={(e) => setNewUser({ ...newUser, Email: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mb-3"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.Password}
              onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mb-3"
            />

            <div className="flex gap-3 mb-3">
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="border rounded-lg px-3 py-2 w-1/2"
              >
                <option value="Users">Users</option>
                <option value="Editor">Editor</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
              <select
                value={newUser.Active ? "active" : "inactive"}
                onChange={(e) => setNewUser({ ...newUser, Active: e.target.value === "active" })}
                className="border rounded-lg px-3 py-2 w-1/2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={handleAddOrEditUser}
              className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800"
            >
              {editingUserId !== null ? "Update User" : "Add User"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;