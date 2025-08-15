const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

// Create Banner
exports.createBanner = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const { title, description, image_url } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Prepare image_url for insertion (string or null)
    const imageUrlToStore = image_url || null;

    // Insert banner
    const { data: banner, error: bannerError } = await supabase
      .from("banners")
      .insert([
        {
          title,
          description,
          image_url: imageUrlToStore, // Store as string or null
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
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get All Banners
exports.getAllBanners = async (req, res) => {
  try {
    let query = supabase
      .from("banners")
      .select("*")
      .eq("is_active", true);

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ message: "Error fetching banners", error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};