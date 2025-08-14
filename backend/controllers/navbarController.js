const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

// VERIFY ADMIN
const verifyAdmin = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return { error: "Forbidden: Admins only" };
    return { decoded };
  } catch (err) {
    return { error: "Invalid Token" };
  }
};

// Create Menu
exports.createMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { label, href, order_index } = req.body;
    if (!label) {
      return res.status(400).json({ error: "Menu label is required" });
    }

    const { data, error } = await supabase
      .from("menus")
      .insert([{ label, href: href || null, order_index: order_index || 0 }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Menu created successfully", menu: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Menus with Dropdowns
exports.getMenusWithItems = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_navbar_data"); // We'll create this function in SQL

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ menus: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Menu
exports.updateMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;
    const { label, href, order_index } = req.body;

    if (!label) {
      return res.status(400).json({ error: "Menu label is required" });
    }

    const { data, error } = await supabase
      .from("menus")
      .update({ label, href: href || null, order_index: order_index || 0 })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu updated successfully", menu: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Menu (and its dropdowns automatically via cascade)
exports.deleteMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;

    const { error } = await supabase.from("menus").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Dropdown Item
exports.createMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { menu_id, label, href, order_index } = req.body;
    if (!menu_id || !label || !href) {
      return res.status(400).json({ error: "Menu ID, label, and href are required" });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ menu_id, label, href, order_index: order_index || 0 }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Menu item created successfully", menu_item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Dropdown Item
exports.updateMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;
    const { label, href, order_index } = req.body;

    if (!label || !href) {
      return res.status(400).json({ error: "Label and href are required" });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .update({ label, href, order_index: order_index || 0 })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu item updated successfully", menu_item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Dropdown Item
exports.deleteMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
