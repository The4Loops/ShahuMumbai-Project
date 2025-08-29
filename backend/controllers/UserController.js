const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");

// VERIFY ADMIN
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

// ADMIN API: Create User
exports.adminCreateUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Unauthorized: Admin access required" });

  try {
    const { full_name, email, password, role, active } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: "Name and Email are required" });
    }

    // Fetch the role ID from roles table
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("label", role || "user")
      .single();

    if (!roleData) {
      return res.status(400).json({ error: `Role '${role || "user"}' not found` });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name,
          email,
          password: hashedPassword,
          role_id: roleData.id,
          active: active ? "Y" : "N",
          joined: new Date().toISOString(),
        },
      ])
      .select("*, roles(label)")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "User created successfully", user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Unauthorized: Admin access required" });

  try {
    const { search, role, status } = req.query;
    let query = supabase
      .from("users")
      .select("id, full_name, email, roles!role_id(label), active, joined, last_login");

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      // Fetch role_id for the given role label
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("label", role)
        .single();

      if (roleError || !roleData) {
        return res.status(400).json({ error: `Role '${role}' not found` });
      }
      query = query.eq("role_id", roleData.id);
    }
    if (status) {
      query = query.eq("active", status === "active" ? "Y" : "N");
    }

    const { data, error } = await query;
    if (error) {
      return res.status(400).json({ error: `Database query failed: ${error.message}` });
    }

    const transformedData = data.map(user => ({
      ...user,
      role: user.roles.label, // Transform roles.label to role for response
      active: user.active === "Y",
      joined: user.joined ? new Date(user.joined).toLocaleDateString() : "N/A",
      last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never",
    }));

    res.status(200).json({ users: transformedData });
  } catch (err) {
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Unauthorized: Admin access required" });

  try {
    const { id } = req.params;
    const { full_name, email, password, role, active } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: "Name and Email are required" });
    }

    // Fetch the role ID from roles table
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("label", role || "Users")
      .single();

    if (!roleData) {
      return res.status(400).json({ error: `Role '${role || "Users"}' not found` });
    }

    const updates = {
      full_name,
      email,
      role_id: roleData.id,
      active: active ? "Y" : "N",
      updated_at: new Date().toISOString(),
    };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("*, roles!role_id(label)")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "User updated successfully", user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: "Unauthorized: Admin access required" });

  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};