const sql = require('mssql');

/* ------------------------------ Create -------------------------------- */
exports.create = async (req, res) => {
  try {
    const {
      year_label,
      title,
      description,
      image_url,
      icon_key,
      title_color,
      dot_color,
      sort_order = 0,
      is_active = true,
    } = req.body || {};

    if (!year_label || !title || !icon_key) {
      return res.status(400).json({ error: 'Missing required fields: year_label, title, icon_key' });
    }

    const payload = {
      year_label: String(year_label),
      title: String(title),
      description: description ?? null,
      image_url: image_url ?? null,
      icon_key: String(icon_key),
      title_color: title_color || 'text-blue-600',
      dot_color: dot_color || 'bg-blue-600',
      sort_order: Number(sort_order) || 0,
      is_active: !!is_active,
    };

    const result = await req.dbPool.request()
      .input('year_label', sql.NVarChar, payload.year_label)
      .input('title', sql.NVarChar, payload.title)
      .input('description', sql.NVarChar, payload.description)
      .input('image_url', sql.NVarChar, payload.image_url)
      .input('icon_key', sql.NVarChar, payload.icon_key)
      .input('title_color', sql.NVarChar, payload.title_color)
      .input('dot_color', sql.NVarChar, payload.dot_color)
      .input('sort_order', sql.Int, payload.sort_order)
      .input('is_active', sql.Bit, payload.is_active)
      .input('created_at', sql.DateTime, new Date())
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        INSERT INTO HeritageMileStones (
          YearLabel, title, description, ImageUrl, IconKey,
          TitleColor, DotColor, SortOrder, IsActive, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @year_label, @title, @description, @image_url, @icon_key,
          @title_color, @dot_color, @sort_order, @is_active, @created_at, @updated_at
        )
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ error: 'Error creating heritage milestone' });
    }

    return res.status(201).json(data);
  } catch (e) {
    console.error('heritage.create error:', e);
    return res.status(500).json({ error: 'Internal server error', details: e.message });
  }
};

/* ------------------------------- Read All ------------------------------ */
exports.list = async (req, res) => {
  try {
    const {
      q = "",
      is_active,
      limit: limitStr = "50",
      offset: offsetStr = "0",
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let query = `
      SELECT 
        *
      FROM HeritageMileStones
    `;
    const parameters = [];
    let whereClause = '';

    if (q) {
      whereClause += ` WHERE (YearLabel LIKE @q OR title LIKE @q OR description LIKE @q)`;
      parameters.push({ name: 'q', type: sql.NVarChar, value: `%${q}%` });
    }
    if (is_active !== undefined && is_active !== '') {
      const activeValue = is_active === true ? 'Y' : 'N';
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' is_active = @is_active';
      parameters.push({ name: 'is_active', type: sql.Char(1), value: activeValue });
    }

    query += whereClause;
    query += ' ORDER BY SortOrder ASC, CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    // Get total count
    let countQuery = 'SELECT COUNT(*) AS total FROM HeritageMileStones';
    if (whereClause.includes('WHERE')) {
      countQuery += whereClause.replace(' WHERE', ' WHERE');
      const countRequest = req.dbPool.request();
      parameters.forEach(param => countRequest.input(param.name, param.type, param.value));
      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;
      return res.json({ items: result.recordset || [], total });
    }

    return res.json({ items: result.recordset || [], total: (result.recordset || []).length });
  } catch (e) {
    console.error('heritage.list error:', e);
    return res.status(500).json({ error: 'Internal server error', details: e.message });
  }
};

/* ------------------------------- Read One ------------------------------ */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          *
        FROM HeritageMileStones
        WHERE HeritageMileStoneId = @id
      `);

    const data = result.recordset[0];
    if (!data) return res.status(404).json({ error: 'Not found' });

    return res.json(data);
  } catch (e) {
    console.error('heritage.getOne error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* ------------------------------ Update --------------------------------- */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      year_label,
      title,
      description,
      image_url,
      icon_key,
      title_color,
      dot_color,
      sort_order,
      is_active,
    } = req.body || {};

    const updates = {};
    if (year_label !== undefined) updates.year_label = year_label;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (icon_key !== undefined) updates.icon_key = icon_key;
    if (title_color !== undefined) updates.title_color = title_color;
    if (dot_color !== undefined) updates.dot_color = dot_color;
    if (sort_order !== undefined) updates.sort_order = Number(sort_order) || 0;
    if (is_active !== undefined) updates.is_active = !!is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let query = 'UPDATE HeritageMileStones SET ';
    const request = req.dbPool.request()
      .input('id', sql.Int, id);
    const values = [];

    if (updates.year_label !== undefined) {
      query += 'YearLabel = @year_label, ';
      values.push({ name: 'year_label', type: sql.NVarChar, value: updates.year_label });
    }
    if (updates.title !== undefined) {
      query += 'title = @title, ';
      values.push({ name: 'title', type: sql.NVarChar, value: updates.title });
    }
    if (updates.description !== undefined) {
      query += 'description = @description, ';
      values.push({ name: 'description', type: sql.NVarChar, value: updates.description });
    }
    if (updates.image_url !== undefined) {
      query += 'ImageUrl = @image_url, ';
      values.push({ name: 'image_url', type: sql.NVarChar, value: updates.image_url });
    }
    if (updates.icon_key !== undefined) {
      query += 'IconKey = @icon_key, ';
      values.push({ name: 'icon_key', type: sql.NVarChar, value: updates.icon_key });
    }
    if (updates.title_color !== undefined) {
      query += 'TitleColor = @title_color, ';
      values.push({ name: 'title_color', type: sql.NVarChar, value: updates.title_color });
    }
    if (updates.dot_color !== undefined) {
      query += 'DotColor = @dot_color, ';
      values.push({ name: 'dot_color', type: sql.NVarChar, value: updates.dot_color });
    }
    if (updates.sort_order !== undefined) {
      query += 'SortOrder = @sort_order, ';
      values.push({ name: 'sort_order', type: sql.Int, value: updates.sort_order });
    }
    if (updates.is_active !== undefined) {
      query += 'IsActive = @is_active, ';
      values.push({ name: 'is_active', type: sql.Char(1), value: updates.is_active ===true ? 'Y' : 'N' });
    }

    query = query.slice(0, -2) + ' OUTPUT INSERTED.* WHERE HeritageMileStoneId = @id';

    values.forEach((val) => {
      request.input(val.name, val.type, val.value);
    });

    const result = await request.query(query);

    const data = result.recordset[0];
    if (!data) return res.status(404).json({ error: 'Not found' });

    return res.json(data);
  } catch (e) {
    console.error('heritage.update error:', e);
    return res.status(500).json({ error: 'Internal server error', details: e.message });
  }
};

/* ------------------------------ Delete --------------------------------- */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM HeritageMileStones
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(204).send();
  } catch (e) {
    console.error('heritage.remove error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};