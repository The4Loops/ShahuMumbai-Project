const sql = require('mssql');
const jwt = require('jsonwebtoken');

// Helper: Verify JWT & Admin Role
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

// CREATE ProductDesignerLink — Admin Only
exports.createProductDesignerLink = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { ProductId, DesignerId } = req.body;

    const result = await req.db.request()
      .input('ProductId', sql.Int, ProductId)
      .input('DesignerId', sql.Int, DesignerId)
      .query(`
        INSERT INTO productdesigner (ProductId, DesignerId)
        OUTPUT INSERTED.*
        VALUES (@ProductId, @DesignerId)
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(400).json({ message: 'Error linking product & designer' });
    }

    res.status(201).json({ message: 'Link created', link: data });
  } catch (error) {
    console.error('createProductDesignerLink:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET All ProductDesignerLinks — Public
exports.getAllProductDesignerLinks = async (req, res) => {
  try {
    const result = await req.db.request()
      .query('SELECT * FROM productdesigner');

    const data = result.recordset;
    if (!data) {
      return res.status(400).json({ message: 'Error fetching links' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('getAllProductDesignerLinks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE ProductDesignerLink — Admin Only
exports.deleteProductDesignerLink = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input('ProductDesignerId', sql.Int, id)
      .query(`
        DELETE FROM productdesigner
        OUTPUT DELETED.*
        WHERE ProductDesignerId = @ProductDesignerId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ message: 'Link not found' });
    }

    res.status(200).json({ message: 'Link deleted' });
  } catch (error) {
    console.error('deleteProductDesignerLink:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};