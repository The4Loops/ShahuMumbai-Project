const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

/* ---------------------------- color helpers ---------------------------- */
const asArrayOfStrings = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") return [val.trim()].filter(Boolean);
  return [];
};
const isValidColor = (s) =>
  /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(s) || /^[a-z][a-z0-9\s-]*$/i.test(s);
const sanitizeColors = (arr) => {
  const seen = new Set();
  return asArrayOfStrings(arr)
    .map((c) => c.toLowerCase())
    .filter((c) => isValidColor(c))
    .filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
};

/* ------------------------------ Create -------------------------------- */
exports.createProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") return res.status(403).json({ message: "Forbidden: Admins only" });

    const {
      name,
      description,
      shortdescription,
      categoryid,
      branddesigner,
      price,
      discountprice,
      stock,
      isactive,
      isfeatured,
      uploadeddate,
      launchingdate,
      images,
      collection_id,
      colors, // array only
    } = req.body;

    if (
      !name ||
      !description ||
      !shortdescription ||
      !categoryid ||
      !branddesigner ||
      !price ||
      !stock ||
      !images ||
      images.length === 0
    ) {
      return res.status(400).json({
        message: "All required fields and at least one image are required",
      });
    }
    if (!images.some((img) => img.is_hero)) {
      return res.status(400).json({ message: "At least one image must be set as hero image" });
    }

    const cleanColors = sanitizeColors(colors);

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert([
        {
          name,
          description,
          shortdescription,
          categoryid,
          branddesigner,
          price: parseFloat(price),
          discountprice: discountprice ? parseFloat(discountprice) : null,
          stock: parseInt(stock),
          isactive: isactive === true || isactive === "true",
          isfeatured: isfeatured === true || isfeatured === "true",
          uploadeddate: new Date(uploadeddate),
          launchingdate: launchingdate ? new Date(launchingdate) : new Date(),
          collectionid: collection_id || null,
          colors: cleanColors,
        },
      ])
      .select()
      .single();

    if (productError) {
      return res.status(400).json({ message: "Error inserting product", error: productError });
    }

    const imageRecords = images.map((img) => ({
      product_id: product.id,
      image_url: img.url,
      is_hero: img.is_hero,
    }));

    const { error: imageError } = await supabase.from("product_images").insert(imageRecords);
    if (imageError) {
      return res.status(400).json({ message: "Error inserting images", error: imageError });
    }

    return res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------------------- Read All ------------------------------ */
exports.getAllProducts = async (req, res) => {
  try {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        product_images!product_id (
          id,
          image_url,
          is_hero
        ),
        categories!categoryid (
          categoryid,
          name
        )
      `
      )
      .eq("isactive", true);

    const { category, limit } = req.query;

    if (category) {
      // NOTE: ilike on joined table alias isn't supported by supabase directly;
      // this works because of the explicit join syntax in RPC; otherwise filter on categoryid in your caller.
      query = query.ilike("categories.name", category);
    }
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;
    if (error) {
      return res.status(400).json({ message: "Error fetching products", error });
    }

    // normalize colors to always be an array
    const normalized = (data || []).map((p) => ({
      ...p,
      colors: Array.isArray(p.colors) ? p.colors : [],
    }));

    return res.status(200).json(normalized);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------------------- Read One ------------------------------ */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images!product_id (
          id,
          image_url,
          is_hero
        ),
        categories!categoryid (
          categoryid,
          name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Product not found", error });
    }

    const normalized = { ...data, colors: Array.isArray(data.colors) ? data.colors : [] };
    return res.status(200).json(normalized);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------------------ Update --------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") return res.status(403).json({ message: "Forbidden: Admins only" });

    const { id } = req.params;
    const {
      name,
      description,
      shortdescription,
      categoryid,
      branddesigner,
      price,
      discountprice,
      stock,
      isactive,
      isfeatured,
      uploadeddate,
      launchingdate,
      images,
      collection_id,
      colors, // optional array
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !shortdescription ||
      !categoryid ||
      !branddesigner ||
      !price ||
      !stock
    ) {
      return res.status(400).json({
        message: "All required fields are required",
      });
    }

    const updateFields = {
      name,
      description,
      shortdescription,
      categoryid,
      branddesigner,
      price: parseFloat(price),
      discountprice: discountprice ? parseFloat(discountprice) : null,
      stock: parseInt(stock),
      isactive: isactive === true || isactive === "true",
      isfeatured: isfeatured === true || isfeatured === "true",
      collectionid: collection_id || null,
      updated_at: new Date(),
    };

    if (uploadeddate) {
      updateFields.uploadeddate = new Date(uploadeddate);
    }

    if (launchingdate) {
      updateFields.launchingdate = new Date(launchingdate); // Added
    }

    if (typeof colors !== "undefined") {
      updateFields.colors = sanitizeColors(colors);
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: "Product not found", error: productError });
    }

    if (images && images.length > 0) {
      const { error: deleteImageError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", id);
      if (deleteImageError) {
        return res
          .status(400)
          .json({ message: "Error deleting existing images", error: deleteImageError });
      }

      const imageRecords = images.map((img) => ({
        product_id: id,
        image_url: img.url,
        is_hero: img.is_hero,
      }));

      const { error: imageError } = await supabase.from("product_images").insert(imageRecords);
      if (imageError) {
        return res.status(400).json({ message: "Error inserting images", error: imageError });
      }
    }

    return res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------------------ Delete --------------------------------- */
exports.deleteProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const { id } = req.params;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return res.status(404).json({ message: "Product not found", error });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------------- Top Latest (Home) --------------------------- */
exports.getTopLatestProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images!product_id (
          id,
          image_url,
          is_hero
        ),
        categories!categoryid (
          categoryid,
          name
        )
      `
      )
      .eq("isactive", true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      return res
        .status(400)
        .json({ message: "Error fetching top latest products", error });
    }

    const normalized = (data || []).map((p) => ({
      ...p,
      colors: Array.isArray(p.colors) ? p.colors : [],
    }));

    return res.status(200).json(normalized);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* --------------------------- Set Collection --------------------------- */
exports.setProductCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionid } = req.body;

    const { data, error } = await supabase
      .from("products")
      .update({ collectionid: collectionid || null, updated_at: new Date() })
      .eq("id", id)
      .select("id, collectionid")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("setProductCollection", e);
    res.status(500).json({ error: e.message });
  }
};

exports.getUpcomingProducts = async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // Build query
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images (
          id,
          image_url,
          is_hero
        ),
        categories (
          categoryid,
          name
        )
      `
      )
      .gt("launchingdate", new Date().toISOString()) // Filter for upcoming products
      .order("launchingdate", { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      return res
        .status(400)
        .json({ message: "Error fetching products", error });
    }

    // Format response
    const formattedProducts = products.map((product) => ({
      ...product,
      product_images: product.product_images || [],
      categories: product.categories || null,
    }));

    return res.status(200).json({
      message: "Upcoming products retrieved successfully",
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};