const sql = require('mssql');
const jwt = require('jsonwebtoken');

function verifyAdmin(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { error: 'Unauthorized: Token missing' };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return { error: 'Forbidden: Admins only' };
    return { decoded };
  } catch {
    return { error: 'Invalid Token' };
  }
}

function dbReady(req) {
  return req.db && req.db.connected;  // ← FIXED
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
}

const slugRegex = /^[a-z0-9-]+$/;
const isHttpUrl = (s) => /^https?:\/\//i.test(s);

// POST /api/categories
exports.createCategory = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { name, slug, image } = req.body || {};

    if (!name) return res.status(400).json({ message: 'Category name is required' });
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ message: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }
    if (image && !isHttpUrl(image)) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(201).json({
        message: 'Category created successfully',
        category: { categoryid: 1, name, slug, image: image || null },
      });
    }

    const r = await req.db.request()
      .input('Name', sql.NVarChar(255), String(name).trim())
      .input('Slug', sql.NVarChar(255), String(slug).trim())
      .input('Image', sql.NVarChar(1024), image || null)
      .query(`
        INSERT INTO dbo.categories (Name, Slug, Image)
        OUTPUT INSERTED.CategoryId AS categoryid, INSERTED.Name AS name, INSERTED.Slug AS slug, INSERTED.Image AS image
        VALUES (@Name, @Slug, @Image);
      `);

    const row = r.recordset?.[0];
    return res.status(201).json({ message: 'Category created successfully', category: row });
  } catch (error) {
    const num = error?.originalError?.info?.number;
    if (num === 2601 || num === 2627) {
      return res.status(400).json({ message: 'Slug already exists' });
    }
    console.error('createCategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json([
        { categoryid: 1, name: 'Sarees', products_count: 3 },
        { categoryid: 2, name: 'Lehengas', products_count: 0 },
      ]);
    }

 
    const r = await req.db.request().query(`
      SELECT
        c.CategoryId AS categoryid,
        c.Name       AS name,
        ISNULL(pc.ProductsCount, 0) AS products_count
      FROM dbo.categories c
      OUTER APPLY (
        SELECT COUNT(*) AS ProductsCount
        FROM dbo.products p
        WHERE p.CategoryId = c.CategoryId
      ) pc
      ORDER BY c.Name ASC;
    `);

    return res.status(200).json(r.recordset || []);
  } catch (error) {
    console.error('getAllCategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Category ID must be a positive integer' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ categoryid: id, name: 'Sample', slug: 'sample', image: null, products_count: 0 });
    }

    const r = await req.db.request()
      .input('Id', sql.Int, id)
      .query(`
        SELECT CategoryId AS categoryid, Name AS name, Slug AS slug, Image AS image
        FROM dbo.categories
        WHERE CategoryId = @Id
      `);

    const cat = r.recordset?.[0];
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const countRes = await req.db.request()
      .input('Id', sql.Int, id)
      .query(`SELECT COUNT(*) AS cnt FROM dbo.products WHERE CategoryId = @Id`);

    const count = countRes.recordset?.[0]?.cnt || 0;
    return res.status(200).json({ ...cat, products_count: count });
  } catch (error) {
    console.error('getCategoryById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH or PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Category ID must be a positive integer' });
    }

    const { name, slug, image } = req.body || {};

    if (slug !== undefined && (!slug || !slugRegex.test(slug))) {
      return res.status(400).json({ message: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }
    if (image !== undefined && image && !isHttpUrl(image)) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({
        message: 'Category updated successfully',
        category: { categoryid: id, name: name ?? 'Sample', slug: slug ?? 'sample', image: image ?? null },
      });
    }

    const sets = [];
    const q = req.db.request().input('Id', sql.Int, id);

    if (name !== undefined) { sets.push('Name=@Name'); q.input('Name', sql.NVarChar(255), name); }
    if (slug !== undefined) { sets.push('Slug=@Slug'); q.input('Slug', sql.NVarChar(255), slug); }
    if (image !== undefined) { sets.push('Image=@Image'); q.input('Image', sql.NVarChar(1024), image || null); }

    if (sets.length === 0) return res.status(400).json({ message: 'No updatable fields provided' });

    const r = await q.query(`
      UPDATE dbo.categories
      SET ${sets.join(', ')}
      OUTPUT INSERTED.CategoryId AS categoryid, INSERTED.Name AS name, INSERTED.Slug AS slug, INSERTED.Image AS image
      WHERE CategoryId = @Id
    `);

    const row = r.recordset?.[0];
    if (!row) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json({ message: 'Category updated successfully', category: row });
  } catch (error) {
    const num = error?.originalError?.info?.number;
    if (num === 2601 || num === 2627) {
      return res.status(400).json({ message: 'Slug already exists' });
    }
    console.error('updateCategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Category ID must be a positive integer' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Category deleted successfully' });
    }

    const r = await req.db.request()
      .input('Id', sql.Int, id)
      .query(`
        DELETE FROM dbo.categories
        OUTPUT DELETED.CategoryId
        WHERE CategoryId = @Id
      `);

    if (!r.recordset?.length) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('deleteCategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
