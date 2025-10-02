const sql = require('mssql');
const jwt = require('jsonwebtoken');

// Verify Admin
const verifyAdmin = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { error: 'Unauthorized: Token missing' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return { error: 'Forbidden: Admins only' };
    return { decoded };
  } catch (err) {
    return { error: 'Invalid Token' };
  }
};

// Create Role
exports.createRole = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { label } = req.body;
    if (!label) {
      return res.status(400).json({ error: 'Role label is required' });
    }

    const result = await req.dbPool.request()
      .input('Label', sql.NVarChar, label)
      .input('IsActive', sql.Char(1), 'Y')
      .input('CreatedAt', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO roles (Label, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@Label, @IsActive, @CreatedAt, @UpdatedAt)
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ error: 'Error creating role' });
    }

    res.status(201).json({ message: 'Role created successfully', role: data });
  } catch (err) {
    console.error('Error in createRole:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Roles
exports.getRoles = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { search } = req.query;
    let query = `
      SELECT 
        RoleId AS id,
        Label AS label,
        IsActive AS is_active,
        CreatedAt AS created_at
      FROM roles
    `;
    const parameters = [];

    if (search) {
      query += ' WHERE Label LIKE @search';
      parameters.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }

    query += ' ORDER BY Label ASC';

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    const rolesResult = await request.query(query);

    const roles = rolesResult.recordset;
    const roleIds = roles.map(role => role.id);

    const roletagsResult = await req.dbPool.request()
      .query(`
        SELECT rt.RoleId, rt.MenuId, m.Label AS menu_label
        FROM roletag rt
        INNER JOIN menu m ON rt.MenuId = m.MenuId
        WHERE rt.RoleId IN (${roleIds.map(() => '?').join(',')})
      `);
    const roletags = roletagsResult.recordset;
    const roletagMap = {};
    roletags.forEach(rt => {
      if (!roletagMap[rt.RoleId]) roletagMap[rt.RoleId] = [];
      roletagMap[rt.RoleId].push({ id: rt.MenuId, label: rt.menu_label });
    });

    const usersResult = await req.dbPool.request()
      .query(`
        SELECT u.UserId AS id, u.Email AS email, u.RoleId
        FROM users u
        WHERE u.RoleId IN (${roleIds.map(() => '?').join(',')})
      `);
    const users = usersResult.recordset;
    const userMap = {};
    users.forEach(user => {
      if (!userMap[user.RoleId]) userMap[user.RoleId] = [];
      userMap[user.RoleId].push({ id: user.id, email: user.email });
    });

    const rolesWithDetails = roles.map(role => ({
      ...role,
      menus: roletagMap[role.id] || [],
      users: userMap[role.id] || [],
    }));

    res.status(200).json({ roles: rolesWithDetails });
  } catch (err) {
    console.error('Error in getRoles:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update Role
exports.updateRole = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { id } = req.params;
    const { label, is_active } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Role label is required' });
    }

    const result = await req.dbPool.request()
      .input('RoleId', sql.Int, id)
      .input('Label', sql.NVarChar, label)
      .input('IsActive', sql.Char(1), is_active ?? 'Y')
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE roles
        SET Label = @Label, IsActive = @IsActive, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.*
        WHERE RoleId = @RoleId
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ error: 'Role not found' });
    }

    res.status(200).json({ message: 'Role updated successfully', role: data });
  } catch (err) {
    console.error('Error in updateRole:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Role
exports.deleteRole = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { id } = req.params;

    // Check if role is assigned to users
    const usersResult = await req.dbPool.request()
      .input('RoleId', sql.Int, id)
      .query('SELECT UserId FROM users WHERE RoleId = @RoleId');

    if (usersResult.recordset.length > 0) {
      return res.status(400).json({ error: 'Cannot delete role assigned to users' });
    }

    const deleteResult = await req.dbPool.request()
      .input('RoleId', sql.Int, id)
      .query('DELETE FROM roles WHERE RoleId = @RoleId');

    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(400).json({ error: 'Role not found' });
    }

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error in deleteRole:', err);
    res.status(500).json({ error: err.message });
  }
};

// Assign Role to User
exports.assignRoleToUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({ error: 'User ID and Role ID are required' });
    }

    // Verify user and role exist
    const userResult = await req.dbPool.request()
      .input('UserId', sql.Int, user_id)
      .query('SELECT UserId FROM users WHERE UserId = @UserId');

    const roleResult = await req.dbPool.request()
      .input('RoleId', sql.Int, role_id)
      .query('SELECT RoleId FROM roles WHERE RoleId = @RoleId');

    if (!userResult.recordset[0]) return res.status(404).json({ error: 'User not found' });
    if (!roleResult.recordset[0]) return res.status(404).json({ error: 'Role not found' });

    const updateResult = await req.dbPool.request()
      .input('UserId', sql.Int, user_id)
      .input('RoleId', sql.Int, role_id)
      .query(`
        UPDATE users
        SET RoleId = @RoleId
        OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.RoleId, r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.UserId = @UserId
      `);

    const data = updateResult.recordset[0];
    if (!data) {
      return res.status(400).json({ error: 'Error assigning role' });
    }

    res.status(200).json({ message: 'Role assigned successfully', user: data });
  } catch (err) {
    console.error('Error in assignRoleToUser:', err);
    res.status(500).json({ error: err.message });
  }
};