const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

// Helper: Verify JWT & Admin Role
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

// CREATE Category — Admin Only
exports.createCategory = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    let { name, slug, image } = req.body || {};

    // Normalize / trim
    name = (name || "").trim();
    slug = (slug || "").trim().toLowerCase();
    image = (image || "").trim();

    // Validate inputs
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }

    // Validate slug format: lowercase letters, numbers, hyphens
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res
        .status(400)
        .json({
          message:
            "Slug must contain only lowercase letters, numbers, and hyphens",
        });
    }

    // Optional: validate image URL if provided (allow http or https)
    if (
      image &&
      !(
        image.startsWith("http://") ||
        image.startsWith("https://")
      )
    ) {
      return res.status(400).json({ message: "Invalid image URL" });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, slug, image: image || null }])
      .select("categoryid, name, slug, image")
      .single();

    if (error) {
      // Unique violation (e.g., unique index on slug)
      if (error.code === "23505") {
        return res.status(400).json({ message: "Slug already exists" });
      }
      return res
        .status(400)
        .json({ message: "Error adding category", error });
    }

    return res
      .status(201)
      .json({ message: "Category created successfully", category: data });
  } catch (error) {
    console.error("createCategory error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


// GET All Categories — Public
exports.getAllCategories = async (req, res) => {
  try {
    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("categoryid, name, slug, image");

    if (categoriesError) {
      return res
        .status(400)
        .json({ message: "Error fetching categories", error: categoriesError });
    }

    // Fetch product counts for categories
    const categoryIds = categories.map((c) => c.categoryid);
    let productCounts = {};
    if (categoryIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("categoryid")
        .in("categoryid", categoryIds);

      if (productsError) {
        return res
          .status(400)
          .json({
            message: "Error fetching product counts",
            error: productsError,
          });
      }

      // Count products per categoryid
      productCounts = products.reduce(
        (acc, { categoryid }) => ({
          ...acc,
          [categoryid]: (acc[categoryid] || 0) + 1,
        }),
        {}
      );
    }

    const formattedData = (categories || []).map((category) => ({
      ...category,
      products_count: productCounts[category.categoryid] || 0,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("categories.getAllCategories error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE Category — Admin Only
exports.updateCategory = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;
    const { name, slug, image } = req.body;

    // Update in Supabase
    const { data, error } = await supabase
      .from("categories")
      .update({ name, slug, image })
      .eq('categoryid', id)
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: "Slug already exists" });
      }
      return res.status(400).json({ message: "Error updating category", error });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category updated successfully", category: data[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE Category — Admin Only
exports.deleteCategory = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("categoryid", id)
      .select();

    if (error || !data.length)
      return res
        .status(400)
        .json({ message: "Error deleting category", error });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("categories")
      .select("categoryid, name, slug, image")
      .eq("categoryid", id)
      .single();
    if (error || !data) return res.status(404).json({ message: "Category not found" });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};