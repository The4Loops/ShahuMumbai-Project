const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

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
      images,
    } = req.body;

    // Validate required fields
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
      return res
        .status(400)
        .json({
          message: "All required fields and at least one image are required",
        });
    }
    if (!images.some((img) => img.is_hero)) {
      return res
        .status(400)
        .json({ message: "At least one image must be set as hero image" });
    }

    // Insert product
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
        },
      ])
      .select()
      .single();

    if (productError) {
      return res
        .status(400)
        .json({ message: "Error inserting product", error: productError });
    }

    // Insert image URLs
    const imageRecords = images.map((img) => ({
      product_id: product.id,
      image_url: img.url,
      is_hero: img.is_hero,
    }));

    const { error: imageError } = await supabase
      .from("product_images")
      .insert(imageRecords);

    if (imageError) {
      return res
        .status(400)
        .json({ message: "Error inserting images", error: imageError });
    }

    return res
      .status(201)
      .json({ message: "Product created successfully", product });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get All Products
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

    // Filter by category if provided
    if (category) {
      query = query.ilike("categories.name", category);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return res
        .status(400)
        .json({ message: "Error fetching products", error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get Product by ID
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

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

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
      images,
    } = req.body;

    // Update product
    const { data: product, error: productError } = await supabase
      .from("products")
      .update({
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
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (productError || !product) {
      return res
        .status(404)
        .json({ message: "Product not found", error: productError });
    }

    // Delete existing images
    if (images && images.length > 0) {
      const { error: deleteImageError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", id);

      if (deleteImageError) {
        return res
          .status(400)
          .json({
            message: "Error deleting existing images",
            error: deleteImageError,
          });
      }

      // Insert new image URLs
      const imageRecords = images.map((img) => ({
        product_id: id,
        image_url: img.url,
        is_hero: img.is_hero,
      }));

      const { error: imageError } = await supabase
        .from("product_images")
        .insert(imageRecords);

      if (imageError) {
        return res
          .status(400)
          .json({ message: "Error inserting images", error: imageError });
      }
    }

    return res
      .status(200)
      .json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const { id } = req.params;

    // Delete product (images will be deleted automatically due to ON DELETE CASCADE)
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return res.status(404).json({ message: "Product not found", error });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// get top products
exports.getTopLatestProducts=async(req,res)=>{
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
      .eq("isactive", true)
      .order("created_at", { ascending: false }) // Sort by created_at in descending order
      .limit(4); // Limit to top 4 products

    const { data, error } = await query;

    if (error) {
      return res
        .status(400)
        .json({ message: "Error fetching top latest products", error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}