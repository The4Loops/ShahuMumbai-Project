import React, { useState, useRef } from "react";
import { Eye, Edit, Trash2, X, Search } from "lucide-react";

// Avatar Upload Component
const AvatarUpload = ({ avatarPreview, setAvatarPreview, name }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleFiles = (files) => {
    const file = files[0];
    if (file && file.type.startsWith("image/")) {
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
      onClick={() => fileInputRef.current.click()}
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
        <span className="text-gray-500 text-2xl">{name?.[0] || "U"}</span>
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

function UserTab() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "4 Loops",
      email: "4loops2025@gmail.com",
      role: "Admin",
      status: "Active",
      joined: "8/15/2025",
      last: "8/16/2025",
      avatar: null,
    },
    {
      id: 2,
      name: "Aman Gupta",
      email: "gaman0324@gmail.com",
      role: "User",
      status: "Active",
      joined: "8/15/2025",
      last: "8/15/2025",
      avatar: null,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const roles = ["Admin", "User", "Editor", "Moderator"];
  const statuses = ["Active", "Inactive"];

  // Filter users based on search query
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Edit user
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setAvatarPreview(user.avatar || null);
    setIsAddEditModalOpen(true);
  };

  // Save user (add/edit)
  const handleSaveUser = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const role = form.role.value;
    const status = form.status.value;

    if (!name || !email) return alert("Name and Email are required!");

    const newUser = {
      id: currentUser ? currentUser.id : users.length + 1,
      name,
      email,
      role,
      status,
      joined: currentUser ? currentUser.joined : new Date().toLocaleDateString(),
      last: new Date().toLocaleDateString(),
      avatar: avatarPreview,
    };

    if (currentUser) {
      setUsers(users.map((u) => (u.id === currentUser.id ? newUser : u)));
    } else {
      setUsers([newUser, ...users]);
    }

    setIsAddEditModalOpen(false);
  };

  // Delete user
  const handleDeleteUser = (user) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    setUsers(users.filter((u) => u.id !== currentUser.id));
    setIsDeleteModalOpen(false);
    setCurrentUser(null);
  };

  return (
    <div className="p-4">
      {/* Search Bar Only */}
      <div className="mb-4 flex items-center gap-2">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-200">
                      {user.avatar ? (
                        <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 font-semibold">{user.name[0]}</span>
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
                    <button onClick={() => setSelectedUser(user)} className="p-2 rounded-full hover:bg-blue-100 text-blue-600">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handleEditUser(user)} className="p-2 rounded-full hover:bg-green-100 text-green-600">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteUser(user)} className="p-2 rounded-full hover:bg-red-100 text-red-600">
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

      {/* Mobile Card Layout */}
      <div className="space-y-3 sm:hidden">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-full overflow-hidden bg-gray-200">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 font-semibold text-lg">{user.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.name}</div>
                  <div className="text-gray-500 text-sm truncate">{user.email}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-gray-500">Joined</div>
                  <div className="text-sm font-medium">{user.joined}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="text-sm mr-2">Role: <span className="font-medium">{user.role}</span></div>
                <div>
                  <span
                    className={`${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    } text-xs px-2 py-0.5 rounded-full`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-1">Last: {user.last}</div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelectedUser(user)} className="p-2 rounded-md bg-blue-50 text-blue-600">
                  <Eye size={16} />
                </button>
                <button onClick={() => handleEditUser(user)} className="p-2 rounded-md bg-green-50 text-green-600">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteUser(user)} className="p-2 rounded-md bg-red-50 text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No users found</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md sm:max-w-sm relative"
          >
            <button
              onClick={() => setIsAddEditModalOpen(false)}
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
                onClick={() => setIsAddEditModalOpen(false)}
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
                  {selectedUser.name[0]}
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md sm:max-w-sm relative">
            <h2 className="text-lg font-semibold mb-4">Delete User</h2>
            <p>
              Are you sure you want to delete <strong>{currentUser?.name}</strong>?
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
