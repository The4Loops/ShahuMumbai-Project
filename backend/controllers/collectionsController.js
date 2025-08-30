
const supabase = require("../config/supabaseClient");


exports.getCollectionOptions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("collections")
      .select("id, title")
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (error) {
      console.error("Supabase error in getCollectionOptions:", error);
      return res.status(500).json({ message: "Failed to fetch collections options" });
    }

    // Map title -> name for the dropdown
    const items = (data || []).map((c) => ({ id: c.id, name: c.title }));
    return res.json(items);
  } catch (e) {
    console.error("GET /api/collections/options error:", e);
    return res.status(500).json({ message: "Failed to fetch collections options" });
  }
};
