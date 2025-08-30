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

// Verify User
const verifyUser = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    const { search, role, status, excludeRole } = req.query;
    let query = supabase
      .from("users")
      .select("id, full_name, email, roles!role_id(label), active, joined, last_login");

    // Search by name or email
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Filter by role
    if (role && role !== "All") {
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

    // Filter by status
    if (status && status !== "All") {
      query = query.eq("active", status === "active" ? "Y" : "N");
    }

    // Exclude specific role (e.g., Users)
    if (excludeRole) {
      const { data: excludeRoleData, error: excludeRoleError } = await supabase
        .from("roles")
        .select("id")
        .eq("label", excludeRole)
        .single();

      if (excludeRoleError || !excludeRoleData) {
        return res.status(400).json({ error: `Exclude role '${excludeRole}' not found` });
      }
      query = query.neq("role_id", excludeRoleData.id); // Use neq to exclude the role
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

// API: Update User Profile
exports.updateUserProfile = async (req, res) => {
  const { error: authError, decoded } = verifyUser(req);
  if (authError) return res.status(401).json({ error: authError });
  console.log(decoded.id);
  try {
    const {
      full_name,
      email,
      password,
      phone,
      about,
      country,
      newsletter_subscription,
      email_notifications,
      public_profile,
      twitter_url,
      facebook_url,
      instagram_url,
      linkedin_url,
      profile_image,
    } = req.body;

    // Validate email is provided
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const updates = {
      full_name: full_name || null,
      email,
      phone: phone || null,
      about: about || null,
      country: country || null,
      newsletter_subscription: newsletter_subscription ?? false,
      email_notifications: email_notifications ?? false,
      public_profile: public_profile ?? false,
      twitter_url: twitter_url || null,
      facebook_url: facebook_url || null,
      instagram_url: instagram_url || null,
      linkedin_url: linkedin_url || null,
      profile_image: profile_image || null,
      updated_at: new Date().toISOString(),
    };

    // Hash password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // Update user in Supabase, ensuring the user can only update their own profile
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", decoded.id) // Ensure user can only update their own profile
      .select("id, full_name, email, phone, about, country, newsletter_subscription, email_notifications, public_profile, twitter_url, facebook_url, instagram_url, linkedin_url, profile_image, roles!role_id(label), active, joined, last_login")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Transform response to match frontend expectations
    const transformedData = {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      about: data.about,
      country: data.country,
      preferences: {
        newsletter: data.newsletter_subscription,
        emailNotifications: data.email_notifications,
        publicProfile: data.public_profile,
      },
      socialLinks: {
        twitter: data.twitter_url,
        facebook: data.facebook_url,
        instagram: data.instagram_url,
        linkedin: data.linkedin_url,
      },
      image: data.profile_image,
      role: data.roles.label,
      active: data.active === "Y",
      joined: data.joined ? new Date(data.joined).toLocaleDateString() : "N/A",
      last_login: data.last_login ? new Date(data.last_login).toLocaleDateString() : "Never",
    };

    res.status(200).json({ message: "Profile updated successfully", user: transformedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API: Get User Profile
exports.getUserProfile = async (req, res) => {
  const { error: authError, decoded } = verifyUser(req);
  if (authError) return res.status(401).json({ error: authError });

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, phone, about, country, newsletter_subscription, email_notifications, public_profile, twitter_url, facebook_url, instagram_url, linkedin_url, profile_image, roles!role_id(label), active, joined, last_login")
      .eq("id", decoded.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    // Transform response to match frontend expectations
    const transformedData = {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      about: data.about,
      country: data.country,
      preferences: {
        newsletter: data.newsletter_subscription || false,
        emailNotifications: data.email_notifications || false,
        publicProfile: data.public_profile || false,
      },
      socialLinks: {
        twitter: data.twitter_url || "",
        facebook: data.facebook_url || "",
        instagram: data.instagram_url || "",
        linkedin: data.linkedin_url || "",
      },
      image: data.profile_image || null,
      role: data.roles.label,
      active: data.active === "Y",
      joined: data.joined ? new Date(data.joined).toLocaleDateString() : "N/A",
      last_login: data.last_login ? new Date(data.last_login).toLocaleDateString() : "Never",
    };

    res.status(200).json({ user: transformedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};