const supabase = require("../config/supabaseClient");
const { jwtDecode } = require("jwt-decode");

// Add to Cart
exports.addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity = 1 } = req.body;

    if (!user_id || !product_id || quantity < 1) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields" });
    }

    // Check if item already in cart
    const { data: existingItem, error: checkError } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    let data, error;
    if (existingItem) {
      // Update quantity
      ({ data, error } = await supabase
        .from("carts")
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date(),
        })
        .eq("id", existingItem.id)
        .select()
        .single());
    } else {
      // Add new item
      ({ data, error } = await supabase
        .from("carts")
        .insert({ user_id, product_id, quantity })
        .select()
        .single());
    }

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in addToCart:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Cart Items
exports.getCartItems = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data, error } = await supabase
      .from("carts")
      .select("*, product:product_id(id, name, price, image_url)") // Assuming products table with these fields
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error in getCartItems:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Cart Items by User ID (from JWT token)
exports.getCartItemsByUserId = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user_id = decoded.id;
    if (!user_id) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    // Query carts table with product details
    const { data, error } = await supabase
      .from("carts")
      .select(
        `
    id,
    user_id,
    product_id,
    quantity,
    created_at,
    updated_at,
    product:products(
      id,
      name,
      price,
      discountprice,
      stock,
      categories!inner(categoryid, name),
      product_images!inner(image_url, is_hero)
    )
  `
      )
      .eq("user_id", user_id)
      .eq("product.product_images.is_hero", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error in getCartItemsByUserId:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Cart Item
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!id || quantity < 1) {
      return res
        .status(400)
        .json({ error: "Invalid cart item ID or quantity" });
    }

    const { data, error } = await supabase
      .from("carts")
      .update({ quantity, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in updateCartItem:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Cart Item
exports.deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Cart item ID is required" });
    }

    const { data, error } = await supabase
      .from("carts")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (err) {
    console.error("Error in deleteCartItem:", err);
    res.status(500).json({ error: err.message });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("user_id", user_id);

    if (error) throw error;

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    console.error("Error in clearCart:", err);
    res.status(500).json({ error: err.message });
  }
};
