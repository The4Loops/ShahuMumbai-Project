const jwt = require("jsonwebtoken");
const sql = require('mssql');
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
    let result;
    
    if (authError) {
      result = await req.db.request()
        .execute('SP_GetMenuUnAuthenticated');
    } else {
      if (!decoded.id) {
        return res.status(400).json({ error: 'Invalid JWT: Missing user ID' });
      }
      result = await req.db.request()
        .input('UserId', sql.Int, parseInt(decoded.id))
        .execute('get_menus_authenticated');
    }

    // Parse JSON from the 'result' column
    let menus = result.recordset[0]?.result
      ? JSON.parse(result.recordset[0].result).Menu
      : [];

    // Apply sorting and filtering
    let sorted = menus.sort((a, b) => a.OrderIndex - b.OrderIndex);
    sorted = sorted.map((menu) => ({
      ...menu,
      DropdownItems: decoded?.role
        ? menu.DropdownItems.filter(
            (item) => item.Roles.length === 0 || item.Roles.split(',').includes(decoded.role)
          )
        : menu.DropdownItems,
    }));

    if (decoded?.role !== 'Admin') {
      sorted = sorted.filter((m) => m.Label.toLowerCase() !== 'admin');
    }

    res.status(200).json({ menus: sorted });
  } catch (err) {
    console.error('Error in getMenusWithItems:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};