const sql = require('mssql');

// List all team members with filtering, search, and pagination
exports.listTeamMembers = async (req, res) => {
  try {
    const {
      team_type = 'All',
      q = '',
      limit: limitStr = '50',
      offset: offsetStr = '0',
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let query = `
      SELECT 
        TeamMemberId AS id,
        Name AS name,
        Role AS role,
        Description AS description,
        Color AS color,
        TeamType AS team_type,
        CreatedAt AS created_at
      FROM TeamMembers
    `;
    const parameters = [];
    let whereClause = '';

    if (team_type && team_type !== 'All') {
      whereClause += (q ? ' AND' : ' WHERE') + ' TeamType = @team_type';
      parameters.push({ name: 'team_type', type: sql.NVarChar, value: team_type.toLowerCase() });
    }

    if (q) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' (Name LIKE @q OR Role LIKE @q OR Description LIKE @q)';
      parameters.push({ name: 'q', type: sql.NVarChar, value: `%${q}%` });
    }

    query += whereClause;
    query += ' ORDER BY Name ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';

    const request = req.db.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    // Get total count
    let countQuery = 'SELECT COUNT(*) AS total FROM TeamMembers';
    if (whereClause.includes('WHERE')) {
      countQuery += whereClause.replace(' WHERE', ' WHERE');
      const countRequest = req.db.request();
      parameters.forEach(param => countRequest.input(param.name, param.type, param.value));
      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;
      const members = result.recordset.map(m => ({
        id: m.id,
        initials: m.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        name: m.name,
        role: m.role,
        desc: m.description,
        color: m.color,
        team_type: m.team_type,
        created_at: m.created_at,
      }));

      return res.json({ members, total });
    }

    const members = result.recordset.map(m => ({
      id: m.id,
      initials: m.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      name: m.name,
      role: m.role,
      desc: m.description,
      color: m.color,
      team_type: m.team_type,
      created_at: m.created_at,
    }));

    return res.json({ members, total: members.length });
  } catch (e) {
    console.error('team-members.listTeamMembers error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Create a new team member
exports.createTeamMember = async (req, res) => {
  try {
    const { name, role, description, color, team_type } = req.body;
    if (!name || !role || !team_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await req.db.request()
      .input('Name', sql.NVarChar, name)
      .input('Role', sql.NVarChar, role)
      .input('Description', sql.NVarChar, description || null)
      .input('Color', sql.NVarChar, color || 'bg-pink-500')
      .input('TeamType', sql.NVarChar, team_type)
      .input('CreatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO TeamMembers (Name, Role, Description, Color, TeamType, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@Name, @Role, @Description, @Color, @TeamType, @CreatedAt)
      `);

    if (!result.recordset[0]) {
      return res.status(400).json({ error: 'Error creating team member' });
    }

    res.status(201).json({ message: 'created successfully' });
  } catch (e) {
    console.error('team-members.createTeamMember error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Get a single team member by ID
exports.getTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input('TeamMemberId', sql.Int, id)
      .query(`
        SELECT 
          TeamMemberId AS id,
          Name AS name,
          Role AS role,
          Description AS description,
          Color AS color,
          TeamType AS team_type,
          CreatedAt AS created_at
        FROM TeamMembers
        WHERE TeamMemberId = @TeamMemberId
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const member = {
      id: data.id,
      initials: data.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      name: data.name,
      role: data.role,
      desc: data.description,
      color: data.color,
      team_type: data.team_type,
      created_at: data.created_at,
    };

    return res.json(member);
  } catch (e) {
    console.error('team-members.getTeamMember error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Update a team member by ID
exports.updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, description, color, team_type } = req.body;

    const updates = {};
    if (name !== undefined) updates.Name = name;
    if (role !== undefined) updates.Role = role;
    if (description !== undefined) updates.Description = description;
    if (color !== undefined) updates.Color = color;
    if (team_type !== undefined) updates.TeamType = team_type;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let query = 'UPDATE TeamMembers SET ';
    const request = req.db.request()
      .input('TeamMemberId', sql.Int, id);
    const values = [];

    if (updates.Name !== undefined) {
      query += 'Name = @Name, ';
      values.push({ name: 'Name', type: sql.NVarChar, value: updates.Name });
    }
    if (updates.Role !== undefined) {
      query += 'Role = @Role, ';
      values.push({ name: 'Role', type: sql.NVarChar, value: updates.Role });
    }
    if (updates.Description !== undefined) {
      query += 'Description = @Description, ';
      values.push({ name: 'Description', type: sql.NVarChar, value: updates.Description });
    }
    if (updates.Color !== undefined) {
      query += 'Color = @Color, ';
      values.push({ name: 'Color', type: sql.NVarChar, value: updates.Color });
    }
    if (updates.TeamType !== undefined) {
      query += 'TeamType = @TeamType, ';
      values.push({ name: 'TeamType', type: sql.NVarChar, value: updates.TeamType });
    }

    query = query.slice(0, -2) + ' OUTPUT INSERTED.* WHERE TeamMemberId = @TeamMemberId';

    values.forEach((val) => {
      request.input(val.name, val.type, val.value);
    });

    const result = await request.query(query);

    const data = result.recordset[0];
    if (!data) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.status(200).json({ message: 'updated successfully' });
  } catch (e) {
    console.error('team-members.updateTeamMember error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Delete a team member by ID
exports.deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input('TeamMemberId', sql.Int, id)
      .query(`
        DELETE FROM TeamMembers
        WHERE TeamMemberId = @TeamMemberId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.status(200).json({ message: 'deleted successfully' });
  } catch (e) {
    console.error('team-members.deleteTeamMember error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};