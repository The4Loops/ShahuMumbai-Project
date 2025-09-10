const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

/* ------------------------- helpers ------------------------- */
const requireAdmin = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") return { error: "Forbidden: Admins only" };
    return { decoded };
  } catch {
    return { error: "Invalid token" };
  }
};

/* ------------------------- create -------------------------- */
exports.createBanner = async (req, res) => {
  const { error } = requireAdmin(req);
  if (error) return res.status(403).json({ message: error });

  try {
    const { title, description, image_url, is_active } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const { data: banner, error: bannerError } = await supabase
      .from("banners")
      .insert([
        {
          title: title.trim(),
          description: description ?? null,
          image_url: image_url || null,
          is_active:
            typeof is_active === "boolean"
              ? is_active
              : is_active === "true"
              ? true
              : true, // default true
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (bannerError) {
      return res
        .status(400)
        .json({ message: "Error inserting banner", error: bannerError });
    }

    return res
      .status(201)
      .json({ message: "Banner created successfully", banner });
  } catch (e) {
    console.error("createBanner", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

/* --------------------------- read all --------------------------- */
exports.getAllBanners = async (_req, res) => {
  try {
    // If your table has no is_active column, drop the .eq() filter.
    let query = supabase.from("banners").select("*").order("updated_at", { ascending: false });

    // Optional filter if you only want active ones:
    // query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) {
      return res.status(400).json({ message: "Error fetching banners", error });
    }
    return res.status(200).json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("getAllBanners", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

/* ------------------------- read one ------------------------- */
exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Banner not found", error });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error("getBannerById", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

/* -------------------------- update -------------------------- */
exports.updateBanner = async (req, res) => {
  const { error } = requireAdmin(req);
  if (error) return res.status(403).json({ message: error });

  try {
    const { id } = req.params;
    const { title, description, image_url, is_active } = req.body;

    // Build patch object only with provided fields
    const patch = { updated_at: new Date().toISOString() };
    if (typeof title !== "undefined") patch.title = String(title).trim();
    if (typeof description !== "undefined") patch.description = description ?? null;
    if (typeof image_url !== "undefined") patch.image_url = image_url || null;
    if (typeof is_active !== "undefined") {
      patch.is_active =
        typeof is_active === "boolean" ? is_active : is_active === "true";
    }

    const { data, error: upError } = await supabase
      .from("banners")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (upError || !data) {
      return res
        .status(404)
        .json({ message: "Error updating banner or banner not found", error: upError });
    }

    return res
      .status(200)
      .json({ message: "Banner updated successfully", banner: data });
  } catch (e) {
    console.error("updateBanner", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

/* -------------------------- delete -------------------------- */
exports.deleteBanner = async (req, res) => {
  const { error } = requireAdmin(req);
  if (error) return res.status(403).json({ message: error });

  try {
    const { id } = req.params;

    const { data, error: delError } = await supabase
      .from("banners")
      .delete()
      .eq("id", id)
      .select();

    if (delError || !data?.length) {
      return res
        .status(404)
        .json({ message: "Error deleting banner or not found", error: delError });
    }

    return res.status(200).json({ message: "Banner deleted successfully" });
  } catch (e) {
    console.error("deleteBanner", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
