const sql = require('mssql');
const jwt = require('jsonwebtoken');

// Verify Admin
const verifyAdmin = (req) => {
  const token = req.cookies.auth_token;
  if (!token) return { error: 'Unauthorized: Token missing' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return { error: 'Forbidden: Admins only' };
    return { decoded };
  } catch (err) {
    return { error: 'Invalid Token' };
  }
};

// Create Menu
exports.createMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { label, href, order_index } = req.body;
    if (!label) return res.status(400).json({ error: 'Menu label is required' });

    const result = await req.db.request()
      .input('Label', sql.NVarChar, label)
      .input('Href', sql.NVarChar, href || null)
      .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
      .input('CreatedAt', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO menu (Label, Href, OrderIndex, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@Label, @Href, @OrderIndex, @CreatedAt, @UpdatedAt)
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ error: 'Error creating menu' });
    }

    res.status(201).json({ message: 'Menu created successfully', menu: data });
  } catch (err) {
    console.error('Error in createMenu:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get Menus
exports.getMenus = async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = `
      SELECT 
        m.MenuId AS id,
        m.Label AS label,
        m.Href AS href,
        m.OrderIndex AS order_index,
        m.CreatedAt AS created_at,
        m.UpdatedAt AS updated_at
      FROM menu m
    `;
    const parameters = [];

    if (search) {
      query += ` WHERE m.Label LIKE @search`;
      parameters.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }

    if (role && role !== 'All') {
      const roleResult = await req.db.request()
        .input('role_label', sql.NVarChar, role)
        .query('SELECT RoleId FROM roles WHERE Label = @role_label');
      if (!roleResult.recordset[0]) {
        return res.status(400).json({ error: `Role '${role}' not found` });
      }
      const roleIdValue = roleResult.recordset[0].RoleId;
      parameters.push({ name: 'role_id', type: sql.Int, value: roleIdValue });
      query = `
        SELECT 
          m.MenuId AS id,
          m.Label AS label,
          m.Href AS href,
          m.OrderIndex AS order_index,
          m.CreatedAt AS created_at,
          m.UpdatedAt AS updated_at
        FROM menu m
        INNER JOIN roletag rt ON m.MenuId = rt.MenuId
        ${search ? `WHERE m.Label LIKE @search` : ''}
        ${search ? ' AND' : 'WHERE'} rt.RoleId = @role_id
      `;
    }

    query += ' ORDER BY m.OrderIndex ASC';

    const request = req.db.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    const menusResult = await request.query(query);

    const menus = menusResult.recordset;
    const menuIds = menus.map(menu => menu.id);

    if (menuIds.length === 0) {
      return res.status(200).json({ menus: [] });
    }

    // For roletags query: use named parameters for IN clause
    const roletagsRequest = req.db.request();
    const roletagsInClause = menuIds.map((_, index) => `@menu${index}`).join(',');
    const roletagsQuery = `
      SELECT rt.MenuId, rt.RoleId, r.Label
      FROM roletag rt
      INNER JOIN roles r ON rt.RoleId = r.RoleId
      WHERE rt.MenuId IN (${roletagsInClause})
    `;
    menuIds.forEach((id, index) => {
      roletagsRequest.input(`menu${index}`, sql.Int, id); // Assuming MenuId is INT
    });
    const roletagsResult = await roletagsRequest.query(roletagsQuery);

    const roletags = roletagsResult.recordset;
    const roletagMap = {};
    roletags.forEach(rt => {
      if (!roletagMap[rt.MenuId]) roletagMap[rt.MenuId] = [];
      roletagMap[rt.MenuId].push(rt.Label);
    });

    // For menuItems query: use named parameters for IN clause
    const menuItemsRequest = req.db.request();
    const menuItemsInClause = menuIds.map((_, index) => `@menu${index}`).join(',');
    const menuItemsQuery = `
      SELECT mi.MenuItemId AS id, mi.MenuId, mi.Label AS label, mi.Href AS href, mi.OrderIndex AS order_index
      FROM menuitems mi
      WHERE mi.MenuId IN (${menuItemsInClause})
      ORDER BY mi.OrderIndex ASC
    `;
    menuIds.forEach((id, index) => {
      menuItemsRequest.input(`menu${index}`, sql.Int, id); // Assuming MenuId is INT
    });
    const menuItemsResult = await menuItemsRequest.query(menuItemsQuery);

    const menuItems = menuItemsResult.recordset;
    const menuItemIds = menuItems.map(item => item.id);

    let menuItemRoletagMap = {};
    if (menuItemIds.length > 0) {
      // For menuItemRoletags query: use named parameters for IN clause
      const menuItemRoletagsRequest = req.db.request();
      const menuItemRoletagsInClause = menuItemIds.map((_, index) => `@item${index}`).join(',');
      const menuItemRoletagsQuery = `
        SELECT mir.MenuItemId, mir.RoleId, r.Label
        FROM menuitemroletag mir
        INNER JOIN roles r ON mir.RoleId = r.RoleId
        WHERE mir.MenuItemId IN (${menuItemRoletagsInClause})
      `;
      menuItemIds.forEach((id, index) => {
        menuItemRoletagsRequest.input(`item${index}`, sql.Int, id); // Assuming MenuItemId is INT
      });
      const menuItemRoletagsResult = await menuItemRoletagsRequest.query(menuItemRoletagsQuery);

      const menuItemRoletags = menuItemRoletagsResult.recordset;
      menuItemRoletags.forEach(mir => {
        if (!menuItemRoletagMap[mir.MenuItemId]) menuItemRoletagMap[mir.MenuItemId] = [];
        menuItemRoletagMap[mir.MenuItemId].push(mir.Label);
      });
    }

    const transformedMenus = menus.map(menu => ({
      ...menu,
      roles: roletagMap[menu.id] || [],
      dropdown_items: menuItems
        .filter(item => item.MenuId === menu.id)
        .map(item => ({
          ...item,
          roles: menuItemRoletagMap[item.id] || [],
        })) || [],
    }));

    res.status(200).json({ menus: transformedMenus });
  } catch (err) {
    console.error('Error in getMenus:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Menus for Dropdown
exports.getAllMenus = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT MenuId AS id, Label AS label FROM menu';

    if (search) {
      query += ' WHERE Label LIKE @search';
    }

    query += ' ORDER BY Label ASC';

    const request = req.db.request();
    if (search) {
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);

    const data = result.recordset;
    if (!data) {
      return res.status(400).json({ error: 'Error fetching menus' });
    }

    res.status(200).json({ menus: data });
  } catch (err) {
    console.error('Error in getAllMenus:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update Menu
exports.updateMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { id } = req.params;
    const { label, href, order_index } = req.body;

    if (!label) return res.status(400).json({ error: 'Menu label is required' });

    const result = await req.db.request()
      .input('MenuId', sql.Int, id)
      .input('Label', sql.NVarChar, label)
      .input('Href', sql.NVarChar, href || null)
      .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE menu
        SET Label = @Label, Href = @Href, OrderIndex = @OrderIndex, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.*
        WHERE MenuId = @MenuId
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ error: 'Menu not found' });
    }

    res.status(200).json({ message: 'Menu updated successfully', menu: data });
  } catch (err) {
    console.error('Error in updateMenu:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Menu
exports.deleteMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { id } = req.params;

    // Delete associated roletags and menuitems first (to avoid FK issues)
    await req.db.request()
      .input('MenuId', sql.Int, id)
      .query('DELETE FROM roletag WHERE MenuId = @MenuId');

    await req.db.request()
      .input('MenuId', sql.Int, id)
      .query('DELETE FROM menuitems WHERE MenuId = @MenuId');

    const result = await req.db.request()
      .input('MenuId', sql.Int, id)
      .query(`
        DELETE FROM menu
        WHERE MenuId = @MenuId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ error: 'Menu not found' });
    }

    res.status(200).json({ message: 'Menu deleted successfully' });
  } catch (err) {
    console.error('Error in deleteMenu:', err);
    res.status(500).json({ error: err.message });
  }
};

// Create Menu Item
exports.createMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { menu_id, label, href, order_index, role_ids } = req.body;
    if (!menu_id || !label || !href) {
      return res.status(400).json({ error: 'Menu ID, label, and href are required' });
    }

    const result = await req.db.request()
      .input('MenuId', sql.Int, menu_id)
      .input('Label', sql.NVarChar, label)
      .input('Href', sql.NVarChar, href)
      .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
      .input('CreatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO menuitems (MenuId, Label, Href, OrderIndex, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@MenuId, @Label, @Href, @OrderIndex, @CreatedAt)
      `);

    const menuItem = result.recordset[0];
    if (!menuItem) {
      return res.status(400).json({ error: 'Error creating menu item' });
    }

    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      for (const role_id of role_ids) {
        const roletagRequest = req.db.request()
          .input('MenuItemId', sql.Int, menuItem.MenuItemId)
          .input('RoleId', sql.Int, role_id)
          .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
          .input('CreatedAt', sql.DateTime, new Date())
          .query(`
            INSERT INTO menuitemroletag (MenuItemId, RoleId, OrderIndex, CreatedAt)
            VALUES (@MenuItemId, @RoleId, @OrderIndex, @CreatedAt)
          `);
        await roletagRequest;
      }
    }

    res.status(201).json({ message: 'Menu item created successfully', menu_item: menuItem });
  } catch (err) {
    console.error('Error in createMenuItem:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update Menu Item
exports.updateMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { id } = req.params;
    const { label, href, order_index, role_ids } = req.body;

    if (!label || !href) {
      return res.status(400).json({ error: 'Label and href are required' });
    }

    // First, update the menu item
    const updateResult = await req.db.request()
      .input('MenuItemId', sql.Int, id)
      .input('Label', sql.NVarChar, label)
      .input('Href', sql.NVarChar, href)
      .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE menuitems
        SET Label = @Label, Href = @Href, OrderIndex = @OrderIndex, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.*
        WHERE MenuItemId = @MenuItemId
      `);

    const menuItem = updateResult.recordset[0];
    if (!menuItem) {
      return res.status(400).json({ error: 'Menu item not found' });
    }

    // Delete existing role associations
    await req.db.request()
      .input('MenuItemId', sql.Int, id)
      .query('DELETE FROM menuitemroletag WHERE MenuItemId = @MenuItemId');

    // Insert new role associations if provided
    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      for (const role_id of role_ids) {
        const roletagRequest = req.db.request()
          .input('MenuItemId', sql.Int, menuItem.MenuItemId)
          .input('RoleId', sql.Int, role_id)
          .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
          .input('CreatedAt', sql.DateTime, new Date())
          .query(`
            INSERT INTO menuitemroletag (MenuItemId, RoleId, OrderIndex, CreatedAt)
            VALUES (@MenuItemId, @RoleId, @OrderIndex, @CreatedAt)
          `);
        await roletagRequest;
      }
    }

    res.status(200).json({ message: 'Menu item updated successfully', menu_item: menuItem });
  } catch (err) {
    console.error('Error in updateMenuItem:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Menu Item
exports.deleteMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { id } = req.params;

    // Delete associated roletags first
    await req.db.request()
      .input('MenuItemId', sql.Int, id)
      .query('DELETE FROM menuitemroletag WHERE MenuItemId = @MenuItemId');

    const result = await req.db.request()
      .input('MenuItemId', sql.Int, id)
      .query(`
        DELETE FROM menuitems
        WHERE MenuItemId = @MenuItemId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ error: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Error in deleteMenuItem:', err);
    res.status(500).json({ error: err.message });
  }
};

