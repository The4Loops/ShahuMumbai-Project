import React, { useState, useRef, useEffect } from "react";
import { Eye, Edit, Trash2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../supabase/axios";
import { toast } from "react-toastify";

/* ------------------------- Avatar Upload ------------------------- */
const AvatarUpload = ({ avatarPreview, setAvatarPreview, name }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file && file.type?.startsWith("image/")) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`w-24 h-24 rounded-full border border-gray-300 overflow-hidden mx-auto mb-2 flex items-center justify-center cursor-pointer ${
        isDragOver ? "border-blue-400 bg-blue-50" : "bg-gray-200"
      }`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {avatarPreview ? (
        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-500 text-2xl">{name?.[0] ?? "U"}</span>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

/* --------------------------- User Tab ---------------------------- */
function UserTab() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  const roles = ["Admin", "Users", "Editor", "Moderator"];
  const statuses = ["Active", "Inactive"];

  // Normalize any incoming API user shape to our UI model
 const normalizeUser = (u, idx) => {
  const id = u?.UserId ?? u?.id ?? u?.email ?? `${idx}-${Date.now()}`;
  return {
    _key: String(id),
    id,
    name: u?.FullName ?? u?.full_name ?? u?.name ?? "—",
    email: u?.Email ?? u?.email ?? "—",
    role: u?.role ?? u?.Label ?? "Users",
    status: (typeof u?.Active === "boolean" ? u.Active : u?.Active === 'Y') ? "Active" : "Inactive",
    joined: u?.Joined ?? u?.joined ?? "N/A",
    last: u?.LastLogin ?? u?.last_login ?? "Never",
    avatar: u?.ProfileImage ?? u?.avatar ?? null,
  };
};

  // Fetch with pagination + search; tolerate multiple API shapes
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/users", {
        params: {
          role: "Users",
          search: searchQuery || undefined,
          page,
          limit,
        }
      });

      const raw = response?.data;

      // Support various common shapes: { users: [] }, { data: [] }, [], { results: [] }
      let list =
        (Array.isArray(raw?.users) && raw.users) ||
        (Array.isArray(raw?.data) && raw.data) ||
        (Array.isArray(raw?.results) && raw.results) ||
        (Array.isArray(raw) && raw) ||
        [];

      const mapped = list.map(normalizeUser);

      const total =
        (Number.isFinite(raw?.total) && raw.total) ||
        (Number.isFinite(raw?.count) && raw.count) ||
        mapped.length;

      setUsers(mapped);
      setTotalUsers(total);
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.error || "Failed to fetch users");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  // Edit user
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setAvatarPreview(user?.avatar ?? null);
    setIsAddEditModalOpen(true);
  };

  // Save user (create/update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const role = form.role.value;
    const status = form.status.value;

    if (!name || !email) return toast.error("Name and Email are required!");

    try {
      if (currentUser) {
        await api.put(`/api/users/${currentUser.id}`, {
          full_name: name,
          email,
          role,
          active: status === "Active",
        });
        toast.success("User updated successfully");
      } else {
        await api.post("/api/users", {
          full_name: name,
          email,
          password: "password123", // placeholder; replace with your flow
          role,
          active: status === "Active",
        });
        toast.success("User created successfully");
      }
      fetchUsers();
      setIsAddEditModalOpen(false);
      setCurrentUser(null);
      setAvatarPreview(null);
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.error || "Failed to save user");
    }
  };

  // Delete user
  const confirmDeleteUser = async () => {
    if (!currentUser?.id) return;
    try {
      await api.delete(`/api/users/${currentUser.id}`);
      toast.success("User deleted successfully");
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.error || "Failed to delete user");
    }
  };

  const totalPages = Math.max(1, Math.ceil((totalUsers || 0) / limit));

  return (
    <div className="p-4">
      {/* 🔍 Search Bar */}
      <div className="mb-4 flex items-center gap-2">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1); // reset page on new search
          }}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full border-collapse bg-white rounded-xl shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left border-b border-gray-200">
              <th className="px-4 py-3 text-gray-600 font-medium">User</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Role</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Joined</th>
              <th className="px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user._key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-200">
                      {user.avatar ? (
                        <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 font-semibold">{user?.name?.[0] ?? "U"}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-500 text-sm">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      } text-sm px-2 py-1 rounded-full`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{user.joined}</div>
                    <div className="text-gray-400">Last: {user.last}</div>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
                      aria-label="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 rounded-full hover:bg-green-100 text-green-600"
                      aria-label="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUser(user);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 rounded-full hover:bg-red-100 text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Controls */}
      {users.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 border rounded disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 border rounded disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md sm:max-w-sm relative"
          >
            <button
              onClick={() => {
                setIsAddEditModalOpen(false);
                setCurrentUser(null);
                setAvatarPreview(null);
              }}
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">{currentUser ? "Edit User" : "Add User"}</h2>

            <AvatarUpload
              avatarPreview={avatarPreview}
              setAvatarPreview={setAvatarPreview}
              name={currentUser?.name || ""}
            />
            <label className="block text-sm font-medium text-gray-700 text-center mb-4">
              Click to Upload
            </label>

            <div className="space-y-3">
              <input
                name="name"
                defaultValue={currentUser?.name || ""}
                placeholder="Name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                name="email"
                defaultValue={currentUser?.email || ""}
                placeholder="Email"
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                name="role"
                defaultValue={currentUser?.role || roles[1]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={currentUser?.status || statuses[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddEditModalOpen(false);
                  setCurrentUser(null);
                  setAvatarPreview(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md sm:max-w-sm relative">
            <button
              onClick={() => setSelectedUser(null)}
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">User Details</h2>
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 mx-auto">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl text-gray-500">
                  {selectedUser?.name?.[0] ?? "U"}
                </div>
              )}
            </div>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Role:</strong> {selectedUser.role}</p>
            <p><strong>Status:</strong> {selectedUser.status}</p>
            <p><strong>Joined:</strong> {selectedUser.joined}</p>
            <p><strong>Last Active:</strong> {selectedUser.last}</p>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md sm:max-w-sm relative">
            <h2 className="text-lg font-semibold mb-4">Delete User</h2>
            <p>
              Are you sure you want to delete <strong>{currentUser?.name ?? "this user"}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                type="button"
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTab;
