import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiGrid, FiList, FiX } from "react-icons/fi";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";

function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [dropdownMenus, setDropdownMenus] = useState([]);
  const [roles, setRoles] = useState([]);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("menu"); // "menu" or "menuItem"
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [newMenu, setNewMenu] = useState({
    label: "",
    href: "",
    order_index: 0,
    role_ids: [],
  });
  const [newMenuItem, setNewMenuItem] = useState({
    menu_id: "",
    label: "",
    href: "",
    order_index: 0,
    role_ids: [],
  });

  const actionMenuRefs = useRef({});

  const badgeColors = {
    Admin: "bg-red-100 text-red-600",
    Manager: "bg-blue-100 text-blue-600",
    Users: "bg-gray-100 text-gray-600",
    Editor: "bg-green-100 text-green-600",
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const roleResponse = await api.get("/api/roles", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setRoles(roleResponse.data.roles);

      const menuResponse = await api.get("/api/menus", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: {
          search: search || undefined,
          role: roleFilter !== "All" ? roleFilter : undefined,
        },
      });
      setMenus(menuResponse.data.menus);

      const dropdownResponse = await api.get("/api/menus/dropdown", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDropdownMenus(dropdownResponse.data.menus);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), [search, roleFilter]);

  useEffect(() => {
    debouncedFetchData();
  }, [search, roleFilter, debouncedFetchData]);

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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") resetForm();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleAddOrEditMenu = async () => {
    if (!newMenu.label) {
      toast.dismiss();
      toast.error("Menu label is required!");
      return;
    }

    try {
      const commonHeaders = { Authorization: `Bearer ${localStorage.getItem("token")}` };

      if (editingMenuId !== null) {
        await api.put(`/api/menus/${editingMenuId}`, {
          label: newMenu.label,
          href: newMenu.href || null,
          order_index: parseInt(newMenu.order_index) || 0,
        }, { headers: commonHeaders });
        await api.post("/api/menu-roles", {
          menu_id: editingMenuId,
          role_ids: newMenu.role_ids,
          order_index: parseInt(newMenu.order_index) || 0,
        }, { headers: commonHeaders });
        toast.dismiss();
        toast.success("Menu updated successfully");
      } else {
        const { data: menu } = await api.post("/api/menus", {
          label: newMenu.label,
          href: newMenu.href || null,
          order_index: parseInt(newMenu.order_index) || 0,
        }, { headers: commonHeaders });
        if (newMenu.role_ids.length > 0) {
          await api.post("/api/menu-roles", {
            menu_id: menu.menu.MenuId,
            role_ids: newMenu.role_ids,
            order_index: parseInt(newMenu.order_index) || 0,
          }, { headers: commonHeaders });
        }
        toast.dismiss();
        toast.success("Menu created successfully");
      }
      fetchData();
      resetForm();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleAddOrEditMenuItem = async () => {
    if (!newMenuItem.menu_id || !newMenuItem.label || !newMenuItem.href) {
      toast.dismiss();
      toast.error("Menu ID, label, and href are required!");
      return;
    }

    try {
      const commonHeaders = { Authorization: `Bearer ${localStorage.getItem("token")}` };

      if (editingMenuItemId !== null) {
        await api.put(`/api/menu-items/${editingMenuItemId}`, {
          label: newMenuItem.label,
          href: newMenuItem.href,
          order_index: parseInt(newMenuItem.order_index) || 0,
          role_ids: newMenuItem.role_ids,
        }, { headers: commonHeaders });
        await api.post("/api/menu-item-roles", {
          menu_item_id: editingMenuItemId,
          role_ids: newMenuItem.role_ids,
          order_index: parseInt(newMenuItem.order_index) || 0,
        }, { headers: commonHeaders });
        toast.dismiss();
        toast.success("Menu item updated successfully");
      } else {
        const { data: menuItem } = await api.post("/api/menu-items", {
          menu_id: newMenuItem.menu_id,
          label: newMenuItem.label,
          href: newMenuItem.href,
          order_index: parseInt(newMenuItem.order_index) || 0,
          role_ids: newMenuItem.role_ids,
        }, { headers: commonHeaders });
        if (newMenuItem.role_ids.length > 0) {
          await api.post("/api/menu-item-roles", {
            menu_item_id: menuItem.menu_item.MenuItemId,
            role_ids: newMenuItem.role_ids,
            order_index: parseInt(newMenuItem.order_index) || 0,
          }, { headers: commonHeaders });
        }
        toast.dismiss();
        toast.success("Menu item created successfully");
      }
      fetchData();
      resetMenuItemForm();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (window.confirm(`Are you sure you want to delete this menu?`)) {
      try {
        await api.delete(`/api/menus/${menuId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.dismiss();
        toast.success("Menu deleted successfully");
        fetchData();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.error || "Failed to delete menu");
      }
    }
    setActionMenuId(null);
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (window.confirm(`Are you sure you want to delete this menu item?`)) {
      try {
        await api.delete(`/api/menu-items/${menuItemId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.dismiss();
        toast.success("Menu item deleted successfully");
        fetchData();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.error || "Failed to delete menu item");
      }
    }
  };

  const resetForm = () => {
    setNewMenu({
      label: "",
      href: "",
      order_index: 0,
      role_ids: [],
    });
    setNewMenuItem({
      menu_id: "",
      label: "",
      href: "",
      order_index: 0,
      role_ids: [],
    });
    setEditingMenuId(null);
    setEditingMenuItemId(null);
    setModalMode("menu");
    setShowModal(false);
  };

  const resetMenuItemForm = () => {
    setNewMenuItem({
      menu_id: "",
      label: "",
      href: "",
      order_index: 0,
      role_ids: [],
    });
    setEditingMenuItemId(null);
    setShowModal(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Menu Management</h1>
      <p className="text-gray-500 text-sm mt-1">Manage navigation menus and assign them to roles</p>

      <div className="mt-6 p-2 border rounded-lg bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <span className="text-gray-500">🔍 Filter & Search Menus</span>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by menu label..."
              className="border rounded-lg px-3 py-2 w-full sm:w-64 focus:ring focus:ring-blue-200 outline-none"
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.label}>
                  {role.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setModalMode("menu");
                setEditingMenuId(null);
                setEditingMenuItemId(null);
                setShowModal(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + Add Menu
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {menus?.length || 0} of {menus?.length || 0} menus
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
      ) : menus.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No menus found.</div>
      ) : view === "table" ? (
        <div className="mt-6 border rounded-lg overflow-x-auto shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Menu</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Roles</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Dropdown Items</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <React.Fragment key={menu.id}>
                  <tr className="border-b hover:bg-gray-50 relative">
                    <td className="py-3 px-4">
                      <div className="font-medium">{menu.label}</div>
                      <div className="text-sm text-gray-500">{menu.href || "No link"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        {menu.roles.map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[role] || badgeColors.Users}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {menu.dropdown_items?.length > 0 ? (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {menu.dropdown_items.map((item) => (
                            <li key={item.id} className="flex justify-between items-start">
                              <span className="flex-1">
                                <div>{item.label} ({item.href})</div>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {item.roles.map((role) => (
                                    <span
                                      key={role}
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[role] || badgeColors.Users}`}
                                    >
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              </span>
                              <div className="flex gap-2 ml-2">
                                <button
                                  onClick={() => {
                                    setModalMode("menuItem");
                                    setNewMenuItem({
                                      menu_id: menu.id,
                                      label: item.label,
                                      href: item.href,
                                      order_index: item.order_index,
                                      role_ids: roles
                                        .filter((role) => item.roles.includes(role.label))
                                        .map((role) => role.id),
                                    });
                                    setEditingMenuItemId(item.id);
                                    setShowModal(true);
                                    setActionMenuId(null);
                                  }}
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="text-red-600 hover:underline text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-500">No dropdown items</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right relative">
                      <div ref={(el) => (actionMenuRefs.current[menu.id] = el)}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === menu.id ? null : menu.id)}
                          className="px-2 py-1 rounded hover:bg-gray-100"
                        >
                          ⋮
                        </button>
                        {actionMenuId === menu.id && (
                          <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg text-sm z-10 w-48">
                            <button
                              onClick={() => {
                                setModalMode("menu");
                                setNewMenu({
                                  label: menu.label,
                                  href: menu.href,
                                  order_index: menu.order_index,
                                  role_ids: roles
                                    .filter((role) => menu.roles.includes(role.label))
                                    .map((role) => role.id),
                                });
                                setEditingMenuId(menu.id);
                                setShowModal(true);
                                setActionMenuId(null);
                              }}
                              className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMenu(menu.id)}
                              className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => {
                                setModalMode("menuItem");
                                setNewMenuItem({ 
                                  menu_id: menu.id, 
                                  label: "", 
                                  href: "", 
                                  order_index: 0, 
                                  role_ids: [] 
                                });
                                setEditingMenuItemId(null);
                                setShowModal(true);
                                setActionMenuId(null);
                              }}
                              className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                            >
                              Add Dropdown Item
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="border rounded-lg p-4 bg-white flex flex-col gap-2 shadow-sm hover:shadow-md transition relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{menu.label}</div>
                  <div className="text-sm text-gray-500">{menu.href || "No link"}</div>
                </div>
                <div ref={(el) => (actionMenuRefs.current[menu.id] = el)}>
                  <button
                    onClick={() => setActionMenuId(actionMenuId === menu.id ? null : menu.id)}
                    className="px-2 py-1 rounded hover:bg-gray-100"
                  >
                    ⋮
                  </button>
                  {actionMenuId === menu.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg text-sm z-10 w-48">
                      <button
                        onClick={() => {
                          setModalMode("menu");
                          setNewMenu({
                            label: menu.label,
                            href: menu.href,
                            order_index: menu.order_index,
                            role_ids: roles
                              .filter((role) => menu.roles.includes(role.label))
                              .map((role) => role.id),
                          });
                          setEditingMenuId(menu.id);
                          setShowModal(true);
                          setActionMenuId(null);
                        }}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setModalMode("menuItem");
                          setNewMenuItem({ 
                            menu_id: menu.id, 
                            label: "", 
                            href: "", 
                            order_index: 0, 
                            role_ids: [] 
                          });
                          setEditingMenuItemId(null);
                          setShowModal(true);
                          setActionMenuId(null);
                        }}
                        className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                      >
                        Add Dropdown Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {menu.roles.map((role) => (
                  <span
                    key={role}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[role] || badgeColors.Users}`}
                  >
                    {role}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                {menu.dropdown_items?.length > 0 ? (
                  <ul className="space-y-1">
                    {menu.dropdown_items.map((item) => (
                      <li key={item.id} className="flex justify-between items-start">
                        <span className="flex-1">
                          <div>{item.label} ({item.href})</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {item.roles.map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[role] || badgeColors.Users}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </span>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => {
                              setModalMode("menuItem");
                              setNewMenuItem({
                                menu_id: menu.id,
                                label: item.label,
                                href: item.href,
                                order_index: item.order_index,
                                role_ids: roles
                                  .filter((role) => item.roles.includes(role.label))
                                  .map((role) => role.id),
                              });
                              setEditingMenuItemId(item.id);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>No dropdown items</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={resetForm}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">
              {editingMenuId !== null
                ? "Edit Menu"
                : editingMenuItemId !== null
                ? "Edit Dropdown Item"
                : modalMode === "menu"
                ? "Add New Menu"
                : "Add Dropdown Item"}
            </h2>

            {modalMode === "menuItem" ? (
              <>
                <select
                  value={newMenuItem.menu_id}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, menu_id: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                  disabled={editingMenuItemId !== null}
                >
                  <option value="">Select Parent Menu</option>
                  {dropdownMenus.length === 0 ? (
                    <option value="" disabled>
                      No menus available
                    </option>
                  ) : (
                    dropdownMenus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.label}
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="text"
                  placeholder="Menu Item Label"
                  value={newMenuItem.label}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, label: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                />
                <input
                  type="text"
                  placeholder="Menu Item Href"
                  value={newMenuItem.href}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, href: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                />
                <input
                  type="number"
                  placeholder="Order Index"
                  value={newMenuItem.order_index}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, order_index: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                />
                <select
                  multiple
                  value={newMenuItem.role_ids}
                  onChange={(e) =>
                    setNewMenuItem({
                      ...newMenuItem,
                      role_ids: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="border rounded-lg px-3 py-2 w-full mb-3 h-32"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddOrEditMenuItem}
                  className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800"
                >
                  {editingMenuItemId !== null ? "Update Menu Item" : "Add Menu Item"}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Menu Label"
                  value={newMenu.label}
                  onChange={(e) => setNewMenu({ ...newMenu, label: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                />
                <input
                  type="text"
                  placeholder="Menu Href (optional)"
                  value={newMenu.href}
                  onChange={(e) => setNewMenu({ ...newMenu, href: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                />
                <input
                  type="number"
                  placeholder="Order Index"
                  value={newMenu.order_index}
                  onChange={(e) => setNewMenu({ ...newMenu, order_index: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full mb-3"
                />
                <select
                  multiple
                  value={newMenu.role_ids}
                  onChange={(e) =>
                    setNewMenu({
                      ...newMenu,
                      role_ids: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="border rounded-lg px-3 py-2 w-full mb-3 h-32"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddOrEditMenu}
                  className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800"
                >
                  {editingMenuId !== null ? "Update Menu" : "Add Menu"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;