// Assign Roles to Menu
exports.assignRolesToMenu = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { menu_id, role_ids, order_index } = req.body;

    if (!menu_id || !role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ error: 'Menu ID and role IDs (array) are required' });
    }

    // Delete existing role associations
    await req.db.request()
      .input('MenuId', sql.Int, menu_id)
      .query('DELETE FROM roletag WHERE MenuId = @MenuId');

    // Insert new role associations
    const insertedRoletags = [];
    for (const role_id of role_ids) {
      const roletagRequest = req.db.request()
        .input('MenuId', sql.Int, menu_id)
        .input('RoleId', sql.Int, role_id)
        .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
        .input('CreatedAt', sql.DateTime, new Date());
      const result = await roletagRequest.query(`
        INSERT INTO roletag (MenuId, RoleId, OrderIndex, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@MenuId, @RoleId, @OrderIndex, @CreatedAt)
      `);
      insertedRoletags.push(result.recordset[0]);
    }

    console.log('Roletags assigned:', insertedRoletags);
    res.status(200).json({ message: 'Roles assigned successfully', roletags: insertedRoletags });
  } catch (err) {
    console.error('Error in assignRolesToMenu:', err);
    res.status(500).json({ error: err.message });
  }
};

// Assign Roles to Menu Item
exports.assignRolesToMenuItem = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { menu_item_id, role_ids, order_index } = req.body;

    if (!menu_item_id || !role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ error: 'Menu item ID and role IDs (array) are required' });
    }

    // Delete existing role associations
    await req.db.request()
      .input('MenuItemId', sql.Int, menu_item_id)
      .query('DELETE FROM menuitemroletag WHERE MenuItemId = @MenuItemId');

    // Insert new role associations
    const insertedRoletags = [];
    for (const role_id of role_ids) {
      const roletagRequest = req.db.request()
        .input('MenuItemId', sql.Int, menu_item_id)
        .input('RoleId', sql.Int, role_id)
        .input('OrderIndex', sql.Int, parseInt(order_index) || 0)
        .input('CreatedAt', sql.DateTime, new Date());
      const result = await roletagRequest.query(`
        INSERT INTO menuitemroletag (MenuItemId, RoleId, OrderIndex, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@MenuItemId, @RoleId, @OrderIndex, @CreatedAt)
      `);
      insertedRoletags.push(result.recordset[0]);
    }

    console.log('Roletags assigned:', insertedRoletags);
    res.status(200).json({ message: 'Roles assigned successfully', roletags: insertedRoletags });
  } catch (err) {
    console.error('Error in assignRolesToMenuItem:', err);
    res.status(500).json({ error: err.message });
  }
};