const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");

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

// Add item to wishlist
const addToWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();
    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item is already in wishlist
    const { data: existingItem, error: checkError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', decoded.id)
      .eq('product_id', product_id)
      .single();
    if (existingItem) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    // Add to wishlist
    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: decoded.id, product_id })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ message: 'Item added to wishlist', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's wishlist
const getWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        user_id,
        product_id,
        created_at,
        updated_at,
        products (
          id,
          name,
          price,
          discountprice,
          stock,
          product_images (
            image_url,
            is_hero
          ),
          categories(
            categoryid,
            name
          )
        )
      `)
      .eq('user_id', decoded.id)
      .eq('products.product_images.is_hero', true);
    if (error) throw error;

    // Process data to include only hero image
    const processedData = data.map(item => ({
      ...item,
      products: {
        ...item.products,
        image_url: item.products.product_images[0]?.image_url || null,
      },
    }));

    res.status(200).json({ message: 'Wishlist retrieved', data: processedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id)
      .eq('user_id', decoded.id)
      .select()
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    res.status(200).json({ message: 'Item removed from wishlist', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { data, error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', decoded.id)
      .select();
    if (error) throw error;

    res.status(200).json({ message: 'Wishlist cleared', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
};