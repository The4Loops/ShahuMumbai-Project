import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiGrid, FiList, FiX } from "react-icons/fi";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";

function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [assignRoleModal, setAssignRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [newRole, setNewRole] = useState({
    label: "",
    is_active: true,
  });
  const [assignRoleData, setAssignRoleData] = useState({
    user_id: "",
    role_id: "",
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

  // Fetch roles and users
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch roles
      const roleResponse = await api.get("/api/roles", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { search: search || undefined },
      });
      console.log("Frontend roles response:", roleResponse.data); // Debug log
      setRoles(roleResponse.data.roles);

      // Fetch users for assignment dropdown
      const userResponse = await api.get("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Frontend users response:", userResponse.data); // Debug log
      setUsers(userResponse.data.users);
    } catch (error) {
      console.error("Fetch error:", error.response?.data); // Debug log
      toast.dismiss();
      toast.error(error.response?.data?.error || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce fetchData
  const debouncedFetchData = useCallback(debounce(fetchData, 300), [search]);

  useEffect(() => {
    debouncedFetchData();
  }, [search]);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuId !== null) {
        const currentRef = actionMenuRefs.current[actionMenuId];
        if (currentRef && !currentRef.contains(e.target)) {
          setActionMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuId]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        resetForm();
        setAssignRoleModal(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleAddOrEditRole = async () => {
    if (!newRole.label) {
      toast.dismiss();
      toast.error("Role label is required!");
      return;
    }

    try {
      if (editingRoleId !== null) {
        await api.put(`/api/roles/${editingRoleId}`, {
          label: newRole.label,
          is_active: newRole.is_active,
        });
        toast.dismiss();
        toast.success("Role updated successfully");
      } else {
        await api.post("/api/roles", {
          label: newRole.label,
        });
        toast.dismiss();
        toast.success("Role created successfully");
      }
      fetchData();
      resetForm();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm(`Are you sure you want to delete this role?`)) {
      try {
        await api.delete(`/api/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.dismiss();
        toast.success("Role deleted successfully");
        fetchData();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.error || "Failed to delete role");
      }
    }
    setActionMenuId(null);
  };

  const handleAssignRole = async () => {
    if (!assignRoleData.user_id || !assignRoleData.role_id) {
      toast.dismiss();
      toast.error("User and role are required!");
      return;
    }

    try {
      await api.post("/api/roles/assign", assignRoleData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.dismiss();
      toast.success("Role assigned successfully");
      fetchData();
      setAssignRoleModal(false);
      setAssignRoleData({ user_id: "", role_id: "" });
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const resetForm = () => {
    setNewRole({ label: "", is_active: true });
    setEditingRoleId(null);
    setShowModal(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Role Management</h1>
      <p className="text-gray-500 text-sm mt-1">Manage roles and assign them to users</p>

      <div className="mt-6 p-2 border rounded-lg bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <span className="text-gray-500">🔍 Filter & Search Roles</span>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role label..."
              className="border rounded-lg px-3 py-2 w-full sm:w-64 focus:ring focus:ring-blue-200 outline-none"
            />
            <button
              onClick={() => {
                setShowModal(true);
                setEditingRoleId(null);
              }}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + Add Role
            </button>
            <button
              onClick={() => setAssignRoleModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Assign Role
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {roles?.length || 0} of {roles?.length || 0} roles
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
      ) : roles.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No roles found.</div>
      ) : view === "table" ? (
        <div className="mt-6 border rounded-lg overflow-x-auto shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Assigned Users</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Menus</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b hover:bg-gray-50 relative">
                  <td className="py-3 px-4">
                    <div className="font-medium">{role.label}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.is_active ? badgeColors.active : badgeColors.inactive
                      }`}
                    >
                      {role.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {role.users?.length > 0
                        ? role.users.map(user => user.email).join(", ")
                        : "No users assigned"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {role.menus?.length > 0
                        ? role.menus.map(menu => menu.label).join(", ")
                        : "No menus assigned"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right relative">
                    <div ref={(el) => (actionMenuRefs.current[role.id] = el)}>
                      <button
                        onClick={() => setActionMenuId(actionMenuId === role.id ? null : role.id)}
                        className="px-2 py-1 rounded hover:bg-gray-100"
                      >
                        ⋮
                      </button>
                      {actionMenuId === role.id && (
                        <div className="absolute right-4 mt-1 bg-white border rounded shadow-lg text-sm z-10">
                          <button
                            onClick={() => {
                              setNewRole({
                                label: role.label,
                                is_active: role.is_active,
                              });
                              setEditingRoleId(role.id);
                              setShowModal(true);
                              setActionMenuId(null);
                            }}
                            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
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
          {roles.map((role) => (
            <div
              key={role.id}
              className="border rounded-lg p-4 bg-white flex flex-col gap-2 shadow-sm hover:shadow-md transition relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{role.label}</div>
                  <div className="text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.is_active ? badgeColors.active : badgeColors.inactive
                      }`}
                    >
                      {role.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div ref={(el) => (actionMenuRefs.current[role.id] = el)}>
                  <button
                    onClick={() => setActionMenuId(actionMenuId === role.id ? null : role.id)}
                    className="px-2 py-1 rounded hover:bg-gray-100"
                  >
                    ⋮
                  </button>
                  {actionMenuId === role.id && (
                    <div className="absolute right-4 top-10 bg-white border rounded shadow-lg text-sm z-10">
                      <button
                        onClick={() => {
                          setNewRole({
                            label: role.label,
                            is_active: role.is_active,
                          });
                          setEditingRoleId(role.id);
                          setShowModal(true);
                          setActionMenuId(null);
                        }}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Assigned Users:</strong>{" "}
                {role.users?.length > 0
                  ? role.users.map(user => user.email).join(", ")
                  : "No users assigned"}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Menus:</strong>{" "}
                {role.menus?.length > 0 ? role.menus.map(menu => menu.label).join(", ") : "No menus assigned"}
              </div>
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
            <h2 className="text-xl font-semibold mb-4">{editingRoleId !== null ? "Edit Role" : "Add New Role"}</h2>
            <input
              type="text"
              placeholder="Role Label"
              value={newRole.label}
              onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mb-3"
            />
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={newRole.is_active}
                onChange={(e) => setNewRole({ ...newRole, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              Active
            </label>
            <button
              onClick={handleAddOrEditRole}
              className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800"
            >
              {editingRoleId !== null ? "Update Role" : "Add Role"}
            </button>
          </div>
        </div>
      )}

      {assignRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setAssignRoleModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Assign Role to User</h2>
            <select
              value={assignRoleData.user_id}
              onChange={(e) => setAssignRoleData({ ...assignRoleData, user_id: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mb-3"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.UserId} value={user.UserId}>
                  {user.Email} ({user.FullName || "No name"})
                </option>
              ))}
            </select>
            <select
              value={assignRoleData.role_id}
              onChange={(e) => setAssignRoleData({ ...assignRoleData, role_id: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mb-3"
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignRole}
              className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800"
            >
              Assign Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;