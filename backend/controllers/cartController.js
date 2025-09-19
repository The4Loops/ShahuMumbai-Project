const crypto = require("crypto");
const supabase = require("../config/supabaseClient");
const currentCartOwner = require("../utils/currentCartOwner");

exports.addToCart = async (req,res) => {
  try {
    const owner = currentCartOwner(req);
    const { product_id, quantity = 1, mode = "add" } = req.body;

    if(!product_id) return res.status(400).json({error: "product_id is required"});
    const qty = Number.isInteger(quantity) ? quantity : parseInt(quantity, 10);
    if(!qty || qty < 1) return res.status(400).json({error: "quantity must be >= 1"});

    const {data: existing, error: selErr } = await supabase
      .from("carts")
      .select("id, quantity")
      .eq("user_id",owner)
      .eq("product_id", product_id)
      .maybeSingle();
    if(selErr) throw selErr;

    if(existing) {
      const newQty = mode === "set" ? qty : existing.quantity + qty;
      const { data, error: updErr } = await supabase
        .from("carts")
        .update({ quantity: newQty, updated_at: new Date() })
        .eq("id",existing.id)
        .eq("user_id", owner)
        .select()
        .single();
      if(updErr) throw updErr;
      return res.json(data);
    } else {
      const { data, error: insErr } = await supabase
        .from("carts")
        .insert({
          id: crypto.randomUUID(),
          user_id: owner,
          product_id,
          quantity: qty,
          created_at:new Date(),
          updated_at:new Date(),
        })
        .select()
        .single();
      if(insErr) throw insErr;
      return res.status(201).json(data);
    }
  } catch (error) {
    console.error("addToCart",error);
    res.status(500).json({error:error.message});
  }
}

exports.getCartItems = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { data, error } = await supabase
      .from("carts")
      .select(`
        id, user_id, product_id, quantity, created_at, updated_at,
        product:products(
          id, name, price, discountprice, stock,
          categories(categoryid, name),
          product_images(id, image_url, is_hero)
        )
      `)
      .eq("user_id", owner)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    console.error("getCartItems", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/cartById  (your Cart page calls this; same behavior as above)
exports.getCartItemsByUserId = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { data, error } = await supabase
      .from("carts")
      .select(`
        id, user_id, product_id, quantity, created_at, updated_at,
        product:products(
          id, name, price, discountprice, stock,
          categories(categoryid, name),
          product_images(id, image_url, is_hero)
        )
      `)
      .eq("user_id", owner)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    console.error("getCartItemsByUserId", err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/cart/:id  { quantity }
exports.updateCartItem = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { id } = req.params;
    const { quantity } = req.body;

    const qty = Number.isInteger(quantity) ? quantity : parseInt(quantity, 10);
    if (!id || !qty || qty < 1) {
      return res.status(400).json({ error: "Invalid cart item ID or quantity" });
    }

    const { data, error } = await supabase
      .from("carts")
      .update({ quantity: qty, updated_at: new Date() })
      .eq("id", id)
      .eq("user_id", owner)      // prevents cross-user tampering
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Cart item not found" });

    res.status(200).json(data);
  } catch (err) {
    console.error("updateCartItem", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/cart/:id
exports.deleteCartItem = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Cart item ID is required" });

    const { data, error } = await supabase
      .from("carts")
      .delete()
      .eq("id", id)
      .eq("user_id", owner)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Cart item not found" });

    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (err) {
    console.error("deleteCartItem", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { error } = await supabase.from("carts").delete().eq("user_id", owner);
    if (error) throw error;
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    console.error("clearCart", err);
    res.status(500).json({ error: err.message });
  }
};