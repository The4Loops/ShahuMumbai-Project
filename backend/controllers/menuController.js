const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

// Verify Admin
const verifyAdmin = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") return { error: "Forbidden: Admins only" };
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
    if (!label) return res.status(400).json({ error: "Menu label is required" });

    const { data, error } = await supabase
      .from("menus")
      .insert([{ label, href: href || null, order_index: parseInt(order_index) || 0 }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Menu created successfully", menu: data });
  } catch (err) {
    console.error("Error in createMenu:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Menus
exports.getMenus = async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = supabase.from("menus").select("id, label, href, order_index, created_at, updated_at");

    if (search) {
      query = query.ilike("label", `%${search}%`);
    }

    if (role && role !== "All") {
      query = query
        .select("id, label, href, order_index, created_at, updated_at, roletag!inner(role_id)")
        .eq("roletag.role_id", role);
    }

    const { data: menus, error } = await query.order("order_index", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    const menuIds = menus.map(menu => menu.id);

    const { data: roletags, error: roletagError } = await supabase
      .from("roletag")
      .select("menu_id, role_id, roles!roletag_role_id_fkey(label)")
      .in("menu_id", menuIds);

    const { data: menuItems, error: menuItemError } = await supabase
      .from("menu_items")
      .select("id, menu_id, label, href, order_index")
      .in("menu_id", menuIds)
      .order("order_index", { ascending: true });

    const menuItemIds = menuItems?.map(item => item.id) || [];
    const { data: menuItemRoletags, error: menuItemRoletagError } = await supabase
      .from("menu_item_roletag")
      .select("menu_item_id, role_id, roles!menu_item_roletag_role_id_fkey(label)")
      .in("menu_item_id", menuItemIds);

    const transformedMenus = menus.map(menu => ({
      ...menu,
      roles: roletags
        ?.filter(rt => rt.menu_id === menu.id)
        .map(rt => rt.roles?.label || "Unknown")
        || [],
      dropdown_items: menuItems
        ?.filter(item => item.menu_id === menu.id)
        .map(item => ({
          id: item.id,
          label: item.label,
          href: item.href,
          order_index: item.order_index,
          roles: menuItemRoletags
            ?.filter(mrt => mrt.menu_item_id === item.id)
            .map(mrt => mrt.roles?.label || "Unknown")
            || [],
        }))
        || [],
    }));

    res.status(200).json({ menus: transformedMenus });
  } catch (err) {
    console.error("Error in getMenus:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Menus for Dropdown
exports.getAllMenus = async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from("menus").select("id, label");

    if (search) {
      query = query.ilike("label", `%${search}%`);
    }

    const { data: menus, error } = await query.order("label", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ menus });
  } catch (err) {
    console.error("Error in getAllMenus:", err);
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

    if (!label) return res.status(400).json({ error: "Menu label is required" });

    const { data, error } = await supabase
      .from("menus")
      .update({ label, href: href || null, order_index: parseInt(order_index) || 0, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu updated successfully", menu: data });
  } catch (err) {
    console.error("Error in updateMenu:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Menu
exports.deleteMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;
    const { error } = await supabase.from("menus").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu deleted successfully" });
  } catch (err) {
    console.error("Error in deleteMenu:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create Menu Item
exports.createMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { menu_id, label, href, order_index, role_ids } = req.body;
    if (!menu_id || !label || !href) {
      return res.status(400).json({ error: "Menu ID, label, and href are required" });
    }

    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .insert([{ menu_id, label, href, order_index: parseInt(order_index) || 0 }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      const roletags = role_ids.map(role_id => ({
        menu_item_id: menuItem.id,
        role_id,
        order_index: parseInt(order_index) || 0,
      }));
      const { error: roletagError } = await supabase.from("menu_item_roletag").insert(roletags);
      if (roletagError) return res.status(400).json({ error: roletagError.message });
    }

    res.status(201).json({ message: "Menu item created successfully", menu_item: menuItem });
  } catch (err) {
    console.error("Error in createMenuItem:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Menu Item
exports.updateMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;
    const { label, href, order_index, role_ids } = req.body;

    if (!label || !href) {
      return res.status(400).json({ error: "Label and href are required" });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .update({ label, href, order_index: parseInt(order_index) || 0 })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    if (role_ids && Array.isArray(role_ids)) {
      await supabase.from("menu_item_roletag").delete().eq("menu_item_id", id);
      if (role_ids.length > 0) {
        const roletags = role_ids.map(role_id => ({
          menu_item_id: id,
          role_id,
          order_index: parseInt(order_index) || 0,
        }));
        const { error: roletagError } = await supabase.from("menu_item_roletag").insert(roletags);
        if (roletagError) return res.status(400).json({ error: roletagError.message });
      }
    }

    res.status(200).json({ message: "Menu item updated successfully", menu_item: data });
  } catch (err) {
    console.error("Error in updateMenuItem:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Menu Item
exports.deleteMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (err) {
    console.error("Error in deleteMenuItem:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Roletags
exports.getRoletags = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { menu_ids } = req.query;
    let query = supabase.from("roletag").select("menu_id, role_id, roles!roletag_role_id_fkey(label)");

    if (menu_ids) {
      query = query.in("menu_id", menu_ids.split(","));
    }

    const { data, error } = await query;
    console.log("Roletags fetched for /api/roletags:", data, "Error:", error);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in getRoletags:", err);
    res.status(500).json({ error: err.message });
  }
};

// Assign Roles to Menu
exports.assignRolesToMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { menu_id, role_ids, order_index } = req.body;

    if (!menu_id || !role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ error: "Menu ID and role IDs (array) are required" });
    }

    await supabase.from("roletag").delete().eq("menu_id", menu_id);

    const roletags = role_ids.map(role_id => ({
      menu_id,
      role_id,
      order_index: parseInt(order_index) || 0,
    }));

    const { data, error } = await supabase.from("roletag").insert(roletags).select();
    console.log("Roletags assigned:", data, "Error:", error);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Roles assigned successfully", roletags: data });
  } catch (err) {
    console.error("Error in assignRolesToMenu:", err);
    res.status(500).json({ error: err.message });
  }
};

// Assign Roles to Menu Item
exports.assignRolesToMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { menu_item_id, role_ids, order_index } = req.body;

    if (!menu_item_id || !role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ error: "Menu item ID and role IDs (array) are required" });
    }

    await supabase.from("menu_item_roletag").delete().eq("menu_item_id", menu_item_id);

    const roletags = role_ids.map(role_id => ({
      menu_item_id,
      role_id,
      order_index: parseInt(order_index) || 0,
    }));

    const { data, error } = await supabase.from("menu_item_roletag").insert(roletags).select();
    
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Roles assigned successfully", roletags: data });
  } catch (err) {
    console.error("Error in assignRolesToMenuItem:", err);
    res.status(500).json({ error: err.message });
  }
};