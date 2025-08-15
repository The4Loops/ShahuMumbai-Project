const jwt = require("jsonwebtoken");
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

// VERIFY AUTHENTICATED USER
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

// Get All Menus
exports.getMenusWithItems = async (req, res) => {
  try {
    const { error: authError, decoded } = verifyUser(req);
    let data, error;

    if (authError) {
      ({ data, error } = await supabase.rpc("get_menus_unauthenticated"));
    } else {
      // Authenticated: call get_menus_authenticated with user_id (int)
      if (!decoded.id) {
        return res.status(400).json({ error: "Invalid JWT: Missing user ID" });
      }

      ({ data, error } = await supabase.rpc("get_menus_authenticated", { user_id: parseInt(decoded.id) }));
    }

    if (error) {
      console.error("RPC error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data || { menus: [] });
  } catch (err) {
    console.error("Error in getMenusWithItems:", err);
    res.status(500).json({ error: err.message });
  }
};
