import React, { useState, useEffect, useMemo, useContext } from "react";
import { Search, Edit } from "lucide-react";
import api from "../../supabase/axios";
import { AdminActionsContext } from "../AdminActionsContext";

function useSearch(rows, query, keys) {
  return useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      keys.some((k) => String(r?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, keys]);
}

const BannerCards = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const { openBannerEditor } = useContext(AdminActionsContext);

  const filteredBanners = useSearch(banners, search, ["title", "description"]);

  useEffect(() => {
    let alive = true;
    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/api/banners");
        if (!alive) return;
        const bannerList = Array.isArray(data) ? data : data?.banners || [];
        setBanners(
          bannerList.map((banner) => ({
            id: banner.BannerId,
            title: banner.Title,
            description: banner.Description,
            image_url: banner.ImageUrl,
            status: banner.IsActive === "Y" ? "Active" : "Inactive",
          }))
        );
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load banners");
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchBanners();
    return () => {
      alive = false;
    };
  }, []);

  const handleEdit = (banner) => {
    openBannerEditor(banner.id);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Banners</h2>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search banners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {loading && <div className="text-sm text-gray-500 mb-4">Loading banners…</div>}
      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.length > 0 ? (
          filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="border rounded-xl shadow-sm hover:shadow-md transition p-4 bg-white flex flex-col"
            >
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-40 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x160?text=Image+Not+Found";
                }}
              />
              <div className="mt-3 flex-1">
                <h3 className="text-lg font-semibold">{banner.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{banner.description}</p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    banner.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {banner.status}
                </span>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(banner)}
                  className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No banners found
          </p>
        )}
      </div>
    </div>
  );
};

export default BannerCards;