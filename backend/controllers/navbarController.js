const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");
const { translateText } = require('../utils/translate');

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

    const language = req.query.lang || 'en-US';
    const targetLang = language.split('-')[0].toLowerCase(); // e.g., 'hi' for hi-IN

    if (authError) {
      ({ data, error } = await supabase.rpc("get_menus_unauthenticated"));
    } else {
      if (!decoded.id) {
        return res.status(400).json({ error: "Invalid JWT: Missing user ID" });
      }
      ({ data, error } = await supabase.rpc("get_menus_authenticated", { user_id: parseInt(decoded.id) }));
    }

    if (error) {
      console.error("RPC error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Translate menus and dropdown_items
    let menus = data.menus || [];
    menus = await Promise.all(
      menus.map(async (menu) => {
        menu.label = language === 'en-US' ? menu.label : await translateText(menu.label, targetLang);
        if (menu.dropdown_items) {
          menu.dropdown_items = await Promise.all(
            menu.dropdown_items.map(async (item) => {
              item.label = language === 'en-US' ? item.label : await translateText(item.label, targetLang);
              if (item.links) {
                item.links = await Promise.all(
                  item.links.map(async (link) => ({
                    ...link,
                    label: language === 'en-US' ? link.label : await translateText(link.label, targetLang),
                  }))
                );
              }
              return item;
            })
          );
        }
        return menu;
      })
    );

    // Apply sorting and filtering
    let sorted = menus.sort((a, b) => a.order_index - b.order_index);
    sorted = sorted.map((menu) => ({
      ...menu,
      dropdown_items: decoded?.role
        ? menu.dropdown_items.filter(
            (item) => item.roles.length === 0 || item.roles.includes(decoded.role)
          )
        : menu.dropdown_items,
    }));

    if (decoded?.role !== "Admin") {
      sorted = sorted.filter((m) => m.label.toLowerCase() !== 'admin');
    }

    res.status(200).json({ menus: sorted });
  } catch (err) {
    console.error("Error in getMenusWithItems:", err);
    res.status(500).json({ error: err.message });
  }
};
