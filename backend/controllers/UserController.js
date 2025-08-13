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
    if (decoded.role !== "admin") return { error: "Forbidden: Admins only" };
    return { decoded };
  } catch (err) {
    return { error: "Invalid Token" };
  }
};

// ADMIN API: Create User
exports.adminCreateUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { full_name, email, password, role, active , ssologin = "N" } = req.body;

    // Step 1: Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    // Step 2: Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Step 3: Insert into "users" table
    const { data, error } = await supabase
      .from("users")
      .insert([
        { full_name, email, password: hashedPassword, role,active, ssologin },
      ])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "User created successfully", user: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { search, role, status } = req.query;
    let query = supabase.from("users").select("*");

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq("role", role);
    }
    if (status) {
      query = query.eq("active", status === "active" ? "Y" : "N");
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Transform data to match frontend expectations
    const transformedData = data.map(user => ({
      ...user,
      active: user.active === "Y",
      joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
      last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never",
    }));

    res.status(200).json({ users: transformedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;
    const { full_name, email, password, role, active } = req.body;

    const updates = { full_name, email, role, active };
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    if (!data.length) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "User updated successfully", user: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    if (!data.length) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};