import React, { useState, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

const sampleDataInit = {
  Products: [
    { id: 1, name: "Laptop", price: "$1200", stock: 10 },
    { id: 2, name: "Headphones", price: "$200", stock: 25 },
  ],
  Users: [
    { id: 1, name: "John Doe", email: "john@example.com", avatar: "https://i.pravatar.cc/40?img=1" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", avatar: "https://i.pravatar.cc/40?img=2" },
  ],
  Categories: [
    { id: 1, name: "Electronics" },
    { id: 2, name: "Fashion" },
  ],
  Banners: [
    { id: 1, title: "Summer Sale", image: "https://via.placeholder.com/150" },
    { id: 2, title: "New Arrivals", image: "https://via.placeholder.com/150" },
  ],
  Reviews: [
    { id: 1, user: "John Doe", product: "Laptop", rating: 5 },
    { id: 2, user: "Jane Smith", product: "Headphones", rating: 4 },
  ],
  Blogs: [
    { id: 1, title: "React Tips", author: "Admin" },
    { id: 2, title: "Tailwind Tricks", author: "Admin" },
  ],
};

const Tables = () => {
  const [activeTable, setActiveTable] = useState("Products");
  const [data, setData] = useState(sampleDataInit);
  const [modal, setModal] = useState({ type: null, row: null });
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const tableNames = Object.keys(data);

  const handleAdd = (newRow) => {
    const updated = [...data[activeTable], { id: Date.now(), ...newRow }];
    setData({ ...data, [activeTable]: updated });
    setModal({ type: null, row: null });
  };

  const handleEdit = (updatedRow) => {
    const updated = data[activeTable].map((row) =>
      row.id === updatedRow.id ? updatedRow : row
    );
    setData({ ...data, [activeTable]: updated });
    setModal({ type: null, row: null });
  };

  const handleDelete = (rowId) => {
    const updated = data[activeTable].filter((row) => row.id !== rowId);
    setData({ ...data, [activeTable]: updated });
    setModal({ type: null, row: null });
  };

  // ---------------- Modal Form ----------------
  const ModalForm = () => {
    const isEdit = modal.type === "edit";
    const row = modal.row || {};

    const [formData, setFormData] = useState({});

    useEffect(() => {
      const fields =
        data[activeTable].length > 0
          ? Object.keys(data[activeTable][0]).filter((key) => key !== "id")
          : Object.keys(row || {});
      const initialData = fields.reduce((acc, key) => {
        acc[key] = row ? row[key] || "" : "";
        return acc;
      }, {});
      setFormData(initialData);
    }, [activeTable]);

    if (!modal.type || modal.type === "delete") return null;

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const parsedData = {};
      for (let key in formData) {
        const val = formData[key];
        parsedData[key] = isNaN(val) ? val : Number(val);
      }
      if (isEdit) handleEdit({ ...row, ...parsedData });
      else handleAdd(parsedData);
    };

    const fields = Object.keys(formData);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">
            {isEdit ? "Edit" : "Add"} {activeTable}
          </h2>
          <form onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field} className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {field}
                </label>
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            ))}

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 border rounded-md text-gray-700"
                onClick={() => setModal({ type: null, row: null })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {isEdit ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------------- Delete Modal ----------------
  const DeleteModal = () => {
    if (modal.type !== "delete") return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-sm">
          <h2 className="text-lg font-semibold mb-4">Delete {activeTable}?</h2>
          <p className="mb-4">Are you sure you want to delete this entry?</p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 border rounded-md text-gray-700"
              onClick={() => setModal({ type: null, row: null })}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md"
              onClick={() => handleDelete(modal.row.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCell = (key, value, row) => {
    if (key === "avatar") {
      return (
        <td key={key} className="border px-4 py-2">
          <img
            src={value}
            alt={row.name || ""}
            className="w-10 h-10 rounded-full object-cover"
          />
        </td>
      );
    }

    if (key === "stock" || key === "rating") {
      const color =
        key === "stock"
          ? value > 20
            ? "green"
            : value > 5
            ? "yellow"
            : "red"
          : key === "rating"
          ? value >= 4
            ? "green"
            : value >= 2
            ? "yellow"
            : "red"
          : "gray";

      return (
        <td key={key} className="border px-4 py-2">
          <span
            className={`px-2 py-1 rounded-full text-white text-sm bg-${color}-500`}
          >
            {value}
          </span>
        </td>
      );
    }

    return (
      <td key={key} className="border px-4 py-2">
        {value}
      </td>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="relative flex overflow-x-auto rounded-full border border-gray-300 w-full md:w-auto mb-4">
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{
            width: `${100 / tableNames.length}%`,
            transform: `translateX(${tableNames.indexOf(activeTable) * 100}%)`,
          }}
        ></div>
        {tableNames.map((table) => (
          <button
            key={table}
            onClick={() => setActiveTable(table)}
            className={`relative flex-1 text-sm md:text-base py-2 px-4 whitespace-nowrap rounded-full z-10 transition-colors duration-300 ${
              activeTable === table
                ? "text-white font-semibold"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            {table}
          </button>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-end mb-4">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            onClick={() => setModal({ type: "add", row: {} })}
          >
            Add New
          </button>
        </div>
        <table className="min-w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {data[activeTable].length > 0 &&
                Object.keys(data[activeTable][0]).map((key) => (
                  <th key={key} className="border px-4 py-2 text-left">
                    {key}
                  </th>
                ))}
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data[activeTable].map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {Object.entries(row).map(([key, value]) =>
                  renderCell(key, value, row)
                )}
                <td className="border px-4 py-2 relative">
                  <button
                    onClick={() =>
                      setDropdownOpen(dropdownOpen === row.id ? null : row.id)
                    }
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                  {dropdownOpen === row.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded shadow-lg z-20">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => setModal({ type: "edit", row })}
                      >
                        Edit
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => setModal({ type: "delete", row })}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalForm />
      <DeleteModal />
    </div>
  );
};

export default Tables;
