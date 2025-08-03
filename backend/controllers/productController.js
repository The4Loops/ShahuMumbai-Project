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
    } = req.body;

    const { data, error } = await supabase.from("products").insert([
      {
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
      },
    ]);

    if (error) {
      return res
        .status(400)
        .json({ message: "Error inserting product", error });
    }

    return res
      .status(201)
      .json({ message: "Product created successfully", product: data[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("isactive", true);

    if (error) {
      return res
        .status(400)
        .json({ message: "Error fetching products", error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};
