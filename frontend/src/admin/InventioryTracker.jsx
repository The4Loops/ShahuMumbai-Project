import React, { useMemo, useState } from "react";

const InventoryTracker = () => {
  const [query, setQuery] = useState("");

  const products = [
    { name: "Vintage Bag", quantity: 5 },
    { name: "Tote Bag", quantity: 0 },
    { name: "Pouch", quantity: 12 },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, products]);

  const getStatus = (qty) => {
    if (qty === 0) return { label: "Out of Stock", tone: "out" };
    if (qty <= 3) return { label: "Low Stock", tone: "low" };
    return { label: "In Stock", tone: "ok" };
  };

  const badgeClass = (tone) => {
    switch (tone) {
      case "out":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      case "low":
        return "bg-[#F3DEDE] text-[#6B4226] border border-[#E6DCD2]";
      default:
        return "bg-white text-[#6B4226] border border-[#E6DCD2]";
    }
  };

  return (
    <div className="font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-[#6B4226]">Inventory</h2>
        <input
          type="text"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-64 rounded-md px-3 py-2 border border-[#E6DCD2] text-[#6B4226] placeholder-[#6B4226]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]"
        />
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((p, idx) => {
          const { label, tone } = getStatus(p.quantity);
          return (
            <div
              key={idx}
              className={`rounded-lg border p-4 bg-white ${
                tone === "out"
                  ? "border-rose-200"
                  : tone === "low"
                  ? "border-[#E6DCD2]"
                  : "border-[#E6DCD2]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[#6B4226] font-semibold">{p.name}</p>
                  <p className="text-sm text-[#6B4226]/70 mt-0.5">
                    Qty: <span className="font-medium text-[#6B4226]">{p.quantity}</span>
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${badgeClass(tone)}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-[#6B4226]/70">No products match your search.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E6DCD2] bg-white">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-[#F1E7E5] text-[#6B4226]">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => {
              const { label, tone } = getStatus(p.quantity);
              return (
                <tr
                  key={idx}
                  className={`border-t border-[#E6DCD2] ${
                    tone === "out"
                      ? "bg-rose-50"
                      : tone === "low"
                      ? "bg-[#FFF7F6]"
                      : "bg-white"
                  }`}
                >
                  <td className="p-3 text-[#6B4226]">{p.name}</td>
                  <td className="p-3 text-right text-[#6B4226]">{p.quantity}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${badgeClass(tone)}`}>
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="p-3 text-sm text-[#6B4226]/70" colSpan={3}>
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTracker;
