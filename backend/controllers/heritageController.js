// controllers/heritageController.js
const supabase = require("../config/supabaseClient");

// GET /api/heritage
// Optional query params: q (search), is_active=true|false, limit, offset
exports.list = async (req, res) => {
  try {
    const {
      q = "",
      is_active,
      limit: limitStr = "50",
      offset: offsetStr = "0",
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let qb = supabase
      .from("heritage_milestones")
      .select(
        "id, year_label, title, description, image_url, icon_key, title_color, dot_color, sort_order, is_active, created_at, updated_at",
        { count: "exact" }
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (q) {
      const like = `%${q}%`;
      qb = qb.or(
        `year_label.ilike.${like},title.ilike.${like},description.ilike.${like}`
      );
    }
    if (is_active !== undefined && is_active !== "") {
      qb = qb.eq("is_active", is_active === "true");
    }

    qb = qb.range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return res.json({ items: data || [], total: count ?? (data || []).length });
  } catch (e) {
    console.error("heritage.list error", e);
    return res.status(500).json({ error: "Internal server error", details: e.message });
  }
};

// GET /api/heritage/:id
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("heritage_milestones")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    return res.json(data);
  } catch (e) {
    console.error("heritage.getOne error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/heritage
exports.create = async (req, res) => {
  try {
    const {
      year_label,
      title,
      description,
      image_url,
      icon_key,
      title_color,
      dot_color,
      sort_order = 0,
      is_active = true,
    } = req.body || {};

    if (!year_label || !title || !icon_key) {
      return res.status(400).json({ error: "Missing required fields: year_label, title, icon_key" });
    }

    const payload = {
      year_label: String(year_label),
      title: String(title),
      description: description ?? null,
      image_url: image_url ?? null,
      icon_key: String(icon_key),
      title_color: title_color || "text-blue-600",
      dot_color: dot_color || "bg-blue-600",
      sort_order: Number(sort_order) || 0,
      is_active: !!is_active,
    };

    const { data, error } = await supabase
      .from("heritage_milestones")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (e) {
    console.error("heritage.create error", e);
    return res.status(500).json({ error: "Internal server error", details: e.message });
  }
};

// PUT /api/heritage/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      year_label,
      title,
      description,
      image_url,
      icon_key,
      title_color,
      dot_color,
      sort_order,
      is_active,
    } = req.body || {};

    const updates = {};
    if (year_label !== undefined) updates.year_label = year_label;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (icon_key !== undefined) updates.icon_key = icon_key;
    if (title_color !== undefined) updates.title_color = title_color;
    if (dot_color !== undefined) updates.dot_color = dot_color;
    if (sort_order !== undefined) updates.sort_order = Number(sort_order) || 0;
    if (is_active !== undefined) updates.is_active = !!is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabase
      .from("heritage_milestones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });

    return res.json(data);
  } catch (e) {
    console.error("heritage.update error", e);
    return res.status(500).json({ error: "Internal server error", details: e.message });
  }
};

// DELETE /api/heritage/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("heritage_milestones").delete().eq("id", id);
    if (error) throw error;
    return res.status(204).send();
  } catch (e) {
    console.error("heritage.remove error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};
