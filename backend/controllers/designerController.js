const sql = require('mssql');
const jwt = require('jsonwebtoken');

// Helper: Verify JWT & Admin Role
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

// CREATE Designer — Admin Only
exports.createDesigner = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { name, bio, imageurl, sociallink, role, isactive } = req.body;

    const result = await req.dbPool.request()
      .input('name', sql.NVarChar, name)
      .input('bio', sql.NVarChar, bio || null)
      .input('imageurl', sql.NVarChar, imageurl || null)
      .input('sociallink', sql.NVarChar, sociallink || null)
      .input('role', sql.NVarChar, role)
      .input('isactive', sql.Char(1), isactive ? 'Y' : 'N')
      .query(`
        INSERT INTO designer (name, bio, imageurl, sociallink, role, isactive)
        OUTPUT INSERTED.*
        VALUES (@name, @bio, @imageurl, @sociallink, @role, @isactive)
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ message: 'Error creating designer' });
    }

    res.status(201).json({ message: 'Designer created', designer: data });
  } catch (error) {
    console.error('createDesigner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET All Designers — Public
exports.getAllDesigners = async (req, res) => {
  try {
    const result = await req.dbPool.request()
      .query('SELECT * FROM designer');

    const data = result.recordset;
    if (!data) {
      return res.status(400).json({ message: 'Error fetching designers' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('getAllDesigners:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE Designer — Admin Only
exports.updateDesigner = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;
    const { name, bio, imageurl, sociallink, role, isactive } = req.body;

    let query = 'UPDATE designer SET ';
    const inputs = { designerid: id };
    const values = [];

    if (typeof name !== 'undefined') {
      query += 'name = @name, ';
      values.push({ name: 'name', type: sql.NVarChar, value: name });
    }
    if (typeof bio !== 'undefined') {
      query += 'bio = @bio, ';
      values.push({ name: 'bio', type: sql.NVarChar, value: bio || null });
    }
    if (typeof imageurl !== 'undefined') {
      query += 'imageurl = @imageurl, ';
      values.push({ name: 'imageurl', type: sql.NVarChar, value: imageurl || null });
    }
    if (typeof sociallink !== 'undefined') {
      query += 'sociallink = @sociallink, ';
      values.push({ name: 'sociallink', type: sql.NVarChar, value: sociallink || null });
    }
    if (typeof role !== 'undefined') {
      query += 'role = @role, ';
      values.push({ name: 'role', type: sql.NVarChar, value: role });
    }
    if (typeof isactive !== 'undefined') {
      query += 'isactive = @isactive, ';
      values.push({ name: 'isactive', type: sql.Char(1), value: isactive ? 'Y' : 'N' });
    }

    query = query.slice(0, -2) + ' OUTPUT INSERTED.* WHERE designerid = @designerid';

    const request = req.dbPool.request()
      .input('designerid', sql.Int, id);

    values.forEach((val) => {
      request.input(val.name, val.type, val.value);
    });

    const result = await request.query(query);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ message: 'Designer not found' });
    }

    res.status(200).json({ message: 'Designer updated', designer: data });
  } catch (error) {
    console.error('updateDesigner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE Designer — Admin Only
exports.deleteDesigner = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('designerid', sql.Int, id)
      .query(`
        DELETE FROM designer
        OUTPUT DELETED.*
        WHERE designerid = @designerid
      `);

    if (!result.recordset.length) {
      return res.status(400).json({ message: 'Designer not found' });
    }

    res.status(200).json({ message: 'Designer deleted' });
  } catch (error) {
    console.error('deleteDesigner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};