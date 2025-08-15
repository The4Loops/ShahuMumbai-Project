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

// Create Role
exports.createRole = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { label } = req.body;
    if (!label) {
      return res.status(400).json({ error: "Role label is required" });
    }

    const { data, error } = await supabase
      .from("roles")
      .insert([{ label, is_active: true }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Role created successfully", role: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Roles
exports.getRoles = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { search } = req.query;
    let query = supabase.from("roles").select("id, label, is_active, created_at");

    if (search) {
      query = query.ilike("label", `%${search}%`);
    }

    const { data, error } = await query.order("label", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    // Fetch associated menus and users
    const roleIds = data.map(role => role.id);
    const { data: roletags } = await supabase
      .from("roletag")
      .select("role_id, menu_id, menus!roletag_menu_id_fkey(label)")
      .in("role_id", roleIds);

    const { data: users } = await supabase
      .from("users")
      .select("id, email, role_id")
      .in("role_id", roleIds);

    const rolesWithDetails = data.map(role => ({
      ...role,
      menus: roletags
        ?.filter(rt => rt.role_id === role.id)
        .map(rt => ({ id: rt.menu_id, label: rt.menus?.label || "Unknown" }))
        || [],
      users: users
        ?.filter(user => user.role_id === role.id)
        .map(user => ({ id: user.id, email: user.email }))
        || [],
    }));

    res.status(200).json({ roles: rolesWithDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Role
exports.updateRole = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;
    const { label, is_active } = req.body;

    if (!label) {
      return res.status(400).json({ error: "Role label is required" });
    }

    const { data, error } = await supabase
      .from("roles")
      .update({ label, is_active: is_active ?? true, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Role updated successfully", role: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Role
exports.deleteRole = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { id } = req.params;

    // Check if role is assigned to users
    const { data: users } = await supabase.from("users").select("id").eq("role_id", id).limit(1);
    if (users.length > 0) {
      return res.status(400).json({ error: "Cannot delete role assigned to users" });
    }

    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign Role to User
exports.assignRoleToUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Admin access required" });

  try {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({ error: "User ID and Role ID are required" });
    }

    // Verify user and role exist
    const { data: user } = await supabase.from("users").select("id").eq("id", user_id).single();
    const { data: role } = await supabase.from("roles").select("id").eq("id", role_id).single();

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!role) return res.status(404).json({ error: "Role not found" });

    const { data, error } = await supabase
      .from("users")
      .update({ role_id })
      .eq("id", user_id)
      .select("id, email, role_id, roles!users_role_id_fkey(label)")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Role assigned successfully", user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};